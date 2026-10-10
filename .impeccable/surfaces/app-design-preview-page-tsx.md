---
version: 1
slug: "app-design-preview-page-tsx"
primary_target: "app/design-preview/page.tsx"
related_targets: ["app/project","app/page.tsx","app/dashboard","app/login"]
---

## Scope

Whole product world for Atoms Lite (landing, login, dashboard, workspace). Mode: Operate for app screens; the landing is a single prompt box. Specimen route: /design-preview (dev only).

## Audience and task

Non-engineer makers: type an idea, watch the agent team build it, try the app, ask for changes, publish. See PRODUCT.md.

## Direction contract

THESIS: A quiet studio in the manner of ChatGPT and the Atoms app, refined rather than themed. Refuses metaphor costumes and the dark-neon "AI builder" default; the generated app is the only loud thing on screen.

OWN-WORLD: Near-white neutral ground (#F7F7F8) with white raised surfaces, hairline borders at 8% ink, ink #0D0D0D, one iris accent for focus/selection/working state. Geist for UI, Instrument Serif only for large headlines, Geist Mono for code. Pill buttons, 24px composer, 16px panels, soft two-layer shadows. Agents as soft-tinted monogram avatars.

STORY: The visitor sees one composer and knows to type; in the workspace they read who is working and on what, and the app takes the right side.

FIRST VIEWPORT: Workspace: slim top bar (project, version, pill actions; black Publish). Left 38%: chat directly on the ground, agent rows "Alex | Engineer" with a collapsible Working process timeline of hairline tool rows; white composer pinned bottom. Right 62%: one raised white panel, tabs + device toolbar, live preview.

FORM: Category standard (canon) executed at full craft, references OpenAI ChatGPT and Atoms; seed key 9cb248f6.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
