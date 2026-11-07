import type { AADDYY } from '../client.js';
import { toBody, type KnownString } from '../params.js';

export type MathProblemCategory =
  | 'arithmetic' | 'algebra' | 'geometry' | 'trigonometry' | 'calculus'
  | 'statistics' | 'linear-algebra' | 'other' | 'auto-detect';
export type SolverLanguage = 'english' | 'spanish' | 'french' | 'hindi' | 'arabic' | 'chinese' | 'custom';
export type SolutionFormat = 'text' | 'text-latex' | 'pdf';

/**
 * POST /api/ai/math-solver. Send `problemText` or `problemImage`. When
 * `inputType` is not given, the SDK sends 'image' if there is a
 * `problemImage`, otherwise 'text'.
 */
export interface MathSolveParams {
  /** The problem as text (3-2000 characters). Required when `inputType` is 'text'. */
  problemText?: string;
  /**
   * The problem as an image: an http(s) URL or a base64 data URI (JPG, PNG or WEBP,
   * up to 10 MB). Required when `inputType` is 'image'.
   */
  problemImage?: string;
  inputType?: 'text' | 'image';
  problemCategory?: MathProblemCategory;
  explanationLevel?: 'brief' | 'step-by-step' | 'conceptual';
  /** One of: english, spanish, french, hindi, arabic, chinese, custom. */
  language?: KnownString<SolverLanguage>;
  /** text, text-latex or pdf. */
  solutionFormat?: KnownString<SolutionFormat>;
  includeVisualization?: boolean;
  showWorkSteps?: boolean;
}

export class Math {
  constructor(private client: AADDYY) {}

  /** Solve a math problem. V1: resolves to the response's `data`. */
  async solve(params: MathSolveParams) {
    const body = toBody(params);
    body.inputType = body.inputType || (body.problemImage ? 'image' : 'text');
    return this.client._request('POST', '/ai/math-solver', body);
  }
}
