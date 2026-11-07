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
  /** The price of the call, in USD (1 credit = $0.01). 0 when the API did not say. */
  public readonly required: number;
  /** The account's balance, in USD. 0 when the API did not say. */
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

/**
 * The typed error for an API error body. `status` is the HTTP status, or 0
 * when there is none (a failed V2 job reports only its error code).
 * Internal: the package exports the error classes, not this function.
 */
export function errorFromBody(status: number, body: Record<string, unknown>): AADDYYError {
  const code = ((body.error as Record<string, unknown> | undefined)?.code as string) ||
               (body.code as string) || '';

  if (status === 401) return new AuthenticationError();
  if (status === 429) return new RateLimitError(body);
  if (code === 'INSUFFICIENT_CREDITS') return new InsufficientCreditsError(body);
  if (code === 'EMAIL_NOT_VERIFIED') return new EmailVerificationError();
  return new AADDYYError(body);
}

/** Where the live tool catalog is. */
export const CATALOG_URL = 'https://backend.aaddyy.com/api/documentation/tools';

/**
 * The error a method rejects with, before any request, when its tool is
 * switched off. Internal.
 */
export function toolUnavailable(method: string, tool: string): AADDYYError {
  return new AADDYYError({
    error: {
      message: `${method} is unavailable: the ${tool} tool is switched off, so the SDK does not call it. ` +
        `The live catalog lists the tools you can call: ${CATALOG_URL}`,
      code: 'TOOL_UNAVAILABLE',
      statusCode: 410,
      details: { method },
    },
  });
}
