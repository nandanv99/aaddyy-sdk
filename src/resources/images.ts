import type { AADDYY } from '../client.js';
import { omit, rename, toBody, type KnownString } from '../params.js';

export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type ImageStyle = 'realistic' | 'artistic' | 'digital_art' | 'fantasy';

const ASPECT_RATIOS: readonly ImageAspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

/**
 * The supported aspect ratio of a 1.0.2 `size` ('1024x1024' -> '1:1'), when
 * its width:height is exactly one of them; otherwise undefined.
 */
function aspectRatioForSize(size: unknown): ImageAspectRatio | undefined {
  if (typeof size !== 'string') return undefined;
  const value = size.trim();
  const known = ASPECT_RATIOS.find((ratio) => ratio === value);
  if (known) return known;
  const match = /^(\d+)\s*[xX:]\s*(\d+)$/.exec(value);
  if (!match) return undefined;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!width || !height) return undefined;
  return ASPECT_RATIOS.find((ratio) => {
    const [w, h] = ratio.split(':').map(Number);
    return width * h === height * w;
  });
}

/** POST /api/ai/image-generation */
export interface ImageGenerateParams {
  /** What the image shows (3-2000 characters). */
  prompt: string;
  /** One of: 1:1, 16:9, 9:16, 4:3, 3:4. */
  aspect_ratio?: KnownString<ImageAspectRatio>;
  /** How many images (1-4). Billed per image. */
  num_images?: number;
  /** 0-2147483647. */
  seed?: number;
  /** png, jpeg or webp. */
  output_format?: KnownString<'png' | 'jpeg' | 'webp'>;
  /** Add style and quality terms to the prompt before the image is made. */
  enhance_prompt?: boolean;
  /**
   * A style for the prompt: realistic, artistic, digital_art or fantasy.
   * The API reads it only when `enhance_prompt` is true.
   */
  style?: KnownString<ImageStyle>;
  /**
   * @deprecated Use `aspect_ratio`; the API does not read `size`. A size whose
   * width:height is exactly a supported ratio ('1024x1024' is '1:1',
   * '1920x1080' is '16:9') is sent as `aspect_ratio`. Any other size is not sent.
   */
  size?: string;
}

/** POST /api/v2/ai/upscale-image */
export interface UpscaleImageParams {
  /** A public http(s) URL of the image. */
  image_url: string;
  /** How much to enlarge the image (1-4). */
  upscale_factor?: number;
  /** The enhancement mode. Omit it for the default mode. */
  model?: string;
  output_format?: 'jpeg' | 'png';
  crop_to_fill?: boolean;
  subject_detection?: 'All' | 'Foreground' | 'Background';
  face_enhancement?: boolean;
  /** 0-1. */
  face_enhancement_creativity?: number;
  /** 0-1. */
  face_enhancement_strength?: number;
  /** 0-1. */
  sharpen?: number;
  /** 0-1. */
  denoise?: number;
  /** 0-1. */
  fix_compression?: number;
  /** 0.01-1. Read by one enhancement mode only. */
  strength?: number;
  /** A whole number from 1 to 6. Read by one enhancement mode only. */
  creativity?: number;
  /** A whole number from 1 to 5. Read by one enhancement mode only. */
  texture?: number;
  /** Up to 1024 characters. Read by one enhancement mode only. */
  prompt?: string;
  /** Read by one enhancement mode only. */
  autoprompt?: boolean;
  /** 0-1. Read by one enhancement mode only. */
  detail?: number;
}

/** The 1.0.2 parameter names for `images.upscale()`. */
export interface LegacyUpscaleImageParams extends Omit<UpscaleImageParams, 'image_url'> {
  /** @deprecated Use `image_url`. */
  imageUrl: string;
  /** @deprecated Use `upscale_factor`. */
  scale?: number;
}

/** POST /api/v2/ai/watermark-remover */
export interface RemoveWatermarkParams {
  /** The image: an http(s) URL or a base64 data URL (JPG, PNG or WEBP, up to 3 MB). */
  image_url: string;
}

/** The 1.0.2 parameter name for `images.removeWatermark()`. */
export interface LegacyRemoveWatermarkParams {
  /** @deprecated Use `image_url`. */
  imageUrl: string;
}

/** POST /api/v2/ai/image-prompt-creator: a prompt that describes an image. */
export interface ImagePromptParams {
  /** The image: an http(s) URL or a base64 data URI (JPG, PNG, GIF, WEBP or BMP). */
  imageUrl: string;
  /**
   * 'normal' (plain text, the default) or 'json'.
   * 'text' is the 1.0.2 name of 'normal' and is sent as 'normal'.
   */
  outputFormat?: 'normal' | 'json' | 'text';
}

export class Images {
  constructor(private client: AADDYY) {}

  /** Make images from a prompt. V1: resolves to the response's `data`. */
  async generate(params: ImageGenerateParams) {
    const body = toBody(params);
    if (body.aspect_ratio === undefined) {
      const ratio = aspectRatioForSize(body.size);
      if (ratio) body.aspect_ratio = ratio;
    }
    omit(body, 'size');
    return this.client._request('POST', '/ai/image-generation', body);
  }

  /**
   * Upscale an image.
   * V2: resolves to the tool's whole response body, `{ success, message, data }`.
   */
  async upscale(params: UpscaleImageParams | LegacyUpscaleImageParams) {
    const body = toBody(params);
    rename(body, 'imageUrl', 'image_url');
    rename(body, 'scale', 'upscale_factor');
    return this.client._requestV2('/upscale-image', body);
  }

  /**
   * Remove a watermark from an image.
   * V2: resolves to the tool's whole response body, `{ success, message, data }`.
   */
  async removeWatermark(params: RemoveWatermarkParams | LegacyRemoveWatermarkParams) {
    const body = toBody(params);
    rename(body, 'imageUrl', 'image_url');
    return this.client._requestV2('/watermark-remover', body);
  }

  /**
   * Write a prompt that describes an image.
   * V2: resolves to the tool's whole response body, `{ success, message, data }`.
   */
  async createPrompt(params: ImagePromptParams) {
    const body = toBody(params);
    if (body.outputFormat === 'text') body.outputFormat = 'normal';
    return this.client._requestV2('/image-prompt-creator', body);
  }
}
