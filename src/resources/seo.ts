import type { AADDYY } from '../client.js';
import { methodUnavailable } from '../errors.js';
import { toBody } from '../params.js';

/** POST /api/ai/seo-analysis */
export interface SeoAnalyzeParams {
  /** The page to analyse. A URL without a scheme gets https://. */
  url: string;
  /** Add a backlinks report (the result's `backlinks`). It raises the price of the call. */
  includeBacklinks?: boolean;
}

/** @deprecated `seo.backlinks()` rejects. Use `seo.analyze({ url, includeBacklinks: true })`. */
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
   * @deprecated Use `seo.analyze({ url, includeBacklinks: true })`: its result
   * has a `backlinks` section. This method rejects with an AADDYYError (code
   * TOOL_UNAVAILABLE) and sends no request.
   */
  async backlinks(_params: SeoBacklinksParams): Promise<unknown> {
    throw methodUnavailable('seo.backlinks()',
      "for a site's backlinks, call seo.analyze({ url, includeBacklinks: true }); its result has a " +
      '`backlinks` section. The SDK does not call the separate backlinks route.');
  }
}
