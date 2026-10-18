import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../worker/api.js';

const candidateFixture = (count = 4) => Array.from({ length: count }, (_, index) => ({
  id: `candidate-${index + 1}`,
  name: `Candidate ${index + 1}`,
  firstDepartment: 'Partnerships',
  secondDepartment: 'Marketing',
  hours: 12,
  city: 'Warsaw',
  commitment: 'weekly',
  answers: {
    achievement: 'Built a useful community project.',
    vision: 'Make founders more connected.',
    initiative: 'Organized a small event.',
    ownership: 'Followed through on the details.',
    motivation: 'Help people make progress.',
    additional: 'Available in Warsaw.',
  },
  summary: 'Clear, concise candidate summary.',
  evidence: ['organized a small event'],
  question: 'What would you try next?',
  ai: {
    rubricVersion: '2026-10-18-v3',
    scores: { ownership: 5, growth: 4, communityService: 3, motivation: 5 },
    weightedScore: 84,
    fit: 'Strong fit',
    reason: 'Shows follow-through, community orientation, and practical initiative.',
    question: 'How would you measure whether your next initiative worked?',
    assessmentVersion: 'evidence-calibrated-2026-10-18-v3',
    evidenceSpecificity: 'Detailed',
    verificationStatus: 'Self-reported; unverified',
    whyNotHigher: 'Verify the individual contribution.',
    criterionReasons: {ownership:'Delivered a named project.',growth:'Describes learning.',communityService:'Team participation.',motivation:'Tested a constrained solution.'},
  },
  aiScore: 99,
  internalAiAssessment: { score: 100 },
}));

const reviewer = { id: 'trusted-user-1', email: 'reviewer@example.com' };
const coordinator = { id: 'trusted-user-2', email: 'coord@example.com' };
const coordinatorEmails = 'coord@example.com';

function authHeaders(user = reviewer) {
  return {
    'oai-authenticated-user-id': user.id,
    'oai-authenticated-user-email': user.email,
  };
}

function makeRequest(path, { method = 'GET', headers = {}, body, origin = 'https://app.example' } = {}) {
  const mergedHeaders = new Headers(headers);
  if (method === 'POST') {
    if (!mergedHeaders.has('content-type')) mergedHeaders.set('content-type', 'application/json');
    if (!mergedHeaders.has('origin')) mergedHeaders.set('origin', origin);
  }
  return new Request(`https://app.example${path}`, {
    method,
    headers: mergedHeaders,
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}

class MemoryBucket {
  objects = new Map();
  customMetadata = new Map();
  listCalls = [];
  getCalls = [];
  putCalls = [];

  constructor({ pageSize = 2 } = {}) {
    this.pageSize = pageSize;
  }

  async put(key, body, options = {}) {
    this.putCalls.push({ key, options });
    const conditionalHeaders = options.onlyIf;
    if (conditionalHeaders instanceof Headers && conditionalHeaders.get('If-None-Match') === '*' && this.objects.has(key)) {
      return null;
    }
    this.objects.set(key, typeof body === 'string' ? body : await new Response(body).text());
    if (options.customMetadata) this.customMetadata.set(key, options.customMetadata);
    return { key };
  }

  async list({ prefix = '', cursor, limit = 1000, include = [] } = {}) {
    this.listCalls.push({ prefix, cursor, limit, include });
    const keys = [...this.objects.keys()].filter((key) => key.startsWith(prefix)).sort();
    const offset = cursor ? Number(cursor) : 0;
    const size = Math.min(limit, this.pageSize);
    const objects = keys.slice(offset, offset + size).map((key) => ({ key }));
    const nextOffset = offset + objects.length;
    const truncated = nextOffset < keys.length;
    const withMetadata = include?.includes('customMetadata')
      ? objects.map((object) => ({ ...object, ...(this.customMetadata.has(object.key) ? { customMetadata: this.customMetadata.get(object.key) } : {}) }))
      : objects;
    return { objects: withMetadata, truncated, ...(truncated ? { cursor: String(nextOffset) } : {}) };
  }

  async get(key) {
    this.getCalls.push(key);
    const value = this.objects.get(key);
    if (value === undefined) return null;
    return { json: async () => JSON.parse(value), text: async () => value };
  }
}

function makeEnv({ bucket = new MemoryBucket(), coordinators = coordinatorEmails } = {}) {
  return {
    BUCKET: bucket,
    ...(coordinators === undefined ? {} : { COORDINATOR_EMAILS: coordinators }),
  };
}

async function api(path, options = {}, env = makeEnv(), candidates = candidateFixture()) {
  return handleApi(makeRequest(path, options), env, candidates);
}

function validReview(candidateId = 'candidate-1') {
  return {
    candidateId,
    scores: { ownership: 4, growth: 5, communityService: 3, motivation: 4 },
    departmentFit: 'Strong fit',
    department: 'Partnerships',
    notes: 'Shows initiative and has followed through on a meaningful project.',
    founderPotential: 'Probably yes',
  };
}

async function postReview({ user = reviewer, body = validReview(), env = makeEnv(), headers = {}, candidates = candidateFixture() } = {}) {
  return handleApi(makeRequest('/api/reviews', {
    method: 'POST',
    headers: { ...authHeaders(user), ...headers },
    body,
  }), env, candidates);
}

async function postComment({ user = reviewer, body = { candidateId: 'candidate-1', text: 'Useful context from my referral.' }, env = makeEnv(), headers = {}, candidates = candidateFixture() } = {}) {
  return handleApi(makeRequest('/api/comments', {
    method: 'POST',
    headers: { ...authHeaders(user), ...headers },
    body,
  }), env, candidates);
}

async function postActivity({ user = reviewer, body = { candidateId: 'candidate-1', status: 'in_progress' }, env = makeEnv(), headers = {}, candidates = candidateFixture() } = {}) {
  return handleApi(makeRequest('/api/activity', {
    method: 'POST',
    headers: { ...authHeaders(user), ...headers },
    body,
  }), env, candidates);
}

async function hashUserIdForTest(userId) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function seedReview(bucket, candidateId, user, overrides = {}) {
  const scores = overrides.scores ?? validReview(candidateId).scores;
  const complete = Object.values(scores).every((score) => Number.isInteger(score));
  const weightedScore = complete
    ? (30 * scores.ownership + 20 * scores.growth + 30 * scores.communityService + 20 * scores.motivation) / 5
    : null;
  const payload = {
    ...validReview(candidateId),
    ...overrides,
    scores,
    weightedScore,
    rubricVersion: '2026-10-18-v3',
    reviewer: user,
    submittedAt: '2026-10-18T12:00:00.000Z',
  };
  const key = `reviews/v3/${await hashUserIdForTest(user.id)}/${candidateId}.json`;
  bucket.objects.set(key, JSON.stringify(payload));
  bucket.customMetadata.set(key, { review: JSON.stringify(payload) });
}

function seedComment(bucket, candidateId, comment) {
  const key = `comments/v1/${candidateId}/${comment.id}.json`;
  const serialized = JSON.stringify(comment);
  bucket.objects.set(key, serialized);
  bucket.customMetadata.set(key, { comment: serialized });
}

async function seedActivity(bucket, user, candidateId, status, updatedAt) {
  const activity = { candidateId, status, reviewerId: user.id, updatedAt };
  const serialized = JSON.stringify(activity);
  const key = `activity/v1/${await hashUserIdForTest(user.id)}.json`;
  bucket.objects.set(key, serialized);
  bucket.customMetadata.set(key, { activity: serialized });
}

test('non-API requests return null for the worker to handle', async () => {
  assert.equal(await api('/'), null);
  assert.equal(await api('/assets/app.js'), null);
});

test('every API endpoint requires trusted identity and returns no candidate names on 401', async () => {
  const env = makeEnv();
  const endpoints = [
    ['/api/me', 'GET'], ['/api/candidates', 'GET'], ['/api/results', 'GET'],
    ['/api/comments?candidateId=candidate-1', 'GET'], ['/api/activity', 'GET'],
    ['/api/reviews', 'POST'], ['/api/comments', 'POST'], ['/api/activity', 'POST'],
  ];
  for (const [path, method] of endpoints) {
    const requestBody = method === 'POST'
      ? (path === '/api/reviews' ? validReview()
        : path === '/api/comments' ? { candidateId: 'candidate-1', text: 'Referral context.' }
          : { candidateId: 'candidate-1', status: 'in_progress' })
      : undefined;
    const request = makeRequest(path, { method, body: requestBody });
    const response = await handleApi(request, env, candidateFixture());
    assert.equal(response.status, 401, path);
    assert.equal(JSON.stringify(await response.json()).includes('Candidate 1'), false, path);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});

test('any signed-in user can review without an email allowlist', async () => {
  const user = { id: 'forwarded-link-user', email: 'anyone@example.com' };
  const response = await api('/api/me', { headers: authHeaders(user) }, makeEnv({ coordinators: '' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    user,
    isCoordinator: false,
    configured: false,
    reviewingClosed: false,
  });
});

test('coordinator status uses only the configured coordinator email list', async () => {
  const response = await api('/api/me', { headers: authHeaders(coordinator) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    user: { id: coordinator.id, email: coordinator.email },
    isCoordinator: true,
    configured: true,
    reviewingClosed: false,
  });
});

test('GET /api/me exposes only trusted identity and reports missing coordinator configuration', async () => {
  const response = await api('/api/me', { headers: authHeaders() }, makeEnv({ coordinators: '' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    user: { id: reviewer.id, email: reviewer.email },
    isCoordinator: false,
    configured: false,
    reviewingClosed: false,
  });
});

test('GET /api/candidates returns whitelisted candidate fields and only this reviewer’s submissions across pages', async () => {
  const bucket = new MemoryBucket({ pageSize: 2 });
  const candidates = candidateFixture(4);
  const env = makeEnv({ bucket });
  for (const candidate of candidates) {
    const response = await postReview({ user: reviewer, body: validReview(candidate.id), env, candidates });
    assert.equal(response.status, 201);
  }
  await seedReview(bucket, 'candidate-1', { id: 'other-user', email: 'other@example.com' });

  const response = await api('/api/candidates', { headers: authHeaders() }, env, candidates);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.candidates.length, 4);
  assert.equal(payload.reviews.length, 4);
  assert.equal(bucket.listCalls.filter(({ prefix }) => prefix.startsWith('reviews/v3/')).length, 2);
  assert.ok(bucket.listCalls.every(({ include }) => include?.includes('customMetadata')));
  assert.equal(bucket.getCalls.filter((key) => key.startsWith('reviews/v3/')).length, 0);
  assert.equal(JSON.stringify(payload).includes('aiScore'), false);
  assert.equal(JSON.stringify(payload).includes('internalAiAssessment'), false);
  assert.equal(JSON.stringify(payload).includes('other-user'), false);
  assert.deepEqual(payload.candidates[0].ai, {...candidates[0].ai, historical:false});
  assert.deepEqual(Object.keys(payload.candidates[0]).sort(), [
    'ai', 'answers', 'city', 'commitment', 'evidence', 'firstDepartment', 'hours', 'id', 'name', 'question', 'secondDepartment', 'summary',
  ]);
});

test('GET /api/results allows signed-in reviewers, fails closed without storage or coordinator configuration, and aggregates all reviews', async () => {
  const allowed = await api('/api/results', { headers: authHeaders() });
  assert.equal(allowed.status, 200);
  assert.ok((await allowed.json()).candidates.length > 0);

  const missingBucket = await api('/api/results', { headers: authHeaders(coordinator) }, makeEnv({ bucket: null }));
  assert.equal(missingBucket.status, 503);
  const missingConfig = await api('/api/results', { headers: authHeaders(coordinator) }, makeEnv({ coordinators: '' }));
  assert.equal(missingConfig.status, 503);

  const bucket = new MemoryBucket({ pageSize: 2 });
  const candidates = candidateFixture(3);
  const env = makeEnv({ bucket });
  await seedReview(bucket, 'candidate-1', reviewer);
  await seedReview(bucket, 'candidate-1', { id: 'another-reviewer', email: 'another@example.com' }, {
    scores: { ownership: 2, growth: 4, communityService: 3, motivation: 5 },
    departmentFit: 'Good fit',
    founderPotential: 'Unsure',
  });
  await seedReview(bucket, 'candidate-2', reviewer, { candidateId: 'candidate-2', scores: { ownership: null, growth: 3, communityService: 4, motivation: null } });
  await seedReview(bucket, 'candidate-3', coordinator, { candidateId: 'candidate-3', scores: { ownership: null, growth: null, communityService: null, motivation: null } });

  const response = await api('/api/results', { headers: authHeaders(coordinator) }, env, candidates);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.reviews.length, 4);
  assert.equal(payload.aggregates.reviewCount, 4);
  assert.equal(payload.aggregates.candidateCount, 3);
  assert.equal(payload.aggregates.completeScoreCount, 2);
  assert.equal(payload.aggregates.incompleteScoreCount, 2);
  assert.equal(payload.aggregates.unknownCriterionCount, 6);
  assert.equal(payload.aggregates.byCandidate.find((item) => item.candidateId === 'candidate-1').reviewCount, 2);
  assert.equal(payload.aggregates.byCandidate.find((item) => item.candidateId === 'candidate-1').averageScores.ownership, 3);
  assert.equal(payload.aggregates.byCandidate.find((item) => item.candidateId === 'candidate-1').averageScores.overall, 72);
  assert.equal(payload.aggregates.byCandidate.find((item) => item.candidateId === 'candidate-2').averageScores.overall, null);
  assert.equal(payload.aggregates.byCandidate.find((item) => item.candidateId === 'candidate-3').unknownCriterionCount, 4);
  assert.equal(JSON.stringify(payload).includes('NaN'), false);
  assert.equal(bucket.listCalls.filter(({ prefix }) => prefix === 'reviews/v3/').length, 2);
  assert.equal(bucket.getCalls.filter((key) => key.startsWith('reviews/v3/')).length, 0);
  assert.equal(JSON.stringify(payload).includes('aiScore'), false);
});

test('GET /api/comments shares all authors’ context newest-first across correctly paginated metadata snapshots', async () => {
  const bucket = new MemoryBucket({ pageSize: 2 });
  const env = makeEnv({ bucket });
  const comments = [
    {
      id: '11111111-1111-4111-8111-111111111111', candidateId: 'candidate-1', text: 'Older referral context.',
      author: { id: 'author-one', email: 'one@example.com' }, createdAt: '2026-10-18T10:00:00.000Z',
    },
    {
      id: '22222222-2222-4222-8222-222222222222', candidateId: 'candidate-1', text: 'Middle referral context.',
      author: { id: 'author-two', email: 'two@example.com' }, createdAt: '2026-10-18T11:00:00.000Z',
    },
    {
      id: '33333333-3333-4333-8333-333333333333', candidateId: 'candidate-1', text: 'Newest referral context.',
      author: { id: 'author-three', email: 'three@example.com' }, createdAt: '2026-10-18T12:00:00.000Z',
    },
  ];
  comments.forEach((comment) => seedComment(bucket, 'candidate-1', comment));

  const response = await api('/api/comments?candidateId=candidate-1', { headers: authHeaders(reviewer) }, env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.comments.map((comment) => comment.id), comments.map((comment) => comment.id).reverse());
  assert.equal(payload.comments[0].author.email, 'three@example.com');
  assert.equal(bucket.listCalls.filter(({ prefix }) => prefix === 'comments/v1/candidate-1/').length, 2);
  assert.ok(bucket.listCalls.every(({ include }) => include?.includes('customMetadata')));
  assert.equal(bucket.getCalls.filter((key) => key.startsWith('comments/v1/')).length, 0);

  const otherCandidate = await api('/api/comments?candidateId=candidate-2', { headers: authHeaders(reviewer) }, env);
  assert.deepEqual((await otherCandidate.json()).comments, []);
  assert.equal((await api('/api/comments', { headers: authHeaders(reviewer) }, env)).status, 400);
  assert.equal((await api('/api/comments?candidateId=candidate-1&candidateId=candidate-2', { headers: authHeaders(reviewer) }, env)).status, 400);
  assert.equal((await api('/api/comments?candidateId=unknown', { headers: authHeaders(reviewer) }, env)).status, 404);
});

test('POST /api/comments stamps trusted authors, shares referrals, and keeps private scoring notes separate', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  const privateNotes = 'PRIVATE scoring notes that other reviewers must not see.';
  const review = await postReview({ env, body: { ...validReview(), notes: privateNotes } });
  assert.equal(review.status, 201);

  const commentResponse = await postComment({
    user: reviewer,
    env,
    body: { candidateId: 'candidate-1', text: 'I worked with them on a community event.' },
  });
  assert.equal(commentResponse.status, 201);
  const { comment } = await commentResponse.json();
  assert.match(comment.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(comment.author.id, reviewer.id);
  assert.equal(comment.author.email, reviewer.email);
  assert.ok(Number.isFinite(Date.parse(comment.createdAt)));
  assert.equal(comment.text, 'I worked with them on a community event.');

  const stored = bucket.customMetadata.get(bucket.putCalls.at(-1).key);
  assert.equal(bucket.putCalls.at(-1).options.onlyIf.get('If-None-Match'), '*');
  assert.equal(JSON.parse(stored.comment).text, comment.text);
  assert.equal(bucket.objects.get(bucket.putCalls.at(-1).key), stored.comment);
  assert.match(bucket.putCalls.at(-1).key, /^comments\/v1\/candidate-1\/[0-9a-f-]+\.json$/);

  const reader = { id: 'different-reviewer', email: 'reader@example.com' };
  const shared = await api('/api/comments?candidateId=candidate-1', { headers: authHeaders(reader) }, env);
  const sharedPayload = await shared.json();
  assert.equal(shared.status, 200);
  assert.equal(sharedPayload.comments.length, 1);
  assert.equal(sharedPayload.comments[0].author.email, reviewer.email);
  assert.equal(JSON.stringify(sharedPayload).includes(privateNotes), false);

  const readerCandidates = await api('/api/candidates', { headers: authHeaders(reader) }, env);
  assert.deepEqual((await readerCandidates.json()).reviews, []);
  const results = await api('/api/results', { headers: authHeaders(coordinator) }, env);
  const resultPayload = await results.json();
  assert.equal(resultPayload.reviews.length, 1);
  assert.equal(resultPayload.aggregates.reviewCount, 1);
  assert.equal(JSON.stringify(resultPayload).includes(comment.text), false);
});

test('GET /api/activity returns privacy-safe submission, completion, TTL, and reviewer summary counts', async () => {
  const bucket = new MemoryBucket({ pageSize: 2 });
  const env = makeEnv({ bucket });
  const completeUser = { id: 'finished-reviewer', email: 'finished@example.com' };
  const activeOne = { id: 'active-reviewer-one', email: 'active1@example.com' };
  const activeTwo = { id: 'active-reviewer-two', email: 'active2@example.com' };
  const expired = { id: 'expired-reviewer', email: 'expired@example.com' };
  const future = { id: 'future-reviewer', email: 'future@example.com' };
  const nullScores = { ownership: null, growth: null, communityService: null, motivation: null };
  const now = Date.now();

  await seedReview(bucket, 'candidate-1', reviewer, { notes: 'PRIVATE reviewer evidence, never show in activity.' });
  for (const candidateId of ['candidate-1', 'candidate-2', 'candidate-3']) {
    await seedReview(bucket, candidateId, completeUser, { candidateId, scores: nullScores });
  }
  const activeAt = new Date(now - 5 * 60_000).toISOString();
  await seedActivity(bucket, reviewer, 'candidate-1', 'in_progress', activeAt);
  await seedActivity(bucket, activeOne, 'candidate-1', 'in_progress', activeAt);
  await seedActivity(bucket, activeTwo, 'candidate-2', 'in_progress', activeAt);
  await seedActivity(bucket, expired, 'candidate-1', 'in_progress', new Date(now - 16 * 60_000).toISOString());
  await seedActivity(bucket, future, 'candidate-1', 'in_progress', new Date(now + 60_000).toISOString());

  const response = await api('/api/activity', { headers: authHeaders() }, env, candidateFixture(3));
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.candidates, [
    { candidateId: 'candidate-1', submittedCount: 2, completeCount: 1, incompleteCount: 1, activeCount: 1 },
    { candidateId: 'candidate-2', submittedCount: 1, completeCount: 0, incompleteCount: 1, activeCount: 1 },
    { candidateId: 'candidate-3', submittedCount: 1, completeCount: 0, incompleteCount: 1, activeCount: 0 },
  ]);
  assert.equal(payload.activeWindowMinutes, 15);
  assert.deepEqual(payload.reviewerSummary, { startedCount: 4, finishedAllCount: 1, activeCount: 2 });
  assert.equal(JSON.stringify(payload).includes('PRIVATE reviewer evidence'), false);
  assert.equal(JSON.stringify(payload).includes('finished@example.com'), false);
  assert.equal(JSON.stringify(payload).includes('active1@example.com'), false);
  assert.equal(bucket.listCalls.filter(({ prefix }) => prefix === 'reviews/v3/').length, 2);
  assert.equal(bucket.listCalls.filter(({ prefix }) => prefix === 'activity/v1/').length, 3);
  assert.ok(bucket.listCalls.every(({ include }) => include?.includes('customMetadata')));
  assert.equal(bucket.getCalls.filter((key) => key.startsWith('reviews/v3/') || key.startsWith('activity/v1/')).length, 0);
});

test('POST /api/activity stores only one hashed-user progress snapshot and idle clears active status', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  const first = await postActivity({ env });
  assert.equal(first.status, 200);
  const firstPayload = await first.json();
  assert.equal(firstPayload.activity.candidateId, 'candidate-1');
  assert.equal(firstPayload.activity.status, 'in_progress');
  assert.ok(Number.isFinite(Date.parse(firstPayload.activity.updatedAt)));
  assert.equal(JSON.stringify(firstPayload).includes(reviewer.id), false);
  assert.equal(JSON.stringify(firstPayload).includes(reviewer.email), false);

  const key = [...bucket.objects.keys()].find((item) => item.startsWith('activity/v1/'));
  assert.match(key, /^activity\/v1\/[a-f0-9]{64}\.json$/);
  const metadata = bucket.customMetadata.get(key);
  assert.equal(bucket.objects.get(key), metadata.activity);
  const storedActivity = JSON.parse(metadata.activity);
  assert.deepEqual(Object.keys(storedActivity).sort(), ['candidateId', 'reviewerId', 'status', 'updatedAt']);
  assert.equal(storedActivity.reviewerId, reviewer.id);
  assert.equal(JSON.stringify(storedActivity).includes(reviewer.email), false);

  const second = await postActivity({ env, body: { candidateId: 'candidate-2', status: 'in_progress' } });
  assert.equal(second.status, 200);
  assert.equal([...bucket.objects.keys()].filter((item) => item.startsWith('activity/v1/')).length, 1);
  let activity = await api('/api/activity', { headers: authHeaders() }, env, candidateFixture(2));
  let rows = (await activity.json()).candidates;
  assert.equal(rows[0].activeCount, 0);
  assert.equal(rows[1].activeCount, 1);

  const idle = await postActivity({ env, body: { candidateId: 'candidate-2', status: 'idle' } });
  assert.equal(idle.status, 200);
  assert.equal(JSON.parse(bucket.customMetadata.get(key).activity).status, 'idle');
  activity = await api('/api/activity', { headers: authHeaders() }, env, candidateFixture(2));
  const idlePayload = await activity.json();
  rows = idlePayload.candidates;
  assert.equal(rows[1].activeCount, 0);
  assert.equal(idlePayload.reviewerSummary.startedCount, 0);
});

test('POST /api/activity validates trusted same-origin progress updates and rejects client timestamps', async () => {
  const baseline = { candidateId: 'candidate-1', status: 'in_progress' };
  const invalidCases = [
    ['wrong origin', { origin: 'https://evil.example' }, baseline, 403],
    ['wrong content type', { headers: { 'content-type': 'text/plain' } }, baseline, 415],
    ['malformed JSON', {}, '{broken', 400],
    ['unknown candidate', {}, { ...baseline, candidateId: 'unknown' }, 400],
    ['invalid status', {}, { ...baseline, status: 'submitted' }, 400],
    ['spoofed identity', {}, { ...baseline, userId: 'someone-else' }, 400],
    ['client timestamp', {}, { ...baseline, updatedAt: null }, 400],
    ['missing status', {}, { candidateId: 'candidate-1' }, 400],
  ];

  for (const [label, requestOptions, body, expectedStatus] of invalidCases) {
    const bucket = new MemoryBucket();
    const response = await handleApi(makeRequest('/api/activity', {
      method: 'POST',
      headers: { ...authHeaders(), ...(requestOptions.headers ?? {}) },
      body,
      origin: requestOptions.origin ?? 'https://app.example',
    }), makeEnv({ bucket }), candidateFixture());
    assert.equal(response.status, expectedStatus, label);
    assert.equal(bucket.objects.size, 0, label);
  }

  const tooLarge = await postActivity({ body: 'x'.repeat(17_000) });
  assert.equal(tooLarge.status, 413);
});

test('GET /api/activity fails closed on missing storage or malformed progress metadata', async () => {
  const missingStorage = await api('/api/activity', { headers: authHeaders() }, makeEnv({ bucket: null }));
  assert.equal(missingStorage.status, 503);

  const bucket = new MemoryBucket();
  const userHash = await hashUserIdForTest(reviewer.id);
  const key = `activity/v1/${userHash}.json`;
  bucket.objects.set(key, JSON.stringify({ candidateId: 'candidate-1', status: 'in_progress', reviewerId: reviewer.id, updatedAt: null }));
  bucket.customMetadata.set(key, { activity: JSON.stringify({ candidateId: 'candidate-1', status: 'in_progress', reviewerId: reviewer.id, updatedAt: null }) });
  const malformed = await api('/api/activity', { headers: authHeaders(coordinator) }, makeEnv({ bucket }));
  assert.equal(malformed.status, 503);
});

test('closed reviewing blocks activity reads from reviewers and all progress writes, while coordinators may read', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  await seedActivity(bucket, reviewer, 'candidate-1', 'in_progress', new Date().toISOString());
  const close = await handleApi(makeRequest('/api/settings', {
    method: 'POST',
    headers: authHeaders(coordinator),
    body: { reviewingClosed: true },
  }), env, candidateFixture());
  assert.equal(close.status, 200);

  const reviewerRead = await api('/api/activity', { headers: authHeaders() }, env);
  assert.equal(reviewerRead.status, 403);
  const coordinatorRead = await api('/api/activity', { headers: authHeaders(coordinator) }, env);
  assert.equal(coordinatorRead.status, 200);
  assert.equal((await coordinatorRead.json()).candidates[0].activeCount, 1);

  for (const user of [reviewer, coordinator]) {
    const response = await postActivity({ user, env, body: { candidateId: 'candidate-1', status: 'idle' } });
    assert.equal(response.status, 403, user.email);
  }
  assert.equal([...bucket.objects.keys()].filter((key) => key.startsWith('activity/v1/')).length, 1);
});

test('a delayed activity body is rejected if reviewing closes before its final write check', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  let bodyReadStarted;
  let releaseBody;
  const bodyStarted = new Promise((resolve) => { bodyReadStarted = resolve; });
  const bodyGate = new Promise((resolve) => { releaseBody = resolve; });
  const body = new ReadableStream({
    async pull(controller) {
      bodyReadStarted();
      await bodyGate;
      controller.enqueue(new TextEncoder().encode(JSON.stringify({ candidateId: 'candidate-1', status: 'in_progress' })));
      controller.close();
    },
  });
  const request = new Request('https://app.example/api/activity', {
    method: 'POST',
    headers: new Headers({ ...authHeaders(), origin: 'https://app.example', 'content-type': 'application/json' }),
    body,
    duplex: 'half',
  });
  const submission = handleApi(request, env, candidateFixture());

  await bodyStarted;
  try {
    const closeResponse = await handleApi(makeRequest('/api/settings', {
      method: 'POST',
      headers: authHeaders(coordinator),
      body: { reviewingClosed: true },
    }), env, candidateFixture());
    assert.equal(closeResponse.status, 200);
  } finally {
    releaseBody();
  }
  const response = await submission;
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'reviewing_closed');
  assert.equal([...bucket.objects.keys()].filter((key) => key.startsWith('activity/v1/')).length, 0);
});

test('POST /api/comments rejects malformed, spoofed, oversized, and unknown-candidate input', async () => {
  const baseline = { candidateId: 'candidate-1', text: 'Valid context for review.' };
  const invalidCases = [
    ['wrong origin', { origin: 'https://evil.example' }, baseline, 403],
    ['wrong content type', { headers: { 'content-type': 'text/plain' } }, baseline, 415],
    ['malformed JSON', {}, '{broken', 400],
    ['unknown candidate', {}, { ...baseline, candidateId: 'unknown' }, 400],
    ['spoofed author', {}, { ...baseline, author: coordinator }, 400],
    ['missing text', {}, { candidateId: 'candidate-1' }, 400],
    ['short text', {}, { ...baseline, text: 'four' }, 400],
    ['too many characters', {}, { ...baseline, text: 'x'.repeat(2_001) }, 400],
  ];

  for (const [label, requestOptions, body, expectedStatus] of invalidCases) {
    const bucket = new MemoryBucket();
    const response = await handleApi(makeRequest('/api/comments', {
      method: 'POST',
      headers: { ...authHeaders(), ...(requestOptions.headers ?? {}) },
      body,
      origin: requestOptions.origin ?? 'https://app.example',
    }), makeEnv({ bucket }), candidateFixture());
    assert.equal(response.status, expectedStatus, label);
    assert.equal(bucket.objects.size, 0, label);
  }

  const metadataTooLarge = await postComment({ body: { ...baseline, text: '\0'.repeat(2_000) } });
  assert.equal(metadataTooLarge.status, 400);
  assert.equal((await metadataTooLarge.json()).error, 'comment_too_large');
  const bodyTooLarge = await postComment({ body: 'x'.repeat(17_000) });
  assert.equal(bodyTooLarge.status, 413);
});

test('closed reviewing hides shared comments from reviewers but lets coordinators read and blocks every comment write', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  seedComment(bucket, 'candidate-1', {
    id: '44444444-4444-4444-8444-444444444444',
    candidateId: 'candidate-1',
    text: 'Shared context remains available to coordinators.',
    author: reviewer,
    createdAt: '2026-10-18T12:00:00.000Z',
  });
  const close = await handleApi(makeRequest('/api/settings', {
    method: 'POST',
    headers: authHeaders(coordinator),
    body: { reviewingClosed: true },
  }), env, candidateFixture());
  assert.equal(close.status, 200);

  const reviewerRead = await api('/api/comments?candidateId=candidate-1', { headers: authHeaders() }, env);
  assert.equal(reviewerRead.status, 403);
  assert.equal((await reviewerRead.json()).error, 'reviewing_closed');
  const coordinatorRead = await api('/api/comments?candidateId=candidate-1', { headers: authHeaders(coordinator) }, env);
  assert.equal(coordinatorRead.status, 200);
  assert.equal((await coordinatorRead.json()).comments.length, 1);

  for (const user of [reviewer, coordinator]) {
    const response = await postComment({ user, env });
    assert.equal(response.status, 403, user.email);
  }
  assert.equal([...bucket.objects.keys()].filter((key) => key.startsWith('comments/v1/')).length, 1);
});

test('a delayed shared-comment body is rejected if reviewing closes before its commit check', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  let bodyReadStarted;
  let releaseBody;
  const bodyStarted = new Promise((resolve) => { bodyReadStarted = resolve; });
  const bodyGate = new Promise((resolve) => { releaseBody = resolve; });
  const body = new ReadableStream({
    async pull(controller) {
      bodyReadStarted();
      await bodyGate;
      controller.enqueue(new TextEncoder().encode(JSON.stringify({
        candidateId: 'candidate-1',
        text: 'A delayed referral comment with useful context.',
      })));
      controller.close();
    },
  });
  const request = new Request('https://app.example/api/comments', {
    method: 'POST',
    headers: new Headers({
      ...authHeaders(),
      origin: 'https://app.example',
      'content-type': 'application/json',
    }),
    body,
    duplex: 'half',
  });
  const submission = handleApi(request, env, candidateFixture());

  await bodyStarted;
  try {
    const closeResponse = await handleApi(makeRequest('/api/settings', {
      method: 'POST',
      headers: authHeaders(coordinator),
      body: { reviewingClosed: true },
    }), env, candidateFixture());
    assert.equal(closeResponse.status, 200);
  } finally {
    releaseBody();
  }

  const response = await submission;
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'reviewing_closed');
  assert.equal([...bucket.objects.keys()].filter((key) => key.startsWith('comments/v1/')).length, 0);
});

test('coordinator results fail closed when a review snapshot is missing instead of loading object bodies', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  const payload = {
    ...validReview(),
    weightedScore: 78,
    rubricVersion: '2026-10-18-v3',
    reviewer,
    submittedAt: '2026-10-18T12:00:00.000Z',
  };
  bucket.objects.set('reviews/v3/snapshot-missing/candidate-1.json', JSON.stringify(payload));

  const response = await api('/api/results', { headers: authHeaders(coordinator) }, env, candidateFixture());
  assert.equal(response.status, 503);
  assert.equal(bucket.getCalls.filter((key) => key.startsWith('reviews/v3/')).length, 0);
});

test('POST /api/reviews validates same-origin JSON, known fields, and all review constraints', async () => {
  const baseline = validReview();
  const invalidCases = [
    ['wrong origin', { origin: 'https://evil.example' }, baseline, 403],
    ['wrong content type', { headers: { 'content-type': 'text/plain' } }, baseline, 415],
    ['malformed JSON', {}, '{broken', 400],
    ['unknown candidate', {}, validReview('candidate-unknown'), 400],
    ['unknown score key', {}, { ...baseline, scores: { ...baseline.scores, leadership: 5 } }, 400],
    ['missing score', {}, { ...baseline, scores: { ownership: 4, growth: 5, communityService: 3 } }, 400],
    ['old rubric key', {}, { ...baseline, scores: { ownership: 4, entrepreneurship: 5, growth: 3, motivation: 4 } }, 400],
    ['non-integer score', {}, { ...baseline, scores: { ...baseline.scores, ownership: 4.5 } }, 400],
    ['out-of-range score', {}, { ...baseline, scores: { ...baseline.scores, ownership: 6 } }, 400],
    ['negative score', {}, { ...baseline, scores: { ...baseline.scores, ownership: 0 } }, 400],
    ['non-numeric unknown score', {}, { ...baseline, scores: { ...baseline.scores, growth: 'unknown' } }, 400],
    ['invalid department fit', {}, { ...baseline, departmentFit: 'Perfect' }, 400],
    ['invalid department', {}, { ...baseline, department: 'Engineering' }, 400],
    ['short notes', {}, { ...baseline, notes: 'Too short' }, 400],
    ['invalid founder potential', {}, { ...baseline, founderPotential: 'Maybe' }, 400],
    ['spoofed identity field', {}, { ...baseline, userId: 'coord@example.com' }, 400],
    ['client timestamp', {}, { ...baseline, submittedAt: '2020-01-01T00:00:00Z' }, 400],
  ];

  for (const [label, requestOptions, body, expectedStatus] of invalidCases) {
    const bucket = new MemoryBucket();
    const headers = { ...authHeaders(), ...(requestOptions.headers ?? {}) };
    const response = await handleApi(makeRequest('/api/reviews', {
      method: 'POST',
      headers,
      body,
      origin: requestOptions.origin ?? 'https://app.example',
    }), makeEnv({ bucket }), candidateFixture());
    assert.equal(response.status, expectedStatus, label);
    assert.equal(bucket.objects.size, 0, label);
  }

  const tooLarge = ' '.repeat(17_000);
  const oversizeResponse = await postReview({ body: tooLarge });
  assert.equal(oversizeResponse.status, 413);
});

test('POST rejects snapshots over the R2 custom metadata budget and preserves complete notes below it', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  const veryLargeIdentity = { id: 'i'.repeat(512), email: reviewer.email };
  const oversizedReview = { ...validReview(), notes: '\0'.repeat(2_000) };
  const rejected = await postReview({ user: veryLargeIdentity, body: oversizedReview, env });
  assert.equal(rejected.status, 400);
  assert.deepEqual(await rejected.json(), {
    error: 'review_too_large',
    message: 'Shorten the notes so the full review fits the storage limit.',
  });
  assert.equal(bucket.objects.size, 0);

  const ordinary = { ...validReview(), notes: 'A'.repeat(2_000) };
  const accepted = await postReview({ body: ordinary, env });
  assert.equal(accepted.status, 201);
  const { review } = await accepted.json();
  assert.equal(review.notes, ordinary.notes);
  const storedMetadata = bucket.customMetadata.get(bucket.putCalls[0].key);
  assert.equal(JSON.parse(storedMetadata.review).notes, ordinary.notes);
  assert.equal(new TextEncoder().encode(storedMetadata.review).byteLength + 'review'.length <= 7_500, true);
});

test('POST computes the v3 weighted score server-side, stamps trusted identity, and uses an atomic create-only R2 condition', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  const response = await postReview({ env });
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.review.weightedScore, 78);
  assert.equal(payload.review.rubricVersion, '2026-10-18-v3');
  assert.equal(payload.review.reviewer.id, reviewer.id);
  assert.equal(payload.review.reviewer.email, reviewer.email);
  assert.ok(Number.isFinite(Date.parse(payload.review.submittedAt)));
  assert.equal(bucket.objects.size, 1);
  assert.match(bucket.putCalls[0].key, /^reviews\/v3\/[a-f0-9]{64}\/candidate-1\.json$/);
  assert.equal(bucket.putCalls[0].options.onlyIf.get('If-None-Match'), '*');
  assert.ok(bucket.putCalls[0].options.customMetadata.review);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('POST accepts explicit unknown scores, preserves null, and never treats a partial score as zero or reweights it', async () => {
  const partial = validReview();
  partial.scores = { ownership: 4, growth: null, communityService: 3, motivation: 5 };
  const partialResponse = await postReview({ body: partial });
  assert.equal(partialResponse.status, 201);
  const partialReview = (await partialResponse.json()).review;
  assert.equal(partialReview.weightedScore, null);
  assert.equal(partialReview.scores.growth, null);
  assert.equal(partialReview.rubricVersion, '2026-10-18-v3');

  const allUnknown = validReview('candidate-2');
  allUnknown.scores = { ownership: null, growth: null, communityService: null, motivation: null };
  allUnknown.notes = 'Insufficient evidence in the application to score any criterion.';
  const unknownResponse = await postReview({ body: allUnknown });
  assert.equal(unknownResponse.status, 201);
  const unknownReview = (await unknownResponse.json()).review;
  assert.equal(unknownReview.weightedScore, null);
  assert.deepEqual(unknownReview.scores, allUnknown.scores);
});

test('duplicate and concurrent submissions for the same reviewer/candidate return 409 without overwriting', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  const [first, second] = await Promise.all([
    postReview({ env, body: validReview() }),
    postReview({ env, body: { ...validReview(), notes: 'A retry must never replace this first review.' } }),
  ]);
  assert.deepEqual([first.status, second.status].sort(), [201, 409]);
  assert.equal(bucket.objects.size, 1);
  const duplicate = await postReview({ env, body: validReview() });
  assert.equal(duplicate.status, 409);
});

test('missing storage returns 503 for candidate reads and review writes', async () => {
  const env = makeEnv({ bucket: null });
  const candidates = await api('/api/candidates', { headers: authHeaders() }, env);
  assert.equal(candidates.status, 503);
  const submission = await postReview({ env });
  assert.equal(submission.status, 503);
});

test('coordinator can close and reopen reviewing; closed state blocks ordinary candidate reads and all submissions', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  const close = await handleApi(makeRequest('/api/settings', {
    method: 'POST',
    headers: authHeaders(coordinator),
    body: { reviewingClosed: true },
  }), env, candidateFixture());
  assert.equal(close.status, 200);
  assert.deepEqual(await close.json(), { settings: { reviewingClosed: true } });

  const me = await api('/api/me', { headers: authHeaders() }, env);
  assert.equal((await me.json()).reviewingClosed, true);
  const reviewerCandidates = await api('/api/candidates', { headers: authHeaders() }, env);
  assert.equal(reviewerCandidates.status, 403);
  assert.match((await reviewerCandidates.json()).message, /reviewing is closed/i);
  assert.equal(JSON.stringify(await api('/api/candidates', { headers: authHeaders() }, env).then((r) => r.json())).includes('Candidate 1'), false);
  assert.equal((await api('/api/candidates', { headers: authHeaders(coordinator) }, env)).status, 200);
  assert.equal((await postReview({ env })).status, 403);
  assert.equal((await api('/api/results', { headers: authHeaders(coordinator) }, env)).status, 200);

  const reopen = await handleApi(makeRequest('/api/settings', {
    method: 'POST',
    headers: authHeaders(coordinator),
    body: { reviewingClosed: false },
  }), env, candidateFixture());
  assert.equal(reopen.status, 200);
  assert.deepEqual(await reopen.json(), { settings: { reviewingClosed: false } });
  assert.equal((await api('/api/candidates', { headers: authHeaders() }, env)).status, 200);
});

test('settings writes are coordinator-only and validate the same-origin boolean payload', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  const denied = await handleApi(makeRequest('/api/settings', {
    method: 'POST',
    headers: authHeaders(),
    body: { reviewingClosed: true },
  }), env, candidateFixture());
  assert.equal(denied.status, 403);
  assert.equal(bucket.objects.size, 0);

  const wrongOrigin = await handleApi(makeRequest('/api/settings', {
    method: 'POST',
    headers: authHeaders(coordinator),
    body: { reviewingClosed: true },
    origin: 'https://evil.example',
  }), env, candidateFixture());
  assert.equal(wrongOrigin.status, 403);
  assert.equal(bucket.objects.size, 0);

  const invalid = await handleApi(makeRequest('/api/settings', {
    method: 'POST',
    headers: authHeaders(coordinator),
    body: { reviewingClosed: 'true' },
  }), env, candidateFixture());
  assert.equal(invalid.status, 400);
  assert.equal(bucket.objects.size, 0);
});

test('a delayed review body is rejected if reviewing closes before its commit check', async () => {
  const bucket = new MemoryBucket();
  const env = makeEnv({ bucket });
  let bodyReadStarted;
  let releaseBody;
  const bodyStarted = new Promise((resolve) => { bodyReadStarted = resolve; });
  const bodyGate = new Promise((resolve) => { releaseBody = resolve; });
  const body = new ReadableStream({
    async pull(controller) {
      bodyReadStarted();
      await bodyGate;
      controller.enqueue(new TextEncoder().encode(JSON.stringify(validReview())));
      controller.close();
    },
  });
  const request = new Request('https://app.example/api/reviews', {
    method: 'POST',
    headers: new Headers({
      ...authHeaders(),
      origin: 'https://app.example',
      'content-type': 'application/json',
    }),
    body,
    duplex: 'half',
  });
  const submission = handleApi(request, env, candidateFixture());

  await bodyStarted;
  try {
    const closeResponse = await handleApi(makeRequest('/api/settings', {
      method: 'POST',
      headers: authHeaders(coordinator),
      body: { reviewingClosed: true },
    }), env, candidateFixture());
    assert.equal(closeResponse.status, 200);
  } finally {
    releaseBody();
  }

  const response = await submission;
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'reviewing_closed');
  assert.equal([...bucket.objects.keys()].filter((key) => key.startsWith('reviews/v3/')).length, 0);
});

test('existing department recommendation is projected without private fields or changing scores', async () => {
  const candidates = candidateFixture(2);
  candidates[0].ai.departmentRecommendation = { department: 'Event Management', reason: 'Repeated event and volunteer coordination.', internalNote: 'must not leak' };
  candidates[1].ai.departmentRecommendation = { department: 'Invented department', reason: 'Invalid' };
  const response = await api('/api/candidates', {headers:authHeaders()}, makeEnv(), candidates);
  const payload = await response.json();
  assert.deepEqual(payload.candidates[0].ai.departmentRecommendation, {department:'Event Management',reason:'Repeated event and volunteer coordination.'});
  assert.equal(payload.candidates[0].ai.weightedScore, 84);
  assert.equal('departmentRecommendation' in payload.candidates[1].ai, false);
  assert.equal(JSON.stringify(payload).includes('must not leak'),false);
});


test('shared results expose all reviewers while open but preserve closure and admin-only settings', async () => {
  const candidates = candidateFixture(2);
  const bucket = new MemoryBucket();
  const env = makeEnv({bucket});
  await seedReview(bucket, 'candidate-1', coordinator);
  const open = await api('/api/results', {headers:authHeaders()}, env, candidates);
  assert.equal(open.status,200);
  assert.equal((await open.json()).reviews[0].reviewer.email,coordinator.email);
  const denied = await api('/api/settings', {method:'POST',headers:authHeaders(),body:{reviewingClosed:true}},env,candidates);
  assert.equal(denied.status,403);
  const close = await api('/api/settings', {method:'POST',headers:authHeaders(coordinator),body:{reviewingClosed:true}},env,candidates);
  assert.equal(close.status,200);
  const closed = await api('/api/results', {headers:authHeaders()},env,candidates);
  assert.equal(closed.status,403);
  assert.equal((await closed.json()).error,'reviewing_closed');
  assert.equal((await api('/api/results', {headers:authHeaders(coordinator)},env,candidates)).status,200);
});

test('historical scores remain separate from current reviews and current aggregates', async () => {
  const bucket=new MemoryBucket();
  const env=makeEnv({bucket});
  const legacy={...validReview(),scores:{ownership:4,growth:5,community:3,problemSolving:4},rubricVersion:'2026-10-18-v2',reviewer,submittedAt:'2026-10-18T12:00:00.000Z'};
  const key=`reviews/v1/${await hashUserIdForTest(reviewer.id)}/candidate-1.json`;
  const serialized=JSON.stringify(legacy);
  bucket.objects.set(key,serialized);
  bucket.customMetadata.set(key,{review:serialized});
  const queue=await api('/api/candidates',{headers:authHeaders()},env);
  assert.equal((await queue.json()).reviews.length,0);
  assert.equal((await postReview({env})).status,201);
  const result=await (await api('/api/results',{headers:authHeaders()},env)).json();
  assert.equal(result.reviews.length,1);
  assert.equal(result.legacyReviews.length,1);
  assert.equal(result.aggregates.reviewCount,1);
  assert.equal(bucket.objects.get(key),serialized);
});

test('historical AI scores are not mapped onto the new rubric and old submissions are rejected',async()=>{
  const fixture=candidateFixture(1);
  delete fixture[0].ai.rubricVersion;
  fixture[0].ai.scores={ownership:4,growth:5,community:3,problemSolving:4};
  const payload=await (await api('/api/candidates',{headers:authHeaders()},makeEnv(),fixture)).json();
  assert.equal(payload.candidates[0].ai.historical,true);
  assert.equal(payload.candidates[0].ai.weightedScore,null);
  const body={...validReview(),scores:{ownership:4,growth:5,community:3,problemSolving:4}};
  assert.equal((await postReview({body})).status,400);
});
