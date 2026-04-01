import type { AADDYY } from '../client.js';

export class Physics {
  constructor(private client: AADDYY) {}

  async solve(params: {
    problemText?: string;
    problemImage?: string;
    inputType?: 'text' | 'image';
    problemCategory?: 'mechanics' | 'electricity-magnetism' | 'thermodynamics' | 'optics' | 'waves' | 'modern-physics' | 'auto-detect';
    explanationLevel?: 'final-answer' | 'step-by-step' | 'conceptual';
    unitsPreference?: 'SI' | 'Imperial' | 'Mixed';
    language?: string;
  }) {
    return this.client._request('POST', '/ai/physics-solver', {
      inputType: params.inputType || (params.problemImage ? 'image' : 'text'),
      ...params,
    });
  }
}
