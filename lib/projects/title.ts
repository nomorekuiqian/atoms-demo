export function titleFromPrompt(prompt: string): string {
  const clean = prompt.replace(/\s+/g, " ").trim().replace(/^(build|make|create)\s+(me\s+)?(an?\s+)?/i, "");
  const title = clean.length > 40 ? `${clean.slice(0, 40).trimEnd()}…` : clean;
  return title.charAt(0).toUpperCase() + title.slice(1);
}
