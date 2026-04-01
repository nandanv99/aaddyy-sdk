import type { AADDYY } from '../client.js';

export class Headshots {
  constructor(private client: AADDYY) {}

  async generate(params: {
    style: string;
    gender?: string;
    background?: string;
  }) {
    return this.client._request('POST', '/ai/headshot-generator', params);
  }
}
