import type { AADDYY } from '../client.js';
import { toBody, type KnownString } from '../params.js';

export type LogoBackground = 'transparent' | 'red' | 'blue' | 'black' | 'white';
export type LogoStyle =
  | 'modern' | 'minimal' | 'vintage' | 'abstract' | '3d' | 'hand_drawn' | 'geometric' | 'AI Decides';
export type LogoType = 'wordmark' | 'lettermark' | 'pictorial' | 'abstract' | 'mascot' | 'emblem' | 'combination';
export type LogoFontMood = 'auto' | 'geometric' | 'rounded' | 'humanist' | 'serif' | 'display' | 'script';

/** POST /api/ai/logo-creator */
export interface LogoParams {
  /** The brand name (1-200 characters). */
  keyword: string;
  /** Colours in words; hex codes in it become the palette (up to 500 characters, 50 words). */
  color?: string;
  background?: LogoBackground;
  /** The style. 'AI Decides' lets the tool choose. */
  type?: LogoStyle;
  /** How many logo concepts (1-6). Each concept is billed. */
  concepts?: number;
  /** Up to 60 characters. */
  tagline?: string;
  /** What the business does (up to 300 characters). */
  description?: string;
  /** An idea for the symbol (up to 120 characters). */
  iconIdea?: string;
  /**
   * 1-7 of the logo types to try: wordmark, lettermark, pictorial, abstract,
   * mascot, emblem, combination.
   */
  logoTypes?: KnownString<LogoType>[];
  /** 1-4 hex colours, such as '#1F4D3A'. */
  palette?: string[];
  /** One of: auto, geometric, rounded, humanist, serif, display, script. */
  fontMood?: KnownString<LogoFontMood>;
}

export class Logos {
  constructor(private client: AADDYY) {}

  /** Make a logo. V1: resolves to the response's `data`. */
  async create(params: LogoParams) {
    return this.client._request('POST', '/ai/logo-creator', toBody(params));
  }
}
