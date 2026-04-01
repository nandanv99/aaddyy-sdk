import type { AADDYY } from '../client.js';

export class Synonyms {
  constructor(private client: AADDYY) {}

  async find(params: {
    word: string;
    context?: string;
    count?: number;
  }) {
    return this.client._request('POST', '/ai/synonym-finder', params);
  }
}
