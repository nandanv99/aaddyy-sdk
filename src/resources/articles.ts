import type { AADDYY } from '../client.js';

export class Articles {
  constructor(private client: AADDYY) {}

  async generate(params: {
    topic: string;
    tone?: 'professional' | 'casual' | 'academic' | 'creative';
    length?: 'short' | 'medium' | 'long';
    audience?: string;
    articleType?: string;
    keywords?: string[];
    language?: string;
  }) {
    return this.client._request('POST', '/ai/article', params);
  }

  async specialized(params: {
    topic: string;
    articleType: string;
    tone?: string;
    length?: string;
  }) {
    return this.client._request('POST', '/ai/article/specialized', params);
  }

  async outline(params: { topic: string; sections?: number }) {
    return this.client._request('POST', '/ai/article/outline', params);
  }

  async improve(params: { content: string; instructions?: string }) {
    return this.client._request('POST', '/ai/article/improve', params);
  }
}
