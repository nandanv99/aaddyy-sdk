# aaddyy

Official Node.js SDK for [AADDYY](https://www.aaddyy.com) — 100+ AI tools via one npm package.

## Install

```bash
npm install aaddyy
```

## Quick Start

```typescript
import { AADDYY } from 'aaddyy'

const client = new AADDYY() // reads AADDYY_API_KEY from env

// Generate an article
const article = await client.articles.generate({
  topic: 'AI trends in 2026',
  tone: 'professional',
  length: 'medium'
})

// Generate an image
const image = await client.images.generate({
  prompt: 'A futuristic city at sunset',
  style: 'photorealistic'
})

// Solve a math problem
const solution = await client.math.solve({
  problemText: 'Integrate x^2 from 0 to 5',
  explanationLevel: 'step-by-step'
})
```

## All Resources

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
client.videos.generate({ prompt, duration })
client.videos.audioToVideo({ audioUrl })           // async V2
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
client.seo.backlinks({ url })
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
- [API Docs](https://backend.aaddyy.com/api-docs/)
- [Developer Portal](https://www.aaddyy.com/developer)
- [Get API Key](https://www.aaddyy.com/api-keys)
