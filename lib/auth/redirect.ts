/** Only allow same-site relative paths as post-login destinations. */
export function safeNext(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || /[\\\x00-\x20\x7f]/.test(next)) {
    return fallback;
  }
  return next;
}
