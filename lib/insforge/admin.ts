import "server-only";
import { createAdminClient } from "@insforge/sdk";
import { serverEnv } from "@/lib/env";

/** Full-access client. Only for published pages, Discover and Remix — never with user input as a filter bypass. */
export function insforgeAdmin() {
  const env = serverEnv();
  return createAdminClient({ baseUrl: env.NEXT_PUBLIC_INSFORGE_URL, apiKey: env.INSFORGE_API_KEY });
}
