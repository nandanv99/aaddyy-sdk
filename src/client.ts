/**
 * AADDYY SDK — core HTTP client.
 * Zero dependencies, uses native fetch (Node 18+).
 */

import {
  AADDYYError,
  AuthenticationError,
  errorFromBody,
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

/** Sent in the User-Agent header. Keep it equal to package.json "version". */
const SDK_VERSION = '1.0.3';

/**
 * Catalog tool ids whose endpoint is not /ai/<the id without "ai-">.
 * Every other id maps by dropping the "ai-" prefix.
 */
const TOOL_ID_PATHS: Readonly<Record<string, string>> = {
  'ai-article-generator': 'article',
  'ai-title-generator': 'article-title',
  'ai-content-curator': 'content-curator/analyze',
  'ai-detector': 'ai-detector',
  'ai-image-generator': 'image-generation',
  'ai-tshirt-designer': 't-shirt-designer',
};

/** The tool's path under /ai/ (no leading slash) for a catalog tool id or slug. */
function slugForToolId(tool: string): string {
  if (Object.prototype.hasOwnProperty.call(TOOL_ID_PATHS, tool)) return TOOL_ID_PATHS[tool];
  return tool.replace(/^ai-/, '');
}

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
   * Call any AADDYY tool synchronously (V1) by its tool ID, slug or endpoint path.
   * Use this for tools that don't have a dedicated resource method. Read the
   * tool's parameters from the live catalog.
   *
   * @example
   * // By tool ID (ai-qr-code-generator → POST /ai/qr-code-generator)
   * await client.tool('ai-qr-code-generator', { content: 'https://www.aaddyy.com' })
   *
   * // By endpoint path, as the catalog's `endpoint` field gives it
   * await client.tool('/api/ai/jewelry-designer', {
   *   jewelry_type: 'ring', design_style: 'classic', material: 'gold_yellow',
   * })
   */
  async tool(toolPath: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return this._request('POST', this.v1PathFor(toolPath), params);
  }

  /**
   * Call any V2 (async) tool by its tool ID, slug or path. Handles submit + poll
   * automatically and resolves to the job's `result`: the tool's whole response
   * body, `{ success, message, data }`.
   *
   * @example
   * await client.toolV2('/nano-banana-2', { prompt: 'a cat' })
   * await client.toolV2('ai-nano-banana-2', { prompt: 'a cat' })
   */
  async toolV2(toolPath: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return this._requestV2(this.v2PathFor(toolPath), params);
  }

  /**
   * The V1 path relative to the base URL. A tool ID or slug becomes /ai/<slug>.
   * A path is kept, without a leading /api when the base URL already ends in /api
   * (the catalog's `endpoint` field starts with /api).
   */
  private v1PathFor(toolPath: string): string {
    if (!toolPath.startsWith('/')) return `/ai/${slugForToolId(toolPath)}`;
    return this.withoutApiPrefix(toolPath);
  }

  /**
   * The tool path after /v2/ai. Accepts a tool ID, a slug, /<slug>, /ai/<slug>,
   * /v2/ai/<slug>, and the catalog's /api/ai/<slug> and /api/v2/ai/<slug>.
   */
  private v2PathFor(toolPath: string): string {
    if (!toolPath.startsWith('/')) return `/${slugForToolId(toolPath)}`;
    let path = this.withoutApiPrefix(toolPath);
    if (path.startsWith('/v2/')) path = path.slice('/v2'.length);
    if (path.startsWith('/ai/')) path = path.slice('/ai'.length);
    return path;
  }

  private withoutApiPrefix(path: string): string {
    const baseEndsInApi = /\/api\/?$/.test(this.baseURL);
    return baseEndsInApi && path.startsWith('/api/') ? path.slice('/api'.length) : path;
  }

  /**
   * Make an authenticated API request and return the response's `data`.
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

    let data: ApiResponse<T> | null;
    try {
      data = await res.json() as ApiResponse<T> | null;
    } catch {
      data = null;
    }
    if (!data || typeof data !== 'object') {
      throw new AADDYYError({
        message: `Unexpected non-JSON response (HTTP ${res.status})`,
        code: 'BAD_RESPONSE',
        statusCode: res.status,
      });
    }

    if (!data.success) {
      throw errorFromBody(res.status, data as unknown as Record<string, unknown>);
    }

    return data.data;
  }

  /**
   * Make an async V2 API request (submit + poll) and return the job's `result`:
   * the tool's whole response body, `{ success, message, data }`.
   * Used internally for image editing, social posts and other long-running tools.
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
      await this._sleep(interval);

      const job = await this._request<{ status: string; result: T; error: string | null; code?: string | null }>(
        'GET',
        `/v2/ai/jobs/${jobId}`
      );

      if (job.status === 'completed') return job.result;
      if (job.status === 'failed') {
        // The poll gives the tool's error code (VALIDATION_ERROR,
        // INSUFFICIENT_CREDITS, ...) but no HTTP status.
        throw errorFromBody(0, {
          success: false,
          error: {
            message: job.error || 'Job failed',
            code: job.code || 'JOB_FAILED',
            details: { jobId },
          },
        });
      }
    }

    throw new AADDYYError({
      error: {
        message: `Job ${jobId} timed out after ${timeout / 1000}s. It may still finish: poll GET /api/v2/ai/jobs/${jobId}.`,
        code: 'JOB_TIMEOUT',
        details: { jobId },
      },
    });
  }

  /**
   * Wait between polls. Internal; tests replace it to skip the wait.
   */
  _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
