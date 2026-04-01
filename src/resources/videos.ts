import type { AADDYY } from '../client.js';

export class Videos {
  constructor(private client: AADDYY) {}

  async generate(params: {
    prompt: string;
    aspect_ratio?: string;
    duration?: number;
  }) {
    return this.client._request('POST', '/ai/video-generation', params);
  }

  async audioToVideo(params: {
    audioUrl: string;
    style?: string;
  }) {
    return this.client._requestV2('/audio-to-video', params);
  }

  async eduClip(params: {
    topic: string;
    duration?: number;
    aspectRatio?: string;
  }) {
    return this.client._requestV2('/edu-clip-generator', params);
  }
}
