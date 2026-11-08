# AGENTS.md — aaddyy SDK

Instructions for coding agents working with or on this package.

## What this is

The official Node.js/TypeScript SDK (npm: `aaddyy`) for the AADDYY AI-tools API — 50+ tools, live catalog at `GET https://backend.aaddyy.com/api/documentation/tools`. Zero runtime dependencies (native fetch, Node 18+). Machine-readable API overview: https://backend.aaddyy.com/llms.txt

## Auth

- API keys start with `aip_` and are created at https://www.aaddyy.com/api-keys (email verification required).
- Every request sends `Authorization: Bearer aip_<key>`.
- `new AADDYY()` reads `AADDYY_API_KEY` from env, or pass `{ apiKey }`.

## Base URL

`https://backend.aaddyy.com/api` (override with `AADDYY_BASE_URL` or `{ baseURL }`).

## V1 (sync) vs V2 (async)

- **V1**: `POST /api/ai/<tool>` — result in the response body. SDK: `client._request()` via typed resources, or `client.tool('<tool-id-or-path>', params)`.
- **V2**: `POST /api/v2/ai/<tool>` → `202 { jobId, pollUrl }` → poll `GET /api/v2/ai/jobs/:jobId` until `status` is `completed`/`failed`. SDK: `client._requestV2()` / `client.toolV2('<path>', params)` handles submit + poll internally (2s interval, 600s timeout). It resolves to the job's `result`, which is the tool's whole V1 response body (`{ success, message, data }`), not just `data`. A failed job rejects with the tool's error code.
- **Edu clips** run in the background on the tool's own job route: `videos.eduClip()` starts the clip with V1, then polls `GET /api/ai/edu-clip-generator/status/:jobId` (5s interval, 30 min timeout) and resolves to the finished job (`download_url` is the MP4). A `duration` other than 15/30/45/60 rejects with `VALIDATION_ERROR` before any request.
- **Polling** (`client._poll()`, used by both): a status request that fails for a passing reason (network error, non-JSON gateway page, 429 or the API's 401 "Rate limit exceeded", 5xx) is sent again, with the wait doubled each time up to 60s, until the timeout. Any other status error rejects at once. Every rejection after the job started carries `details.jobId`.

## Credits

- 1 credit = $0.01. Catalog `pricing.basePrice` is in USD (e.g. `0.05` = 5 credits).
- Insufficient balance → HTTP 402, code `INSUFFICIENT_CREDITS`, with `details: { required, available }` in USD — surfaced as `InsufficientCreditsError` with `.required` / `.available`.
- `client.videos.generate()` and `client.videos.audioToVideo()` reject with code `TOOL_UNAVAILABLE` and send nothing: their tools are switched off. `client.seo.backlinks()` does the same: the backlinks route does not bill the paid data it fetches, so the SDK sends callers to `seo.analyze({ url, includeBacklinks: true })`. Other SDK-set codes: `JOB_FAILED`, `JOB_TIMEOUT`, `BAD_RESPONSE`, and `VALIDATION_ERROR` for an edu clip `duration`.
- Other typed errors: `RateLimitError` (429, and the 401 "Rate limit exceeded: ..." the API sends for a key over its request limit), `AuthenticationError` (any other 401), `EmailVerificationError` (403 `EMAIL_NOT_VERIFIED`), base `AADDYYError`.

## Repo layout

- `src/client.ts` — `AADDYY` class: auth, `_request()` (V1), `_requestV2()` (V2 submit + poll), `_poll()` (status polling with retries), `tool()`, `toolV2()`.
- `src/errors.ts` — typed error classes, plus internal helpers (`errorFromBody`, `methodUnavailable`, `toolUnavailable`).
- `src/params.ts` — internal helpers that turn a method's parameters into the request body (rename 1.0.2 names, drop fields the API does not read).
- `src/resources/*.ts` — one class per resource group (`articles`, `images`, `videos`, `math`, `seo`, ...).
- `src/index.ts` — public exports (classes, errors, parameter types).
- `test/` — `node:test` tests against `dist/` with a stubbed `fetch` (no network), and `types.check.ts`, type-level tests that `tsc -p test/tsconfig.json` checks.
- Build with `npm run build` (empties `dist/`, then tsc). Test with `npm test` (build, type tests, unit tests). `npm pack` and `npm publish` rebuild `dist/` first (`prepack`), and `npm publish` runs `npm test` (`prepublishOnly`), so a stale `dist/` cannot be published. New tools don't require a resource class — `client.tool()`/`client.toolV2()` cover the whole catalog.

## References

- Live tool catalog: https://backend.aaddyy.com/api/documentation/tools
- llms.txt: https://backend.aaddyy.com/llms.txt
- OpenAPI: https://backend.aaddyy.com/openapi.json

## When a new backend tool is added

This SDK does not discover tools, and needs no change for a new one: once the
tool is seeded on the backend, `client.tool()` / `client.toolV2()` call it by its
catalog id or endpoint (`GET https://backend.aaddyy.com/api/documentation/tools`).

Add a typed method only when a tool needs one. Take its fields from the tool's
validation rules (`aaddyy-backend/AI_TOOLS/<Tool>/validation/rules.js`) and its
controller, not from the catalog's parameter list, which can lag behind them.
Add a request test for it in `test/resources.test.js`.

Full add-a-tool flow: `aaddyy-backend/CLAUDE.md` → "Adding a New Tool".
