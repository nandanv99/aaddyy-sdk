// Type-level tests, checked by `tsc -p test/tsconfig.json` against the built
// declarations in dist/. Nothing here runs.
//
// 1. Calls in the API's own names compile.
// 2. 1.0.2 calls that could succeed still compile (old names are deprecated
//    aliases; fields that were typed `string` still take any string).
// 3. Calls that miss a field the API requires do not compile: they never
//    succeeded (the API answered with a validation error).

import { AADDYY } from '../dist/index.js';
import type { EduClipJob } from '../dist/index.js';

declare const client: AADDYY;
declare const someString: string;

export async function apiNames(): Promise<void> {
  await client.articles.generate({ topic: 'AI in healthcare', tone: 'professional', length: 'medium', audience: 'business', keywords: 'ai, clinics' });
  await client.articles.specialized({ topic: 'Home espresso', articleType: 'how-to' });
  await client.articles.outline({ topic: 'Home espresso', sectionsCount: 6 });
  await client.articles.improve({ content: 'text', improvements: ['readability'] });
  await client.captions.generate({ imageUrl: 'https://example.com/a.jpg', numberOfVariations: 3 });
  await client.captions.instagram({ postAbout: 'Autumn menu', websiteUrl: 'https://cafe.example.com' });
  await client.captions.linkedin({ postIdea: 'Lessons learned' });
  await client.captions.linkedin({ websiteUrl: 'https://example.com', postGoal: 'Education' });
  await client.emails.write({ emailType: 'sales_outreach', topic: 'Ask for a demo call' });
  await client.emails.jobEmail({ emailType: 'job_application', jobTitle: 'Engineer', companyName: 'Acme', userName: 'Sam Lee' });
  await client.essays.write({ topic: 'Cities and cars', wordCount: 800 });
  await client.headshots.generate({ image_url: 'https://example.com/me.jpg', background_style: 'corporate' });
  await client.images.generate({ prompt: 'A lighthouse', aspect_ratio: '16:9' });
  await client.images.upscale({ image_url: 'https://example.com/a.jpg', upscale_factor: 2 });
  await client.images.removeWatermark({ image_url: 'https://example.com/a.jpg' });
  await client.images.createPrompt({ imageUrl: 'https://example.com/a.jpg', outputFormat: 'normal' });
  await client.keywords.research({ keyword: 'standing desk' });
  await client.logos.create({ keyword: 'Acme', type: 'AI Decides', concepts: 2 });
  await client.math.solve({ problemText: '2x + 3 = 11', problemCategory: 'other' });
  await client.physics.solve({ problemText: 'A ball falls 20 m', problemCategory: 'relativity' });
  await client.seo.analyze({ url: 'example.com' });
  await client.seo.backlinks({ url: 'example.com' });
  await client.synonyms.find({ topic: 'happy', similarWordsCount: 5 });
  await client.titles.generate({ topic: 'Remote work', quantity: 5 });
  await client.titles.seo({ topic: 'Remote work', primaryKeyword: 'remote work' });
  await client.titles.abTest({ topic: 'Remote work', variationCount: 4 });
  await client.titles.competitive({ topic: 'Remote work', competitorTitles: ['10 Remote Work Tips'] });
  const clip: EduClipJob = await client.videos.eduClip({ userInput: 'How rainbows form', duration: 30 });
  const downloadUrl: string | undefined = clip.download_url;
  void downloadUrl;
}

export async function calls102(): Promise<void> {
  await client.articles.generate({ topic: 'x', tone: someString, length: someString, audience: someString, articleType: someString, keywords: ['a', 'b'], language: 'en' });
  await client.articles.generate({ topic: 'x', tone: 'academic' });
  await client.articles.specialized({ topic: 'x', articleType: someString, tone: someString, length: someString });
  await client.articles.outline({ topic: 'x', sections: 5 });
  await client.articles.improve({ content: 'x', instructions: 'y' });
  await client.essays.write({ topic: 'x', wordCount: 500, tone: someString, language: 'en', essayType: 'narrative', academicLevel: 'graduate' });
  await client.images.generate({ prompt: 'x', style: someString, size: someString, num_images: 2 });
  await client.images.createPrompt({ imageUrl: 'x', outputFormat: 'text' });
  await client.logos.create({ keyword: 'x', color: someString, background: 'white', type: 'modern' });
  await client.math.solve({ problemText: 'x', language: someString, problemCategory: 'algebra', explanationLevel: 'brief', includeVisualization: true });
  await client.physics.solve({ problemImage: 'x', language: someString, unitsPreference: 'SI', explanationLevel: 'final-answer' });
  await client.seo.analyze({ url: 'x', includeBacklinks: true });
  await client.titles.generate({ topic: 'x', tone: someString, count: 5, titleType: someString, keywords: 'k' });
  await client.titles.abTest({ topic: 'x', count: 4 });
  // Old names that now map to a working request.
  await client.videos.eduClip({ topic: 'x', duration: 30 });
  await client.images.upscale({ imageUrl: 'x', scale: 2, model: someString });
  await client.images.removeWatermark({ imageUrl: 'x' });
  await client.keywords.research({ topic: 'x', country: 'US', language: 'en' });
  await client.synonyms.find({ word: 'x', count: 5, context: 'y' });
  await client.captions.instagram({ topic: 'x', websiteUrl: 'https://example.com', tone: 'fun', hashtags: true });
  await client.captions.linkedin({ topic: 'x', tone: 'y' });
  await client.emails.write({ emailType: 'business', purpose: 'x', recipientType: 'client', tone: 'formal', length: 'short' });
  await client.titles.seo({ topic: 'x', keywords: 'k', count: 3 });
  await client.titles.competitive({ topic: 'x', competitors: ['a competitor title'] });
  await client.headshots.generate({ image_url: 'x', style: 'studio', gender: 'any', background: 'clean' });
  await client.captions.generate({ imageUrl: 'x', topic: 'summer', count: 2 });
  await client.emails.jobEmail({ emailType: 'follow_up', jobTitle: 'x', companyName: 'y', userName: 'z', skills: ['a'] });
  // Switched off: still compile, reject at run time.
  await client.videos.generate({ prompt: 'x', aspect_ratio: '16:9', duration: 5 });
  await client.videos.audioToVideo({ audioUrl: 'x', style: 'y' });
}

export async function missingRequiredFields(): Promise<void> {
  // @ts-expect-error duration is required
  await client.videos.eduClip({ userInput: 'x' });
  // @ts-expect-error duration is 15, 30, 45 or 60
  await client.videos.eduClip({ userInput: 'x', duration: 20 });
  // @ts-expect-error image_url (or the 1.0.2 imageUrl) is required
  await client.images.upscale({ upscale_factor: 2 });
  // @ts-expect-error wordCount is required
  await client.essays.write({ topic: 'x' });
  // @ts-expect-error emailType is required
  await client.emails.write({ purpose: 'x' });
  // @ts-expect-error userName is required
  await client.emails.jobEmail({ emailType: 'follow_up', jobTitle: 'x', companyName: 'y' });
  // @ts-expect-error image_url is required
  await client.headshots.generate({ style: 'corporate' });
  // @ts-expect-error imageUrl is required
  await client.captions.generate({ topic: 'x' });
  // @ts-expect-error websiteUrl is required for a JSON request
  await client.captions.instagram({ postAbout: 'x' });
  // @ts-expect-error postIdea or websiteUrl is required
  await client.captions.linkedin({ postGoal: 'Education' });
  // @ts-expect-error keyword (or the 1.0.2 topic) is required
  await client.keywords.research({ country: 'US' });
  // @ts-expect-error similarWordsCount (or the 1.0.2 count) is required
  await client.synonyms.find({ word: 'x' });
  // @ts-expect-error primaryKeyword (or the 1.0.2 keywords) is required
  await client.titles.seo({ topic: 'x' });
  // @ts-expect-error competitorTitles (or the 1.0.2 competitors) is required
  await client.titles.competitive({ topic: 'x' });
}
