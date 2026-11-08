/**
 * AADDYY SDK — core HTTP client.
 * Zero dependencies, uses native fetch (Node 18+).
 */

import {
  AADDYYError,
  AuthenticationError,
  RateLimitError,
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
 * Catalog tool ids whose V1 endpoint is not /ai/<the id without "ai-">, as
 * paths relative to the base URL. Every other id maps by dropping the "ai-"
 * prefix.
 */
const TOOL_ID_PATHS: Readonly<Record<string, string>> = {
  'ai-article-generator': '/ai/article',
  'ai-title-generator': '/ai/article-title',
  'ai-content-curator': '/ai/content-curator/analyze',
  'ai-detector': '/ai/ai-detector',
  'ai-image-generator': '/ai/image-generation',
  'ai-tshirt-designer': '/ai/t-shirt-designer',
  // Not an /ai tool, and V1 only: POST /api/profiles creates a draft profile.
  'link-in-bio': '/profiles',
};

function mappedPath(tool: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(TOOL_ID_PATHS, tool) ? TOOL_ID_PATHS[tool] : undefined;
}

/** The V1 path, relative to the base URL, for a catalog tool id or slug. */
function v1PathForToolId(tool: string): string {
  return mappedPath(tool) ?? `/ai/${tool.replace(/^ai-/, '')}`;
}

/** The tool's path under /ai/ (no leading slash) for a catalog tool id or slug. */
function slugForToolId(tool: string): string {
  const path = mappedPath(tool);
  if (path && path.startsWith('/ai/')) return path.slice('/ai/'.length);
  return tool.replace(/^ai-/, '');
}

/** V2 jobs: the wait between polls, and how long to poll. */
const V2_POLL_MS = 2_000;
const V2_TIMEOUT_MS = 600_000;

/** The longest wait between two polls, after polls that failed. */
const MAX_POLL_WAIT_MS = 60_000;

/**
 * Add the job id and its status request to an error raised after the job
 * started: the job may still finish, and the caller can still collect it.
 */
function withJob(err: AADDYYError, jobId: string, statusRequest: string): AADDYYError {
  const writable = err as unknown as { details?: Record<string, unknown>; message: string };
  writable.details = { ...(err.details ?? {}), jobId };
  writable.message = `${err.message} Job ${jobId} had started; check it with ${statusRequest}.`;
  return err;
}

/**
 * Whether a failed status request is worth repeating: a network error, a reply
 * that is not JSON (a gateway page), a rate limit, or a server error. The job
 * itself is not affected by these, and polling it again is free.
 */
function isPassingPollError(err: unknown): boolean {
  if (!(err instanceof AADDYYError)) return true; // fetch itself failed
  if (err instanceof RateLimitError || err.code === 'BAD_RESPONSE') return true;
  return err.statusCode === 429 || err.statusCode >= 500;
}

/** Options for AADDYY._poll(). Internal. */
export interface PollOptions<J> {
  /** The wait before each status request, in ms. */
  intervalMs: number;
  /** How long to poll, in ms, before rejecting with JOB_TIMEOUT. */
  timeoutMs: number;
  /** True when the job has finished, whether it succeeded or failed. */
  isDone: (job: J) => boolean;
  /** The start of the JOB_TIMEOUT message, such as 'Job abc did not finish within 600 s.' */
  timeoutMessage: string;
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
    if (!toolPath.startsWith('/')) return v1PathForToolId(toolPath);
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
   * `path` is relative to the base URL. A leading /api is dropped when the base
   * URL already ends in /api, so a catalog endpoint such as /api/ai/essay-writer
   * works as it is. Used internally by resource classes.
   */
  async _request<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    const url = `${this.baseURL}${this.withoutApiPrefix(path)}`;
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
    const submitted = await this._request<{ jobId?: string } | null>('POST', `/v2/ai${toolPath}`, body);
    if (!submitted || !submitted.jobId) {
      throw new AADDYYError({ error: { message: 'The job was not started: the response has no jobId.', code: 'BAD_RESPONSE' } });
    }
    const jobId = String(submitted.jobId);

    type V2Job = { status: string; result: T; error: string | null; code?: string | null };
    const job = await this._poll<V2Job>(`/v2/ai/jobs/${encodeURIComponent(jobId)}`, jobId, {
      intervalMs: V2_POLL_MS,
      timeoutMs: V2_TIMEOUT_MS,
      isDone: (j) => j.status === 'completed' || j.status === 'failed',
      timeoutMessage: `Job ${jobId} did not finish within ${V2_TIMEOUT_MS / 1000} s.`,
    });

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
    return job.result;
  }

  /**
   * Poll a job that has started: GET `path` until `isDone(job)`, then resolve
   * to that job. Waits `intervalMs` before each status request. A status
   * request that fails for a passing reason (network error, gateway page, rate
   * limit, server error) is sent again after a longer wait (doubled each time,
   * up to 60 s), until `timeoutMs` has passed; then the call rejects with
   * JOB_TIMEOUT. Any other error (401, 403, 404, ...) rejects at once. Each
   * rejection carries `details.jobId` and the status URL, because the job may
   * still finish and the caller can still collect it. Internal.
   */
  async _poll<J>(path: string, jobId: string, options: PollOptions<J>): Promise<J> {
    const { intervalMs, timeoutMs, isDone, timeoutMessage } = options;
    const statusRequest = `GET ${this.baseURL}${this.withoutApiPrefix(path)}`;
    const start = Date.now();
    let wait = intervalMs;
    let lastError: unknown;

    while (Date.now() - start < timeoutMs) {
      await this._sleep(wait);
      let job: J;
      try {
        job = await this._request<J>('GET', path);
      } catch (err) {
        if (!isPassingPollError(err)) throw withJob(err as AADDYYError, jobId, statusRequest);
        lastError = err;
        wait = Math.min(wait * 2, MAX_POLL_WAIT_MS);
        continue;
      }
      lastError = undefined;
      wait = intervalMs;
      if (job && typeof job === 'object' && isDone(job)) return job;
    }

    const lastFailure = lastError instanceof Error
      ? ` The last status request failed: ${lastError.message}`
      : '';
    throw new AADDYYError({
      error: {
        message: `${timeoutMessage} It may still finish: poll ${statusRequest}.${lastFailure}`,
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
