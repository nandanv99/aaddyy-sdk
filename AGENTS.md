# AGENTS.md — aaddyy SDK

Instructions for coding agents working with or on this package.

## What this is

The official Node.js/TypeScript SDK (npm: `aaddyy`) for the AADDYY AI-tools API — 49+ tools, live catalog at `GET https://backend.aaddyy.com/api/documentation/tools`. Zero runtime dependencies (native fetch, Node 18+). Machine-readable API overview: https://backend.aaddyy.com/llms.txt

## Auth

- API keys start with `aip_` and are created at https://www.aaddyy.com/api-keys (email verification required).
- Every request sends `Authorization: Bearer aip_<key>`.
- `new AADDYY()` reads `AADDYY_API_KEY` from env, or pass `{ apiKey }`.

## Base URL

`https://backend.aaddyy.com/api` (override with `AADDYY_BASE_URL` or `{ baseURL }`).

## V1 (sync) vs V2 (async)

- **V1**: `POST /api/ai/<tool>` — result in the response body. SDK: `client._request()` via typed resources, or `client.tool('<tool-id-or-path>', params)`.
- **V2**: `POST /api/v2/ai/<tool>` → `202 { jobId, pollUrl }` → poll `GET /api/v2/ai/jobs/:jobId` until `status` is `completed`/`failed`. SDK: `client._requestV2()` / `client.toolV2('<path>', params)` handles submit + poll internally (2s interval, 600s timeout) — callers only ever see the final result.

## Credits

- 1 credit = $0.01. Catalog `pricing.basePrice` is in USD (e.g. `0.05` = 5 credits).
- Insufficient balance → HTTP 402, code `INSUFFICIENT_CREDITS`, with `details: { required, available }` — surfaced as `InsufficientCreditsError` with `.required` / `.available`.
- Other typed errors: `RateLimitError` (429), `AuthenticationError` (401), `EmailVerificationError` (403 `EMAIL_NOT_VERIFIED`), base `AADDYYError`.

## Repo layout

- `src/client.ts` — `AADDYY` class: auth, `_request()` (V1), `_requestV2()` (V2 submit + poll), `tool()`, `toolV2()`.
- `src/errors.ts` — typed error classes.
- `src/resources/*.ts` — one class per resource group (`articles`, `images`, `videos`, `math`, `seo`, ...).
- `src/index.ts` — public exports.
- Build with `npx tsc` (outputs to `dist/`). New tools don't require a resource class — `client.tool()`/`client.toolV2()` cover the whole catalog.

## References

- Live tool catalog: https://backend.aaddyy.com/api/documentation/tools
- llms.txt: https://backend.aaddyy.com/llms.txt
- OpenAPI: https://backend.aaddyy.com/openapi.json
