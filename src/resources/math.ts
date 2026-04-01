import type { AADDYY } from '../client.js';

export class Math {
  constructor(private client: AADDYY) {}

  async solve(params: {
    problemText?: string;
    problemImage?: string;
    inputType?: 'text' | 'image';
    problemCategory?: 'arithmetic' | 'algebra' | 'geometry' | 'trigonometry' | 'calculus' | 'statistics' | 'linear-algebra' | 'auto-detect';
    explanationLevel?: 'brief' | 'step-by-step' | 'conceptual';
    language?: string;
    includeVisualization?: boolean;
  }) {
    return this.client._request('POST', '/ai/math-solver', {
      inputType: params.inputType || (params.problemImage ? 'image' : 'text'),
      ...params,
    });
  }
}
