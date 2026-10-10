/** Public app links: /p/{slug}. Same rules as Atoms: 6-30 lowercase letters, numbers or hyphens. */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{4,28})[a-z0-9]$/;

const RESERVED = new Set([
  "admin", "api", "app", "atoms", "dashboard", "discover", "login", "logout", "preview", "project", "projects",
  "settings", "signup", "static", "support", "www",
]);

export function slugProblem(slug: string): string | null {
  if (slug.length < 6) return "Use at least 6 characters.";
  if (slug.length > 30) return "Use at most 30 characters.";
  if (/[^a-z0-9-]/.test(slug)) return "Use lowercase letters, numbers and hyphens only.";
  if (slug.startsWith("-") || slug.endsWith("-")) return "Start and end with a letter or number.";
  if (!SLUG_PATTERN.test(slug)) return "Use 6–30 lowercase letters, numbers or hyphens.";
  if (RESERVED.has(slug)) return "That name is reserved.";
  return null;
}

/** A readable default from the project title, with a short random suffix. */
export function suggestSlug(title: string, rand = Math.random): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/g, "");
  const suffix = Math.floor(rand() * 36 ** 4).toString(36).padStart(4, "0");
  return `${base || "app"}-${suffix}`;
}
