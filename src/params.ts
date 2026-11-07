/**
 * Internal helpers that turn a method's parameters into the request body the
 * API validates. Not part of the public API.
 */

/**
 * A string field with a list of known values. Any other string still
 * type-checks, so code that passed a `string` to 1.0.2 keeps compiling; the
 * API checks the value.
 */
export type KnownString<T extends string> = T | (string & {});

export type Body = Record<string, unknown>;

/** A shallow copy of the caller's parameters, without undefined values. A missing object is {}. */
export function toBody(params: object | null | undefined): Body {
  const body: Body = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) body[key] = value;
  }
  return body;
}

/**
 * Send a 1.0.2 field under its API name. When the caller set both names, the
 * API name wins. The old name is never sent.
 */
export function rename(body: Body, from: string, to: string): void {
  if (!(from in body)) return;
  if (body[to] === undefined) body[to] = body[from];
  delete body[from];
}

/** Remove fields the API does not read. */
export function omit(body: Body, ...keys: string[]): void {
  for (const key of keys) delete body[key];
}
