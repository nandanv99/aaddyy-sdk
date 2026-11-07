'use strict';

// videos: the two switched-off tools reject before any request; eduClip starts
// the clip on V1 and polls the tool's own status route until it is ready.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AADDYYError } = require('../dist/index.js');
const { ok, withStub } = require('./helpers.js');

// Words that name a model or provider. An SDK error must contain none of them.
const PROVIDER_NAMES = /\b(fal|luma|ray|openai|gpt|gemini|google|claude|anthropic|bytedance|seedance|kling|runway|wan|veo|sora|replicate|minimax|hailuo|pika|elevenlabs)\b/i;

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

test('videos.eduClip: starts the clip on V1, polls its status until completed, resolves to the job', async () => {
  const states = [
    { job_id: 'clip-1', status: 'pending', progress: 0 },
    { job_id: 'clip-1', status: 'processing', progress: 40 },
    DONE,
  ];
  await withStub((call) => ok(call.method === 'POST' ? START : states.shift()), async (client, calls) => {
    const clip = await client.videos.eduClip({ userInput: 'How rainbows form, for 8-year-olds', duration: 30, videoStyle: 'whiteboard' });
    assert.deepEqual(clip, DONE);
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

test('videos.eduClip: waits 5 seconds between polls', async () => {
  await withStub((call) => ok(call.method === 'POST' ? START : DONE), async (client) => {
    const waits = [];
    client._sleep = async (ms) => { waits.push(ms); };
    await client.videos.eduClip({ userInput: 'How rainbows form', duration: 15 });
    assert.deepEqual(waits, [5000]);
  });
});

test('videos.eduClip: a failed clip rejects with JOB_FAILED and the job id', async () => {
  const failed = { job_id: 'clip-1', status: 'failed', error: 'Scene 2 could not be made' };
  await withStub((call) => ok(call.method === 'POST' ? START : failed), async (client) => {
    await assert.rejects(client.videos.eduClip({ userInput: 'How rainbows form', duration: 15 }), (err) => {
      assert.equal(err.code, 'JOB_FAILED');
      assert.equal(err.message, 'Scene 2 could not be made');
      assert.deepEqual(err.details, { jobId: 'clip-1' });
      return true;
    });
  });
});

test('videos.eduClip: a clip not ready after 30 minutes rejects with JOB_TIMEOUT', async () => {
  const realNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    await withStub((call) => ok(call.method === 'POST' ? START : { job_id: 'clip-1', status: 'processing' }), async (client) => {
      client._sleep = async (ms) => { now += ms; };
      await assert.rejects(client.videos.eduClip({ userInput: 'How rainbows form', duration: 60 }), (err) => {
        assert.equal(err.code, 'JOB_TIMEOUT');
        assert.deepEqual(err.details, { jobId: 'clip-1' });
        assert.match(err.message, /GET \/api\/ai\/edu-clip-generator\/status\/clip-1/);
        return true;
      });
    });
  } finally {
    Date.now = realNow;
  }
});

test('videos.eduClip: a start response without job_id rejects with BAD_RESPONSE', async () => {
  await withStub(() => ok({ status: 'pending' }), async (client, calls) => {
    await assert.rejects(client.videos.eduClip({ userInput: 'How rainbows form', duration: 15 }), { code: 'BAD_RESPONSE' });
    assert.equal(calls.length, 1);
  });
});
