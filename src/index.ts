/**
 * AADDYY SDK — Official Node.js client for AADDYY AI Tools API.
 *
 * Usage:
 *   import { AADDYY } from 'aaddyy'
 *   const client = new AADDYY() // reads AADDYY_API_KEY from env
 *   const article = await client.articles.generate({ topic: 'AI trends' })
 */

export { AADDYY } from './client.js';
export type { AADDYYOptions } from './client.js';

// Errors
export {
  AADDYYError,
  InsufficientCreditsError,
  RateLimitError,
  AuthenticationError,
  EmailVerificationError,
} from './errors.js';

// Resource classes (for advanced typing)
export { Articles } from './resources/articles.js';
export { Images } from './resources/images.js';
export { Videos } from './resources/videos.js';
export { Logos } from './resources/logos.js';
export { Essays } from './resources/essays.js';
export { Emails } from './resources/emails.js';
export { Captions } from './resources/captions.js';
export { Math } from './resources/math.js';
export { Physics } from './resources/physics.js';
export { SEO } from './resources/seo.js';
export { Keywords } from './resources/keywords.js';
export { Headshots } from './resources/headshots.js';
export { Titles } from './resources/titles.js';
export { Synonyms } from './resources/synonyms.js';

// Parameter types (types only)
export type {
  ArticleParams, SpecializedArticleParams, ArticleOutlineParams, ArticleImproveParams,
} from './resources/articles.js';
export type {
  CaptionParams, InstagramPostParams, LegacyInstagramPostParams,
  LinkedInPostParams, LegacyLinkedInPostParams,
} from './resources/captions.js';
export type { EmailParams, LegacyEmailParams, JobEmailParams } from './resources/emails.js';
export type { EssayParams } from './resources/essays.js';
export type { HeadshotParams } from './resources/headshots.js';
export type {
  ImageGenerateParams, UpscaleImageParams, LegacyUpscaleImageParams,
  RemoveWatermarkParams, LegacyRemoveWatermarkParams, ImagePromptParams,
} from './resources/images.js';
export type { KeywordResearchParams, LegacyKeywordResearchParams } from './resources/keywords.js';
export type { LogoParams } from './resources/logos.js';
export type { MathSolveParams } from './resources/math.js';
export type { PhysicsSolveParams } from './resources/physics.js';
export type { SeoAnalyzeParams, SeoBacklinksParams } from './resources/seo.js';
export type { SynonymParams, LegacySynonymParams } from './resources/synonyms.js';
export type {
  TitleParams, SeoTitleParams, LegacySeoTitleParams, TitleAbTestParams,
  TitleCompetitiveParams, LegacyTitleCompetitiveParams,
} from './resources/titles.js';
export type {
  EduClipParams, LegacyEduClipParams, EduClipJob, VideoGenerateParams, AudioToVideoParams,
} from './resources/videos.js';
