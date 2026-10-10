---
name: Atoms Lite
description: Describe an app. A team of AI agents builds it.
colors:
  ground: "#f7f7f8"
  surface: "#ffffff"
  surface-2: "#f1f1f2"
  surface-3: "#e8e8ea"
  hairline: "rgba(13, 13, 13, 0.08)"
  hairline-strong: "rgba(13, 13, 13, 0.15)"
  ink: "#0d0d0d"
  ink-2: "#5d5d5d"
  ink-3: "#6f6f6f"
  on-ink: "#ffffff"
  iris: "#5b5bd6"
  iris-soft: "#eeeefc"
  iris-ink: "#4040b0"
  danger: "#c9252c"
  danger-soft: "#fdeded"
  success: "#18794e"
  success-soft: "#e6f4ec"
  mike: "#8a4b12"
  mike-soft: "#f7ead9"
  emma: "#9a2d5a"
  emma-soft: "#f8e4ec"
  bob: "#1f5a8e"
  bob-soft: "#e1edf8"
  alex: "#1e6b43"
  alex-soft: "#e0f2e7"
  scrim: "rgba(13, 13, 13, 0.32)"
typography:
  display-lg:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "60px"
    fontWeight: 400
    lineHeight: "62px"
    letterSpacing: "-0.015em"
  display:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "44px"
    fontWeight: 400
    lineHeight: "48px"
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "30px"
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.01em"
  prompt:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "24px"
  message:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "21px"
    fontFeature: "\"ss01\" on, \"cv11\" on"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
  code:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: "20px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  message-gap: "28px"
  message-indent: "44px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "32px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "32px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-2}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "32px"
  button-lg:
    typography: "{typography.message}"
    padding: "0 20px"
    height: "40px"
  button-sm:
    typography: "{typography.label}"
    padding: "0 12px"
    height: "28px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    size: "32px"
  icon-button-active:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  composer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.message}"
    rounded: "{rounded.xl}"
    padding: "16px 20px 12px"
  composer-send:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.full}"
    size: "36px"
  composer-send-disabled:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink-3}"
  tabs-list:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.full}"
    padding: "2px"
  tabs-trigger:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "28px"
  tabs-trigger-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  prompt-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "32px"
  status-pill-published:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  status-pill-failed:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  status-pill-stopped:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  user-bubble:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.message}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
  agent-avatar-mike:
    backgroundColor: "{colors.mike-soft}"
    textColor: "{colors.mike}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    size: "32px"
  agent-avatar-emma:
    backgroundColor: "{colors.emma-soft}"
    textColor: "{colors.emma}"
    rounded: "{rounded.full}"
    size: "32px"
  agent-avatar-bob:
    backgroundColor: "{colors.bob-soft}"
    textColor: "{colors.bob}"
    rounded: "{rounded.full}"
    size: "32px"
  agent-avatar-alex:
    backgroundColor: "{colors.alex-soft}"
    textColor: "{colors.alex}"
    rounded: "{rounded.full}"
    size: "32px"
  tool-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  list-row-selected:
    backgroundColor: "{colors.iris-soft}"
    textColor: "{colors.iris-ink}"
  menu:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "4px"
  menu-item:
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "32px"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
    width: "440px"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
---

# Design System: Atoms Lite

## Overview

**Creative North Star: "The Quiet Studio"**

Atoms Lite is a calm room where a small team works and the thing they make is the only loud object in it. The interface is a near-white neutral ground with white raised surfaces, hairline borders, near-black ink, and one iris accent that appears only when something is focused, selected, or working. Everything around the generated app is grey on purpose, so the app's own colours read as the result, not as chrome.

Density is relaxed and conversational on the chat side and tool-like on the app side. Chat runs directly on the ground with no bubble behind agent messages; agents are identified by original clay avatars with soft-tinted letter fallbacks and a "Name | Role" label, and their work is shown as a quiet timeline of hairline tool rows. The preview lives in one raised white panel. Instrument Serif appears only as a large headline; every other word is set in Geist, and code in Geist Mono.

The system is refined rather than themed. It refuses metaphor worlds (kitchen pass, call sheet, transit map, ticket wallet were tried and rejected as stiff) and the dark-neon "AI builder" default. Light and dark themes share one token set.

**Key Characteristics:**
- Near-white ground (#F7F7F8) with chat set directly on it; white raised panels for tools.
- One iris accent, reserved for focus, selection and in-progress state.
- Ink-black pill for the single primary action on a screen (Publish, Sign in, New project).
- Instrument Serif only at display size; Geist everywhere else.
- Hairline borders at 8% ink, soft two-layer shadows, generous radii (12px fields, 16px panels, 24px composer).
- One live motion: a light sweep across in-progress text.

## Colors

A neutral greyscale studio with one cool iris accent and four soft identity tints for the agents.

### Primary
- **Iris** (`iris`): focus rings (2px outline, 2px offset), focused field and composer borders, caret colour, the running spinner in a tool row, and the "writing" dot on a file. Never a fill for buttons or decoration.
- **Iris Wash** (`iris-soft`): text selection, the 3–4px soft halo around a focused field or composer, and the background of a selected row (current file in Code, viewed version in Versions).
- **Iris Ink** (`iris-ink`): text on an Iris Wash selected row.

### Secondary
- **Agent tints** (`mike` / `mike-soft`, `emma` / `emma-soft`, `bob` / `bob-soft`, `alex` / `alex-soft`): Mike amber-brown, Emma plum, Bob slate blue, Alex forest green. Used only inside the avatar (soft background, original image, deep fallback letter). They identify who is speaking; they are never used for text, borders or surfaces elsewhere.

### Tertiary
- **Status** (`success` / `success-soft`, `danger` / `danger-soft`): the "Published" pill and done checks; failed agent pills, runtime-error icon, destructive menu items, field errors and the Delete button. Warning tokens exist in the stylesheet but no component uses them yet.

### Neutral
- **Studio Ground** (`ground`): the page background everywhere, including behind the chat column.
- **Paper** (`surface`): raised panels, the composer, fields, menus, dialogs, tool rows, chips.
- **Soft Grey** (`surface-2`): hover fill for ghost buttons and rows, the tabs track, the user's chat bubble, stopped pill.
- **Mid Grey** (`surface-3`): disabled send button, account monogram, scrollbar thumb.
- **Hairline** (`hairline`): default border on every element, row dividers, panel edges.
- **Hairline Strong** (`hairline-strong`): field and composer borders, secondary button border, the Working process rail, small vertical separators.
- **Ink** (`ink`), **Ink 2** (`ink-2`), **Ink 3** (`ink-3`): primary text; secondary text and icons; placeholders, line numbers and step counts.
- **On Ink** (`on-ink`): text on ink pills, tooltips and toasts.
- **Scrim** (`scrim`): dialog backdrop.

Dark theme (`.dark`) remaps the same roles: ground #161616, surface #1f1f1f / #2a2a2a / #333333, ink #ececec / #b4b4b4 / #8f8f8f, on-ink #0d0d0d, iris #8d8ff5 with wash #26264a and ink #bcbdff, hairlines at 8% / 16% white. Agent and status pairs invert to light letters on deep tints.

### Named Rules
**The Only Colour Rule.** The generated app is the only colourful thing on screen. Chrome stays neutral; agent tints live only inside 32px (or 24px) avatars and status colours only inside small pills and icons.

**The Iris Means Now Rule.** Iris marks focus, selection or work in progress, and nothing else. If an iris element is still on screen after the user has stopped interacting and nothing is running, it is decoration and must go.

**The One Black Pill Rule.** Each screen has one ink-filled primary button. In the workspace it is Publish, and it stays visible at every width.

## Typography

**Display Font:** Instrument Serif 400 (with ui-serif, Georgia)
**Body Font:** Geist (with ui-sans-serif, system-ui), stylistic sets `ss01` and `cv11` on
**Label/Mono Font:** Geist Mono (with ui-monospace)

**Character:** A soft, slightly literary serif greets the user in one large line; everything after it is a precise, neutral grotesk. The pairing reads as a studio with good taste, not a tech dashboard.

### Hierarchy
- **Display Large** (400, 60px / 62px, -0.015em): the home question "What should we build?" from 640px up.
- **Display** (400, 44px / 48px, -0.01em): page headlines: home on phones, "Welcome" on login, "Projects", "Not found".
- **Headline** (Geist 600, 24px / 30px, -0.015em): rare in-app titles.
- **Title** (Geist 600, 20px / 28px, -0.01em): dialog titles and section heads.
- **Prompt** (400, 17px / 24px): the large home composer text.
- **Message** (400, 15px, line-height 1.6): agent message bodies, the user bubble, the workspace composer, project names. Cap running prose at 65ch.
- **Body** (400 or 500, 14px / 21px): the UI default: buttons, fields, menu items, labels in rows.
- **Label** (500, 13px / 18px): tabs, small buttons, prompt chips, field labels, secondary meta lines.
- **Caption** (500, 12px / 16px): status pills, tooltips, the "Show N earlier" chip.
- **Code** (Geist Mono 400, 12.5px / 20px): file paths in tool rows and the file list, the code viewer. Numbers that change (versions, times, line numbers) use tabular figures.

### Named Rules
**The Serif Is a Greeting Rule.** Instrument Serif is used only at 44px or larger, once per screen, for the page headline. It never appears in buttons, labels, messages, dialogs or empty states.

**The No Shouting Rule.** No uppercase labels, no letter-spaced small caps, no eyebrow text above headlines. Hierarchy comes from size and ink weight.

## Layout

The base unit is 4px. Common steps: 2px (tabs track inset), 8px (panel gaps, icon-button clusters), 12px (avatar-to-label gap, row gaps), 16px (row padding, chat padding), 24px (dialog padding), 28px between chat messages. Agent message bodies are indented 44px so they align under the name, past the 32px avatar.

**Workspace.** A 56px top bar (logo mark, project name menu, version pill, then Share and Publish at the right) sits on the ground. Below it, from 768px (md) up, a two-column grid with an 8px gap and 8px outer inset: chat on the left at 38% (never narrower than 360px), one raised white panel on the right taking the rest. The panel has a 48px toolbar (Preview / Code / Versions tabs, then device, refresh, open-in-new-tab and console icon buttons) over the live preview. The composer is pinned to the bottom of the chat column.

**Below md.** Chat and App become two tabs in the top bar; only one pane shows at a time. Below 640px (sm) the Share button, the version pill, the preview toolbar icons and the issue report's Console button are hidden. Publish stays.

**Other screens.** Home: centred column, headline at 18vh from the top, composer up to 720px wide, example prompt chips centred beneath. Login: centred 360px column at 12vh. Dashboard: 880px column, 64px site header, one panel of 64px project rows; the updated-time column hides below 640px. Dialogs are 440px wide (100vw minus 32px on phones).

## Elevation & Depth

Depth is mostly tonal: white panels on a near-white ground, separated by hairlines. Shadows are soft, two-layer and low-contrast, and they mark how far a surface sits above the ground, never ornament. In dark mode the same three steps use black at 30–50%.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px rgba(13,13,13,0.04), 0 2px 8px rgba(13,13,13,0.04)`): raised panels, the workspace composer, the active tab thumb, version cards, the projects list.
- **Float** (`box-shadow: 0 2px 4px rgba(13,13,13,0.04), 0 12px 32px rgba(13,13,13,0.08)`): the home composer, menus, toasts, the floating issue report over the preview.
- **Modal** (`box-shadow: 0 8px 16px rgba(13,13,13,0.06), 0 24px 64px rgba(13,13,13,0.14)`): dialogs only.
- **Focus halo** (`box-shadow: 0 0 0 3px var(--accent-soft)` on fields, `0 0 0 4px` on the composer): paired with an iris border on focus.

### Named Rules
**The Three Heights Rule.** Only Rest, Float and Modal exist. A surface placed on another surface is separated by a hairline, not by a fourth shadow.

## Shapes

Generously rounded, never sharp. Interactive controls are full pills (buttons, tabs, chips, status pills, icon buttons, avatars, toasts). Containers step up with size: 8px for small chips and menu items, 12px for fields, tool rows, menus and version cards, 16px for panels and the issue report, 24px for the composer, the user bubble and dialogs. Borders are always one hairline; there are no thick strokes, no dashed borders, and no offset shadows.

## Components

### Buttons
Calm, soft-edged pills that never shout.
- **Shape:** full pill (9999px). Heights 28px (sm), 32px (md, default), 40px (lg); 32px and 40px icon-only variants.
- **Primary:** ink fill with on-ink text, 14px medium. One per screen.
- **Secondary:** paper fill, strong hairline border, ink text; hover to Soft Grey.
- **Ghost:** no fill, Ink 2 text; hover to Soft Grey with Ink text. Used for Cancel, Log in, Restore, Console, row menus.
- **Danger:** danger fill with on-ink text; only inside a confirmation dialog.
- **Hover / Focus:** primary dims to 85% opacity; focus shows the global 2px iris outline at 2px offset.
- **Loading:** a spinning loader icon appears before the label, the button keeps full opacity and shows a progress cursor. **Disabled:** 40% opacity, no pointer events.

### Chips
- **Prompt chips** (home): 32px pills, paper fill, hairline border, Ink 2 label; hover strengthens the border and darkens the text. Clicking fills the composer.
- **Status pills:** 12px medium on a soft tint: Published (success), Failed (danger), Stopped (Soft Grey). Version pill in the top bar: Soft Grey, tabular "v2".

### Cards / Containers
- **Panel:** paper, 16px radius, hairline border, Rest shadow. Contents are divided by hairline rows (project list, version list, file list), never by nested cards.
- **Version card:** 12px radius, hairline, Rest shadow, a 32px Soft Grey "vN" tile, summary and meta, ghost Restore.
- **Empty state:** centred inside the panel: title, one line of Ink 2 body capped at 36ch, one primary action.

### Inputs / Fields
- **Style:** 40px tall, paper, strong hairline border, 12px radius, 14px text, Ink 3 placeholder, iris caret. Label above in 13px medium Ink.
- **Focus:** border turns iris with a 3px Iris Wash halo; no outline.
- **Error / Disabled:** border turns danger and a 13px danger hint appears below with the fix ("Use 6–30 lowercase letters, numbers or hyphens."); disabled is 50% opacity with a not-allowed cursor.

### Composer (signature)
The prompt box shared by home and workspace. Paper, strong hairline, 24px radius, Rest shadow (Float on home). Textarea with 16px top / 20px side padding (2 rows in the workspace at 15px, 3 rows on home at 17px), then a footer row with a 36px round action at the right: ink Send arrow; Soft Grey with Ink 3 arrow when empty; ink Stop square while a run is going. Enter sends, Shift+Enter adds a line. On focus the border turns iris with a 4px Iris Wash halo.

### Agent message (signature)
A 32px original matte avatar on a soft tint, with a letter fallback, then "Name | Role" (Ink name, Ink 2 role, a 12px hairline divider). While thinking or working, the current activity ("Writing app.js") sits at the right in a live sweep; stopped and failed runs show a status pill there instead. The body is 15px at 1.6 line height, indented 44px, with no bubble behind it. The user's own message is the only bubble: Soft Grey, 24px radius, right-aligned, at most 85% wide.

### Working process (signature)
A collapsible "Working process · N steps" trigger in 13px Ink 2 with a chevron that rotates over 200ms. Below it, a strong-hairline rail with 16px inset holds plain-text notes and hairline tool rows: 36px, paper, 12px radius, file icon, "Write file" / "Read file" in Ink 2, the path in mono Ink, and a status icon at the right (success check, iris spinner, danger cross). Only the last three tool rows show; earlier ones collapse into one "Show N earlier" caption chip in their own place in the timeline, with "Show less" at the end once expanded.

### Navigation
- **Tabs:** a Soft Grey pill track (2px inset) holding 28px pill triggers in 13px medium Ink 2; the active trigger becomes a paper thumb with Ink text and the Rest shadow. Used for Preview / Code / Versions, Chat / App on phones, Sign in / Create account.
- **Site header:** 64px, logo at left, ghost Log in and primary Sign up (or New project plus account monogram) at right.
- **Icon buttons:** 32px round, Ink 2, hover to Soft Grey; the pressed one (current device width) keeps Soft Grey. Each has a tooltip: ink, 8px radius, 12px medium on-ink text, 300ms delay.
- **Menus:** paper, 12px radius, hairline, Float shadow, 4px inset; 32px items with 16px Ink 2 icons, Soft Grey highlight; destructive items in danger.
- **Selected rows:** Iris Wash background with Iris Ink text (current file); version rows reveal Restore on hover only on hover-capable devices and always show it on touch.

### Feedback
- **Toast:** an ink pill at the bottom centre, on-ink 14px text, Float shadow. One short sentence ("Link copied", "Stopped. v2 is unchanged.").
- **Issue report:** floats 16px above the preview's bottom edge, max 520px: a danger-tinted alert icon, "1 runtime error" with the message in 12px mono, a ghost Console and a primary Resolve.
- **Dialog:** paper, 24px radius, 24px padding, Modal shadow over the scrim, a 32px round close at top right; actions right-aligned, ghost Cancel before the primary or danger action.

### Motion
One grammar for state changes: 180ms with the out curve `cubic-bezier(0.16, 1, 0.3, 1)` for colour, border, shadow and opacity. New chat messages and tool rows rise 4px while fading in over 220ms on the same curve. Menus and dialogs fade in with a 2% zoom. The only looping motion is the **live sweep**: a soft highlight moving right-to-left across in-progress text every 1.8s (an opacity mask, not a colour), plus a 1.4s breathing dot on the file being written and spinners inside tool rows and loading buttons. With reduced motion, all animation and transition time drops to effectively zero.

## Do's and Don'ts

### Do:
- **Do** set the chat directly on the #F7F7F8 ground and keep tools in one raised white panel.
- **Do** keep exactly one ink pill per screen; in the workspace it is Publish, visible at every width.
- **Do** reserve iris for focus, selection and in-progress state.
- **Do** use Instrument Serif only for the one display headline (44px, or 60px from 640px up).
- **Do** show agent progress as hairline tool rows and live-sweep activity text, never a generic spinner screen.
- **Do** switch the workspace to Chat / App tabs below 768px.
- **Do** write UI copy in English, short and direct: a label says what happens ("Publish", "Restore", "Try again"), an error says what to do next.
- **Do** keep transitions at 180ms on the out curve and honour reduced motion.

### Don't:
- **Don't** build metaphor themes (kitchens, call sheets, transit maps, tickets) or the dark-neon "AI builder" look.
- **Don't** fill text with colour gradients; the live sweep's opacity mask is the only gradient that touches text.
- **Don't** use the iris accent decoratively: no iris buttons, headings, icons at rest, borders at rest, or backgrounds that aren't a selected row.
- **Don't** put cards inside cards; inside a panel, divide with hairline rows.
- **Don't** add colour to the chrome; the generated app is the only colour on screen.
- **Don't** use Instrument Serif below 44px or more than once per screen.
- **Don't** add uppercase eyebrows, kickers or letter-spaced labels above headlines.
- **Don't** write filler copy: no slogans, no "AI-powered", no feature-explainer paragraphs, no invented testimonials or numbers.
- **Don't** add a fourth shadow height or hard offset shadows.

## Enhanced workspace and visual assets (2026-10-10)

Version comparison stays inside the existing Versions panel: complete summary, version selector, file counts and a collapsed per-file diff. Export names the snapshot version. Selection uses the Iris highlight only inside the sandbox; its injected helper cannot inherit parent CSS variables. Selected context is a removable chip with a clear dynamic-DOM limitation.

AgentAvatar consumes 96px transparent WebP at fixed 24/32px, empty alt beside real role labels, with the existing letter visible until load or after failure. Original artwork and prompts are separate from public derivatives. The five theme miniatures use the single THEMES palette/font/radius mapping and real DOM text inside keyboard-selectable menu items; they are style references, not promised pixel output. Empty preview artwork is decorative, 180px, absent for errors and existing apps. Discover uses a real screenshot only when project and published version match its manifest; screenshot failure leaves a text fallback.
