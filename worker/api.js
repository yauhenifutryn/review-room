const SETTINGS_KEY = 'settings/v1/reviewing-closed.json';
const REVIEW_PREFIX = 'reviews/v3/';
const LEGACY_REVIEW_PREFIX = 'reviews/v1/';
const LEGACY_SCORE_KEYS = ['ownership', 'growth', 'community', 'problemSolving'];
const LEGACY_WEIGHTS = {ownership:30,growth:20,community:30,problemSolving:20};
const COMMENT_PREFIX = 'comments/v1/';
const ACTIVITY_PREFIX = 'activity/v1/';
const DATASET_KEY = 'dataset/v1/candidates.json';
const REVIEWER_HEADER_ID = 'oai-authenticated-user-id';
const REVIEWER_HEADER_EMAIL = 'oai-authenticated-user-email';
const MAX_BODY_BYTES = 16 * 1024;
const MAX_DATASET_BODY_BYTES = 5 * 1024 * 1024;
const MAX_DATASET_CANDIDATES = 200;
const MAX_NOTES_LENGTH = 2_000;
const MAX_CUSTOM_METADATA_SNAPSHOT_BYTES = 7_500;
const MAX_COMMENT_LENGTH = 2_000;
const COMMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIVE_WINDOW_MINUTES = 15;
const ACTIVE_WINDOW_MS = ACTIVE_WINDOW_MINUTES * 60_000;
const REVIEW_SCORE_KEYS = ['ownership', 'growth', 'communityService', 'motivation'];
const REVIEW_WEIGHTS = { ownership: 30, growth: 20, communityService: 30, motivation: 20 };
const RUBRIC_VERSION = '2026-10-18-v3';
const DEPARTMENTS = ['Partnerships', 'Event Management', 'People', 'Marketing', 'Finance'];
const DEPARTMENT_FITS = ['Strong fit', 'Good fit', 'Discuss', 'Poor fit'];
const FOUNDER_POTENTIAL = ['Definitely yes', 'Probably yes', 'Unsure', 'Probably not', 'Definitely not'];
const DEPARTMENT_FIT_COUNTS = Object.fromEntries(DEPARTMENT_FITS.map((value) => [value, 0]));
const FOUNDER_POTENTIAL_COUNTS = Object.fromEntries(FOUNDER_POTENTIAL.map((value) => [value, 0]));
const ANSWER_KEYS = ['achievement', 'vision', 'initiative', 'ownership', 'motivation', 'additional'];
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,253}\.[A-Z]{2,63}\b/gi;
const PHONE_PATTERN = /(?<!\w)\+?(?:\d[\s().-]?){7,14}\d(?!\w)/g;

class BodyTooLargeError extends Error {}
class InvalidDataError extends Error {}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...extraHeaders,
  });
  return new Response(JSON.stringify(payload), { status, headers });
}

function apiError(status, code, message, extraHeaders = {}) {
  return jsonResponse({ error: code, message }, status, extraHeaders);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value, expected) {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}

function parseEmailList(value) {
  if (typeof value !== 'string') return [];
  return [...new Set(value.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean))];
}

function readIdentity(request) {
  const id = request.headers.get(REVIEWER_HEADER_ID)?.trim();
  const email = request.headers.get(REVIEWER_HEADER_EMAIL)?.trim().toLowerCase();
  if (!id || !email || id.length > 512 || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return { id, email };
}

function hasBucket(env) {
  return Boolean(env?.BUCKET && typeof env.BUCKET.get === 'function' && typeof env.BUCKET.put === 'function');
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isJsonRequest(request) {
  return request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json';
}

async function readBoundedText(request, maxBytes = MAX_BODY_BYTES) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    throw new BodyTooLargeError();
  }

  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new BodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

async function readJsonBody(request, maxBytes = MAX_BODY_BYTES) {
  let text;
  try {
    text = await readBoundedText(request, maxBytes);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return { response: apiError(413, 'payload_too_large', 'The request body exceeds the allowed size.') };
    }
    return { response: apiError(400, 'invalid_request', 'The request body is not valid UTF-8.') };
  }

  try {
    return { value: JSON.parse(text) };
  } catch {
    return { response: apiError(400, 'invalid_request', 'The request body must be valid JSON.') };
  }
}

async function readSettings(bucket) {
  const object = await bucket.get(SETTINGS_KEY);
  if (!object) return { reviewingClosed: false };
  const settings = await (typeof object.json === 'function' ? object.json() : JSON.parse(await object.text()));
  if (!isRecord(settings) || typeof settings.reviewingClosed !== 'boolean') throw new InvalidDataError('Invalid settings');
  return { reviewingClosed: settings.reviewingClosed };
}

function safeText(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function weightedScore(scores, keys = REVIEW_SCORE_KEYS, weights = REVIEW_WEIGHTS) {
  if (!keys.every(key => Number.isInteger(scores[key]) && scores[key] >= 1 && scores[key] <= 5)) return null;
  return keys.reduce((sum, key) => sum + weights[key] * scores[key], 0) / 5;
}

function projectAi(source) {
  if (!isRecord(source)) return null;
  const historical = source.rubricVersion !== RUBRIC_VERSION;
  const sourceScores = !historical && isRecord(source.scores) ? source.scores : {};
  const scores = Object.fromEntries(REVIEW_SCORE_KEYS.map((key) => {
    const score = sourceScores[key];
    return [key, score === null || (Number.isInteger(score) && score >= 1 && score <= 5) ? score : null];
  }));
  return {
    scores,
    historical,
    rubricVersion: safeText(source.rubricVersion),
    weightedScore: weightedScore(scores),
    fit: safeText(source.fit),
    reason: safeText(source.reason),
    question: safeText(source.question),
    assessmentVersion: safeText(source.assessmentVersion),
    evidenceSpecificity: safeText(source.evidenceSpecificity),
    verificationStatus: safeText(source.verificationStatus),
    whyNotHigher: safeText(source.whyNotHigher),
    criterionReasons: Object.fromEntries(REVIEW_SCORE_KEYS.map(key => [key, historical ? '' : safeText(source.criterionReasons?.[key])])),
    ...(isRecord(source.departmentRecommendation) && DEPARTMENTS.includes(source.departmentRecommendation.department) ? {
      departmentRecommendation: {department:source.departmentRecommendation.department, reason:safeText(source.departmentRecommendation.reason)},
    } : {}),
    ...(Array.isArray(source.externalEvidence) ? {
      externalEvidence: source.externalEvidence.slice(0, 10).map(check => ({
        url: typeof check.url === 'string' && /^https?:\/\//i.test(check.url) ? check.url : null,
        title: safeText(check.title), status: safeText(check.status), summary: safeText(check.summary), limits: safeText(check.limits),
      })),
      publicEvidenceSummary: safeText(source.publicEvidenceSummary),
      checkedDate: safeText(source.checkedDate),
    } : {}),
  };
}

function projectCandidate(candidate) {
  if (!isRecord(candidate) || typeof candidate.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(candidate.id)) {
    throw new InvalidDataError('Invalid candidate');
  }
  if (typeof candidate.name !== 'string' || !candidate.name.trim()) throw new InvalidDataError('Invalid candidate name');

  const projected = { id: candidate.id, name: candidate.name };
  for (const key of ['firstDepartment', 'secondDepartment', 'city', 'commitment', 'summary', 'question']) {
    if (typeof candidate[key] === 'string') projected[key] = candidate[key];
  }
  if (typeof candidate.hours === 'number' && Number.isFinite(candidate.hours)) projected.hours = candidate.hours;
  else if (typeof candidate.hours === 'string') projected.hours = candidate.hours;
  if (Array.isArray(candidate.evidence)) projected.evidence = candidate.evidence.filter((item) => typeof item === 'string');
  if (isRecord(candidate.answers)) {
    projected.answers = Object.fromEntries(ANSWER_KEYS
      .filter((key) => typeof candidate.answers[key] === 'string')
      .map((key) => [key, candidate.answers[key]]));
  }
  if (candidate.ai !== undefined) projected.ai = projectAi(candidate.ai);
  return projected;
}

async function loadCandidates(source) {
  const records = typeof source === 'function' ? await source() : source;
  if (!Array.isArray(records)) throw new InvalidDataError('Candidate data is unavailable');

  const candidates = records.map(projectCandidate);
  const ids = new Set();
  for (const candidate of candidates) {
    if (ids.has(candidate.id)) throw new InvalidDataError('Duplicate candidate id');
    ids.add(candidate.id);
  }
  return candidates;
}

function redactContactPatterns(value) {
  return value.replace(EMAIL_PATTERN, '[email removed]').replace(PHONE_PATTERN, match => /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(match.trim()) ? match : '[phone removed]');
}

function normalizeDatasetCandidate(source) {
  if (!isRecord(source) || typeof source.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(source.id) ||
      typeof source.name !== 'string' || !source.name.trim() ||
      !(source.firstDepartment === '' || DEPARTMENTS.includes(source.firstDepartment)) || !(source.secondDepartment === '' || DEPARTMENTS.includes(source.secondDepartment)) ||
      !(typeof source.hours === 'number' && Number.isFinite(source.hours) && source.hours >= 0) &&
        !(typeof source.hours === 'string' && (source.hours === '' || source.hours.trim())) ||
      typeof source.city !== 'string' || typeof source.commitment !== 'string' ||
      !hasExactKeys(source.answers, ANSWER_KEYS) ||
      !ANSWER_KEYS.every((key) => typeof source.answers[key] === 'string')) {
    throw new InvalidDataError('Invalid candidate');
  }

  if (source.ai !== undefined) {
    if (!isRecord(source.ai)) throw new InvalidDataError('Invalid candidate assessment');
    if (source.ai.scores !== undefined) {
      if (!isRecord(source.ai.scores)) throw new InvalidDataError('Invalid candidate scores');
      for (const [key, score] of Object.entries(source.ai.scores)) {
        if (!REVIEW_SCORE_KEYS.includes(key) ||
            !(score === null || (Number.isInteger(score) && score >= 1 && score <= 5))) {
          throw new InvalidDataError('Invalid candidate score');
        }
      }
    }
  }

  for (const key of ['summary', 'question']) {
    if (source[key] !== undefined && typeof source[key] !== 'string') {
      throw new InvalidDataError('Invalid candidate text');
    }
  }
  if (source.evidence !== undefined &&
      (!Array.isArray(source.evidence) || !source.evidence.every((item) => typeof item === 'string'))) {
    throw new InvalidDataError('Invalid candidate evidence');
  }

  const answers = Object.fromEntries(ANSWER_KEYS.map((key) => [key, redactContactPatterns(source.answers[key])]));
  const projected = projectCandidate({ ...source, name: source.name.trim(), answers });
  if (typeof projected.hours === 'string') projected.hours = projected.hours.trim();
  projected.city = projected.city.trim();
  projected.commitment = projected.commitment.trim();
  return projected;
}

function normalizeDataset(value) {
  if (!hasExactKeys(value, ['candidates']) || !Array.isArray(value.candidates) ||
      value.candidates.length === 0 || value.candidates.length > MAX_DATASET_CANDIDATES) {
    throw new InvalidDataError('Invalid dataset');
  }

  const candidates = value.candidates.map(normalizeDatasetCandidate);
  const ids = new Set();
  for (const candidate of candidates) {
    if (ids.has(candidate.id)) throw new InvalidDataError('Duplicate candidate id');
    ids.add(candidate.id);
  }
  return candidates;
}

async function hashUserId(userId) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function listObjects(bucket, prefix) {
  if (typeof bucket.list !== 'function') throw new InvalidDataError('Storage listing unavailable');
  const objects = [];
  let cursor;
  const seenCursors = new Set();
  for (let pageNumber = 0; pageNumber < 100_000; pageNumber += 1) {
    const page = await bucket.list({ prefix, limit: 1000, include: ['customMetadata'], ...(cursor ? { cursor } : {}) });
    if (!page || !Array.isArray(page.objects)) throw new InvalidDataError('Invalid storage page');
    for (const object of page.objects) {
      if (typeof object?.key !== 'string' || !object.key.startsWith(prefix)) throw new InvalidDataError('Invalid storage key');
      objects.push(object);
    }
    if (!page.truncated) return objects;
    if (typeof page.cursor !== 'string' || !page.cursor || seenCursors.has(page.cursor)) {
      throw new InvalidDataError('Invalid storage cursor');
    }
    seenCursors.add(page.cursor);
    cursor = page.cursor;
  }
  throw new InvalidDataError('Too many storage pages');
}

function normalizeReview(source, legacy = false) {
  const keys = legacy ? LEGACY_SCORE_KEYS : REVIEW_SCORE_KEYS;
  const version = legacy ? '2026-10-18-v2' : RUBRIC_VERSION;
  if (!isRecord(source) || typeof source.candidateId !== 'string' ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(source.candidateId) ||
      !hasExactKeys(source.scores, keys) ||
      !keys.every((key) => source.scores[key] === null ||
        (Number.isInteger(source.scores[key]) && source.scores[key] >= 1 && source.scores[key] <= 5)) ||
      source.rubricVersion !== version ||
      !DEPARTMENT_FITS.includes(source.departmentFit) || !DEPARTMENTS.includes(source.department) ||
      !FOUNDER_POTENTIAL.includes(source.founderPotential) ||
      typeof source.notes !== 'string' || source.notes.trim().length < 15 ||
      !isRecord(source.reviewer) || typeof source.reviewer.id !== 'string' || typeof source.reviewer.email !== 'string' ||
      typeof source.submittedAt !== 'string' || !Number.isFinite(Date.parse(source.submittedAt))) {
    throw new InvalidDataError('Invalid review record');
  }
  return {
    candidateId: source.candidateId,
    scores: Object.fromEntries(keys.map((key) => [key, source.scores[key]])),
    weightedScore: weightedScore(source.scores, keys, legacy ? LEGACY_WEIGHTS : REVIEW_WEIGHTS),
    rubricVersion: version,
    departmentFit: source.departmentFit,
    department: source.department,
    notes: source.notes,
    founderPotential: source.founderPotential,
    reviewer: { id: source.reviewer.id, email: source.reviewer.email },
    submittedAt: source.submittedAt,
  };
}

function normalizeComment(source, candidateId, expectedId) {
  if (!hasExactKeys(source, ['id', 'candidateId', 'text', 'author', 'createdAt']) ||
      typeof source.id !== 'string' || !COMMENT_ID_PATTERN.test(source.id) || source.id !== expectedId ||
      source.candidateId !== candidateId || typeof source.text !== 'string' ||
      source.text !== source.text.trim() || source.text.length < 5 || source.text.length > MAX_COMMENT_LENGTH ||
      !hasExactKeys(source.author, ['id', 'email']) || typeof source.author.id !== 'string' ||
      !source.author.id.trim() || source.author.id.length > 512 || typeof source.author.email !== 'string' ||
      source.author.email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(source.author.email) ||
      typeof source.createdAt !== 'string' || !Number.isFinite(Date.parse(source.createdAt))) {
    throw new InvalidDataError('Invalid comment record');
  }
  return {
    id: source.id,
    candidateId: source.candidateId,
    text: source.text,
    author: { id: source.author.id, email: source.author.email },
    createdAt: source.createdAt,
  };
}

async function readReviews(bucket, prefix, expectedReviewerId, legacy = false) {
  const objects = await listObjects(bucket, prefix);
  const reviews = [];
  for (let start = 0; start < objects.length; start += 100) {
    const page = objects.slice(start, start + 100);
    const values = await Promise.all(page.map(async (object) => {
      const snapshot = object.customMetadata?.review;
      if (typeof snapshot !== 'string') throw new InvalidDataError('Missing review snapshot');
      const source = JSON.parse(snapshot);
      return normalizeReview(source, legacy);
    }));
    for (const review of values) {
      if (expectedReviewerId && review.reviewer.id !== expectedReviewerId) throw new InvalidDataError('Review owner mismatch');
      reviews.push(review);
    }
  }
  return reviews.sort((left, right) => right.submittedAt.localeCompare(left.submittedAt) ||
    left.candidateId.localeCompare(right.candidateId) || left.reviewer.id.localeCompare(right.reviewer.id));
}

async function readComments(bucket, candidateId) {
  const prefix = `${COMMENT_PREFIX}${candidateId}/`;
  const objects = await listObjects(bucket, prefix);
  const comments = [];
  for (let start = 0; start < objects.length; start += 100) {
    const page = objects.slice(start, start + 100);
    const values = await Promise.all(page.map(async (object) => {
      const fileName = object.key.slice(prefix.length);
      if (!fileName.endsWith('.json')) throw new InvalidDataError('Invalid comment key');
      const expectedId = fileName.slice(0, -'.json'.length);
      const snapshot = object.customMetadata?.comment;
      if (typeof snapshot !== 'string') throw new InvalidDataError('Missing comment snapshot');
      return normalizeComment(JSON.parse(snapshot), candidateId, expectedId);
    }));
    comments.push(...values);
  }
  return comments.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) ||
    right.id.localeCompare(left.id));
}

async function readActivitySummary(bucket, candidates) {
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  const counts = new Map(candidates.map((candidate) => [candidate.id, {
    candidateId: candidate.id,
    submittedCount: 0,
    completeCount: 0,
    incompleteCount: 0,
    activeCount: 0,
  }]));
  const submittedByReviewer = new Map();
  const submittedPairs = new Set();
  const reviewObjects = await listObjects(bucket, REVIEW_PREFIX);
  const reviewKeyPattern = /^reviews\/v3\/([a-f0-9]{64})\/([A-Za-z0-9_-]{1,128})\.json$/;

  for (let start = 0; start < reviewObjects.length; start += 100) {
    const page = reviewObjects.slice(start, start + 100);
    const values = await Promise.all(page.map(async (object) => {
      const match = object.key.match(reviewKeyPattern);
      const snapshot = object.customMetadata?.review;
      if (!match || typeof snapshot !== 'string') throw new InvalidDataError('Invalid review snapshot');
      const review = normalizeReview(JSON.parse(snapshot));
      const [, userHash, candidateId] = match;
      if (review.candidateId !== candidateId || !candidateIds.has(candidateId) ||
          await hashUserId(review.reviewer.id) !== userHash) {
        throw new InvalidDataError('Review ownership or candidate mismatch');
      }
      return { userHash, candidateId, complete: review.weightedScore !== null };
    }));

    for (const { userHash, candidateId, complete } of values) {
      const stats = counts.get(candidateId);
      stats.submittedCount += 1;
      if (complete) stats.completeCount += 1;
      else stats.incompleteCount += 1;
      submittedPairs.add(`${userHash}/${candidateId}`);
      if (!submittedByReviewer.has(userHash)) submittedByReviewer.set(userHash, new Set());
      submittedByReviewer.get(userHash).add(candidateId);
    }
  }

  const now = Date.now();
  const activeReviewerHashes = new Set();
  const activityObjects = await listObjects(bucket, ACTIVITY_PREFIX);
  const activityKeyPattern = /^activity\/v1\/([a-f0-9]{64})\.json$/;
  for (let start = 0; start < activityObjects.length; start += 100) {
    const page = activityObjects.slice(start, start + 100);
    const values = await Promise.all(page.map(async (object) => {
      const match = object.key.match(activityKeyPattern);
      const snapshot = object.customMetadata?.activity;
      if (!match || typeof snapshot !== 'string') throw new InvalidDataError('Invalid activity snapshot');
      const activity = JSON.parse(snapshot);
      if (!hasExactKeys(activity, ['candidateId', 'reviewerId', 'status', 'updatedAt']) ||
          typeof activity.candidateId !== 'string' || !candidateIds.has(activity.candidateId) ||
          typeof activity.reviewerId !== 'string' || !activity.reviewerId.trim() || activity.reviewerId.length > 512 ||
          !['in_progress', 'idle'].includes(activity.status) || typeof activity.updatedAt !== 'string' ||
          !Number.isFinite(Date.parse(activity.updatedAt)) || await hashUserId(activity.reviewerId) !== match[1]) {
        throw new InvalidDataError('Invalid activity record');
      }
      return { userHash: match[1], ...activity };
    }));

    for (const activity of values) {
      if (activity.status !== 'in_progress') continue;
      const age = now - Date.parse(activity.updatedAt);
      if (age < 0 || age > ACTIVE_WINDOW_MS || submittedPairs.has(`${activity.userHash}/${activity.candidateId}`)) continue;
      counts.get(activity.candidateId).activeCount += 1;
      activeReviewerHashes.add(activity.userHash);
    }
  }

  const startedReviewerHashes = new Set([...submittedByReviewer.keys(), ...activeReviewerHashes]);
  const finishedAllCount = candidates.length === 0 ? 0 : [...submittedByReviewer.values()]
    .filter((candidateSet) => candidates.every((candidate) => candidateSet.has(candidate.id))).length;
  return {
    candidates: candidates.map((candidate) => counts.get(candidate.id)),
    reviewerSummary: {
      startedCount: startedReviewerHashes.size,
      finishedAllCount,
      activeCount: activeReviewerHashes.size,
    },
    activeWindowMinutes: ACTIVE_WINDOW_MINUTES,
  };
}

function roundedAverage(values) {
  if (!values.length) return null;
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 100) / 100;
}

function scoreStatistics(reviews) {
  const completeReviews = reviews.filter((review) => weightedScore(review.scores) !== null);
  const unknownScoresByCriterion = Object.fromEntries(REVIEW_SCORE_KEYS.map((key) => [
    key,
    reviews.filter((review) => review.scores[key] === null).length,
  ]));
  const unknownCriterionCount = Object.values(unknownScoresByCriterion).reduce((sum, count) => sum + count, 0);
  return {
    reviewCount: reviews.length,
    completeScoreCount: completeReviews.length,
    incompleteScoreCount: reviews.length - completeReviews.length,
    unknownCriterionCount,
    unknownScoresByCriterion,
    averageScores: {
      ...Object.fromEntries(REVIEW_SCORE_KEYS.map((key) => [
        key,
        roundedAverage(reviews.map((review) => review.scores[key]).filter((score) => score !== null)),
      ])),
      overall: roundedAverage(completeReviews.map((review) => weightedScore(review.scores))),
    },
  };
}

function buildAggregates(candidates, reviews) {
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  if (reviews.some((review) => !candidateIds.has(review.candidateId))) throw new InvalidDataError('Review references an unknown candidate');

  return {
    ...scoreStatistics(reviews),
    candidateCount: candidates.length,
    byCandidate: candidates.map((candidate) => {
      const candidateReviews = reviews.filter((review) => review.candidateId === candidate.id);
      return {
        candidateId: candidate.id,
        ...scoreStatistics(candidateReviews),
        departmentFitCounts: Object.fromEntries(Object.keys(DEPARTMENT_FIT_COUNTS).map((fit) => [
          fit,
          candidateReviews.filter((review) => review.departmentFit === fit).length,
        ])),
        founderPotentialCounts: Object.fromEntries(Object.keys(FOUNDER_POTENTIAL_COUNTS).map((potential) => [
          potential,
          candidateReviews.filter((review) => review.founderPotential === potential).length,
        ])),
      };
    }),
  };
}

function validateReviewBody(value, candidates) {
  const topLevelKeys = ['candidateId', 'scores', 'departmentFit', 'department', 'notes', 'founderPotential'];
  if (!hasExactKeys(value, topLevelKeys)) return 'The review must contain exactly the expected fields.';
  if (typeof value.candidateId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value.candidateId) ||
      !candidates.some((candidate) => candidate.id === value.candidateId)) return 'Choose a known candidate.';
  if (!hasExactKeys(value.scores, REVIEW_SCORE_KEYS)) return 'Provide every current score criterion, using null when evidence is insufficient.';
  if (!REVIEW_SCORE_KEYS.every((key) => value.scores[key] === null ||
      (Number.isInteger(value.scores[key]) && value.scores[key] >= 1 && value.scores[key] <= 5))) {
    return 'Each score must be null or an integer from 1 to 5.';
  }
  if (!DEPARTMENT_FITS.includes(value.departmentFit)) return 'Choose a valid department fit.';
  if (!DEPARTMENTS.includes(value.department)) return 'Choose a valid department.';
  if (typeof value.notes !== 'string' || value.notes.trim().length < 15 || value.notes.length > MAX_NOTES_LENGTH) {
    return 'Notes must explain the assessment in 15 to 2000 characters.';
  }
  if (!FOUNDER_POTENTIAL.includes(value.founderPotential)) return 'Choose a valid founder-potential response.';
  return null;
}

function validateCommentBody(value, candidates) {
  if (!hasExactKeys(value, ['candidateId', 'text'])) return 'The comment must contain exactly candidateId and text.';
  if (typeof value.candidateId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value.candidateId) ||
      !candidates.some((candidate) => candidate.id === value.candidateId)) return 'Choose a known candidate.';
  if (typeof value.text !== 'string' || value.text.trim().length < 5 || value.text.length > MAX_COMMENT_LENGTH) {
    return 'Comment text must be 5 to 2000 characters.';
  }
  return null;
}

function validateActivityBody(value, candidates) {
  if (!hasExactKeys(value, ['candidateId', 'status'])) return 'The activity update must contain exactly candidateId and status.';
  if (typeof value.candidateId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value.candidateId) ||
      !candidates.some((candidate) => candidate.id === value.candidateId)) return 'Choose a known candidate.';
  if (!['in_progress', 'idle'].includes(value.status)) return 'Status must be in_progress or idle.';
  return null;
}

async function handleGetMe(identity, isCoordinator, coordinators, env) {
  if (!hasBucket(env)) return apiError(503, 'service_unavailable', 'Review storage is not configured.');
  const settings = await readSettings(env.BUCKET);
  return jsonResponse({
    user: identity,
    isCoordinator,
    configured: coordinators.length > 0,
    reviewingClosed: settings.reviewingClosed,
  });
}

async function handleGetCandidates(identity, isCoordinator, env, source) {
  if (!hasBucket(env)) return apiError(503, 'service_unavailable', 'Review storage is not configured.');
  const settings = await readSettings(env.BUCKET);
  if (settings.reviewingClosed && !isCoordinator) {
    return apiError(403, 'reviewing_closed', 'Reviewing is closed. Candidate records are no longer available.');
  }
  const candidates = await loadCandidates(source);
  const userHash = await hashUserId(identity.id);
  const reviews = await readReviews(env.BUCKET, `${REVIEW_PREFIX}${userHash}/`, identity.id);
  return jsonResponse({ candidates, reviews });
}

async function handleGetComments(isCoordinator, env, source, url) {
  if (!hasBucket(env) || typeof env.BUCKET.list !== 'function') {
    return apiError(503, 'service_unavailable', 'Review storage is not configured.');
  }
  const settings = await readSettings(env.BUCKET);
  if (settings.reviewingClosed && !isCoordinator) {
    return apiError(403, 'reviewing_closed', 'Reviewing is closed. Shared comments are no longer available.');
  }

  const values = url.searchParams.getAll('candidateId');
  if (values.length !== 1 || [...url.searchParams.keys()].length !== 1 ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(values[0])) {
    return apiError(400, 'invalid_candidate', 'Provide one valid candidateId.');
  }
  const candidates = await loadCandidates(source);
  if (!candidates.some((candidate) => candidate.id === values[0])) {
    return apiError(404, 'not_found', 'Candidate not found.');
  }
  return jsonResponse({ comments: await readComments(env.BUCKET, values[0]) });
}

async function handleGetActivity(isCoordinator, env, source) {
  if (!hasBucket(env) || typeof env.BUCKET.list !== 'function') {
    return apiError(503, 'service_unavailable', 'Review storage is not configured.');
  }
  const settings = await readSettings(env.BUCKET);
  if (settings.reviewingClosed && !isCoordinator) {
    return apiError(403, 'reviewing_closed', 'Reviewing is closed. Activity is no longer available to reviewers.');
  }
  const candidates = await loadCandidates(source);
  return jsonResponse(await readActivitySummary(env.BUCKET, candidates));
}

async function handleGetResults(identity, isCoordinator, coordinators, env, source) {
  if (coordinators.length === 0) return apiError(503, 'service_unavailable', 'Coordinator access is not configured.');
  if (!hasBucket(env) || typeof env.BUCKET.list !== 'function') {
    return apiError(503, 'service_unavailable', 'Review storage is not configured.');
  }
  const settings = await readSettings(env.BUCKET);
  if (settings.reviewingClosed && !isCoordinator) return apiError(403, 'reviewing_closed', 'Reviewing is closed. Results are no longer available to reviewers.');
  const candidates = await loadCandidates(source);
  const reviews = await readReviews(env.BUCKET, REVIEW_PREFIX);
  const legacyReviews = await readReviews(env.BUCKET, LEGACY_REVIEW_PREFIX, undefined, true);
  return jsonResponse({ candidates, reviews, legacyReviews, rubricVersion: RUBRIC_VERSION, aggregates: buildAggregates(candidates, reviews) });
}

function validatePostHeaders(request) {
  if (!isSameOrigin(request)) return apiError(403, 'forbidden', 'Requests must come from this site.');
  if (!isJsonRequest(request)) return apiError(415, 'unsupported_media_type', 'Send the request as application/json.');
  return null;
}

async function handlePostReview(request, identity, env, source) {
  const headerError = validatePostHeaders(request);
  if (headerError) return headerError;
  if (!hasBucket(env) || typeof env.BUCKET.list !== 'function') {
    return apiError(503, 'service_unavailable', 'Review storage is not configured.');
  }

  const parsed = await readJsonBody(request);
  if (parsed.response) return parsed.response;
  const candidates = await loadCandidates(source);
  const validationMessage = validateReviewBody(parsed.value, candidates);
  if (validationMessage) return apiError(400, 'invalid_review', validationMessage);

  const review = {
    candidateId: parsed.value.candidateId,
    scores: Object.fromEntries(REVIEW_SCORE_KEYS.map((key) => [key, parsed.value.scores[key]])),
    weightedScore: weightedScore(parsed.value.scores),
    rubricVersion: RUBRIC_VERSION,
    departmentFit: parsed.value.departmentFit,
    department: parsed.value.department,
    notes: parsed.value.notes.trim(),
    founderPotential: parsed.value.founderPotential,
    reviewer: identity,
    submittedAt: new Date().toISOString(),
  };
  const userHash = await hashUserId(identity.id);
  const key = `${REVIEW_PREFIX}${userHash}/${review.candidateId}.json`;
  const serialized = JSON.stringify(review);
  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(serialized).byteLength + encoder.encode('review').byteLength;
  if (metadataBytes > MAX_CUSTOM_METADATA_SNAPSHOT_BYTES) {
    return apiError(400, 'review_too_large', 'Shorten the notes so the full review fits the storage limit.');
  }
  // CLOSE-BARRIER CEILING: R2 cannot transact a settings read with a write to a different key. This check admits the commit; a write already admitted here may finish after close. Use serialized admission and persistence (for example, a Durable Object or transactional database) if a strict close barrier becomes necessary.
  const latestSettings = await readSettings(env.BUCKET);
  if (latestSettings.reviewingClosed) {
    return apiError(403, 'reviewing_closed', 'Reviewing is closed. New reviews are no longer accepted.');
  }
  const saved = await env.BUCKET.put(key, serialized, {
    onlyIf: new Headers({ 'If-None-Match': '*' }),
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
    customMetadata: { review: serialized },
  });
  if (!saved) return apiError(409, 'review_already_submitted', 'A review for this candidate has already been submitted.');
  return jsonResponse({ review }, 201);
}

async function handlePostComment(request, identity, env, source) {
  const headerError = validatePostHeaders(request);
  if (headerError) return headerError;
  if (!hasBucket(env)) return apiError(503, 'service_unavailable', 'Review storage is not configured.');

  const parsed = await readJsonBody(request);
  if (parsed.response) return parsed.response;
  const candidates = await loadCandidates(source);
  const validationMessage = validateCommentBody(parsed.value, candidates);
  if (validationMessage) return apiError(400, 'invalid_comment', validationMessage);

  const comment = {
    id: crypto.randomUUID(),
    candidateId: parsed.value.candidateId,
    text: parsed.value.text.trim(),
    author: identity,
    createdAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(comment);
  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(serialized).byteLength + encoder.encode('comment').byteLength;
  if (metadataBytes > MAX_CUSTOM_METADATA_SNAPSHOT_BYTES) {
    return apiError(400, 'comment_too_large', 'Shorten the comment so it fits the storage limit.');
  }

  // CLOSE-BARRIER CEILING: R2 cannot transact a settings read with a write to a different key. This check admits the comment; a write already admitted here may finish after close. Use serialized admission and persistence (for example, a Durable Object or transactional database) if a strict close barrier becomes necessary.
  const settings = await readSettings(env.BUCKET);
  if (settings.reviewingClosed) {
    return apiError(403, 'reviewing_closed', 'Reviewing is closed. New comments are no longer accepted.');
  }

  const key = `${COMMENT_PREFIX}${comment.candidateId}/${comment.id}.json`;
  const saved = await env.BUCKET.put(key, serialized, {
    onlyIf: new Headers({ 'If-None-Match': '*' }),
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
    customMetadata: { comment: serialized },
  });
  if (!saved) return apiError(409, 'comment_conflict', 'The comment could not be saved. Please try again.');
  return jsonResponse({ comment }, 201);
}

async function handlePostActivity(request, identity, env, source) {
  const headerError = validatePostHeaders(request);
  if (headerError) return headerError;
  if (!hasBucket(env)) return apiError(503, 'service_unavailable', 'Review storage is not configured.');

  const parsed = await readJsonBody(request);
  if (parsed.response) return parsed.response;
  const candidates = await loadCandidates(source);
  const validationMessage = validateActivityBody(parsed.value, candidates);
  if (validationMessage) return apiError(400, 'invalid_activity', validationMessage);

  const userHash = await hashUserId(identity.id);
  const activity = {
    candidateId: parsed.value.candidateId,
    status: parsed.value.status,
    updatedAt: new Date().toISOString(),
  };
  const storedActivity = { ...activity, reviewerId: identity.id };
  const serialized = JSON.stringify(storedActivity);
  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(serialized).byteLength + encoder.encode('activity').byteLength;
  if (metadataBytes > MAX_CUSTOM_METADATA_SNAPSHOT_BYTES) {
    return apiError(400, 'activity_too_large', 'The activity update exceeds the storage limit.');
  }

  // CLOSE-BARRIER CEILING: R2 cannot transact a settings read with a write to a different key. This check admits the update; a write already admitted here may finish after close. Use serialized admission and persistence (for example, a Durable Object or transactional database) if a strict close barrier becomes necessary.
  const settings = await readSettings(env.BUCKET);
  if (settings.reviewingClosed) {
    return apiError(403, 'reviewing_closed', 'Reviewing is closed. Activity updates are no longer accepted.');
  }

  const key = `${ACTIVITY_PREFIX}${userHash}.json`;
  await env.BUCKET.put(key, serialized, {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
    customMetadata: { activity: serialized },
  });
  return jsonResponse({ activity });
}

function isPreconditionFailure(error) {
  return error?.status === 412 || error?.statusCode === 412 || error?.code === 'PreconditionFailed' ||
    /precondition failed/i.test(String(error?.message ?? ''));
}

async function handlePostSettings(request, isCoordinator, coordinators, env) {
  if (coordinators.length === 0) return apiError(503, 'service_unavailable', 'Coordinator access is not configured.');
  if (!isCoordinator) return apiError(403, 'forbidden', 'Coordinator access is required.');
  const headerError = validatePostHeaders(request);
  if (headerError) return headerError;
  if (!hasBucket(env)) return apiError(503, 'service_unavailable', 'Review storage is not configured.');
  const parsed = await readJsonBody(request);
  if (parsed.response) return parsed.response;
  if (!hasExactKeys(parsed.value, ['reviewingClosed']) || typeof parsed.value.reviewingClosed !== 'boolean') {
    return apiError(400, 'invalid_settings', 'reviewingClosed must be a boolean.');
  }
  const settings = { reviewingClosed: parsed.value.reviewingClosed, updatedAt: new Date().toISOString() };
  await env.BUCKET.put(SETTINGS_KEY, JSON.stringify(settings), {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
  });
  return jsonResponse({ settings: { reviewingClosed: settings.reviewingClosed } });
}

async function handlePostDataset(request, isCoordinator, coordinators, env) {
  if (coordinators.length === 0) return apiError(503, 'service_unavailable', 'Coordinator access is not configured.');
  if (!isCoordinator) return apiError(403, 'forbidden', 'Coordinator access is required.');
  const headerError = validatePostHeaders(request);
  if (headerError) return headerError;
  if (!hasBucket(env) || typeof env.BUCKET.list !== 'function') {
    return apiError(503, 'service_unavailable', 'Review storage is not configured.');
  }

  const parsed = await readJsonBody(request, MAX_DATASET_BODY_BYTES);
  if (parsed.response) return parsed.response;

  let candidates;
  try {
    candidates = normalizeDataset(parsed.value);
  } catch {
    return apiError(400, 'invalid_dataset', 'Provide 1 to 200 valid candidates using the canonical candidate schema.');
  }

  if (await env.BUCKET.get(DATASET_KEY)) {
    return apiError(409, 'dataset_exists', 'A candidate dataset is already configured. Use a new site and bucket for a new cohort.');
  }
  if ((await listObjects(env.BUCKET, 'reviews/')).length > 0) {
    return apiError(409, 'reviews_exist', 'A candidate dataset cannot be added after reviews have been recorded.');
  }

  const saved = await env.BUCKET.put(DATASET_KEY, JSON.stringify(candidates), {
    onlyIf: new Headers({ 'If-None-Match': '*' }),
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
  });
  if (!saved) return apiError(409, 'dataset_exists', 'A candidate dataset is already configured.');
  return jsonResponse({ candidateCount: candidates.length }, 201);
}

export async function handleApi(request, env, candidateSource) {
  const url = new URL(request.url);
  if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) return null;

  const identity = readIdentity(request);
  if (!identity) return apiError(401, 'unauthorized', 'Sign in to use this review app.');

  const coordinators = parseEmailList(env?.COORDINATOR_EMAILS);
  const isCoordinator = coordinators.includes(identity.email);
  const methods = {
    '/api/me': ['GET'],
    '/api/candidates': ['GET'],
    '/api/results': ['GET'],
    '/api/reviews': ['POST'],
    '/api/comments': ['GET', 'POST'],
    '/api/activity': ['GET', 'POST'],
    '/api/settings': ['POST'],
    '/api/dataset': ['POST'],
  };
  const allowedMethods = methods[url.pathname];
  if (!allowedMethods) return apiError(404, 'not_found', 'API endpoint not found.');
  if (!allowedMethods.includes(request.method)) {
    return apiError(405, 'method_not_allowed', 'Method not allowed.', { allow: allowedMethods.join(', ') });
  }

  try {
    if (url.pathname === '/api/me') return await handleGetMe(identity, isCoordinator, coordinators, env);
    if (url.pathname === '/api/candidates') return await handleGetCandidates(identity, isCoordinator, env, candidateSource);
    if (url.pathname === '/api/results') return await handleGetResults(identity, isCoordinator, coordinators, env, candidateSource);
    if (url.pathname === '/api/reviews') return await handlePostReview(request, identity, env, candidateSource);
    if (url.pathname === '/api/comments' && request.method === 'GET') {
      return await handleGetComments(isCoordinator, env, candidateSource, url);
    }
    if (url.pathname === '/api/comments' && request.method === 'POST') {
      return await handlePostComment(request, identity, env, candidateSource);
    }
    if (url.pathname === '/api/activity' && request.method === 'GET') {
      return await handleGetActivity(isCoordinator, env, candidateSource);
    }
    if (url.pathname === '/api/activity' && request.method === 'POST') {
      return await handlePostActivity(request, identity, env, candidateSource);
    }
    if (url.pathname === '/api/settings') return await handlePostSettings(request, isCoordinator, coordinators, env);
    if (url.pathname === '/api/dataset') return await handlePostDataset(request, isCoordinator, coordinators, env);
  } catch (error) {
    if (request.method === 'POST' && url.pathname === '/api/reviews' && isPreconditionFailure(error)) {
      return apiError(409, 'review_already_submitted', 'A review for this candidate has already been submitted.');
    }
    if (request.method === 'POST' && url.pathname === '/api/comments' && isPreconditionFailure(error)) {
      return apiError(409, 'comment_conflict', 'The comment could not be saved. Please try again.');
    }
    if (request.method === 'POST' && url.pathname === '/api/dataset' && isPreconditionFailure(error)) {
      return apiError(409, 'dataset_exists', 'A candidate dataset is already configured.');
    }
    return apiError(503, 'service_unavailable', 'The review service is temporarily unavailable.');
  }
  return apiError(404, 'not_found', 'API endpoint not found.');
}
