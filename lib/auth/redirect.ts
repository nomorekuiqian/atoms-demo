/** Only allow same-site relative paths as post-login destinations. */
export function safeNext(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
