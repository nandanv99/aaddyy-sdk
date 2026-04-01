/**
 * AADDYY SDK — core HTTP client.
 * Zero dependencies, uses native fetch (Node 18+).
 */

import {
  AADDYYError,
  InsufficientCreditsError,
  RateLimitError,
  AuthenticationError,
  EmailVerificationError,
} from './errors.js';

import { Articles } from './resources/articles.js';
import { Images } from './resources/images.js';
import { Videos } from './resources/videos.js';
import { Logos } from './resources/logos.js';
import { Essays } from './resources/essays.js';
import { Emails } from './resources/emails.js';
import { Captions } from './resources/captions.js';
import { Math as MathResource } from './resources/math.js';
import { Physics } from './resources/physics.js';
import { SEO } from './resources/seo.js';
import { Keywords } from './resources/keywords.js';
import { Headshots } from './resources/headshots.js';
import { Titles } from './resources/titles.js';
import { Synonyms } from './resources/synonyms.js';

export interface AADDYYOptions {
  apiKey?: string;
  baseURL?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  requestId?: string;
}

const SDK_VERSION = '1.0.0';

export class AADDYY {
  private readonly apiKey: string;
  private readonly baseURL: string;

  // Resources
  public readonly articles: Articles;
  public readonly images: Images;
  public readonly videos: Videos;
  public readonly logos: Logos;
  public readonly essays: Essays;
  public readonly emails: Emails;
  public readonly captions: Captions;
  public readonly math: MathResource;
  public readonly physics: Physics;
  public readonly seo: SEO;
  public readonly keywords: Keywords;
  public readonly headshots: Headshots;
  public readonly titles: Titles;
  public readonly synonyms: Synonyms;

  constructor(options?: AADDYYOptions) {
    this.apiKey = options?.apiKey || process.env.AADDYY_API_KEY || '';
    this.baseURL = options?.baseURL || process.env.AADDYY_BASE_URL || 'https://backend.aaddyy.com/api';

    if (!this.apiKey) {
      throw new AuthenticationError(
        'AADDYY API key required. Pass { apiKey } or set AADDYY_API_KEY env var. Get a key at https://www.aaddyy.com/api-keys'
      );
    }

    this.articles = new Articles(this);
    this.images = new Images(this);
    this.videos = new Videos(this);
    this.logos = new Logos(this);
    this.essays = new Essays(this);
    this.emails = new Emails(this);
    this.captions = new Captions(this);
    this.math = new MathResource(this);
    this.physics = new Physics(this);
    this.seo = new SEO(this);
    this.keywords = new Keywords(this);
    this.headshots = new Headshots(this);
    this.titles = new Titles(this);
    this.synonyms = new Synonyms(this);
  }

  /**
   * Make an authenticated API request.
   * Used internally by resource classes.
   */
  async _request<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': `aaddyy-sdk/${SDK_VERSION} node/${process.version}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data: ApiResponse<T> = await res.json() as ApiResponse<T>;

    if (!data.success) {
      const raw = data as unknown as Record<string, unknown>;
      const code = (raw.error as Record<string, unknown>)?.code as string ||
                   (raw.code as string) || '';

      if (res.status === 401) throw new AuthenticationError();
      if (res.status === 429) throw new RateLimitError(raw);
      if (code === 'INSUFFICIENT_CREDITS') throw new InsufficientCreditsError(raw);
      if (code === 'EMAIL_NOT_VERIFIED') throw new EmailVerificationError();
      throw new AADDYYError(raw);
    }

    return data.data;
  }

  /**
   * Make an async V2 API request (submit + poll).
   * Used internally for video, image editing, and other long-running tools.
   */
  async _requestV2<T>(toolPath: string, body: Record<string, unknown>): Promise<T> {
    // Submit job
    const submitData = await this._request<{ jobId: string }>('POST', `/v2/ai${toolPath}`, body);
    const { jobId } = submitData;

    // Poll until completed or failed (max 600s)
    const start = Date.now();
    const timeout = 600_000;
    const interval = 2_000;

    while (Date.now() - start < timeout) {
      await new Promise(r => setTimeout(r, interval));

      const job = await this._request<{ status: string; result: T; error: string | null }>(
        'GET',
        `/v2/ai/jobs/${jobId}`
      );

      if (job.status === 'completed') return job.result;
      if (job.status === 'failed') throw new AADDYYError({ message: job.error || 'Job failed' });
    }

    throw new AADDYYError({ message: `Job ${jobId} timed out after ${timeout / 1000}s` });
  }
}
