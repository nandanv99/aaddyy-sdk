'use strict';

// videos: the two switched-off tools reject before any request; eduClip starts
// the clip on V1 and polls the tool's own status route until it is ready.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AADDYYError, AuthenticationError } = require('../dist/index.js');
const { ok, withStub, withFakeClock, apiError, PROVIDER_NAMES } = require('./helpers.js');

for (const [method, call] of [
  ['videos.generate()', (c) => c.videos.generate({ prompt: 'product demo animation', duration: 5 })],
  ['videos.audioToVideo()', (c) => c.videos.audioToVideo({ audioUrl: 'https://example.com/song.mp3' })],
]) {
  test(`${method} rejects with TOOL_UNAVAILABLE and sends no request`, async () => {
    await withStub(() => ok({}), async (client, calls) => {
      await assert.rejects(call(client), (err) => {
        assert.ok(err instanceof AADDYYError);
        assert.equal(err.code, 'TOOL_UNAVAILABLE');
        assert.equal(err.statusCode, 410);
        assert.ok(err.message.startsWith(`${method} is unavailable: the AI `), err.message);
        assert.ok(err.message.includes('switched off'), err.message);
        assert.doesNotMatch(err.message, PROVIDER_NAMES);
        return true;
      });
      assert.equal(calls.length, 0);
    });
  });
}

const START = { job_id: 'clip-1', status: 'pending', status_url: '/api/ai/edu-clip-generator/status/clip-1' };
const DONE = {
  job_id: 'clip-1', status: 'completed', progress: 100,
  download_url: '/api/ai/edu-clip-generator/download/clip-1', video_duration: 30,
};
const PARAMS = { userInput: 'How rainbows form', duration: 15 };
const STATUS_URL = 'https://api.test/api/ai/edu-clip-generator/status/clip-1';

/**
 * The start request answers START; each status request answers the next entry
 * of `polls` (an Error entry makes fetch reject, as a network error does).
 */
function clip(polls) {
  return (call) => {
    if (call.method === 'POST') return ok(START);
    const next = polls.shift();
    if (next instanceof Error) throw next;
    return next;
  };
}

test('videos.eduClip: starts the clip on V1, polls its status until completed, resolves to the job', async () => {
  const states = [
    { job_id: 'clip-1', status: 'pending', progress: 0 },
    { job_id: 'clip-1', status: 'processing', progress: 40 },
    DONE,
  ];
  await withStub((call) => ok(call.method === 'POST' ? START : states.shift()), async (client, calls) => {
    const clipJob = await client.videos.eduClip({ userInput: 'How rainbows form, for 8-year-olds', duration: 30, videoStyle: 'whiteboard' });
    assert.deepEqual(clipJob, DONE);
    assert.deepEqual(calls.map((c) => [c.method, c.path, c.body]), [
      ['POST', '/ai/edu-clip-generator', { userInput: 'How rainbows form, for 8-year-olds', duration: 30, videoStyle: 'whiteboard' }],
      ['GET', '/ai/edu-clip-generator/status/clip-1', undefined],
      ['GET', '/ai/edu-clip-generator/status/clip-1', undefined],
      ['GET', '/ai/edu-clip-generator/status/clip-1', undefined],
    ]);
  });
});

test('videos.eduClip: 1.0.2 topic is sent as userInput', async () => {
  await withStub((call) => ok(call.method === 'POST' ? START : DONE), async (client, calls) => {
    await client.videos.eduClip({ topic: 'How rainbows form', duration: 15, aspectRatio: '9:16' });
    assert.deepEqual(calls[0].body, { userInput: 'How rainbows form', duration: 15, aspectRatio: '9:16' });
  });
});

test("videos.eduClip: a duration given as a string ('30') is sent as given; the API accepts it", async () => {
  await withStub(clip([ok(DONE)]), async (client, calls) => {
    await client.videos.eduClip({ userInput: 'How rainbows form', duration: '30' });
    assert.deepEqual(calls[0].body, { userInput: 'How rainbows form', duration: '30' });
  });
});

for (const [name, params] of [
  ['a call without duration (the 1.0.2 call)', { topic: 'How rainbows form' }],
  ['duration 20', { userInput: 'How rainbows form', duration: 20 }],
  ["duration '15.0'", { userInput: 'How rainbows form', duration: '15.0' }],
]) {
  test(`videos.eduClip: ${name} rejects with VALIDATION_ERROR and sends no request`, async () => {
    await withStub(() => ok(START), async (client, calls) => {
      await assert.rejects(client.videos.eduClip(params), (err) => {
        assert.ok(err instanceof AADDYYError);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.equal(err.statusCode, 422);
        assert.deepEqual(err.details, { fields: [{ path: 'duration', msg: 'Duration must be 15, 30, 45, or 60 seconds' }] });
        return true;
      });
      assert.equal(calls.length, 0);
    });
  });
}

test('videos.eduClip: waits 5 seconds between polls', async () => {
  await withStub((call) => ok(call.method === 'POST' ? START : DONE), async (client) => {
    const waits = [];
    client._sleep = async (ms) => { waits.push(ms); };
    await client.videos.eduClip(PARAMS);
    assert.deepEqual(waits, [5000]);
  });
});

test('videos.eduClip: a status request that fails for a passing reason is sent again, after a longer wait', async () => {
  const polls = [
    { status: 502, raw: '<html>Bad gateway</html>' },
    apiError(429, 'RATE_LIMITED', 'Too many requests'),
    apiError(401, 'UNAUTHORIZED', 'Rate limit exceeded: requests per minute'),
    apiError(500, 'STATUS_ERROR', 'Failed to get job status'),
    new TypeError('fetch failed'),
    ok({ job_id: 'clip-1', status: 'processing', progress: 50 }),
    apiError(503, 'SERVICE_UNAVAILABLE', 'Service unavailable'),
    ok(DONE),
  ];
  await withStub(clip(polls), async (client, calls) => {
    const waits = [];
    client._sleep = async (ms) => { waits.push(ms); };
    assert.deepEqual(await client.videos.eduClip(PARAMS), DONE);
    assert.equal(calls.length, 1 + 8);
    // 5 s, doubled after each failed request (at most 60 s), and 5 s again after an answer.
    assert.deepEqual(waits, [5000, 10000, 20000, 40000, 60000, 60000, 5000, 10000]);
  });
});

for (const [name, response, check] of [
  ['404', apiError(404, 'NOT_FOUND', 'Job not found'), (err) => {
    assert.equal(err.code, 'NOT_FOUND');
    assert.equal(err.statusCode, 404);
  }],
  ['403', apiError(403, 'UNAUTHORIZED', 'Unauthorized'), (err) => assert.equal(err.statusCode, 403)],
  ['401 for a key that is no longer valid', apiError(401, 'UNAUTHORIZED', 'Invalid API key'), (err) => {
    assert.ok(err instanceof AuthenticationError);
  }],
]) {
  test(`videos.eduClip: a ${name} from the status route rejects at once, with the job id`, async () => {
    await withStub(clip([ok({ job_id: 'clip-1', status: 'processing' }), response]), async (client, calls) => {
      await assert.rejects(client.videos.eduClip(PARAMS), (err) => {
        check(err);
        assert.deepEqual(err.details, { jobId: 'clip-1' });
        assert.ok(err.message.endsWith(` Job clip-1 had started; check it with GET ${STATUS_URL}.`), err.message);
        return true;
      });
      assert.equal(calls.length, 3);
    });
  });
}

test("videos.eduClip: a failed clip rejects with JOB_FAILED and the job id, without the status route's error text", async () => {
  // The status route's `error` is the worker's internal error text.
  const internal = 'Scene generation failed: upstream 500\nRaw: {"scenes": [';
  await withStub(clip([ok({ job_id: 'clip-1', status: 'failed', error: internal })]), async (client) => {
    await assert.rejects(client.videos.eduClip(PARAMS), (err) => {
      assert.ok(err instanceof AADDYYError);
      assert.equal(err.code, 'JOB_FAILED');
      assert.equal(err.message, 'Clip clip-1 could not be made.');
      assert.deepEqual(err.details, { jobId: 'clip-1' });
      return true;
    });
  });
});

test('videos.eduClip: a clip not ready after 30 minutes (360 polls, 5 s apart) rejects with JOB_TIMEOUT', async () => {
  await withFakeClock(async (sleep, sleeps) => {
    await withStub((call) => ok(call.method === 'POST' ? START : { job_id: 'clip-1', status: 'processing' }), async (client, calls) => {
      client._sleep = sleep;
      await assert.rejects(client.videos.eduClip({ userInput: 'How rainbows form', duration: 60 }), (err) => {
        assert.equal(err.code, 'JOB_TIMEOUT');
        assert.deepEqual(err.details, { jobId: 'clip-1' });
        assert.equal(err.message, `Clip clip-1 was not ready after 30 minutes. It may still finish: poll GET ${STATUS_URL}.`);
        return true;
      });
      assert.equal(calls.filter((c) => c.method === 'GET').length, 360);
      assert.ok(sleeps.every((ms) => ms === 5000));
    });
  });
});

test('videos.eduClip: status requests that fail until the deadline reject with JOB_TIMEOUT, the job id and the last failure', async () => {
  await withFakeClock(async (sleep) => {
    await withStub((call) => (call.method === 'POST' ? ok(START) : { status: 503, raw: '<html>Unavailable</html>' }), async (client) => {
      client._sleep = sleep;
      await assert.rejects(client.videos.eduClip(PARAMS), (err) => {
        assert.equal(err.code, 'JOB_TIMEOUT');
        assert.deepEqual(err.details, { jobId: 'clip-1' });
        assert.match(err.message, /The last status request failed: Unexpected non-JSON response \(HTTP 503\)$/);
        return true;
      });
    });
  });
});

test('videos.eduClip: a start response without job_id rejects with BAD_RESPONSE', async () => {
  await withStub(() => ok({ status: 'pending' }), async (client, calls) => {
    await assert.rejects(client.videos.eduClip(PARAMS), { code: 'BAD_RESPONSE' });
    assert.equal(calls.length, 1);
  });
});
