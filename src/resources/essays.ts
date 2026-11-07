import type { AADDYY } from '../client.js';
import { omit, toBody, type KnownString } from '../params.js';

export type EssayType =
  | 'argumentative' | 'expository' | 'narrative' | 'descriptive' | 'analytical'
  | 'persuasive' | 'compare_contrast' | 'cause_effect' | 'research';
export type EssayAcademicLevel = 'high_school' | 'undergraduate' | 'graduate' | 'professional';
export type EssayTone = 'formal' | 'informal' | 'academic' | 'conversational' | 'professional';

/** POST /api/ai/essay-writer */
export interface EssayParams {
  /** What the essay is about (5-500 characters). */
  topic: string;
  /** Target length in words (250-3000). */
  wordCount: number;
  essayType?: EssayType;
  academicLevel?: EssayAcademicLevel;
  /** One of: formal, informal, academic, conversational, professional. */
  tone?: KnownString<EssayTone>;
  /** Include citations. Must be true when `essayType` is 'research'. */
  citations?: boolean;
  /** Include an outline. */
  outline?: boolean;
  /** @deprecated The API does not read it, so the SDK does not send it. */
  language?: string;
}

export class Essays {
  constructor(private client: AADDYY) {}

  /** Write an essay. V1: resolves to the response's `data`. */
  async write(params: EssayParams) {
    const body = toBody(params);
    omit(body, 'language');
    return this.client._request('POST', '/ai/essay-writer', body);
  }
}
