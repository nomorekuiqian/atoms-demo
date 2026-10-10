import "server-only";
import { createAdminClient } from "@insforge/sdk";
import { serverEnv } from "@/lib/env";

/** Full-access client. For public snapshots and owner-checked atomic generation/publishing operations. Never bypass ownership with user-supplied filters. */
export function insforgeAdmin() {
  const env = serverEnv();
  return createAdminClient({ baseUrl: env.NEXT_PUBLIC_INSFORGE_URL, apiKey: env.INSFORGE_API_KEY });
}
