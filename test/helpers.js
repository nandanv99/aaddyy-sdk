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
 * recorded in `calls` as { method, path, query, headers, body }, where `path`
 * is relative to the base URL (no /api) and `body` is the parsed JSON body.
 */
async function withStub(respond, fn) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const call = {
      method: init.method,
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
    const client = new AADDYY({ apiKey: 'aip_test_key', baseURL: BASE_URL });
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

module.exports = { BASE_URL, ok, v2, withStub, requestsOf };
