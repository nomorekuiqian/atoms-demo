import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

/** User-scoped server client for Server Components, Route Handlers, and Server Actions. */
export async function insforgeServer() {
  return createServerClient({ cookies: await cookies() });
}

export async function getCurrentUser() {
  const client = await insforgeServer();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) return null;
  return data.user;
}
