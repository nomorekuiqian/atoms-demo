# AGENTS.md

Shared conventions for coding agents (Claude Code, Codex, etc.) working in this repo. The source of truth for scope and design is [docs/PRD.md](docs/PRD.md).

## Project

Atoms-style AI app builder: a coordinating Mike agent with independent Emma/Bob/Alex ReAct loops turns a prompt into a small multi-file HTML/CSS/JS app, streamed into a sandboxed iframe preview, with versions and public publishing.

## Stack

- Next.js 15 App Router + TypeScript, Tailwind CSS **3.4**, shadcn/ui, Zustand
- InsForge for DB / Auth / RLS / Model Gateway / hosting (Sites)
  - Browser & SSR: `@insforge/sdk`, `@insforge/sdk/ssr`; privileged server code: `createAdminClient({ apiKey })`
  - Agent runtime: Vercel AI SDK `ToolLoopAgent` with `@ai-sdk/openai-compatible` pointed at OpenRouter via `OPENROUTER_BASE_URL` + `OPENROUTER_API_KEY`, server-side only
  - The app always calls the real model, locally and in production; there is no mock mode and no daily generation limit. Scripted models (`lib/llm/scripted-model.ts`, `fixtures/`) are only for unit tests and `scripts/smoke-react.mjs --mock`
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

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **atoms-demo** (API base `https://53bg3mbj.us-east.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->
