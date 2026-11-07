import type { AADDYY } from '../client.js';
import { toBody } from '../params.js';

/** POST /api/ai/seo-analysis */
export interface SeoAnalyzeParams {
  /** The page to analyse. A URL without a scheme gets https://. */
  url: string;
  /** Add a backlinks report. It raises the price of the call. */
  includeBacklinks?: boolean;
}

/** POST /api/ai/seo-analysis/backlinks */
export interface SeoBacklinksParams {
  /** The site whose backlinks to summarise. */
  url: string;
}

export class SEO {
  constructor(private client: AADDYY) {}

  /** Analyse a page's SEO. V1: resolves to the response's `data`. */
  async analyze(params: SeoAnalyzeParams) {
    return this.client._request('POST', '/ai/seo-analysis', toBody(params));
  }

  /**
   * Summarise a site's backlinks. V1: resolves to the response's `data`.
   * The API reads `url` from the query string, so the SDK sends it there (and in
   * the body).
   */
  async backlinks(params: SeoBacklinksParams) {
    const body = toBody(params);
    const query = typeof params.url === 'string' ? `?url=${encodeURIComponent(params.url)}` : '';
    return this.client._request('POST', `/ai/seo-analysis/backlinks${query}`, body);
  }
}
