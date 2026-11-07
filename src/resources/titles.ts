import type { AADDYY } from '../client.js';
import { rename, renameInRange, toBody, type KnownString } from '../params.js';

export type TitleType = 'clickbait' | 'seo' | 'professional' | 'listicle' | 'how-to' | 'question' | 'news' | 'review';
export type TitleTone =
  | 'professional' | 'casual' | 'urgent' | 'friendly' | 'authoritative' | 'conversational' | 'dramatic';
export type TitleAudience =
  | 'general' | 'technical' | 'business' | 'academic' | 'beginner' | 'expert' | 'consumer';
export type SearchIntent = 'informational' | 'commercial' | 'navigational' | 'transactional';
export type TitleTestDimension =
  | 'emotional' | 'length' | 'format' | 'urgency' | 'specificity' | 'audience' | 'benefit';

/** POST /api/ai/article-title */
export interface TitleParams {
  /** What the article is about (3-200 characters). */
  topic: string;
  /**
   * One of: clickbait, seo, professional, listicle, how-to, question, news,
   * review. The API accepts it, but the titles do not depend on it today.
   */
  titleType?: KnownString<TitleType>;
  /** One of: professional, casual, urgent, friendly, authoritative, conversational, dramatic. */
  tone?: KnownString<TitleTone>;
  audience?: TitleAudience;
  /** Keywords as one string (up to 200 characters). */
  keywords?: string;
  /** How many titles (1-20). */
  quantity?: number;
  /** The longest title, in characters (30-100). */
  maxLength?: number;
  includeNumbers?: boolean;
  /** Add an analysis of the titles to the result. */
  includeAnalysis?: boolean;
  /**
   * @deprecated Use `quantity`. Sent as `quantity`; a value outside 1-20 is
   * moved to the nearest end of that range.
   */
  count?: number;
}

/** POST /api/ai/article-title/seo */
export interface SeoTitleParams extends TitleParams {
  /**
   * The keyword the titles target (2-50 characters). The API's prompt reads the
   * keyword from `keywords`, so when `keywords` is not set the SDK sends this
   * value as `keywords` too.
   */
  primaryKeyword: string;
  /** Up to 5 more keywords, each 2-50 characters. */
  secondaryKeywords?: string[];
  searchIntent?: SearchIntent;
  /** Up to 50 characters. */
  location?: string;
  /** Up to 5 competitor page URLs. */
  competitorUrls?: string[];
}

/**
 * The 1.0.2 call, `titles.seo({ topic, keywords })`. The SDK also sends
 * `keywords` as `primaryKeyword`, which the API requires.
 */
export interface LegacySeoTitleParams extends Omit<SeoTitleParams, 'primaryKeyword' | 'keywords'> {
  /** Sent as `keywords` and, when `primaryKeyword` is not set, as `primaryKeyword`. */
  keywords: string;
  primaryKeyword?: string;
}

/** POST /api/ai/article-title/abtest */
export interface TitleAbTestParams {
  /** What the article is about (3-200 characters). */
  topic: string;
  /** A title to vary (10-200 characters). */
  baseTitle?: string;
  /** How many variations (2-20). */
  variationCount?: number;
  testingDimensions?: TitleTestDimension[];
  audience?: TitleAudience;
  /**
   * @deprecated Use `variationCount`. Sent as `variationCount`; a value outside
   * 2-20 is moved to the nearest end of that range.
   */
  count?: number;
}

/** POST /api/ai/article-title/competitive */
export interface TitleCompetitiveParams {
  /** What the article is about (3-200 characters). */
  topic: string;
  /** 1-10 competitor titles, each 10-200 characters. */
  competitorTitles: string[];
  targetAudience?: TitleAudience;
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
}

/** The 1.0.2 parameter names for `titles.competitive()`. */
export interface LegacyTitleCompetitiveParams extends Omit<TitleCompetitiveParams, 'competitorTitles'> {
  /** @deprecated Use `competitorTitles`. */
  competitors: string[];
}

export class Titles {
  constructor(private client: AADDYY) {}

  /** Write article titles. V1: resolves to the response's `data`. */
  async generate(params: TitleParams) {
    const body = toBody(params);
    renameInRange(body, 'count', 'quantity', 1, 20);
    return this.client._request('POST', '/ai/article-title', body);
  }

  /** Write SEO titles for a keyword. V1. */
  async seo(params: SeoTitleParams | LegacySeoTitleParams) {
    const body = toBody(params);
    renameInRange(body, 'count', 'quantity', 1, 20);
    if (body.primaryKeyword === undefined && typeof body.keywords === 'string' && body.keywords !== '') {
      body.primaryKeyword = body.keywords;
    }
    // The API's seo prompt reads the keyword from `keywords` only.
    if ((body.keywords === undefined || body.keywords === '') && typeof body.primaryKeyword === 'string') {
      body.keywords = body.primaryKeyword;
    }
    return this.client._request('POST', '/ai/article-title/seo', body);
  }

  /**
   * Write title variations to A/B test. V1. Not checked against the live API:
   * if it fails with SERVICE_ERROR, use `titles.generate()`.
   */
  async abTest(params: TitleAbTestParams) {
    const body = toBody(params);
    renameInRange(body, 'count', 'variationCount', 2, 20);
    return this.client._request('POST', '/ai/article-title/abtest', body);
  }

  /**
   * Compare titles with competitors' titles. V1. Not checked against the live
   * API: if it fails with SERVICE_ERROR, use `titles.generate()`.
   */
  async competitive(params: TitleCompetitiveParams | LegacyTitleCompetitiveParams) {
    const body = toBody(params);
    rename(body, 'competitors', 'competitorTitles');
    return this.client._request('POST', '/ai/article-title/competitive', body);
  }
}
