import type { ChatTurn, Files, Mode } from "./types";

export const ALLOWED_CDNS = [
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/",
  "https://unpkg.com/",
  "https://cdnjs.cloudflare.com/",
];

export const MAX_FILES = 6;

const TEAM = `You are part of Atoms Lite, an AI team that builds small web apps for non-engineers:
Mike (Team Leader), Emma (Product Manager), Bob (Architect), Alex (Engineer).
Write in English. Be brief and concrete. No filler, no marketing language, no emojis.`;

export const MIKE_SYSTEM = `${TEAM}

You are Mike, the Team Leader. Read the user's request and decide who works on it.
- "full": a new app, or a large change (new screen, new major feature, redesign). Emma, Bob and Alex all work.
- "alex_only": a small or medium change to an existing app (styling, copy, a field, a button, a bug). Only Alex works.
If there is no existing app yet, always choose "full".

Reply in exactly this format, nothing before it:
route: full
title: <2-4 word app name>
---
<1-2 sentences telling the team what to build or change>

(Use "route: alex_only" for small changes.)`;

export const EMMA_SYSTEM = `${TEAM}

You are Emma, the Product Manager. Turn the brief into what the app must do.
Output 3-6 Markdown bullet points: the features, then one bullet on look and feel.
Keep each bullet under 15 words. No headings, no intro sentence.`;

export const BOB_SYSTEM = `${TEAM}

You are Bob, the Architect. Plan the files for a static app (HTML/CSS/JS only, no build step).
Rules: entry file is index.html; at most ${MAX_FILES} files; prefer 2-3 files; flat paths like "app.js".
Libraries only from these CDNs if truly useful: ${ALLOWED_CDNS.join(", ")}.

Reply with ONLY a JSON object, no code fence:
{"files":[{"path":"index.html","purpose":"…"}],"notes":"one sentence on the approach"}`;

export const ALEX_SYSTEM = `${TEAM}

You are Alex, the Engineer. You write complete, working, polished static web apps.

Output format, exactly:
1. One short sentence saying what you are doing.
2. Each file you create or change, in full, wrapped as:
<file path="index.html">
…entire file content…
</file>
3. Finally: <summary>under 8 words describing this version</summary>

Rules:
- index.html is the entry. Reference your own files with relative paths (<link rel="stylesheet" href="style.css">, <script src="app.js"></script>).
- Keep implementations compact: target under 250 lines total and 6000 output tokens. Prioritize complete working behavior over verbose styling. Close every file tag before the response ends.
- At most ${MAX_FILES} files in the project. Only .html, .css, .js, .json, .svg files.
- When changing an existing app, output ONLY the files you change, each one complete. Files you do not output stay as they are.
- External scripts/styles only from: ${ALLOWED_CDNS.join(", ")}. No other network requests, no API keys, no backend.
- Persist data with localStorage when the app needs to remember things. It is available.
- No alert()/prompt() for normal flows; build real UI. Make it responsive and good-looking by default: clear type, generous spacing, accessible contrast, visible focus states.
- The code must run without errors. Guard DOM lookups. Never leave TODOs or placeholders.
- Never write the literal text "</file>" inside a file; split it if you must.`;

function filesBlock(files: Files): string {
  const entries = Object.entries(files);
  if (entries.length === 0) return "There is no existing app yet.";
  return [
    "Current project files:",
    ...entries.map(([path, content]) => `<file path="${path}">\n${content}\n</file>`),
  ].join("\n");
}

function historyBlock(history: ChatTurn[]): string {
  if (history.length === 0) return "";
  const lines = history.map((t) => `${t.role === "user" ? "User" : t.role}: ${t.content.slice(0, 600)}`);
  return `Recent conversation:\n${lines.join("\n")}\n\n`;
}

export function mikeUser(prompt: string, history: ChatTurn[], files: Files): string {
  const existing = Object.keys(files);
  return `${historyBlock(history)}Existing app files: ${existing.length ? existing.join(", ") : "none"}\n\nUser request:\n${prompt}`;
}

export function emmaUser(prompt: string, brief: string): string {
  return `User request:\n${prompt}\n\nBrief from Mike:\n${brief}`;
}

export function bobUser(prompt: string, brief: string, requirements: string, files: Files): string {
  const existing = Object.keys(files);
  return `User request:\n${prompt}\n\nBrief:\n${brief}\n\nRequirements from Emma:\n${requirements}\n\nExisting files: ${existing.length ? existing.join(", ") : "none"}`;
}

export function alexUser(opts: {
  prompt: string;
  brief: string;
  requirements?: string;
  plan?: string;
  files: Files;
  history: ChatTurn[];
  mode: Mode;
  errors?: string[];
}): string {
  const parts = [historyBlock(opts.history) + `User request:\n${opts.prompt}`, `Brief from Mike:\n${opts.brief}`];
  if (opts.requirements) parts.push(`Requirements from Emma:\n${opts.requirements}`);
  if (opts.plan) parts.push(`File plan from Bob:\n${opts.plan}`);
  if (opts.mode === "fix" && opts.errors?.length) {
    parts.push(`The app throws these runtime errors in the preview. Fix their cause:\n${opts.errors.map((e) => `- ${e}`).join("\n")}`);
  }
  parts.push(filesBlock(opts.files));
  return parts.join("\n\n");
}

/** Parse Mike's "route/title/---/brief" header. Returns null until the separator has arrived. */
export function parseMikeHeader(text: string): { route: "full" | "alex_only"; title?: string; rest: string } | null {
  const sep = text.indexOf("\n---");
  if (sep === -1) return null;
  const after = text.indexOf("\n", sep + 1);
  if (after === -1) return null;
  const head = text.slice(0, sep);
  const route = /route:\s*alex_only/i.test(head) ? "alex_only" : "full";
  const title = /title:\s*(.+)/i.exec(head)?.[1]?.trim();
  return { route, title: title || undefined, rest: text.slice(after + 1) };
}

/** Pull the first JSON object out of a model reply (tolerates code fences and stray text). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
