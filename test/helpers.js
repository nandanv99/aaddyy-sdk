'use strict';

// Test helpers: a client whose fetch is stubbed. No request leaves the process.

const { AADDYY } = require('../dist/index.js');

const BASE_URL = 'https://api.test/api';

/** A successful API envelope. */
function ok(data) {
  return { status: 200, body: { success: true, message: 'ok', data } };
}

/** The V2 flow: POST submits job-1, GET /v2/ai/jobs/job-1 answers `job`. */
function v2(job = { status: 'completed', result: { success: true, message: 'done', data: { ok: true } } }) {
  return (call) => (call.method === 'POST'
    ? ok({ jobId: 'job-1', status: 'queued', pollUrl: '/api/v2/ai/jobs/job-1' })
    : ok({ jobId: 'job-1', error: null, code: null, ...job }));
}

/**
 * Run `fn` with a client whose requests go to `respond(call)`. Each request is
 * recorded in `calls` as { method, url, path, query, headers, body }, where
 * `url` is the full URL, `path` is relative to the base URL (no /api) and
 * `body` is the parsed JSON body. A `respond` that throws makes fetch reject,
 * as a network error does. `options.baseURL` replaces the test base URL.
 */
async function withStub(respond, fn, options = {}) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const call = {
      method: init.method,
      url: String(input),
      path: url.pathname.replace(/^\/api/, ''),
      query: Object.fromEntries(url.searchParams),
      headers: init.headers,
      body: init.body === undefined ? undefined : JSON.parse(init.body),
    };
    calls.push(call);
    const { status = 200, body, raw } = await respond(call, calls.length - 1);
    return new Response(raw !== undefined ? raw : JSON.stringify(body), {
      status,
      headers: { 'content-type': raw !== undefined ? 'text/html' : 'application/json' },
    });
  };
  try {
    const client = new AADDYY({ apiKey: 'aip_test_key', baseURL: options.baseURL || BASE_URL });
    client._sleep = async () => {};
    await fn(client, calls);
  } finally {
    globalThis.fetch = original;
  }
}

/** The requests a single call sends, as [method, path, body] (plus query when there is one). */
async function requestsOf(respond, call) {
  let sent;
  await withStub(respond, async (client, calls) => {
    await call(client);
    sent = calls.map((c) => (Object.keys(c.query).length
      ? [c.method, c.path, c.body, c.query]
      : [c.method, c.path, c.body]));
  });
  return sent;
}

/**
 * Run `fn(sleep, sleeps)` with Date.now() on a fake clock. Set
 * `client._sleep = sleep`: each wait then moves the clock instead of waiting,
 * and is recorded in `sleeps` (ms).
 */
async function withFakeClock(fn) {
  const realNow = Date.now;
  let now = 1_000_000;
  const sleeps = [];
  Date.now = () => now;
  try {
    await fn(async (ms) => { sleeps.push(ms); now += ms; }, sleeps);
  } finally {
    Date.now = realNow;
  }
}

/** An API error response, as the backend's res.error() writes it. */
function apiError(status, code, message, details) {
  const error = { message, code, statusCode: status };
  if (details) error.details = details;
  return { status, body: { success: false, error } };
}

// Words that name a model or provider. An SDK error must contain none of them.
const PROVIDER_NAMES = /\b(fal|luma|ray|openai|gpt|gemini|google|claude|anthropic|bytedance|seedance|kling|runway|wan|veo|sora|replicate|minimax|hailuo|pika|elevenlabs|dataforseo)\b/i;

module.exports = { BASE_URL, ok, v2, withStub, requestsOf, withFakeClock, apiError, PROVIDER_NAMES };
