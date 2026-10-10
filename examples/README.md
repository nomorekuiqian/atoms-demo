# Curated starter examples

These are authored static starter templates, not recordings of model-generated runs. Each is published as a normal versioned project, supports the existing Remix flow, and is labeled in Discover. No AI usage entries are fabricated.

- `daily-habits`: add/remove habits, daily check-ins, seven-day history, local persistence.
- `recipe-collection`: six recipes, text/meal filters, favorites and a deduplicated shopping checklist.
- `studio-open-day`: fictional event agenda, expandable calendar details and local-only RSVP. No reservation, email or payment is sent.

Run `node --env-file=.env.local scripts/seed-starter-examples.mjs` to add missing slugs to the configured project's demo account. It never overwrites existing slugs. Source files remain here; published version IDs and screenshot provenance are in `lib/assets/examples.json`. Browser storage is per app and per device.

Verified in the platform sandbox: habit create/check/reload/remove, recipe search/favorite/reload/shopping checks/clear, event details/RSVP/reload/clear. Calendar details are displayed for manual use; downloads are not promised from the sandboxed template.
