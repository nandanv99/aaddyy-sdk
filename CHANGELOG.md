# Changelog

## 1.0.3 (unreleased)

Every method now sends the field names and values the API validates. In 1.0.2,
many methods sent names the API does not read, and those calls failed with a
validation error. The old names still work: the SDK sends them under the API's
names (see the table in the README).

### Fixed

- `videos.eduClip()` sends `userInput` (1.0.2 sent `topic`) and `duration`
  (15, 30, 45 or 60, required). It starts the clip with
  `POST /api/ai/edu-clip-generator`, polls the clip's status every 5 seconds for
  up to 30 minutes, and resolves to the finished job; its `download_url` is the
  MP4. In 1.0.2 every call failed validation, and a valid call would have
  resolved only to the start ticket.
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
  `titles.seo()` requires `primaryKeyword`; a 1.0.2 call's `keywords` is also
  sent as `primaryKeyword`. `titles.abTest()` sends `variationCount` (1.0.2:
  `count`). `titles.competitive()` sends `competitorTitles` (1.0.2: `competitors`).
- `seo.backlinks()` sends `url` in the query string, where the API reads it.
- `math.solve()` and `physics.solve()`: `inputType: undefined` no longer removes
  the `inputType` the SDK derives from the problem.
- `client.tool()` maps the tool IDs whose endpoint differs from the ID (for
  example `ai-title-generator` is `/api/ai/article-title`). `client.tool()` and
  `client.toolV2()` accept the catalog's `/api/...` endpoints.
- A failed V2 job rejects with the tool's error code (for example
  `VALIDATION_ERROR`, or `InsufficientCreditsError` for `INSUFFICIENT_CREDITS`)
  and `details.jobId`. 1.0.2 used the code `UNKNOWN_ERROR`.
- A response that is not JSON rejects with the code `BAD_RESPONSE` and the HTTP
  status, not a JSON parse error.
- The User-Agent header carries the package version (1.0.2 sent `1.0.0`).

### Changed

- `videos.generate()` and `videos.audioToVideo()` reject with an `AADDYYError`
  whose code is `TOOL_UNAVAILABLE`, and send no request: their tools are
  switched off. They are deprecated, and stay in the package because removing
  a method needs a major version.
- Fields the API does not read are no longer sent: `language`
  (`articles.generate`, `articles.specialized`, `essays.write`),
  `instructions` (`articles.improve`), `topic` (`captions.generate`), `tone`
  and `hashtags` (`captions.instagram`), `tone` (`captions.linkedin`),
  `skills` (`emails.jobEmail`), `style` and `gender` (`headshots.generate`),
  `country` and `language` (`keywords.research`), `context`
  (`synonyms.find`). Each is marked deprecated in the types.

### Types

- Each method has an exported parameter type with the API's fields and values
  (`ArticleParams`, `EduClipParams`, `UpscaleImageParams`, ...).
- The 1.0.2 names are deprecated aliases. Fields that were `string` in 1.0.2
  still take any string; the API's values are suggested.
- Fields the API requires are required. A call that left one out never
  succeeded, because the API answered with a validation error. Such a call now
  fails to compile.

### Not changed

- V2 methods (`images.upscale`, `images.removeWatermark`, `images.createPrompt`,
  `captions.instagram`, `captions.linkedin`, `client.toolV2()`) resolve to the
  tool's whole response body, `{ success, message, data }`, as in 1.0.2. V1
  methods resolve to `data`.

## 1.0.2

Published to npm on 2026-04-03.
