import type { AADDYY } from '../client.js';

export class Captions {
  constructor(private client: AADDYY) {}

  async generate(params: {
    topic: string;
    platform?: string;
    tone?: string;
    count?: number;
  }) {
    return this.client._request('POST', '/ai/caption-generator', params);
  }

  async instagram(params: {
    topic: string;
    tone?: string;
    hashtags?: boolean;
  }) {
    return this.client._requestV2('/instagram-post-generator', params);
  }

  async linkedin(params: {
    topic: string;
    tone?: string;
  }) {
    return this.client._requestV2('/linkedin-post-generator', params);
  }
}
