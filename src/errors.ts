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
 * when there is none (a failed V2 job reports only its error code). A body
 * without a statusCode of its own (the V2 poll route's 404 and 403 are
 * `{ success, message }`) gets the HTTP status.
 * Internal: the package exports the error classes, not this function.
 */
export function errorFromBody(status: number, body: Record<string, unknown>): AADDYYError {
  const error = body.error as Record<string, unknown> | undefined;
  const code = (error?.code as string) || (body.code as string) || '';
  const message = (error?.message as string) || (body.message as string) || '';
  const response = status && !error?.statusCode && !body.statusCode ? { ...body, statusCode: status } : body;

  // An API key over its request limit gets a 401 that says so
  // ("Rate limit exceeded: requests per minute"). The key itself is valid.
  if (status === 401 && /^rate limit exceeded/i.test(message)) {
    return new RateLimitError({ ...response, error: { ...error, code: 'RATE_LIMITED' } });
  }
  if (status === 401) return new AuthenticationError();
  if (status === 429) return new RateLimitError(response);
  if (code === 'INSUFFICIENT_CREDITS') return new InsufficientCreditsError(response);
  if (code === 'EMAIL_NOT_VERIFIED') return new EmailVerificationError();
  return new AADDYYError(response);
}

/** Where the live tool catalog is. */
export const CATALOG_URL = 'https://backend.aaddyy.com/api/documentation/tools';

/**
 * The error a method rejects with, before any request, when the SDK does not
 * call the method's endpoint. Internal.
 */
export function methodUnavailable(method: string, reason: string): AADDYYError {
  return new AADDYYError({
    error: {
      message: `${method} is unavailable: ${reason}`,
      code: 'TOOL_UNAVAILABLE',
      statusCode: 410,
      details: { method },
    },
  });
}

/**
 * The error a method rejects with, before any request, when its tool is
 * switched off. Internal.
 */
export function toolUnavailable(method: string, tool: string): AADDYYError {
  return methodUnavailable(method,
    `the ${tool} tool is switched off, so the SDK does not call it. ` +
    `The live catalog lists the tools you can call: ${CATALOG_URL}`);
}
