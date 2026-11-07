# aaddyy

Official Node.js SDK for [AADDYY](https://www.aaddyy.com): 50+ AI tools in one npm package. Typed methods cover the common tools, and `client.tool()` / `client.toolV2()` call any tool in the [live catalog](https://backend.aaddyy.com/api/documentation/tools).

## Install

```bash
npm install aaddyy
```

## Quick Start

```typescript
import { AADDYY } from 'aaddyy'

const client = new AADDYY({ apiKey: 'aip_your_key' })
// or: new AADDYY() — reads AADDYY_API_KEY from env

// Synchronous (V1) tool call: resolves to the response's `data`
const article = await client.articles.generate({
  topic: 'AI trends in 2026',
  tone: 'professional',
  length: 'medium'
})

// Async (V2) tool call: the SDK submits the job and polls until it is done.
// Resolves to the tool's whole response body: { success, message, data }
const upscaled = await client.images.upscale({
  image_url: 'https://example.com/photo.jpg',
  upscale_factor: 2
})
```

## Call any tool (generic escape hatch)

Not every tool in the [live catalog](https://backend.aaddyy.com/api/documentation/tools) has a dedicated resource method. Use `client.tool()` (V1) or `client.toolV2()` (V2) with the tool's ID, its slug, or its endpoint path, and the parameters the catalog lists for it:

```typescript
// Sync (V1) by tool ID: ai-qr-code-generator → POST /api/ai/qr-code-generator
const qr = await client.tool('ai-qr-code-generator', { content: 'https://www.aaddyy.com' })

// ...or by the catalog's `endpoint`
const ring = await client.tool('/api/ai/jewelry-designer', {
  jewelry_type: 'ring',
  design_style: 'classic',
  material: 'gold_yellow'
})

// Async (V2): submit + poll handled for you
const image = await client.toolV2('/nano-banana-2', { prompt: 'a cat astronaut' })
```

Tool IDs whose endpoint differs from the ID (for example `ai-title-generator` → `/api/ai/article-title`) are mapped for you. Browse tool IDs, parameters, and prices at [backend.aaddyy.com/llms.txt](https://backend.aaddyy.com/llms.txt) or the [OpenAPI spec](https://backend.aaddyy.com/openapi.json).

## Typed Resources

Each method sends the field names the API validates. Required fields are marked `*`; this is a summary, and the exported parameter types list every field.

```text
// Writing (V1)
client.articles.generate({ topic*, tone, length, audience, keywords })
client.articles.specialized({ topic*, articleType* })        // how-to, listicle, review, news, opinion
client.articles.outline({ topic*, sectionsCount, audience })
client.articles.improve({ content*, improvements, tone })
client.essays.write({ topic*, wordCount*, essayType, academicLevel })
client.emails.write({ emailType*, topic*, tone, length })
client.emails.jobEmail({ emailType*, jobTitle*, companyName*, userName* })
client.titles.generate({ topic*, quantity, tone, titleType })
client.titles.seo({ topic*, primaryKeyword*, quantity })
client.titles.abTest({ topic*, variationCount, baseTitle })
client.titles.competitive({ topic*, competitorTitles* })
client.synonyms.find({ topic*, similarWordsCount* })

// Images
client.images.generate({ prompt*, aspect_ratio, num_images })    // V1
client.images.upscale({ image_url*, upscale_factor })            // V2
client.images.removeWatermark({ image_url* })                    // V2
client.images.createPrompt({ imageUrl*, outputFormat })          // V2
client.logos.create({ keyword*, type, background, concepts })    // V1
client.headshots.generate({ image_url*, background_style })      // V1: from a portrait photo

// Video
client.videos.eduClip({ userInput*, duration* })   // 15, 30, 45 or 60 seconds; waits for the clip

// Social
client.captions.generate({ imageUrl*, platform, tone })              // V1: captions for an image
client.captions.instagram({ postAbout*, websiteUrl* })              // V2
client.captions.linkedin({ postIdea, websiteUrl, postGoal })        // V2: postIdea or websiteUrl

// Education (V1)
client.math.solve({ problemText | problemImage, explanationLevel })
client.physics.solve({ problemText | problemImage, explanationLevel })

// SEO (V1)
client.seo.analyze({ url*, includeBacklinks })
client.seo.backlinks({ url* })
client.keywords.research({ keyword* })
```

The parameter types (`ArticleParams`, `EduClipParams`, ...) are exported; each field's type and doc comment give its accepted values.

### What each call resolves to

- **V1 methods** resolve to the response's `data`.
- **V2 methods** (`images.upscale`, `images.removeWatermark`, `images.createPrompt`, `captions.instagram`, `captions.linkedin`, and `client.toolV2()`) resolve to the tool's whole response body, `{ success, message, data }`. They poll every 2 seconds for up to 10 minutes.
- **`videos.eduClip()`** starts the clip, polls its status every 5 seconds until it is ready (up to 30 minutes), and resolves to the finished job. Its `download_url` is the MP4's path on the API host; the download needs the same API key:

```typescript
const clip = await client.videos.eduClip({
  userInput: 'How rainbows form, for 8-year-olds',
  duration: 30,
  videoStyle: 'whiteboard'
})
const video = await fetch(`https://backend.aaddyy.com${clip.download_url}`, {
  headers: { Authorization: `Bearer ${process.env.AADDYY_API_KEY}` }
})
```

### Switched-off tools

`client.videos.generate()` and `client.videos.audioToVideo()` call tools that are switched off. They reject with an `AADDYYError` whose `code` is `TOOL_UNAVAILABLE`, without sending a request. For text-to-video, call the Seedance Video Generator with `client.toolV2()`; its parameters are in the live catalog.

### Upgrading from 1.0.2

1.0.2 sent some fields under names the API does not read. 1.0.3 sends the API's names and still accepts the old ones:

| Method | 1.0.2 name | Sent as |
|---|---|---|
| `videos.eduClip` | `topic` | `userInput` |
| `images.upscale` | `imageUrl`, `scale` | `image_url`, `upscale_factor` |
| `images.removeWatermark` | `imageUrl` | `image_url` |
| `images.createPrompt` | `outputFormat: 'text'` | `outputFormat: 'normal'` |
| `images.generate` | `size` | `aspect_ratio`, when the size is exactly a supported ratio (`'1024x1024'` → `'1:1'`) |
| `keywords.research` | `topic` | `keyword` |
| `synonyms.find` | `word`, `count` | `topic`, `similarWordsCount` |
| `emails.write` | `purpose`, `recipientType` | `topic`, `recipientRole` |
| `captions.generate` | `count` | `numberOfVariations` |
| `captions.instagram` | `topic` | `postAbout` |
| `captions.linkedin` | `topic` | `postIdea` |
| `headshots.generate` | `background` | `background_style` |
| `articles.generate` | `keywords: string[]` | `keywords`, joined with `", "` |
| `articles.outline` | `sections` | `sectionsCount` |
| `titles.generate`, `titles.seo` | `count` | `quantity` |
| `titles.seo` | `keywords` | `keywords` and `primaryKeyword` |
| `titles.abTest` | `count` | `variationCount` |
| `titles.competitive` | `competitors` | `competitorTitles` |

Fields the API does not read (for example `language` on `articles.generate`, `skills` on `emails.jobEmail`, `style` and `gender` on `headshots.generate`) are no longer sent. See [CHANGELOG.md](./CHANGELOG.md) for the full list.

## Error Handling

```typescript
import { AADDYY, AADDYYError, InsufficientCreditsError, RateLimitError } from 'aaddyy'

try {
  const result = await client.articles.generate({ topic: 'AI in healthcare' })
} catch (err) {
  if (err instanceof InsufficientCreditsError) {
    // Amounts in USD (1 credit = $0.01)
    console.log(`Need $${err.required}, have $${err.available}`)
  } else if (err instanceof RateLimitError) {
    console.log('Rate limited, try again later')
  } else if (err instanceof AADDYYError) {
    console.log(err.code, err.message, err.details)
  }
}
```

Codes the SDK sets itself: `TOOL_UNAVAILABLE` (a switched-off tool), `JOB_FAILED` (an educational clip failed, or a V2 job failed without a code of its own), `JOB_TIMEOUT` (still running when the SDK stopped waiting; `details.jobId` names the job), and `BAD_RESPONSE` (the API answered with something other than JSON). A failed V2 job keeps the tool's own code, such as `VALIDATION_ERROR`.

## Pricing

Pay-per-use. 1 credit = $0.01. Each tool's price is in the [live catalog](https://backend.aaddyy.com/api/documentation/tools).
New accounts get 50 free credits ($0.50) — no card required.

Sign up at [aaddyy.com/signup](https://www.aaddyy.com/signup) and get your API key at [aaddyy.com/api-keys](https://www.aaddyy.com/api-keys).

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AADDYY_API_KEY` | Yes | — | Your API key (starts with `aip_`) |
| `AADDYY_BASE_URL` | No | `https://backend.aaddyy.com/api` | API base URL |

## Links

- [AADDYY](https://www.aaddyy.com)
- [Live tool catalog](https://backend.aaddyy.com/api/documentation/tools)
- [llms.txt](https://backend.aaddyy.com/llms.txt) — machine-readable tool catalog for LLMs
- [openapi.json](https://backend.aaddyy.com/openapi.json) — OpenAPI 3.0 spec
- [API Docs](https://backend.aaddyy.com/api-docs/)
- [Developer Portal](https://www.aaddyy.com/developer)
- [Get API Key](https://www.aaddyy.com/api-keys)
