import { createHash, randomUUID } from 'node:crypto';
import { open, mkdir, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';

export const MAX_INPUT_BYTES = 5 * 1024 * 1024;
export const MAX_CANDIDATES = 200;

const DEPARTMENTS = ['Partnerships', 'Event Management', 'People', 'Marketing', 'Finance'];
const ANSWER_KEYS = ['achievement', 'vision', 'initiative', 'ownership', 'motivation', 'additional'];
const SCORE_KEYS = ['ownership', 'growth', 'communityService', 'motivation'];
const SCORE_WEIGHTS = { ownership: 30, growth: 20, communityService: 30, motivation: 20 };
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const EMAIL_PATTERN = /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+/gi;
const PHONE_PATTERN = /(?<![\p{L}\p{N}])(?:\+\s*)?\d(?:[\d\s().\/-]*\d){5,}(?![\p{L}\p{N}])/gu;
const OPTIONAL_CANDIDATE_KEYS = [
  'firstDepartment', 'secondDepartment', 'hours', 'city', 'commitment', 'answers', 'ai',
];

const QUESTION_HEADERS = {
  achievement: [
    'achievement',
    'a meaningful achievement',
    'what’s the most impressive thing you’ve ever done?',
  ],
  vision: [
    'vision',
    'a future they want to shape',
    'what change do you want to drive in the world, and how do you imagine using your strengths, ideas, and energy to make that vision a reality?',
  ],
  initiative: [
    'initiative',
    'a moment they took initiative',
    'imagine you join START tomorrow. You have 3 other members, 4 weeks and a small budget. What would you make happen for Warsaw’s student/startup community?',
  ],
  ownership: [
    'ownership',
    'how they take responsibility',
    'what would you like to take ownership of in this department during your first semester?',
  ],
  motivation: [
    'motivation',
    'why your community',
    'why do you want to join your community?',
  ],
  additional: [
    'additional',
    'anything else to add',
    'is there anything else you want to share with us?',
  ],
};

const CSV_FIELD_HEADERS = {
  id: ['id', 'candidate id', 'application id'],
  name: ['name', 'full name', 'applicant name'],
  firstName: ['first name'],
  lastName: ['last name'],
  createdTime: ['created time', 'created at'],
  firstDepartment: ['firstDepartment', 'first department', 'first department preference', 'first department choice'],
  secondDepartment: ['secondDepartment', 'second department', 'second department preference', 'second department choice'],
  hours: ['hours', 'hours per week', 'weekly hours', 'hours available per week'],
  city: ['city'],
  commitment: ['commitment', 'availability', 'time commitment'],
};

const FIELD_BY_HEADER = new Map();
for (const [field, headers] of Object.entries(CSV_FIELD_HEADERS)) {
  for (const header of headers) FIELD_BY_HEADER.set(normalizeHeader(header), field);
}
for (const [answerKey, headers] of Object.entries(QUESTION_HEADERS)) {
  for (const header of headers) FIELD_BY_HEADER.set(normalizeHeader(header), `answer:${answerKey}`);
  FIELD_BY_HEADER.set(normalizeHeader(`answer ${answerKey}`), `answer:${answerKey}`);
  FIELD_BY_HEADER.set(normalizeHeader(`application answer ${answerKey}`), `answer:${answerKey}`);
}

export class CandidateImportError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CandidateImportError';
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value, allowed, location) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw new CandidateImportError(`Unsupported property in ${location}: ${unknown[0]}`);
  }
}

function normalizeHeader(value) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function sanitizeFreeText(value) {
  const withoutEmails = value.replace(EMAIL_PATTERN, '[redacted email]');
  return withoutEmails.replace(PHONE_PATTERN, (match) => {
    const digits = match.replace(/\D/g, '').length;
    const candidate = match.trim();
    const looksLikeDate = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(candidate);
    return digits >= 7 && !looksLikeDate ? '[redacted phone]' : match;
  });
}

function cleanText(value, location, { allowEmpty = false } = {}) {
  if (typeof value !== 'string') {
    throw new CandidateImportError(`${location} must be text`);
  }
  const cleaned = sanitizeFreeText(value.trim());
  if (!allowEmpty && !cleaned.trim()) return undefined;
  return cleaned;
}

function normalizeDepartment(value, location) {
  if (value === null) return undefined;
  if (typeof value !== 'string') {
    throw new CandidateImportError(`${location} must be one of the supported departments`);
  }
  const department = DEPARTMENTS.find((item) => item.toLocaleLowerCase('en-US') === value.trim().toLocaleLowerCase('en-US'));
  if (!department) {
    throw new CandidateImportError(`${location} must be one of the supported departments`);
  }
  return department;
}

function normalizeHours(value, location) {
  if (value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new CandidateImportError(`${location} must be a non-negative number`);
  }
  return value;
}

function normalizeAnswers(source, location) {
  if (source === null) return undefined;
  if (!isRecord(source)) throw new CandidateImportError(`${location} must be an object`);
  rejectUnknownKeys(source, ANSWER_KEYS, location);
  const answers = {};
  for (const key of ANSWER_KEYS) {
    if (!Object.hasOwn(source, key)) continue;
    answers[key] = cleanText(source[key], `${location}.${key}`, { allowEmpty: true });
  }
  return answers;
}

function recomputeWeightedScore(scores) {
  if (!SCORE_KEYS.every((key) => Number.isInteger(scores[key]) && scores[key] >= 1 && scores[key] <= 5)) {
    return null;
  }
  return SCORE_KEYS.reduce((total, key) => total + SCORE_WEIGHTS[key] * scores[key], 0) / 5;
}

function normalizeDepartmentRecommendation(source) {
  if (source === null) return undefined;
  if (!isRecord(source)) {
    throw new CandidateImportError('ai.departmentRecommendation must be an object');
  }
  rejectUnknownKeys(source, ['department', 'reason'], 'ai.departmentRecommendation');
  if (!Object.hasOwn(source, 'department')) {
    throw new CandidateImportError('ai.departmentRecommendation.department is required');
  }
  const department = normalizeDepartment(source.department, 'ai.departmentRecommendation.department');
  const recommendation = { department };
  if (Object.hasOwn(source, 'reason') && source.reason !== null) {
    recommendation.reason = cleanText(source.reason, 'ai.departmentRecommendation.reason', { allowEmpty: true });
  }
  return recommendation;
}

function normalizeAi(source) {
  if (source === null) return undefined;
  if (!isRecord(source)) throw new CandidateImportError('ai must be an object');
  // weightedScore is accepted only as an untrusted legacy field and is never copied.
  rejectUnknownKeys(
    source,
    ['rubricVersion', 'scores', 'fit', 'reason', 'question', 'departmentRecommendation', 'weightedScore'],
    'ai',
  );

  if (source.rubricVersion !== undefined && source.rubricVersion !== '2026-10-18-v3') throw new CandidateImportError('AI assessment uses an older rubric; reassess before importing scores');
  const ai = {rubricVersion:'2026-10-18-v3'};
  if (Object.hasOwn(source, 'scores')) {
    if (!isRecord(source.scores)) throw new CandidateImportError('ai.scores must be an object');
    rejectUnknownKeys(source.scores, SCORE_KEYS, 'ai.scores');
    const scores = Object.fromEntries(SCORE_KEYS.map((key) => {
      const score = source.scores[key] ?? null;
      if (score !== null && (!Number.isInteger(score) || score < 1 || score > 5)) {
        throw new CandidateImportError(`ai.scores.${key} must be null or an integer from 1 to 5`);
      }
      return [key, score];
    }));
    ai.scores = scores;
    ai.weightedScore = recomputeWeightedScore(scores);
  }
  for (const key of ['fit', 'reason', 'question']) {
    if (!Object.hasOwn(source, key) || source[key] === null) continue;
    ai[key] = cleanText(source[key], `ai.${key}`, { allowEmpty: true });
  }
  if (Object.hasOwn(source, 'departmentRecommendation')) {
    ai.departmentRecommendation = normalizeDepartmentRecommendation(source.departmentRecommendation);
  }
  return ai;
}

function normalizeCandidate(source, index) {
  const location = `candidate ${index + 1}`;
  if (!isRecord(source)) throw new CandidateImportError(`${location} must be an object`);
  rejectUnknownKeys(source, ['id', 'name', ...OPTIONAL_CANDIDATE_KEYS], location);

  if (typeof source.id !== 'string' || !ID_PATTERN.test(source.id.trim())) {
    throw new CandidateImportError(`${location}.id is required and must be 1 to 128 letters, digits, underscores, or hyphens`);
  }
  const name = cleanText(source.name, `${location}.name`);
  if (!name) throw new CandidateImportError(`${location}.name is required`);

  const candidate = { id: source.id.trim(), name, firstDepartment:'',secondDepartment:'',hours:'',city:'',commitment:'',answers:Object.fromEntries(ANSWER_KEYS.map(key=>[key,''])) };
  for (const key of ['firstDepartment', 'secondDepartment']) {
    if (!Object.hasOwn(source, key) || source[key] === null || source[key] === '') continue;
    candidate[key] = normalizeDepartment(source[key], `${location}.${key}`);
  }
  if (Object.hasOwn(source, 'hours') && source.hours !== null) {
    candidate.hours = source.hours === '' ? '' : normalizeHours(source.hours, `${location}.hours`);
  }
  for (const key of ['city', 'commitment']) {
    if (!Object.hasOwn(source, key) || source[key] === null) continue;
    const value = cleanText(source[key], `${location}.${key}`);
    if (value !== undefined) candidate[key] = value;
  }
  if (Object.hasOwn(source, 'answers')) {
    const answers = normalizeAnswers(source.answers, `${location}.answers`);
    if (answers !== undefined) candidate.answers = {...candidate.answers,...answers};
  }
  if (Object.hasOwn(source, 'ai')) {
    const ai = normalizeAi(source.ai);
    if (ai !== undefined) candidate.ai = ai;
  }
  return candidate;
}

function deriveNotionId(fullName, createdTime) {
  const normalizedName = fullName.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
  const normalizedCreatedTime = createdTime.normalize('NFKC').trim();
  const digest = createHash('sha256')
    .update(`${normalizedName}|${normalizedCreatedTime}`, 'utf8')
    .digest('hex')
    .slice(0, 20);
  return `app_${digest}`;
}

function csvRowsToCandidates(records, headers) {
  if (records.length < 2) throw new CandidateImportError('CSV must contain a header and at least one candidate');
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  if (normalizedHeaders.some((header) => !header)) throw new CandidateImportError('CSV headers cannot be blank');
  if (new Set(normalizedHeaders).size !== normalizedHeaders.length) {
    throw new CandidateImportError('CSV contains duplicate headers');
  }

  const fields = normalizedHeaders.map((header) => FIELD_BY_HEADER.get(header) ?? null);
  const assigned = new Set();
  for (const field of fields) {
    if (field === null) continue;
    if (assigned.has(field)) throw new CandidateImportError(`CSV maps more than one column to ${field}`);
    assigned.add(field);
  }

  const hasNotionIdentity = assigned.has('createdTime') && (assigned.has('firstName') || assigned.has('lastName'));
  return records.slice(1).map((row, index) => {
    if (row.length !== headers.length) throw new CandidateImportError(`CSV row ${index + 2} has an unexpected number of columns`);
    const values = {};
    const answers = {};
    let hasAnswerColumn = false;
    for (let columnIndex = 0; columnIndex < fields.length; columnIndex += 1) {
      const field = fields[columnIndex];
      if (field === null) continue;
      const value = row[columnIndex] ?? '';
      if (field.startsWith('answer:')) {
        hasAnswerColumn = true;
        answers[field.slice('answer:'.length)] = value;
      } else {
        values[field] = value;
      }
    }

    const firstName = values.firstName?.trim() ?? '';
    const lastName = values.lastName?.trim() ?? '';
    const joinedName = [firstName, lastName].filter(Boolean).join(' ');
    const name = values.name?.trim() || joinedName;
    if (!name) throw new CandidateImportError(`CSV row ${index + 2} is missing a name`);

    let id = values.id?.trim() ?? '';
    if (!id && hasNotionIdentity) {
      const createdTime = values.createdTime?.trim() ?? '';
      if (!createdTime) {
        throw new CandidateImportError(`CSV row ${index + 2} needs Created time to derive an ID`);
      }
      id = deriveNotionId(name, createdTime);
    }
    if (!id) throw new CandidateImportError(`CSV row ${index + 2} is missing an ID`);

    const source = { id, name };
    for (const key of ['firstDepartment', 'secondDepartment']) {
      if (values[key]?.trim()) source[key] = values[key].trim();
    }
    if (values.hours?.trim()) {
      const hours = Number(values.hours.trim());
      if (!Number.isFinite(hours) || hours < 0) {
        throw new CandidateImportError(`CSV row ${index + 2} has invalid hours`);
      }
      source.hours = hours;
    }
    for (const key of ['city', 'commitment']) {
      if (values[key]?.trim()) source[key] = values[key].trim();
    }
    if (hasAnswerColumn) source.answers = answers;
    return normalizeCandidate(source, index);
  });
}

function parseCsvCandidates(text) {
  let records;
  try {
    records = parseCsv(text, {
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: false,
    });
  } catch {
    throw new CandidateImportError('CSV is malformed or has inconsistent row widths');
  }
  if (!Array.isArray(records) || records.length < 2) {
    throw new CandidateImportError('CSV must contain a header and at least one candidate');
  }
  const headers = records[0].map((header) => String(header));
  if (records.length - 1 > MAX_CANDIDATES) {
    throw new CandidateImportError(`CSV may contain at most ${MAX_CANDIDATES} candidates`);
  }
  return csvRowsToCandidates(records, headers);
}

function decodeInput(input) {
  if (typeof input === 'string') return input;
  if (!(input instanceof Uint8Array)) {
    throw new CandidateImportError('Input must be text or UTF-8 bytes');
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(input);
  } catch {
    throw new CandidateImportError('Input is not valid UTF-8');
  }
}

export function inferImportFormat(filePath) {
  const extension = filePath.toLowerCase().split('.').at(-1);
  if (extension === 'json' || extension === 'csv') return extension;
  throw new CandidateImportError('Input file must end in .json or .csv');
}

export function parseCandidateInput(input, format) {
  const size = typeof input === 'string' ? Buffer.byteLength(input, 'utf8') : input?.byteLength;
  if (!Number.isSafeInteger(size)) throw new CandidateImportError('Input must be text or UTF-8 bytes');
  if (size > MAX_INPUT_BYTES) {
    throw new CandidateImportError(`Input exceeds the ${MAX_INPUT_BYTES}-byte size limit`);
  }
  if (format !== 'json' && format !== 'csv') {
    throw new CandidateImportError('Input format must be JSON or CSV');
  }
  const decoded = decodeInput(input).replace(/^\uFEFF/, '');

  let source;
  if (format === 'json') {
    try {
      source = JSON.parse(decoded);
    } catch {
      throw new CandidateImportError('Input is not valid JSON');
    }
    if (!Array.isArray(source)) throw new CandidateImportError('JSON input must be an array of candidates');
    if (source.length > MAX_CANDIDATES) {
      throw new CandidateImportError(`JSON may contain at most ${MAX_CANDIDATES} candidates`);
    }
    if (source.length === 0) throw new CandidateImportError('At least one candidate is required');
    source = source.map(normalizeCandidate);
  } else {
    source = parseCsvCandidates(decoded);
  }

  if (source.length === 0) throw new CandidateImportError('At least one candidate is required');
  const ids = new Set();
  for (const candidate of source) {
    if (ids.has(candidate.id)) throw new CandidateImportError('Duplicate candidate ID');
    ids.add(candidate.id);
  }
  return source;
}

export async function readImportFile(filePath) {
  const file = await open(filePath, 'r');
  try {
    const stat = await file.stat();
    if (stat.size > MAX_INPUT_BYTES) {
      throw new CandidateImportError(`Input exceeds the ${MAX_INPUT_BYTES}-byte size limit`);
    }
    const buffer = Buffer.alloc(MAX_INPUT_BYTES + 1);
    let total = 0;
    while (total < buffer.length) {
      const { bytesRead } = await file.read(buffer, total, buffer.length - total, null);
      if (bytesRead === 0) break;
      total += bytesRead;
      if (total > MAX_INPUT_BYTES) {
        throw new CandidateImportError(`Input exceeds the ${MAX_INPUT_BYTES}-byte size limit`);
      }
    }
    return buffer.subarray(0, total);
  } finally {
    await file.close();
  }
}

export function serializeCandidatesJson(candidates) {
  return `${JSON.stringify(candidates, null, 2)}\n`;
}

export async function writeCandidatesJson(candidates, outputPath, { replace = false } = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0 || candidates.length > MAX_CANDIDATES) {
    throw new CandidateImportError(`Output must contain 1 to ${MAX_CANDIDATES} candidates`);
  }
  const output = serializeCandidatesJson(candidates);
  await mkdir(dirname(outputPath), { recursive: true, mode: 0o700 });

  if (!replace) {
    let handle;
    try {
      handle = await open(outputPath, 'wx', 0o600);
    } catch (error) {
      if (error?.code === 'EEXIST') {
        throw new CandidateImportError('Output already exists; pass --replace to overwrite it');
      }
      throw error;
    }
    try {
      await handle.writeFile(output, 'utf8');
      await handle.sync();
    } catch (error) {
      await handle.close().catch(() => {});
      await rm(outputPath, { force: true }).catch(() => {});
      throw error;
    }
    await handle.close();
    return;
  }

  const temporaryPath = `${outputPath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    const handle = await open(temporaryPath, 'wx', 0o600);
    try {
      await handle.writeFile(output, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}
