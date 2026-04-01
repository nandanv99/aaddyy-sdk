import type { AADDYY } from '../client.js';

export class SEO {
  constructor(private client: AADDYY) {}

  async analyze(params: {
    url: string;
    includeBacklinks?: boolean;
  }) {
    return this.client._request('POST', '/ai/seo-analysis', params);
  }

  async backlinks(params: { url: string }) {
    return this.client._request('POST', '/ai/seo-analysis/backlinks', params);
  }
}
