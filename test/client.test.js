'use strict';

// The client: headers, V1 envelope, V2 submit + poll, errors, and how tool()
// and toolV2() turn a tool ID, slug or path into a request path.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {
  AADDYYError, InsufficientCreditsError, AuthenticationError, RateLimitError,
} = require('../dist/index.js');
const { ok, v2, withStub, requestsOf, withFakeClock, apiError } = require('./helpers.js');

const pkg = require(path.join(__dirname, '..', 'package.json'));

test('every request carries the API key and the package version in User-Agent', async () => {
  await withStub(() => ok({}), async (client, calls) => {
    await client.seo.analyze({ url: 'example.com' });
    assert.equal(calls[0].headers.Authorization, 'Bearer aip_test_key');
    assert.equal(calls[0].headers['Content-Type'], 'application/json');
    assert.match(calls[0].headers['User-Agent'], new RegExp(`^aaddyy-sdk/${pkg.version.replace(/\./g, '\\.')} node/`));
  });
});

test('package.json is version 1.0.3', () => {
  assert.equal(pkg.version, '1.0.3');
});

test('V1 resolves to the response data', async () => {
  await withStub(() => ok({ titles: ['A', 'B'] }), async (client) => {
    assert.deepEqual(await client.titles.generate({ topic: 'Remote work' }), { titles: ['A', 'B'] });
  });
});

test('V2 submits, polls /v2/ai/jobs/:jobId, and resolves to the job result (the tool response body)', async () => {
  const envelope = { success: true, message: 'Image upscaled', data: { imageUrl: 'https://cdn.example.com/out.png' } };
  const states = ['waiting', 'active', 'completed'];
  await withStub((call) => (call.method === 'POST'
    ? ok({ jobId: 'job-9', status: 'queued' })
    : ok({ jobId: 'job-9', status: states.shift(), result: envelope, error: null })), async (client, calls) => {
    assert.deepEqual(await client.images.upscale({ image_url: 'https://example.com/a.jpg' }), envelope);
    assert.deepEqual(calls.map((c) => `${c.method} ${c.path}`), [
      'POST /v2/ai/upscale-image',
      'GET /v2/ai/jobs/job-9',
      'GET /v2/ai/jobs/job-9',
      'GET /v2/ai/jobs/job-9',
    ]);
  });
});

test("a failed V2 job rejects with the tool's error code and the job id", async () => {
  await withStub(v2({ status: 'failed', result: null, error: 'Validation failed', code: 'VALIDATION_ERROR' }), async (client) => {
    await assert.rejects(client.images.removeWatermark({ image_url: 'https://example.com/a.jpg' }), (err) => {
      assert.ok(err instanceof AADDYYError);
      assert.equal(err.message, 'Validation failed');
      assert.equal(err.code, 'VALIDATION_ERROR');
      assert.deepEqual(err.details, { jobId: 'job-1' });
      return true;
    });
  });
});

test('a V2 job that failed for credits rejects with InsufficientCreditsError', async () => {
  await withStub(v2({ status: 'failed', result: null, error: 'Insufficient balance', code: 'INSUFFICIENT_CREDITS' }), async (client) => {
    await assert.rejects(client.images.upscale({ image_url: 'https://example.com/a.jpg' }), InsufficientCreditsError);
  });
});

const UPSCALED = { success: true, message: 'Image upscaled', data: { imageUrl: 'https://cdn.example.com/out.png' } };
const V2_STATUS_URL = 'https://api.test/api/v2/ai/jobs/job-1';

test('V2: a status request that fails for a passing reason is sent again, after a longer wait', async () => {
  const polls = [
    { status: 502, raw: '<html>Bad gateway</html>' },
    apiError(401, 'UNAUTHORIZED', 'Rate limit exceeded: requests per minute'),
    ok({ jobId: 'job-1', status: 'completed', result: UPSCALED, error: null }),
  ];
  await withStub((call) => (call.method === 'POST' ? ok({ jobId: 'job-1', status: 'queued' }) : polls.shift()), async (client, calls) => {
    const waits = [];
    client._sleep = async (ms) => { waits.push(ms); };
    assert.deepEqual(await client.images.upscale({ image_url: 'https://example.com/a.jpg' }), UPSCALED);
    assert.equal(calls.length, 4);
    assert.deepEqual(waits, [2000, 4000, 8000]);
  });
});

test('V2: a 404 from the poll route rejects at once, with its HTTP status and the job id', async () => {
  // The poll route's 404 has no error object: { success: false, message, data: null }.
  const gone = { status: 404, body: { success: false, message: 'Job not found. It may have been cleaned up.', data: null } };
  await withStub((call) => (call.method === 'POST' ? ok({ jobId: 'job-1', status: 'queued' }) : gone), async (client, calls) => {
    await assert.rejects(client.images.upscale({ image_url: 'https://example.com/a.jpg' }), (err) => {
      assert.ok(err instanceof AADDYYError);
      assert.equal(err.statusCode, 404);
      assert.deepEqual(err.details, { jobId: 'job-1' });
      assert.equal(err.message, `Job not found. It may have been cleaned up. Job job-1 had started; check it with GET ${V2_STATUS_URL}.`);
      return true;
    });
    assert.equal(calls.length, 2);
  });
});

test('V2: a job not finished after 600 s (300 polls, 2 s apart) rejects with JOB_TIMEOUT and the job id', async () => {
  await withFakeClock(async (sleep, sleeps) => {
    await withStub(v2({ status: 'active', result: null }), async (client, calls) => {
      client._sleep = sleep;
      await assert.rejects(client.images.upscale({ image_url: 'https://example.com/a.jpg' }), (err) => {
        assert.ok(err instanceof AADDYYError);
        assert.equal(err.code, 'JOB_TIMEOUT');
        assert.deepEqual(err.details, { jobId: 'job-1' });
        assert.equal(err.message, `Job job-1 did not finish within 600 s. It may still finish: poll GET ${V2_STATUS_URL}.`);
        return true;
      });
      assert.equal(calls.filter((c) => c.method === 'GET').length, 300);
      assert.ok(sleeps.every((ms) => ms === 2000));
    });
  });
});

test('V2: a submit response without jobId rejects with BAD_RESPONSE and polls nothing', async () => {
  await withStub(() => ok({ status: 'queued' }), async (client, calls) => {
    await assert.rejects(client.images.upscale({ image_url: 'https://example.com/a.jpg' }), { code: 'BAD_RESPONSE' });
    assert.equal(calls.length, 1);
  });
});

test('a failed V2 job without a code rejects with JOB_FAILED', async () => {
  await withStub(v2({ status: 'failed', result: null, error: null, code: null }), async (client) => {
    await assert.rejects(client.images.upscale({ image_url: 'https://example.com/a.jpg' }), { code: 'JOB_FAILED', message: 'Job failed' });
  });
});

test('402 rejects with InsufficientCreditsError and its required/available', async () => {
  const body = { success: false, error: { message: 'Insufficient balance', code: 'INSUFFICIENT_CREDITS', statusCode: 402, details: { required: 0.12, available: 0.05 } } };
  await withStub(() => ({ status: 402, body }), async (client) => {
    await assert.rejects(client.images.generate({ prompt: 'A lighthouse' }), (err) => {
      assert.ok(err instanceof InsufficientCreditsError);
      assert.equal(err.required, 0.12);
      assert.equal(err.available, 0.05);
      return true;
    });
  });
});

test('422 rejects with the validation details', async () => {
  const fields = [{ path: 'wordCount', msg: 'Word count is required' }];
  const body = { success: false, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 422, details: { fields } } };
  await withStub(() => ({ status: 422, body }), async (client) => {
    await assert.rejects(client.essays.write({ topic: 'Cities and cars', wordCount: 100 }), (err) => {
      assert.equal(err.code, 'VALIDATION_ERROR');
      assert.equal(err.statusCode, 422);
      assert.deepEqual(err.details, { fields });
      return true;
    });
  });
});

test('401 and 429 reject with AuthenticationError and RateLimitError', async () => {
  await withStub(() => ({ status: 401, body: { success: false, error: { code: 'UNAUTHORIZED' } } }), async (client) => {
    await assert.rejects(client.seo.analyze({ url: 'example.com' }), AuthenticationError);
  });
  await withStub(() => ({ status: 429, body: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } } }), async (client) => {
    await assert.rejects(client.seo.analyze({ url: 'example.com' }), RateLimitError);
  });
});

test('a 401 that says the key is over its request limit rejects with RateLimitError', async () => {
  await withStub(() => apiError(401, 'UNAUTHORIZED', 'Rate limit exceeded: requests per minute'), async (client) => {
    await assert.rejects(client.seo.analyze({ url: 'example.com' }), (err) => {
      assert.ok(err instanceof RateLimitError);
      assert.equal(err.code, 'RATE_LIMITED');
      assert.equal(err.message, 'Rate limit exceeded: requests per minute');
      return true;
    });
  });
});

test('an error body without a statusCode of its own gets the HTTP status', async () => {
  await withStub(() => ({ status: 403, body: { success: false, message: 'Access denied', data: null } }), async (client) => {
    await assert.rejects(client.seo.analyze({ url: 'example.com' }), { statusCode: 403, message: 'Access denied' });
  });
});

test('a non-JSON response rejects with BAD_RESPONSE and the HTTP status', async () => {
  await withStub(() => ({ status: 502, raw: '<html>Bad gateway</html>' }), async (client) => {
    await assert.rejects(client.seo.analyze({ url: 'example.com' }), { code: 'BAD_RESPONSE', statusCode: 502 });
  });
});

// ── tool() and toolV2() paths ───────────────────────────────────────────────

const v1 = () => ok({});

test('tool(): a tool ID drops "ai-"', async () => {
  const sent = await requestsOf(v1, (c) => c.tool('ai-qr-code-generator', { content: 'https://www.aaddyy.com' }));
  assert.deepEqual(sent, [['POST', '/ai/qr-code-generator', { content: 'https://www.aaddyy.com' }]]);
});

test('tool(): tool IDs whose endpoint differs from the ID map to their catalog endpoint', async () => {
  const expected = {
    'ai-article-generator': '/ai/article',
    'ai-title-generator': '/ai/article-title',
    'ai-content-curator': '/ai/content-curator/analyze',
    'ai-detector': '/ai/ai-detector',
    'ai-image-generator': '/ai/image-generation',
    'ai-tshirt-designer': '/ai/t-shirt-designer',
  };
  for (const [id, endpoint] of Object.entries(expected)) {
    const sent = await requestsOf(v1, (c) => c.tool(id, {}));
    assert.equal(sent[0][1], endpoint, id);
  }
});

test('tool(): a slug, an /ai path and the catalog /api/ai endpoint reach the same path', async () => {
  for (const ref of ['jewelry-designer', '/ai/jewelry-designer', '/api/ai/jewelry-designer']) {
    const sent = await requestsOf(v1, (c) => c.tool(ref, { jewelry_type: 'ring' }));
    assert.deepEqual(sent, [['POST', '/ai/jewelry-designer', { jewelry_type: 'ring' }]], ref);
  }
});

test('toolV2(): every way to name a tool submits to /v2/ai/<slug>', async () => {
  for (const ref of ['/nano-banana-2', 'nano-banana-2', 'ai-nano-banana-2', '/ai/nano-banana-2', '/v2/ai/nano-banana-2', '/api/ai/nano-banana-2', '/api/v2/ai/nano-banana-2']) {
    const sent = await requestsOf(v2(), (c) => c.toolV2(ref, { prompt: 'a cat' }));
    assert.deepEqual(sent[0], ['POST', '/v2/ai/nano-banana-2', { prompt: 'a cat' }], ref);
  }
  const detector = await requestsOf(v2(), (c) => c.toolV2('ai-detector', { text: 'x' }));
  assert.equal(detector[0][1], '/v2/ai/ai-detector');
  const detectorPath = await requestsOf(v2(), (c) => c.toolV2('/ai-detector', { text: 'x' }));
  assert.equal(detectorPath[0][1], '/v2/ai/ai-detector');
});
