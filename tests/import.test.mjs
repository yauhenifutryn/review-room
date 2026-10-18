import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MAX_CANDIDATES,
  MAX_INPUT_BYTES,
  inferImportFormat,
  parseCandidateInput,
  readImportFile,
  serializeCandidatesJson,
  writeCandidatesJson,
} from '../scripts/candidate-import.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const cliPath = join(repoRoot, 'scripts', 'import-candidates.mjs');

const validCandidate = (overrides = {}) => ({
  id: 'example_applicant_a',
  name: 'Example Applicant A',
  firstDepartment: 'Partnerships',
  secondDepartment: 'Marketing',
  hours: 8,
  city: 'Warsaw',
  commitment: 'Weekly',
  answers: {
    achievement: 'A fictional example answer.',
    vision: 'A fictional example vision.',
    initiative: 'A fictional example initiative.',
    ownership: 'A fictional example ownership response.',
    motivation: 'A fictional example motivation.',
    additional: 'A fictional example note.',
  },
  ...overrides,
});

function notionCsv(rows) {
  const headers = [
    'First Name',
    'Last Name',
    'Created time',
    'First Department Preference',
    'Second Department Preference',
    'Hours per week',
    'City',
    'Commitment',
    'Achievement',
    'Why do you want to join your community?',
  ];
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

test('fictional JSON and CSV examples both import as two candidates', async () => {
  const json = await readFile(join(repoRoot, 'examples', 'candidates.json'), 'utf8');
  const csv = await readFile(join(repoRoot, 'examples', 'candidates.csv'), 'utf8');
  assert.equal(parseCandidateInput(json, 'json').length, 2);
  assert.equal(parseCandidateInput(csv, 'csv').length, 2);
});

test('Notion CSV handles UTF-8 BOM and multiline quoted answers while dropping contact and profile columns', () => {
  const csv = '\uFEFFFirst Name,Last Name,Created time,First Department Preference,Second Department Preference,Hours per week,City,Commitment,Achievement,Why do you want to join your community?,Email,Phone,Gender,University,Profile\n'
    + 'Example Applicant,Åsa,2026-10-18T10:00:00.000Z,Partnerships,Marketing,8,Łódź,Weekly,"I built a café demo,\nthen iterated after feedback. Reach me at sample@example.test or +48 123 456 789.","I like bringing people together.",hidden@example.test,+48 111 222 333,hidden,hidden,hidden';
  const [candidate] = parseCandidateInput(Buffer.from(csv, 'utf8'), 'csv');

  assert.equal(candidate.name, 'Example Applicant Åsa');
  assert.equal(candidate.firstDepartment, 'Partnerships');
  assert.equal(candidate.secondDepartment, 'Marketing');
  assert.equal(candidate.city, 'Łódź');
  assert.match(candidate.id, /^app_[a-f0-9]{20}$/);
  assert.equal(candidate.answers.achievement.includes('\n'), true);
  assert.match(candidate.answers.achievement, /café/);
  assert.match(candidate.answers.achievement, /\[redacted email\]/);
  assert.match(candidate.answers.achievement, /\[redacted phone\]/);
  assert.equal(JSON.stringify(candidate).includes('sample@example.test'), false);
  assert.equal(JSON.stringify(candidate).includes('hidden@example.test'), false);
  assert.equal(JSON.stringify(candidate).includes('111 222 333'), false);
  assert.equal(JSON.stringify(candidate).includes('University'), false);
  assert.deepEqual(Object.keys(candidate).sort(), [
    'answers', 'city', 'commitment', 'firstDepartment', 'hours', 'id', 'name', 'secondDepartment',
  ]);
});

test('Notion-derived IDs stay stable when rows move and repeated name/time pairs fail as duplicates', () => {
  const first = ['Example Applicant', 'A', '2026-10-18T10:00:00.000Z', 'Partnerships', 'Marketing', '8', 'Warsaw', 'Weekly', 'First answer', 'First motivation'];
  const second = ['Example Applicant', 'B', '2026-10-18T10:05:00.000Z', 'People', 'Finance', '4', 'Krakow', 'Flexible', 'Second answer', 'Second motivation'];
  const original = parseCandidateInput(notionCsv([first, second]), 'csv');
  const reversed = parseCandidateInput(notionCsv([second, first]), 'csv');
  const idsByName = new Map(original.map(({ name, id }) => [name, id]));

  assert.deepEqual(new Map(reversed.map(({ name, id }) => [name, id])), idsByName);
  assert.throws(
    () => parseCandidateInput(notionCsv([first, first]), 'csv'),
    /Duplicate candidate ID/,
  );
});

test('generic CSV requires IDs and ignores non-whitelisted contact/profile columns', () => {
  const csv = 'id,name,firstDepartment,secondDepartment,hours,city,commitment,achievement,email,phone,gender,university,linkedin\n'
    + 'example_a,Example Applicant A,Partnerships,Marketing,8,Warsaw,Weekly,"Build useful things.",row@example.test,+48 123 456 789,hidden,hidden,hidden';
  const [candidate] = parseCandidateInput(csv, 'csv');

  assert.equal(candidate.id, 'example_a');
  assert.equal(candidate.firstDepartment, 'Partnerships');
  assert.equal(candidate.secondDepartment, 'Marketing');
  assert.equal(candidate.hours, 8);
  assert.equal(candidate.city, 'Warsaw');
  assert.deepEqual(candidate.answers, { achievement: 'Build useful things.',vision:'',initiative:'',ownership:'',motivation:'',additional:'' });
  assert.equal(JSON.stringify(candidate).includes('row@example.test'), false);
  assert.equal(JSON.stringify(candidate).includes('123 456 789'), false);
  assert.equal(JSON.stringify(candidate).includes('linkedin'), false);
  assert.throws(
    () => parseCandidateInput('name,firstDepartment\nExample Applicant A,Partnerships', 'csv'),
    /missing an ID/,
  );
});

test('JSON requires explicit unique IDs, rejects unknown properties, and strips contact patterns from free-text answers', () => {
  const candidate = validCandidate({
    answers: {
      achievement: 'Email me at applicant@example.test; call +48 123 456 789.',
    },
  });
  const [cleaned] = parseCandidateInput(JSON.stringify([candidate]), 'json');

  assert.deepEqual(cleaned.answers, {
    achievement: 'Email me at [redacted email]; call [redacted phone].',
    vision:'',initiative:'',ownership:'',motivation:'',additional:''
  });
  assert.throws(
    () => parseCandidateInput(JSON.stringify([{ name: 'Example Applicant A' }]), 'json'),
    /id is required/,
  );
  assert.throws(
    () => parseCandidateInput(JSON.stringify([validCandidate({ email: 'applicant@example.test' })]), 'json'),
    /Unsupported property.*email/,
  );
  assert.throws(
    () => parseCandidateInput(JSON.stringify([candidate, candidate]), 'json'),
    /Duplicate candidate ID/,
  );
});

test('departments and optional AI scores are validated; weighted scores are recomputed', () => {
  const candidate = validCandidate({
    firstDepartment: 'Marketing',
    ai: {
      rubricVersion:'2026-10-18-v3',
    scores: { ownership: 5, growth: 4, communityService: 3, motivation: 5 },
      weightedScore: -999,
      fit: 'Strong fit',
      reason: 'A clear example; email ai@example.test.',
      question: 'How would you test a next step?',
      departmentRecommendation: {
        department: 'People',
        reason: 'Shows care for the team.',
      },
    },
  });
  const [normalized] = parseCandidateInput(JSON.stringify([candidate]), 'json');

  assert.equal(normalized.ai.weightedScore, 84);
  assert.equal(normalized.ai.reason, 'A clear example; email [redacted email].');
  assert.deepEqual(normalized.ai.departmentRecommendation, {
    department: 'People',
    reason: 'Shows care for the team.',
  });
  assert.throws(
    () => parseCandidateInput(JSON.stringify([validCandidate({ firstDepartment: 'Engineering' })]), 'json'),
    /firstDepartment must be one of the supported departments/,
  );
  assert.throws(
    () => parseCandidateInput(JSON.stringify([validCandidate({
      ai: { scores: { ownership: 6 } },
    })]), 'json'),
    /ai.scores.ownership must be null or an integer from 1 to 5/,
  );
  assert.throws(
    () => parseCandidateInput(JSON.stringify([validCandidate({
      ai: { externalEvidence: [] },
    })]), 'json'),
    /Unsupported property.*externalEvidence/,
  );
});

test('input is bounded to 5 MiB and 200 records for JSON and CSV', () => {
  assert.throws(
    () => parseCandidateInput(Buffer.alloc(MAX_INPUT_BYTES + 1, 32), 'json'),
    /size limit/,
  );
  const tooManyJson = Array.from({ length: MAX_CANDIDATES + 1 }, (_, index) => (
    validCandidate({ id: `example_${index}` })
  ));
  assert.throws(
    () => parseCandidateInput(JSON.stringify(tooManyJson), 'json'),
    /at most 200 candidates/,
  );
  const tooManyCsv = Array.from({ length: MAX_CANDIDATES + 1 }, (_, index) => [
    `example_${index}`, `Example Applicant ${index}`, 'Partnerships', 'Marketing', '8', 'Warsaw', 'Weekly',
  ]);
  assert.throws(
    () => parseCandidateInput(
      ['id,name,firstDepartment,secondDepartment,hours,city,commitment', ...tooManyCsv.map((row) => row.join(','))].join('\n'),
      'csv',
    ),
    /at most 200 candidates/,
  );
});

test('JSON output safely preserves quotes, backslashes, newlines, and Unicode', () => {
  const [candidate] = parseCandidateInput(JSON.stringify([validCandidate({
    answers: { achievement: 'Quote: "yes"; slash: \\; line one\nline two; café 🏁' },
  })]), 'json');
  const serialized = serializeCandidatesJson([candidate]);

  assert.equal(serialized.endsWith('\n'), true);
  assert.deepEqual(JSON.parse(serialized), [candidate]);
});

test('writer refuses replacement by default and only overwrites when requested', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'review-room-import-'));
  const outputPath = join(directory, '.private', 'candidates.json');
  try {
    const initial = [validCandidate()];
    const replacement = [validCandidate({ id: 'example_applicant_b', name: 'Example Applicant B' })];
    await writeCandidatesJson(initial, outputPath);
    const originalBytes = await readFile(outputPath, 'utf8');

    await assert.rejects(writeCandidatesJson(replacement, outputPath), /already exists/);
    assert.equal(await readFile(outputPath, 'utf8'), originalBytes);

    await writeCandidatesJson(replacement, outputPath, { replace: true });
    assert.deepEqual(JSON.parse(await readFile(outputPath, 'utf8')), replacement);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('bounded file reader rejects oversized files and CLI help documents its output and privacy limit', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'review-room-import-'));
  const oversizedPath = join(directory, 'oversized.json');
  try {
    await writeFile(oversizedPath, Buffer.alloc(MAX_INPUT_BYTES + 1, 32));
    await assert.rejects(readImportFile(oversizedPath), /size limit/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }

  assert.equal(inferImportFormat('candidate.CSV'), 'csv');
  const result = spawnSync(process.execPath, [cliPath, '--help'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /npm run import -- input\.json\|input\.csv \[--replace\]/);
  assert.match(result.stdout, /\.private\/candidates\.json/);
  assert.match(result.stdout, /cannot guarantee anonymity/);
});
