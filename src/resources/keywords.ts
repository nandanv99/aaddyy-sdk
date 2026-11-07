import type { AADDYY } from '../client.js';
import { omit, rename, toBody } from '../params.js';

/** POST /api/ai/keyword-researcher */
export interface KeywordResearchParams {
  /** The keyword or topic to research (1-300 characters, up to 30 words). */
  keyword: string;
  /** Accepted by the API; the report is the same either way today. */
  detailed?: boolean;
  /** @deprecated The API does not read it, so the SDK does not send it. */
  country?: string;
  /** @deprecated The API does not read it, so the SDK does not send it. */
  language?: string;
}

/** The 1.0.2 parameter names for `keywords.research()`. */
export interface LegacyKeywordResearchParams extends Omit<KeywordResearchParams, 'keyword'> {
  /** @deprecated Use `keyword`. */
  topic: string;
}

export class Keywords {
  constructor(private client: AADDYY) {}

  /** Research a keyword. V1: resolves to the response's `data`. */
  async research(params: KeywordResearchParams | LegacyKeywordResearchParams) {
    const body = toBody(params);
    rename(body, 'topic', 'keyword');
    omit(body, 'country', 'language');
    return this.client._request('POST', '/ai/keyword-researcher', body);
  }
}
