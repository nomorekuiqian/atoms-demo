"use client";

import { createBrowserClient } from "@insforge/sdk/ssr";

let client: ReturnType<typeof createBrowserClient> | undefined;

/** User-scoped browser client (RLS applies). Auth mutations go through server actions. */
export function insforgeBrowser() {
  client ??= createBrowserClient();
  return client;
}
