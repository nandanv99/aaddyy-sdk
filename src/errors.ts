/**
 * AADDYY SDK error types.
 */

export class AADDYYError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(response: {
    message?: string;
    error?: { message?: string; code?: string; statusCode?: number; details?: Record<string, unknown> };
    code?: string;
    statusCode?: number;
  }) {
    const msg = response.error?.message || response.message || 'AADDYY API error';
    super(msg);
    this.name = 'AADDYYError';
    this.code = response.error?.code || response.code || 'UNKNOWN_ERROR';
    this.statusCode = response.error?.statusCode || response.statusCode || 500;
    this.details = response.error?.details;
  }
}

export class InsufficientCreditsError extends AADDYYError {
  public readonly required: number;
  public readonly available: number;

  constructor(response: Record<string, unknown>) {
    super({ ...response, code: 'INSUFFICIENT_CREDITS' });
    this.name = 'InsufficientCreditsError';
    const details = (response.error as Record<string, unknown>)?.details as Record<string, unknown> | undefined;
    this.required = (details?.required as number) || 0;
    this.available = (details?.available as number) || 0;
  }
}

export class RateLimitError extends AADDYYError {
  constructor(response: Record<string, unknown>) {
    super({ ...response, code: 'RATE_LIMITED' });
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends AADDYYError {
  constructor(message = 'Authentication failed. Check your AADDYY_API_KEY.') {
    super({ message, code: 'UNAUTHORIZED', statusCode: 401 });
    this.name = 'AuthenticationError';
  }
}

export class EmailVerificationError extends AADDYYError {
  constructor() {
    super({
      message: 'Email verification required. Verify your email at aaddyy.com before creating API keys.',
      code: 'EMAIL_NOT_VERIFIED',
      statusCode: 403,
    });
    this.name = 'EmailVerificationError';
  }
}
