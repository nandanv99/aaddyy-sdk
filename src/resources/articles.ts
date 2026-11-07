import type { AADDYY } from '../client.js';
import { omit, rename, toBody, type Body, type KnownString } from '../params.js';

export type ArticleLength = 'short' | 'medium' | 'long';
export type ArticleTone =
  | 'professional' | 'casual' | 'friendly' | 'formal' | 'creative' | 'authoritative' | 'conversational';
export type ArticleAudience = 'general' | 'technical' | 'business' | 'academic' | 'beginner' | 'expert';
export type ArticleType = 'how-to' | 'listicle' | 'review' | 'news' | 'opinion' | 'general';
export type ArticleImprovement =
  | 'readability' | 'engagement' | 'seo' | 'structure' | 'grammar' | 'tone' | 'length';

/** POST /api/ai/article */
export interface ArticleParams {
  /** What the article is about (3-200 characters). */
  topic: string;
  /** short, medium or long. */
  length?: KnownString<ArticleLength>;
  /** One of: professional, casual, friendly, formal, creative, authoritative, conversational. */
  tone?: KnownString<ArticleTone>;
  /** One of: general, technical, business, academic, beginner, expert. */
  audience?: KnownString<ArticleAudience>;
  /**
   * SEO keywords as one comma-separated string (up to 500 characters).
   * An array is joined with ", " before it is sent.
   */
  keywords?: string | string[];
  includeImages?: boolean;
  includeReferences?: boolean;
  outline?: boolean;
  /** One of: how-to, listicle, review, news, opinion, general. */
  articleType?: KnownString<ArticleType>;
  /** @deprecated The API does not read it, so the SDK does not send it. */
  language?: string;
}

/** POST /api/ai/article/specialized */
export interface SpecializedArticleParams extends Omit<ArticleParams, 'articleType'> {
  /** The kind of article: how-to, listicle, review, news, opinion or general. */
  articleType: KnownString<ArticleType>;
}

/** POST /api/ai/article/outline */
export interface ArticleOutlineParams {
  /** What the article is about (3-200 characters). */
  topic: string;
  length?: ArticleLength;
  audience?: ArticleAudience;
  /** Keywords as one comma-separated string (up to 500 characters). */
  keywords?: string;
  /** How many sections (3-15). */
  sectionsCount?: number;
  /** @deprecated Use `sectionsCount`. */
  sections?: number;
}

/** POST /api/ai/article/improve */
export interface ArticleImproveParams {
  /** The article to improve (100-10,000 characters). */
  content: string;
  /** What to improve. */
  improvements?: ArticleImprovement[];
  tone?: ArticleTone;
  audience?: ArticleAudience;
  /**
   * @deprecated The API does not read it, so the SDK does not send it.
   * Use `improvements`, `tone` and `audience`.
   */
  instructions?: string;
}

function articleBody(params: ArticleParams): Body {
  const body = toBody(params);
  if (Array.isArray(body.keywords)) body.keywords = body.keywords.join(', ');
  omit(body, 'language');
  return body;
}

export class Articles {
  constructor(private client: AADDYY) {}

  /** Write an article. V1: resolves to the response's `data`. */
  async generate(params: ArticleParams) {
    return this.client._request('POST', '/ai/article', articleBody(params));
  }

  /** Write an article of one kind (how-to, listicle, review, news, opinion). V1. */
  async specialized(params: SpecializedArticleParams) {
    return this.client._request('POST', '/ai/article/specialized', articleBody(params));
  }

  /** Outline an article. V1. */
  async outline(params: ArticleOutlineParams) {
    const body = toBody(params);
    rename(body, 'sections', 'sectionsCount');
    return this.client._request('POST', '/ai/article/outline', body);
  }

  /** Improve an existing article. V1. */
  async improve(params: ArticleImproveParams) {
    const body = toBody(params);
    omit(body, 'instructions');
    return this.client._request('POST', '/ai/article/improve', body);
  }
}
