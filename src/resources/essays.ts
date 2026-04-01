import type { AADDYY } from '../client.js';

export class Essays {
  constructor(private client: AADDYY) {}

  async write(params: {
    topic: string;
    essayType?: 'argumentative' | 'expository' | 'narrative' | 'persuasive' | 'descriptive';
    wordCount?: number;
    academicLevel?: 'high_school' | 'undergraduate' | 'graduate' | 'professional';
    tone?: string;
    language?: string;
  }) {
    return this.client._request('POST', '/ai/essay-writer', params);
  }
}
