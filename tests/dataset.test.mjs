import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import { handleApi } from '../worker/api.js';

const DATASET_KEY = 'dataset/v1/candidates.json';
const coordinator = { id: 'coordinator-user', email: 'coord@example.com' };
const reviewer = { id: 'reviewer-user', email: 'reviewer@example.com' };

function authHeaders(user) {
  return {
    'oai-authenticated-user-id': user.id,
    'oai-authenticated-user-email': user.email,
  };
}

function request(path, { method = 'GET', user = reviewer, body, headers = {}, origin = 'https://app.example' } = {}) {
  const mergedHeaders = new Headers({ ...authHeaders(user), ...headers });
  if (method === 'POST') {
    if (!mergedHeaders.has('content-type')) mergedHeaders.set('content-type', 'application/json');
    if (!mergedHeaders.has('origin')) mergedHeaders.set('origin', origin);
  }
  return new Request('https://app.example' + path, {
    method,
    headers: mergedHeaders,
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}

function candidate(id = 'candidate-1') {
  return {
    id,
    name: 'Example Candidate',
    firstDepartment: 'Partnerships',
    secondDepartment: 'Marketing',
    hours: 12,
    city: 'Warsaw',
    commitment: 'Weekly',
    answers: {
      achievement: 'Built a useful community project.',
      vision: 'Make founders more connected.',
      initiative: 'Organized a small event.',
      ownership: 'Followed through on the details.',
      motivation: 'Help people make progress.',
      additional: '',
    },
  };
}

class MemoryBucket {
  objects = new Map();
  metadata = new Map();
  getCalls = [];
  putCalls = [];
  listCalls = [];

  async get(key) {
    this.getCalls.push(key);
    const stored = this.objects.get(key);
    if (stored === undefined) return null;
    return {
      text: async () => stored,
      json: async () => JSON.parse(stored),
    };
  }

  async put(key, body, options = {}) {
    this.putCalls.push({ key, options });
    if (options.onlyIf instanceof Headers &&
        options.onlyIf.get('If-None-Match') === '*' &&
        this.objects.has(key)) {
      return null;
    }
    const stored = typeof body === 'string' ? body : await new Response(body).text();
    this.objects.set(key, stored);
    if (options.customMetadata) this.metadata.set(key, options.customMetadata);
    return { key };
  }

  async list({ prefix = '', cursor, limit = 1000 } = {}) {
    this.listCalls.push({ prefix, cursor, limit });
    const keys = [...this.objects.keys()].filter((key) => key.startsWith(prefix)).sort();
    const offset = cursor ? Number(cursor) : 0;
    const page = keys.slice(offset, offset + limit);
    const nextOffset = offset + page.length;
    const truncated = nextOffset < keys.length;
    return {
      objects: page.map((key) => ({ key })),
      truncated,
      ...(truncated ? { cursor: String(nextOffset) } : {}),
    };
  }
}

function env(bucket = new MemoryBucket(), coordinators = 'coord@example.com,other@example.com') {
  return { BUCKET: bucket, COORDINATOR_EMAILS: coordinators };
}

async function postDataset({ bucket = new MemoryBucket(), user = coordinator, body = { candidates: [candidate()] }, headers = {}, origin } = {}) {
  const storage = env(bucket);
  const response = await handleApi(request('/api/dataset', {
    method: 'POST',
    user,
    body,
    headers,
    ...(origin === undefined ? {} : { origin }),
  }), storage);
  return { response, bucket };
}

test('dataset import requires trusted coordinator identity before reading a source or storage', async () => {
  const bucket = new MemoryBucket();
  let sourceReads = 0;
  const source = async () => {
    sourceReads += 1;
    return [];
  };
  const storage = env(bucket);

  const anonymous = await handleApi(request('/api/dataset', {
    method: 'POST',
    user: { id: '', email: '' },
    body: { candidates: [candidate()] },
  }), storage, source);
  assert.equal(anonymous.status, 401);

  const reviewerResponse = await handleApi(request('/api/dataset', {
    method: 'POST',
    user: reviewer,
    body: { candidates: [candidate()] },
  }), storage, source);
  assert.equal(reviewerResponse.status, 403);
  assert.equal(sourceReads, 0);
  assert.deepEqual(bucket.getCalls, []);
  assert.deepEqual(bucket.listCalls, []);
});

test('coordinator import stores a normalized array without contact fields or R2 custom metadata', async () => {
  const imported = candidate();
  imported.email = 'private@example.com';
  imported.phone = '+48 555 123 456';
  imported.contactDetails = { email: 'nested@example.com', phone: '+48 111 222 333' };
  imported.answers.achievement = 'Contact alex@example.com or call +48 123 456 789 about this project.';
  imported.ai = {
    rubricVersion:'2026-10-18-v3',
    scores: { ownership: 5, growth: 4, communityService: 3, motivation: 5 },
    weightedScore: 1,
    fit: 'Strong fit',
    reason: 'Shows follow-through.',
  };

  const { response, bucket } = await postDataset({ body: { candidates: [imported] } });
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.candidateCount, 1);
  const stored = JSON.parse(bucket.objects.get(DATASET_KEY));
  assert.deepEqual(stored[0].ai.scores, imported.ai.scores);
  assert.equal(stored[0].ai.weightedScore, 84);
  assert.equal(stored[0].email, undefined);
  assert.equal(stored[0].phone, undefined);
  assert.equal(stored[0].contactDetails, undefined);
  assert.equal(stored[0].answers.achievement.includes('alex@example.com'), false);
  assert.equal(stored[0].answers.achievement.includes('123 456 789'), false);

  assert.deepEqual(Object.keys(stored[0]).sort(), [
    'ai', 'answers', 'city', 'commitment', 'firstDepartment', 'hours', 'id', 'name', 'secondDepartment',
  ]);
  assert.equal(stored[0].id, 'candidate-1');
  assert.equal(bucket.putCalls.length, 1);
  assert.equal(bucket.putCalls[0].key, DATASET_KEY);
  assert.equal(bucket.putCalls[0].options.onlyIf.get('If-None-Match'), '*');
  assert.equal(bucket.putCalls[0].options.httpMetadata.contentType, 'application/json; charset=utf-8');
  assert.equal('customMetadata' in bucket.putCalls[0].options, false);
  assert.equal(bucket.metadata.has(DATASET_KEY), false);
});

test('malformed, empty, oversized, duplicate, invalid and non-canonical datasets are rejected', async () => {
  const invalidRequests = [
    { label: 'malformed JSON', body: '{bad json', status: 400 },
    { label: 'empty dataset', body: { candidates: [] }, status: 400 },
    { label: 'missing wrapper', body: { candidate: candidate() }, status: 400 },
    { label: 'duplicate IDs', body: { candidates: [candidate(), candidate()] }, status: 400 },
    { label: 'invalid ID', body: { candidates: [candidate('../other-key')] }, status: 400 },
    { label: 'invalid department', body: { candidates: [{ ...candidate(), firstDepartment: 'Engineering' }] }, status: 400 },
    { label: 'invalid AI score', body: { candidates: [{ ...candidate(), ai: { scores: { ownership: 6 } } }] }, status: 400 },
    { label: 'missing answer key', body: { candidates: [{ ...candidate(), answers: { achievement: 'one' } }] }, status: 400 },
    { label: 'too many candidates', body: { candidates: Array.from({ length: 201 }, (_, index) => candidate('candidate-' + index)) }, status: 400 },
    { label: 'oversized body', body: 'x'.repeat(5 * 1024 * 1024 + 1), status: 413 },
  ];

  for (const invalid of invalidRequests) {
    const bucket = new MemoryBucket();
    const { response } = await postDataset({ bucket, body: invalid.body });
    assert.equal(response.status, invalid.status, invalid.label);
    assert.equal(bucket.putCalls.length, 0, invalid.label);
  }
});

test('dataset import requires same-origin JSON', async () => {
  const wrongOrigin = await postDataset({ origin: 'https://attacker.example' });
  assert.equal(wrongOrigin.response.status, 403);
  assert.equal(wrongOrigin.bucket.putCalls.length, 0);

  const wrongType = await postDataset({ headers: { 'content-type': 'text/plain' } });
  assert.equal(wrongType.response.status, 415);
  assert.equal(wrongType.bucket.putCalls.length, 0);
});

test('an existing dataset or any review record prevents cohort replacement', async () => {
  const existingDataset = new MemoryBucket();
  existingDataset.objects.set(DATASET_KEY, JSON.stringify([candidate('existing')]));
  const duplicateImport = await postDataset({ bucket: existingDataset });
  assert.equal(duplicateImport.response.status, 409);
  assert.equal(existingDataset.putCalls.length, 0);

  const reviewedDataset = new MemoryBucket();
  reviewedDataset.objects.set('reviews/v3/abc123/candidate-1.json', '{}');
  const blockedImport = await postDataset({ bucket: reviewedDataset });
  assert.equal(blockedImport.response.status, 409);
  assert.equal(reviewedDataset.putCalls.length, 0);
});

test('concurrent dataset imports use create-only persistence and exactly one succeeds', async () => {
  const bucket = new MemoryBucket();
  const importOne = postDataset({ bucket, body: { candidates: [candidate('first')] } });
  const importTwo = postDataset({ bucket, body: { candidates: [candidate('second')] } });
  const results = await Promise.all([importOne, importTwo]);
  assert.deepEqual(results.map(({ response }) => response.status).sort(), [201, 409]);
  assert.equal(bucket.putCalls.length, 2);
  assert.equal(bucket.objects.has(DATASET_KEY), true);
  const stored = JSON.parse(bucket.objects.get(DATASET_KEY));
  assert.equal(stored.length, 1);
  assert.ok(['first', 'second'].includes(stored[0].id));
});

test('source functions load only on authenticated requests, array fixtures stay supported, and the shell exposes no coordinator secret', async () => {
  const bucket = new MemoryBucket();
  let sourceReads = 0;
  const fixture = candidate();
  const source = async () => {
    sourceReads += 1;
    return [fixture];
  };
  const candidateResponse = await handleApi(request('/api/candidates', { user: reviewer }), env(bucket), source);
  assert.equal(candidateResponse.status, 200);
  assert.equal((await candidateResponse.json()).candidates[0].id, fixture.id);
  assert.equal(sourceReads, 1);

  const arrayResponse = await handleApi(request('/api/candidates', { user: reviewer }), env(new MemoryBucket()), [fixture]);
  assert.equal(arrayResponse.status, 200);
  assert.equal((await arrayResponse.json()).candidates[0].id, fixture.id);

  const shellBucket = new MemoryBucket();
  const coordinatorEmails = 'coord@example.com,other@example.com';
  const shell = await worker.fetch(new Request('https://app.example/'), env(shellBucket, coordinatorEmails));
  assert.equal(shell.status, 200);
  const shellText = await shell.text();
  assert.equal(shellText.includes(coordinatorEmails), false);
  assert.equal(shellBucket.getCalls.length, 0);

  const anonymousCandidates = await worker.fetch(new Request('https://app.example/api/candidates'), env(shellBucket));
  assert.equal(anonymousCandidates.status, 401);
  assert.equal(shellBucket.getCalls.length, 0);

  const emptyCandidates = await worker.fetch(request('/api/candidates', { user: reviewer }), env(shellBucket));
  assert.equal(emptyCandidates.status, 200);
  assert.deepEqual((await emptyCandidates.json()).candidates, []);
  assert.deepEqual(shellBucket.getCalls, ['settings/v1/reviewing-closed.json', DATASET_KEY]);

  const me = await worker.fetch(request('/api/me', { user: reviewer }), env(shellBucket));
  assert.equal(me.status, 200);
  const mePayload = await me.json();
  assert.equal(mePayload.configured, true);
  assert.equal(JSON.stringify(mePayload).includes(coordinatorEmails), false);
});

test('the documented fictional JSON and CSV import outputs upload without schema repair', async () => {
  const {readFile}=await import('node:fs/promises');
  const {parseCandidateInput}=await import('../scripts/candidate-import.mjs');
  for(const extension of ['json','csv']) {
    const source=await readFile(new URL('../examples/candidates.'+extension,import.meta.url),'utf8');
    const records=parseCandidateInput(source,extension);
    const {response,bucket}=await postDataset({body:{candidates:records}});
    assert.equal(response.status,201,extension);
    assert.equal(JSON.parse(bucket.objects.get(DATASET_KEY)).length,2);
  }
});

test('import pipeline preserves project dates while removing contact phone numbers',async()=>{
  const {parseCandidateInput}=await import('../scripts/candidate-import.mjs');
  const record=candidate();
  record.answers.achievement='Delivered on 2026-10-18. Call +48 123 456 789.';
  const records=parseCandidateInput(JSON.stringify([record]),'json');
  const {response,bucket}=await postDataset({body:{candidates:records}});
  assert.equal(response.status,201);
  const saved=JSON.parse(bucket.objects.get(DATASET_KEY));
  assert.equal(saved[0].answers.achievement,'Delivered on 2026-10-18. Call [redacted phone].');
});
