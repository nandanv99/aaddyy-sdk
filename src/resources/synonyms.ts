import type { AADDYY } from '../client.js';
import { omit, rename, toBody } from '../params.js';

/** POST /api/ai/synonym-finder */
export interface SynonymParams {
  /** The word or phrase (1-100 characters: letters, spaces and hyphens). */
  topic: string;
  /** How many synonyms (1-50). Above the included number, each extra word is billed. */
  similarWordsCount: number;
  /** @deprecated The API does not read it, so the SDK does not send it. */
  context?: string;
}

/** The 1.0.2 parameter names for `synonyms.find()`. */
export interface LegacySynonymParams extends Omit<SynonymParams, 'topic' | 'similarWordsCount'> {
  /** @deprecated Use `topic`. */
  word: string;
  /** @deprecated Use `similarWordsCount`. */
  count: number;
}

export class Synonyms {
  constructor(private client: AADDYY) {}

  /** Find synonyms. V1: resolves to the response's `data`. */
  async find(params: SynonymParams | LegacySynonymParams) {
    const body = toBody(params);
    rename(body, 'word', 'topic');
    rename(body, 'count', 'similarWordsCount');
    omit(body, 'context');
    return this.client._request('POST', '/ai/synonym-finder', body);
  }
}
