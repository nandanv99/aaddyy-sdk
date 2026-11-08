# Changelog

## 1.0.3 (unreleased)

Every method now sends the field names and values the API validates. In 1.0.2,
many methods sent names the API does not read, and those calls failed with a
validation error. The old names still work: the SDK sends them under the API's
names (see the table in the README).

### Added

- `client.tool()` and `client.toolV2()` call any tool in the live catalog by
  its tool ID, its slug or its catalog `endpoint`. The tool IDs whose endpoint
  differs from the ID are mapped (for example `ai-title-generator` is
  `/api/ai/article-title`, and `link-in-bio` is `/api/profiles`). These methods
  were in the source before 1.0.2, but the published 1.0.2 package did not
  contain them, so this is their first release.
- Each method's parameter type is exported (`ArticleParams`, `EduClipParams`,
  `UpscaleImageParams`, ...).

### Fixed

- `videos.eduClip()` sends `userInput` (1.0.2 sent `topic`) and `duration`
  (15, 30, 45 or 60, required). It starts the clip with
  `POST /api/ai/edu-clip-generator`, polls the clip's status every 5 seconds for
  up to 30 minutes, and resolves to the finished job; its `download_url` is the
  MP4. In 1.0.2 every call failed validation, and a valid call would have
  resolved only to the start ticket. A `duration` the API does not accept
  rejects with `VALIDATION_ERROR` before any request. A failed clip rejects
  with `JOB_FAILED` and `details.jobId`.
- `images.upscale()` sends `image_url` and `upscale_factor` (1.0.2: `imageUrl`, `scale`).
- `images.removeWatermark()` sends `image_url` (1.0.2: `imageUrl`).
- `images.createPrompt()` sends `outputFormat: 'normal'` for the 1.0.2 value `'text'`.
- `images.generate()` takes `aspect_ratio`. The API never read `size`; a size
  whose width:height is exactly a supported ratio is sent as `aspect_ratio`.
- `keywords.research()` sends `keyword` (1.0.2: `topic`).
- `synonyms.find()` sends `topic` and `similarWordsCount` (1.0.2: `word`, `count`).
- `emails.write()` sends `topic` and `recipientRole` (1.0.2: `purpose`,
  `recipientType`). `emailType` is required.
- `emails.jobEmail()`: `emailType` and `userName` are required.
- `essays.write()`: `wordCount` (250-3000) is required.
- `headshots.generate()`: `image_url`, the portrait photo, is required.
  `background` is sent as `background_style`.
- `captions.generate()`: `imageUrl`, the image to caption, is required. `count`
  is sent as `numberOfVariations`.
- `captions.instagram()` sends `postAbout` (1.0.2: `topic`). `websiteUrl` is
  required: it is the only brand source a JSON request can send.
- `captions.linkedin()` sends `postIdea` (1.0.2: `topic`).
- `articles.generate()` and `articles.specialized()` send `keywords` as one
  string, as the API takes it; an array is joined with ", ".
- `articles.outline()` sends `sectionsCount` (1.0.2: `sections`).
- `titles.generate()` and `titles.seo()` send `quantity` (1.0.2: `count`).
  `titles.abTest()` sends `variationCount` (1.0.2: `count`).
  `titles.competitive()` sends `competitorTitles` (1.0.2: `competitors`).
- The API checks `sectionsCount` (3-15), `quantity` (1-20) and
  `variationCount` (2-20), but it ignored the 1.0.2 names, so any value worked.
  A 1.0.2 `sections` or `count` outside the range is sent as the nearest end of
  it, so a call that worked with 1.0.2 does not fail validation now.
- `titles.seo()` requires `primaryKeyword`. A 1.0.2 call's `keywords` is also
  sent as `primaryKeyword`, and `primaryKeyword` is also sent as `keywords`
  when `keywords` is not set, because the API's prompt reads the keyword from
  `keywords`.
- `math.solve()` and `physics.solve()`: `inputType: undefined` no longer removes
  the `inputType` the SDK derives from the problem.
- Polling a V2 job or a clip: a status request that fails for a passing reason
  (network error, gateway page, rate limit, server error) is sent again after a
  longer wait, up to 60 seconds, until the time limit. Any other status error
  rejects at once. 1.0.2 gave up on the first failed status request.
- Every error raised after a V2 job or a clip has started carries
  `details.jobId`, and its message names the status URL. A timeout rejects with
  the code `JOB_TIMEOUT`.
- A failed V2 job rejects with the tool's error code (for example
  `VALIDATION_ERROR`, or `InsufficientCreditsError` for `INSUFFICIENT_CREDITS`)
  and `details.jobId`. 1.0.2 used the code `UNKNOWN_ERROR`.
- A key over its request limit rejects with `RateLimitError`. The API answers
  that case with a 401 (`Rate limit exceeded: ...`), which 1.0.2 reported as
  `AuthenticationError`.
- An error response without a `statusCode` of its own (for example the V2
  poll route's 404) keeps the HTTP status. 1.0.2 reported 500.
- A response that is not JSON rejects with the code `BAD_RESPONSE` and the HTTP
  status, not a JSON parse error.
- A path that starts with `/api`, such as a catalog `endpoint`, no longer gets
  a second `/api` when the base URL ends in `/api`.
- The User-Agent header carries the package version (1.0.2 sent `1.0.0`).

### Changed

- `videos.generate()` and `videos.audioToVideo()` reject with an `AADDYYError`
  whose code is `TOOL_UNAVAILABLE`, and send no request: their tools are
  switched off. A `videos.generate()` call that succeeded with 1.0.2 now
  rejects. Both methods are deprecated, and stay in the package because
  removing a method needs a major version.
- `seo.backlinks()` rejects the same way and sends no request. Use
  `seo.analyze({ url, includeBacklinks: true })`: its result has a `backlinks`
  section. In 1.0.2 every `seo.backlinks()` call failed validation.
- Fields the API does not read are no longer sent: `language`
  (`articles.generate`, `articles.specialized`, `essays.write`),
  `instructions` (`articles.improve`), `topic` (`captions.generate`), `tone`
  and `hashtags` (`captions.instagram`), `tone` (`captions.linkedin`),
  `skills` (`emails.jobEmail`), `style` and `gender` (`headshots.generate`),
  `country` and `language` (`keywords.research`), `context`
  (`synonyms.find`). Each is marked deprecated in the types.
- The JOB_FAILED error for a clip does not repeat the status route's `error`
  text, which is internal.

### Types

- The 1.0.2 names are deprecated aliases.
- Every field that was typed `string` in 1.0.2 still takes any string, and so
  does every new choice field of the methods whose 1.0.2 calls could succeed
  (`articles.*`, `images.generate`, `logos.create`, `math.solve`,
  `physics.solve`, `titles.generate`, `titles.abTest`). The API's values are
  suggested. New choice fields of the other methods take only the API's
  values.
- Fields the API requires are required. A call that left one out never
  succeeded, because the API answered with a validation error. Such a call now
  fails to compile.

### Package

- `npm pack` and `npm publish` rebuild `dist/` first, and `npm publish` runs
  the tests. `npm run build` empties `dist/` before it compiles.

### Not changed

- V2 methods (`images.upscale`, `images.removeWatermark`, `images.createPrompt`,
  `captions.instagram`, `captions.linkedin`) resolve to the tool's whole
  response body, `{ success, message, data }`, as in 1.0.2, and so does
  `client.toolV2()`. V1 methods resolve to `data`.

## 1.0.2

Published to npm on 2026-04-03.
