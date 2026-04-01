import type { AADDYY } from '../client.js';

export class Images {
  constructor(private client: AADDYY) {}

  async generate(params: {
    prompt: string;
    style?: string;
    size?: string;
    num_images?: number;
  }) {
    return this.client._request('POST', '/ai/image-generation', params);
  }

  async upscale(params: {
    imageUrl: string;
    scale?: number;
    model?: string;
  }) {
    return this.client._requestV2('/upscale-image', params);
  }

  async removeWatermark(params: { imageUrl: string }) {
    return this.client._requestV2('/watermark-remover', params);
  }

  async createPrompt(params: {
    imageUrl: string;
    outputFormat?: 'text' | 'json';
  }) {
    return this.client._requestV2('/image-prompt-creator', params);
  }
}
