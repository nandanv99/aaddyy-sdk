# aaddyy

Official Node.js SDK for [AADDYY](https://www.aaddyy.com) — 49+ AI tools (auto-discovered from the live catalog) via one npm package.

## Install

```bash
npm install aaddyy
```

## Quick Start

```typescript
import { AADDYY } from 'aaddyy'

const client = new AADDYY({ apiKey: 'aip_your_key' })
// or: new AADDYY() — reads AADDYY_API_KEY from env

// Synchronous (V1) tool call — result returned directly
const article = await client.articles.generate({
  topic: 'AI trends in 2026',
  tone: 'professional',
  length: 'medium'
})

// Async (V2) tool call — SDK submits the job and polls until done
const upscaled = await client.images.upscale({
  imageUrl: 'https://example.com/photo.jpg',
  scale: 2
})
```

## Call any tool (generic escape hatch)

Not every tool in the [live catalog](https://backend.aaddyy.com/api/documentation/tools) has a dedicated resource method. Use `client.tool()` / `client.toolV2()` to call any tool by ID or endpoint path:

```typescript
// Sync (V1): by tool ID (auto-resolves ai-jewelry-designer → POST /ai/jewelry-designer)
const design = await client.tool('ai-jewelry-designer', { keyword: 'diamond ring' })

// ...or by endpoint path
const ghibli = await client.tool('/ai/ghibli-generator', { imageUrl: 'https://example.com/me.jpg' })

// Async (V2): submit + poll handled for you
const image = await client.toolV2('/nano-banana-2', { prompt: 'a cat astronaut' })
```

Browse tool IDs, parameters, and prices at [backend.aaddyy.com/llms.txt](https://backend.aaddyy.com/llms.txt) or the [OpenAPI spec](https://backend.aaddyy.com/openapi.json).

## Typed Resources

```typescript
const client = new AADDYY({ apiKey: 'aip_your_key' })

// Writing
client.articles.generate({ topic, tone, length })
client.articles.outline({ topic })
client.articles.improve({ content, instructions })
client.essays.write({ topic, essayType, wordCount })
client.emails.write({ purpose, tone })
client.emails.jobEmail({ jobTitle, companyName })
client.titles.generate({ topic, count })
client.titles.seo({ topic, keywords })
client.synonyms.find({ word, context })

// Images
client.images.generate({ prompt, style, size })
client.images.upscale({ imageUrl, scale })        // async V2
client.images.removeWatermark({ imageUrl })        // async V2
client.images.createPrompt({ imageUrl })           // async V2
client.logos.create({ keyword, color, type })
client.headshots.generate({ style, gender })

// Video
client.videos.eduClip({ topic, duration })         // async V2

// Social
client.captions.generate({ topic, platform })
client.captions.instagram({ topic, tone })         // async V2
client.captions.linkedin({ topic, tone })          // async V2

// Education
client.math.solve({ problemText, explanationLevel })
client.physics.solve({ problemText, explanationLevel })

// SEO
client.seo.analyze({ url })
client.keywords.research({ topic })
```

## Error Handling

```typescript
import { AADDYY, InsufficientCreditsError, RateLimitError } from 'aaddyy'

try {
  const result = await client.articles.generate({ topic: 'AI' })
} catch (err) {
  if (err instanceof InsufficientCreditsError) {
    console.log(`Need ${err.required} credits, have ${err.available}`)
  } else if (err instanceof RateLimitError) {
    console.log('Rate limited, try again later')
  }
}
```

## Pricing

Pay-per-use. 1 credit = $0.01. Most tools cost 1-10 credits.
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
