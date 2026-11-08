import type { AADDYY } from '../client.js';
import { omit, rename, toBody, type KnownString } from '../params.js';

export type CaptionOutputType = 'short_caption' | 'detailed_caption' | 'hashtag_set' | 'ai_prompt' | 'story';
export type CaptionTone =
  | 'funny' | 'romantic' | 'inspirational' | 'professional' | 'casual'
  | 'artistic' | 'bold' | 'trendy' | 'emotional' | 'minimal';
export type CaptionPlatform = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'pinterest' | 'threads' | 'custom';
export type CaptionLanguage = 'english' | 'spanish' | 'french' | 'hindi' | 'german' | 'italian' | 'japanese';
export type CaptionFocus = 'object' | 'emotion' | 'scene' | 'conceptual';
export type LinkedInPostGoal = 'Engagement' | 'Awareness' | 'Promotion' | 'Thought Leadership' | 'Education';

/** POST /api/ai/caption-generator: captions for an image. */
export interface CaptionParams {
  /** The image to caption: an http(s) URL or a base64 data URI (JPG, PNG or WEBP, up to 10 MB). */
  imageUrl: string;
  outputType?: CaptionOutputType;
  /**
   * One of: funny, romantic, inspirational, professional, casual, artistic,
   * bold, trendy, emotional, minimal.
   */
  tone?: KnownString<CaptionTone>;
  /** One of: instagram, twitter, linkedin, facebook, pinterest, threads, custom. */
  platform?: KnownString<CaptionPlatform>;
  captionLength?: 'short' | 'medium' | 'long';
  includeEmojis?: boolean;
  includeHashtags?: boolean;
  /** 0-30. */
  numberOfHashtags?: number;
  /** Up to 10 keywords, each up to 50 characters. */
  customKeywords?: string[];
  language?: CaptionLanguage;
  /** How many captions to write (1-5). */
  numberOfVariations?: number;
  captionFocus?: CaptionFocus;
  /** Extra instructions for the captions (up to 500 characters). */
  customPromptModifier?: string;
  nsfwFilter?: boolean;
  /** @deprecated Use `numberOfVariations`. */
  count?: number;
  /**
   * @deprecated The API does not read it, so the SDK does not send it. The tool
   * captions the image in `imageUrl`; steer it with `customPromptModifier`.
   */
  topic?: string;
}

/** POST /api/v2/ai/instagram-post-generator (JSON). */
export interface InstagramPostParams {
  /** What the post is about (10-500 characters). */
  postAbout: string;
  /**
   * The brand's website, which the tool reads for the brand's look and voice.
   * Required here: the other source, reference images, needs a multipart
   * upload, which the SDK does not send.
   */
  websiteUrl: string;
  postType?: 'feed' | 'story';
  /** Up to 100 characters. */
  companyName?: string;
  /** Up to 1000 characters. */
  brandDescription?: string;
  /** @deprecated The API does not read it, so the SDK does not send it. */
  tone?: string;
  /** @deprecated The API does not read it, so the SDK does not send it. */
  hashtags?: boolean;
}

/** The 1.0.2 parameter names for `captions.instagram()`. */
export interface LegacyInstagramPostParams extends Omit<InstagramPostParams, 'postAbout'> {
  /** @deprecated Use `postAbout`. */
  topic: string;
}

interface LinkedInPostFields {
  /** What the post is about (3-500 characters). */
  postIdea?: string;
  /** The brand's website: an http(s) URL (up to 2000 characters). */
  websiteUrl?: string;
  postGoal?: LinkedInPostGoal;
  /** @deprecated The API does not read it, so the SDK does not send it. */
  tone?: string;
}

/** POST /api/v2/ai/linkedin-post-generator: needs `postIdea`, `websiteUrl`, or both. */
export type LinkedInPostParams =
  | (LinkedInPostFields & { postIdea: string })
  | (LinkedInPostFields & { websiteUrl: string });

/** The 1.0.2 parameter names for `captions.linkedin()`. */
export interface LegacyLinkedInPostParams extends LinkedInPostFields {
  /** @deprecated Use `postIdea`. */
  topic: string;
}

export class Captions {
  constructor(private client: AADDYY) {}

  /** Write captions for an image. V1: resolves to the response's `data`. */
  async generate(params: CaptionParams) {
    const body = toBody(params);
    rename(body, 'count', 'numberOfVariations');
    omit(body, 'topic');
    return this.client._request('POST', '/ai/caption-generator', body);
  }

  /**
   * Make an Instagram post (image, caption, hashtags) from a website.
   * V2: resolves to the tool's whole response body, `{ success, message, data }`.
   */
  async instagram(params: InstagramPostParams | LegacyInstagramPostParams) {
    const body = toBody(params);
    rename(body, 'topic', 'postAbout');
    omit(body, 'tone', 'hashtags');
    return this.client._requestV2('/instagram-post-generator', body);
  }

  /**
   * Make a LinkedIn post (text and image) from an idea, a website, or both.
   * V2: resolves to the tool's whole response body, `{ success, message, data }`.
   */
  async linkedin(params: LinkedInPostParams | LegacyLinkedInPostParams) {
    const body = toBody(params);
    rename(body, 'topic', 'postIdea');
    omit(body, 'tone');
    return this.client._requestV2('/linkedin-post-generator', body);
  }
}

