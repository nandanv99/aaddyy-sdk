'use strict';

// Every resource method: the exact request a typical call sends, and how the
// 1.0.2 parameter names are sent. The request bodies match what the backend
// validates (AI_TOOLS/<Tool>/validation/rules.js).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ok, v2, requestsOf } = require('./helpers.js');

const v1 = () => ok({ ok: true });
const ARTICLE = 'AI changes how small clinics book patients. '.repeat(3);
const POLL = ['GET', '/v2/ai/jobs/job-1', undefined];

// Each case: [name, responder, call, expected requests].
const cases = [
  // ── articles ──────────────────────────────────────────────────────────────
  ['articles.generate: typical call', v1,
    (c) => c.articles.generate({ topic: 'AI in healthcare', tone: 'professional', length: 'medium', audience: 'business', keywords: 'ai, clinics' }),
    [['POST', '/ai/article', { topic: 'AI in healthcare', tone: 'professional', length: 'medium', audience: 'business', keywords: 'ai, clinics' }]]],
  ['articles.generate: 1.0.2 keywords array is joined; language is not sent', v1,
    (c) => c.articles.generate({ topic: 'AI in healthcare', keywords: ['ai', 'clinics'], language: 'en' }),
    [['POST', '/ai/article', { topic: 'AI in healthcare', keywords: 'ai, clinics' }]]],
  ['articles.specialized: typical call', v1,
    (c) => c.articles.specialized({ topic: 'Home espresso', articleType: 'how-to', tone: 'friendly' }),
    [['POST', '/ai/article/specialized', { topic: 'Home espresso', articleType: 'how-to', tone: 'friendly' }]]],
  ['articles.outline: typical call', v1,
    (c) => c.articles.outline({ topic: 'Home espresso', sectionsCount: 6, audience: 'beginner' }),
    [['POST', '/ai/article/outline', { topic: 'Home espresso', sectionsCount: 6, audience: 'beginner' }]]],
  ['articles.outline: 1.0.2 sections is sent as sectionsCount', v1,
    (c) => c.articles.outline({ topic: 'Home espresso', sections: 5 }),
    [['POST', '/ai/article/outline', { topic: 'Home espresso', sectionsCount: 5 }]]],
  ['articles.improve: typical call', v1,
    (c) => c.articles.improve({ content: ARTICLE, improvements: ['readability', 'seo'], tone: 'friendly' }),
    [['POST', '/ai/article/improve', { content: ARTICLE, improvements: ['readability', 'seo'], tone: 'friendly' }]]],
  ['articles.improve: 1.0.2 instructions is not sent', v1,
    (c) => c.articles.improve({ content: ARTICLE, instructions: 'make it punchier' }),
    [['POST', '/ai/article/improve', { content: ARTICLE }]]],

  // ── captions ──────────────────────────────────────────────────────────────
  ['captions.generate: typical call', v1,
    (c) => c.captions.generate({ imageUrl: 'https://example.com/beach.jpg', platform: 'instagram', tone: 'trendy', numberOfVariations: 3 }),
    [['POST', '/ai/caption-generator', { imageUrl: 'https://example.com/beach.jpg', platform: 'instagram', tone: 'trendy', numberOfVariations: 3 }]]],
  ['captions.generate: 1.0.2 count is sent as numberOfVariations; topic is not sent', v1,
    (c) => c.captions.generate({ imageUrl: 'https://example.com/beach.jpg', topic: 'summer', count: 2 }),
    [['POST', '/ai/caption-generator', { imageUrl: 'https://example.com/beach.jpg', numberOfVariations: 2 }]]],
  ['captions.instagram: typical call (V2)', v2(),
    (c) => c.captions.instagram({ postAbout: 'Our autumn menu launches on Friday', websiteUrl: 'https://cafe.example.com', postType: 'feed' }),
    [['POST', '/v2/ai/instagram-post-generator', { postAbout: 'Our autumn menu launches on Friday', websiteUrl: 'https://cafe.example.com', postType: 'feed' }], POLL]],
  ['captions.instagram: 1.0.2 topic is sent as postAbout; tone and hashtags are not sent', v2(),
    (c) => c.captions.instagram({ topic: 'Our autumn menu launches on Friday', websiteUrl: 'https://cafe.example.com', tone: 'fun', hashtags: true }),
    [['POST', '/v2/ai/instagram-post-generator', { postAbout: 'Our autumn menu launches on Friday', websiteUrl: 'https://cafe.example.com' }], POLL]],
  ['captions.linkedin: typical call (V2)', v2(),
    (c) => c.captions.linkedin({ postIdea: 'Lessons from our first 100 customers', postGoal: 'Thought Leadership' }),
    [['POST', '/v2/ai/linkedin-post-generator', { postIdea: 'Lessons from our first 100 customers', postGoal: 'Thought Leadership' }], POLL]],
  ['captions.linkedin: 1.0.2 topic is sent as postIdea; tone is not sent', v2(),
    (c) => c.captions.linkedin({ topic: 'Lessons from our first 100 customers', tone: 'warm' }),
    [['POST', '/v2/ai/linkedin-post-generator', { postIdea: 'Lessons from our first 100 customers' }], POLL]],

  // ── emails ────────────────────────────────────────────────────────────────
  ['emails.write: typical call', v1,
    (c) => c.emails.write({ emailType: 'sales_outreach', topic: 'Ask for a 20-minute demo call next week', tone: 'friendly', length: 'short' }),
    [['POST', '/ai/email-writer', { emailType: 'sales_outreach', topic: 'Ask for a 20-minute demo call next week', tone: 'friendly', length: 'short' }]]],
  ['emails.write: 1.0.2 purpose and recipientType are sent as topic and recipientRole', v1,
    (c) => c.emails.write({ emailType: 'business', purpose: 'Ask for a 20-minute demo call next week', recipientType: 'client', tone: 'formal' }),
    [['POST', '/ai/email-writer', { emailType: 'business', topic: 'Ask for a 20-minute demo call next week', recipientRole: 'client', tone: 'formal' }]]],
  ['emails.jobEmail: typical call', v1,
    (c) => c.emails.jobEmail({ emailType: 'job_application', jobTitle: 'Backend Engineer', companyName: 'Acme', userName: 'Sam Lee', tone: 'confident' }),
    [['POST', '/ai/job-email-creator', { emailType: 'job_application', jobTitle: 'Backend Engineer', companyName: 'Acme', userName: 'Sam Lee', tone: 'confident' }]]],
  ['emails.jobEmail: 1.0.2 skills is not sent', v1,
    (c) => c.emails.jobEmail({ emailType: 'follow_up', jobTitle: 'Backend Engineer', companyName: 'Acme', userName: 'Sam Lee', skills: ['Node.js'] }),
    [['POST', '/ai/job-email-creator', { emailType: 'follow_up', jobTitle: 'Backend Engineer', companyName: 'Acme', userName: 'Sam Lee' }]]],

  // ── essays ────────────────────────────────────────────────────────────────
  ['essays.write: typical call', v1,
    (c) => c.essays.write({ topic: 'Should cities ban cars downtown?', wordCount: 800, essayType: 'argumentative', academicLevel: 'undergraduate' }),
    [['POST', '/ai/essay-writer', { topic: 'Should cities ban cars downtown?', wordCount: 800, essayType: 'argumentative', academicLevel: 'undergraduate' }]]],
  ['essays.write: 1.0.2 language is not sent', v1,
    (c) => c.essays.write({ topic: 'Should cities ban cars downtown?', wordCount: 500, language: 'en' }),
    [['POST', '/ai/essay-writer', { topic: 'Should cities ban cars downtown?', wordCount: 500 }]]],

  // ── headshots ─────────────────────────────────────────────────────────────
  ['headshots.generate: typical call', v1,
    (c) => c.headshots.generate({ image_url: 'https://example.com/me.jpg', background_style: 'corporate', aspect_ratio: '3:4' }),
    [['POST', '/ai/headshot-generator', { image_url: 'https://example.com/me.jpg', background_style: 'corporate', aspect_ratio: '3:4' }]]],
  ['headshots.generate: 1.0.2 background is sent as background_style; style and gender are not sent', v1,
    (c) => c.headshots.generate({ image_url: 'https://example.com/me.jpg', style: 'studio', gender: 'female', background: 'clean' }),
    [['POST', '/ai/headshot-generator', { image_url: 'https://example.com/me.jpg', background_style: 'clean' }]]],

  // ── images ────────────────────────────────────────────────────────────────
  ['images.generate: typical call', v1,
    (c) => c.images.generate({ prompt: 'A lighthouse at dawn, watercolor', aspect_ratio: '16:9', num_images: 2 }),
    [['POST', '/ai/image-generation', { prompt: 'A lighthouse at dawn, watercolor', aspect_ratio: '16:9', num_images: 2 }]]],
  ['images.generate: 1.0.2 size with an exact supported ratio is sent as aspect_ratio', v1,
    (c) => c.images.generate({ prompt: 'A lighthouse at dawn', size: '1920x1080', style: 'realistic' }),
    [['POST', '/ai/image-generation', { prompt: 'A lighthouse at dawn', style: 'realistic', aspect_ratio: '16:9' }]]],
  ['images.generate: 1.0.2 size 1024x1024 is sent as 1:1', v1,
    (c) => c.images.generate({ prompt: 'A lighthouse at dawn', size: '1024x1024' }),
    [['POST', '/ai/image-generation', { prompt: 'A lighthouse at dawn', aspect_ratio: '1:1' }]]],
  ['images.generate: a size with no supported ratio is not sent', v1,
    (c) => c.images.generate({ prompt: 'A lighthouse at dawn', size: '1792x1024' }),
    [['POST', '/ai/image-generation', { prompt: 'A lighthouse at dawn' }]]],
  ['images.generate: aspect_ratio wins over size', v1,
    (c) => c.images.generate({ prompt: 'A lighthouse at dawn', aspect_ratio: '9:16', size: '1024x1024' }),
    [['POST', '/ai/image-generation', { prompt: 'A lighthouse at dawn', aspect_ratio: '9:16' }]]],
  ['images.upscale: typical call (V2)', v2(),
    (c) => c.images.upscale({ image_url: 'https://example.com/photo.jpg', upscale_factor: 2 }),
    [['POST', '/v2/ai/upscale-image', { image_url: 'https://example.com/photo.jpg', upscale_factor: 2 }], POLL]],
  ['images.upscale: 1.0.2 imageUrl and scale are sent as image_url and upscale_factor', v2(),
    (c) => c.images.upscale({ imageUrl: 'https://example.com/photo.jpg', scale: 4, model: 'mode-a' }),
    [['POST', '/v2/ai/upscale-image', { image_url: 'https://example.com/photo.jpg', upscale_factor: 4, model: 'mode-a' }], POLL]],
  ['images.removeWatermark: typical call (V2)', v2(),
    (c) => c.images.removeWatermark({ image_url: 'https://example.com/stock.jpg' }),
    [['POST', '/v2/ai/watermark-remover', { image_url: 'https://example.com/stock.jpg' }], POLL]],
  ['images.removeWatermark: 1.0.2 imageUrl is sent as image_url', v2(),
    (c) => c.images.removeWatermark({ imageUrl: 'https://example.com/stock.jpg' }),
    [['POST', '/v2/ai/watermark-remover', { image_url: 'https://example.com/stock.jpg' }], POLL]],
  ['images.createPrompt: typical call (V2)', v2(),
    (c) => c.images.createPrompt({ imageUrl: 'https://example.com/scene.jpg', outputFormat: 'json' }),
    [['POST', '/v2/ai/image-prompt-creator', { imageUrl: 'https://example.com/scene.jpg', outputFormat: 'json' }], POLL]],
  ["images.createPrompt: 1.0.2 outputFormat 'text' is sent as 'normal'", v2(),
    (c) => c.images.createPrompt({ imageUrl: 'https://example.com/scene.jpg', outputFormat: 'text' }),
    [['POST', '/v2/ai/image-prompt-creator', { imageUrl: 'https://example.com/scene.jpg', outputFormat: 'normal' }], POLL]],

  // ── keywords ──────────────────────────────────────────────────────────────
  ['keywords.research: typical call', v1,
    (c) => c.keywords.research({ keyword: 'standing desk' }),
    [['POST', '/ai/keyword-researcher', { keyword: 'standing desk' }]]],
  ['keywords.research: 1.0.2 topic is sent as keyword; country and language are not sent', v1,
    (c) => c.keywords.research({ topic: 'standing desk', country: 'US', language: 'en' }),
    [['POST', '/ai/keyword-researcher', { keyword: 'standing desk' }]]],

  // ── logos ─────────────────────────────────────────────────────────────────
  ['logos.create: typical call', v1,
    (c) => c.logos.create({ keyword: 'Acme Coffee', type: 'minimal', background: 'transparent', color: 'deep green', concepts: 2 }),
    [['POST', '/ai/logo-creator', { keyword: 'Acme Coffee', type: 'minimal', background: 'transparent', color: 'deep green', concepts: 2 }]]],

  // ── math / physics ────────────────────────────────────────────────────────
  ['math.solve: typical text call gets inputType text', v1,
    (c) => c.math.solve({ problemText: 'Solve 2x + 3 = 11', explanationLevel: 'step-by-step' }),
    [['POST', '/ai/math-solver', { problemText: 'Solve 2x + 3 = 11', explanationLevel: 'step-by-step', inputType: 'text' }]]],
  ['math.solve: an image call gets inputType image', v1,
    (c) => c.math.solve({ problemImage: 'https://example.com/problem.png' }),
    [['POST', '/ai/math-solver', { problemImage: 'https://example.com/problem.png', inputType: 'image' }]]],
  ['math.solve: inputType: undefined does not erase the derived inputType', v1,
    (c) => c.math.solve({ problemText: 'Solve 2x + 3 = 11', inputType: undefined }),
    [['POST', '/ai/math-solver', { problemText: 'Solve 2x + 3 = 11', inputType: 'text' }]]],
  ['physics.solve: typical call', v1,
    (c) => c.physics.solve({ problemText: 'A ball is dropped from 20 m. How long does it fall?', unitsPreference: 'SI' }),
    [['POST', '/ai/physics-solver', { problemText: 'A ball is dropped from 20 m. How long does it fall?', unitsPreference: 'SI', inputType: 'text' }]]],
  ['physics.solve: an image call gets inputType image', v1,
    (c) => c.physics.solve({ problemImage: 'data:image/png;base64,iVBORw0KGgo=', explanationLevel: 'final-answer' }),
    [['POST', '/ai/physics-solver', { problemImage: 'data:image/png;base64,iVBORw0KGgo=', explanationLevel: 'final-answer', inputType: 'image' }]]],

  // ── seo ───────────────────────────────────────────────────────────────────
  ['seo.analyze: typical call', v1,
    (c) => c.seo.analyze({ url: 'example.com', includeBacklinks: true }),
    [['POST', '/ai/seo-analysis', { url: 'example.com', includeBacklinks: true }]]],
  ['seo.backlinks: url goes in the query string, where the API reads it', v1,
    (c) => c.seo.backlinks({ url: 'https://example.com/a?b=c&d=e' }),
    [['POST', '/ai/seo-analysis/backlinks', { url: 'https://example.com/a?b=c&d=e' }, { url: 'https://example.com/a?b=c&d=e' }]]],

  // ── synonyms ──────────────────────────────────────────────────────────────
  ['synonyms.find: typical call', v1,
    (c) => c.synonyms.find({ topic: 'happy', similarWordsCount: 8 }),
    [['POST', '/ai/synonym-finder', { topic: 'happy', similarWordsCount: 8 }]]],
  ['synonyms.find: 1.0.2 word and count are sent as topic and similarWordsCount; context is not sent', v1,
    (c) => c.synonyms.find({ word: 'happy', count: 5, context: 'a birthday card' }),
    [['POST', '/ai/synonym-finder', { topic: 'happy', similarWordsCount: 5 }]]],

  // ── titles ────────────────────────────────────────────────────────────────
  ['titles.generate: typical call', v1,
    (c) => c.titles.generate({ topic: 'Remote work productivity', tone: 'casual', quantity: 5 }),
    [['POST', '/ai/article-title', { topic: 'Remote work productivity', tone: 'casual', quantity: 5 }]]],
  ['titles.generate: 1.0.2 count is sent as quantity', v1,
    (c) => c.titles.generate({ topic: 'Remote work productivity', count: 5 }),
    [['POST', '/ai/article-title', { topic: 'Remote work productivity', quantity: 5 }]]],
  ['titles.seo: typical call', v1,
    (c) => c.titles.seo({ topic: 'Remote work productivity', primaryKeyword: 'remote work', quantity: 3 }),
    [['POST', '/ai/article-title/seo', { topic: 'Remote work productivity', primaryKeyword: 'remote work', quantity: 3 }]]],
  ['titles.seo: 1.0.2 keywords is also sent as primaryKeyword; count as quantity', v1,
    (c) => c.titles.seo({ topic: 'Remote work productivity', keywords: 'remote work', count: 3 }),
    [['POST', '/ai/article-title/seo', { topic: 'Remote work productivity', keywords: 'remote work', quantity: 3, primaryKeyword: 'remote work' }]]],
  ['titles.abTest: typical call', v1,
    (c) => c.titles.abTest({ topic: 'Remote work productivity', variationCount: 4, testingDimensions: ['emotional', 'length'] }),
    [['POST', '/ai/article-title/abtest', { topic: 'Remote work productivity', variationCount: 4, testingDimensions: ['emotional', 'length'] }]]],
  ['titles.abTest: 1.0.2 count is sent as variationCount', v1,
    (c) => c.titles.abTest({ topic: 'Remote work productivity', count: 4 }),
    [['POST', '/ai/article-title/abtest', { topic: 'Remote work productivity', variationCount: 4 }]]],
  ['titles.competitive: typical call', v1,
    (c) => c.titles.competitive({ topic: 'Remote work productivity', competitorTitles: ['10 Remote Work Tips That Actually Work'], analysisDepth: 'detailed' }),
    [['POST', '/ai/article-title/competitive', { topic: 'Remote work productivity', competitorTitles: ['10 Remote Work Tips That Actually Work'], analysisDepth: 'detailed' }]]],
  ['titles.competitive: 1.0.2 competitors is sent as competitorTitles', v1,
    (c) => c.titles.competitive({ topic: 'Remote work productivity', competitors: ['10 Remote Work Tips That Actually Work'] }),
    [['POST', '/ai/article-title/competitive', { topic: 'Remote work productivity', competitorTitles: ['10 Remote Work Tips That Actually Work'] }]]],
];

for (const [name, respond, call, expected] of cases) {
  test(name, async () => {
    assert.deepEqual(await requestsOf(respond, call), expected);
  });
}

test('the API name wins when a call sets both the old and the new name', async () => {
  const sent = await requestsOf(v2(), (c) => c.images.upscale({ image_url: 'https://example.com/new.jpg', imageUrl: 'https://example.com/old.jpg' }));
  assert.deepEqual(sent[0], ['POST', '/v2/ai/upscale-image', { image_url: 'https://example.com/new.jpg' }]);
});

test("a method does not change the caller's parameters", async () => {
  const params = { word: 'happy', count: 5, context: 'card' };
  await requestsOf(v1, (c) => c.synonyms.find(params));
  assert.deepEqual(params, { word: 'happy', count: 5, context: 'card' });
});

test('fields the SDK does not know are passed through unchanged', async () => {
  const sent = await requestsOf(v1, (c) => c.logos.create({ keyword: 'Acme', newField: 1 }));
  assert.deepEqual(sent, [['POST', '/ai/logo-creator', { keyword: 'Acme', newField: 1 }]]);
});

test('every resource method is covered by a case above', () => {
  const { AADDYY } = require('../dist/index.js');
  const client = new AADDYY({ apiKey: 'aip_test_key' });
  const covered = new Set(cases.map(([name]) => name.split(':')[0]));
  // Covered in videos.test.js.
  for (const m of ['videos.generate', 'videos.audioToVideo', 'videos.eduClip']) covered.add(m);
  const all = [];
  for (const [resource, value] of Object.entries(client)) {
    if (!value || typeof value !== 'object') continue;
    for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(value))) {
      if (method !== 'constructor') all.push(`${resource}.${method}`);
    }
  }
  assert.ok(all.length >= 29, `found only ${all.length} methods`);
  assert.deepEqual(all.filter((m) => !covered.has(m)), []);
});
