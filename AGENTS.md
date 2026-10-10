# AGENTS.md

Shared conventions for coding agents (Claude Code, Codex, etc.) working in this repo. The source of truth for scope and design is [docs/PRD.md](docs/PRD.md).

## Project

Atoms-style AI app builder: a multi-agent pipeline (Mike → Emma → Bob → Alex) turns a prompt into a small multi-file HTML/CSS/JS app, streamed into a sandboxed iframe preview, with versions and public publishing.

## Stack

- Next.js 15 App Router + TypeScript, Tailwind CSS **3.4**, shadcn/ui, Zustand
- InsForge for DB / Auth / RLS / Model Gateway / hosting (Sites)
  - Browser & SSR: `@insforge/sdk`, `@insforge/sdk/ssr`; privileged server code: `createAdminClient({ apiKey })`
  - LLM calls: `openai` SDK pointed at OpenRouter (`OPENROUTER_API_KEY`, server-side only)
- Vitest for unit tests

## Rules

- InsForge SDK inserts take arrays: `insert([{ ... }])`. Every SDK call returns `{ data, error }`; check `error`.
- User-owned tables reference `auth.users(id)` and use RLS with `(select auth.uid())`.
- Never expose secrets through `NEXT_PUBLIC_*`. Only `.env.example` is committed.
- Schema changes go through `npx @insforge/cli db migrations` (files in `migrations/`); auth config through `insforge.toml` + `npx @insforge/cli config apply`.
- Generated apps run only inside `<iframe sandbox="allow-scripts allow-forms allow-modals">` — never add `allow-same-origin`.
- Keep the orchestrator (`lib/agents/`) free of Next.js specifics so it can move to an InsForge Edge Function if needed.

## Commands

```bash
npm run dev          # local dev
npm run build        # must pass before every deploy
npm run test         # vitest
npm run deploy       # npx @insforge/cli deployments deploy .
```

## Workflow

- Commit per milestone with Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Finish P0 (PRD §3) before any P1 work; deploy after each milestone.
