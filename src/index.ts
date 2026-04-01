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
