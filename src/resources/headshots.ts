import type { AADDYY } from '../client.js';
import { omit, rename, toBody } from '../params.js';

/** POST /api/ai/headshot-generator: a professional headshot from a portrait photo. */
export interface HeadshotParams {
  /** The portrait: an http(s) URL or a base64 data URI (PNG, JPG or WEBP). */
  image_url: string;
  background_style?: 'professional' | 'corporate' | 'clean' | 'gradient';
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  /** @deprecated Use `background_style`. */
  background?: string;
  /** @deprecated The API does not read it, so the SDK does not send it. */
  style?: string;
  /** @deprecated The API does not read it, so the SDK does not send it. */
  gender?: string;
}

export class Headshots {
  constructor(private client: AADDYY) {}

  /** Make a headshot from a portrait photo. V1: resolves to the response's `data`. */
  async generate(params: HeadshotParams) {
    const body = toBody(params);
    rename(body, 'background', 'background_style');
    omit(body, 'style', 'gender');
    return this.client._request('POST', '/ai/headshot-generator', body);
  }
}
