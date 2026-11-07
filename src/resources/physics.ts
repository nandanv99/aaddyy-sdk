import type { AADDYY } from '../client.js';
import { toBody, type KnownString } from '../params.js';
import type { SolutionFormat, SolverLanguage } from './math.js';

export type PhysicsProblemCategory =
  | 'mechanics' | 'electricity-magnetism' | 'thermodynamics' | 'optics' | 'waves'
  | 'modern-physics' | 'relativity' | 'fluid-mechanics' | 'other' | 'auto-detect';

/**
 * POST /api/ai/physics-solver. Send `problemText` or `problemImage`. When
 * `inputType` is not given, the SDK sends 'image' if there is a
 * `problemImage`, otherwise 'text'.
 */
export interface PhysicsSolveParams {
  /** The problem as text (5-3000 characters). Required when `inputType` is 'text'. */
  problemText?: string;
  /**
   * The problem as an image: an http(s) URL or a base64 data URI (JPG, PNG or WEBP,
   * up to 10 MB). Required when `inputType` is 'image'.
   */
  problemImage?: string;
  inputType?: 'text' | 'image';
  problemCategory?: PhysicsProblemCategory;
  explanationLevel?: 'final-answer' | 'step-by-step' | 'conceptual';
  unitsPreference?: 'SI' | 'Imperial' | 'Mixed';
  /** One of: english, spanish, french, hindi, arabic, chinese, custom. */
  language?: KnownString<SolverLanguage>;
  solutionFormat?: SolutionFormat;
  includeConstantsAndEquations?: boolean;
}

export class Physics {
  constructor(private client: AADDYY) {}

  /** Solve a physics problem. V1: resolves to the response's `data`. */
  async solve(params: PhysicsSolveParams) {
    const body = toBody(params);
    body.inputType = params.inputType || (params.problemImage ? 'image' : 'text');
    return this.client._request('POST', '/ai/physics-solver', body);
  }
}
