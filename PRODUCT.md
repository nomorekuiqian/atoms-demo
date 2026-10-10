# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Non-engineers — creators, product managers, students — who want a small working web app (a timer, a budget tracker, a game, a personal page) without writing code. They arrive with a one-sentence idea, wait while it is built, poke at the result, ask for changes in plain language, and share a link with friends.

The first people to use this build are Atoms (atoms.dev) reviewers evaluating it as a take-home; the design still serves the end user above, not the reviewer.

## Product Purpose

Atoms Lite turns a sentence into a running multi-file HTML/CSS/JS app. A visible team of AI agents does the work, the app runs live in a preview next to the conversation, every change becomes a version, and any version can be published to a public URL. Success: from idea to a usable, shareable app in about two minutes, and further changes by just asking.

## Positioning

The build is done by a named team, not a single chatbot: Mike (Team Leader) writes a brief and assigns work, Emma (Product Manager) lists features, Bob (Architect) plans files, Alex (Engineer) writes the code. Their work streams in as it happens, so waiting is watching. Small follow-up edits go straight from Mike to Alex.

## Operating Context

- Core loop: prompt → agents stream → files appear → preview runs → follow-up change → new version → publish.
- Desktop browser is the main context; phones must still work (chat and preview switch by tab).
- Generated apps run only in a sandboxed iframe and on public `/p/{slug}` pages.
- Generation takes 30–120 seconds; the user can stop it at any time.

## Capabilities and Constraints

- Email/password sign-up without verification, plus a one-click shared demo account (no anonymous mode).
- Project list; workspace with chat on the left and Preview / Code / Versions on the right; App Viewer toolbar with device width, refresh, open in new tab, and a Console.
- Versions are full snapshots; restore creates a new version. Publish uses a 6–30 character lowercase slug; apps can be unpublished.
- P1 extensions: Issue Report + Resolve (runtime errors sent back to Alex), Discover + Remix, theme presets.
- Generated apps are front-end only, at most 6 files, persistence only via localStorage.
- Per-user daily generation limit (lower for the demo account); the UI must explain limits plainly.

## Brand Commitments

- Name: "Atoms Lite". Do not use Atoms' official logo or colors; the look does not need to follow atoms.dev.
- Interface language: English. Agent names and roles (Mike · Team Leader, Emma · Product Manager, Bob · Architect, Alex · Engineer) and Atoms terms (Version, Publish, Remix, Resolve, Issue Report) are kept as-is.
- Visual reference (user decision, 2026-10-10): elegant and premium in the manner of OpenAI's ChatGPT and the Atoms app — airy neutral grounds, quiet hierarchy, generous whitespace, refined type. Concept/metaphor worlds (kitchen pass, call sheet, transit map, ticket wallet) were rejected as stiff. Match their craft level; do not copy Atoms' own fonts, colors, or mascots.
- Voice: direct and brief. No marketing slogans, no "AI-powered" filler, no feature-explainer paragraphs.

## Evidence on Hand

None yet. No testimonials, user counts, logos, or benchmarks exist; never fabricate them. Example prompts (Pomodoro timer, expense tracker, Snake, personal homepage) are the only seeded content.

## Product Principles

1. Every element earns its place: if you cannot say what the user does with it, remove it.
2. Show the work: progress is the agents' real output, never a fake spinner.
3. The app is the hero: once something is built, the preview gets the space.
4. Never lose work: failed or stopped runs never overwrite the last good version.
5. Say it plainly: short labels, concrete errors with a next step.

## Accessibility & Inclusion

WCAG 2.1 AA contrast in light and dark themes; full keyboard operation of chat, tabs, and dialogs; visible focus; respects reduced motion.
