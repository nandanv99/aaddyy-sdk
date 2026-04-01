import type { AADDYY } from '../client.js';

export class Titles {
  constructor(private client: AADDYY) {}

  async generate(params: {
    topic: string;
    tone?: string;
    count?: number;
    titleType?: string;
    keywords?: string;
  }) {
    return this.client._request('POST', '/ai/article-title', params);
  }

  async seo(params: { topic: string; keywords?: string; count?: number }) {
    return this.client._request('POST', '/ai/article-title/seo', params);
  }

  async abTest(params: { topic: string; count?: number }) {
    return this.client._request('POST', '/ai/article-title/abtest', params);
  }

  async competitive(params: { topic: string; competitors?: string[] }) {
    return this.client._request('POST', '/ai/article-title/competitive', params);
  }
}
