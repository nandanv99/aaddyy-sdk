import type { AADDYY } from '../client.js';

export class Logos {
  constructor(private client: AADDYY) {}

  async create(params: {
    keyword: string;
    color?: string;
    background?: 'transparent' | 'red' | 'blue' | 'black' | 'white';
    type?: 'modern' | 'minimal' | 'vintage' | 'abstract' | '3d' | 'hand_drawn' | 'geometric';
  }) {
    return this.client._request('POST', '/ai/logo-creator', params);
  }
}
