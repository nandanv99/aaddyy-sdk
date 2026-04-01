import type { AADDYY } from '../client.js';

export class Keywords {
  constructor(private client: AADDYY) {}

  async research(params: {
    topic: string;
    country?: string;
    language?: string;
  }) {
    return this.client._request('POST', '/ai/keyword-researcher', params);
  }
}
