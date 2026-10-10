"use server";

import { redirect } from "next/navigation";
import { insforgeAdmin } from "@/lib/insforge/admin";
import { insforgeServer } from "@/lib/insforge/server";
import { SLUG_PATTERN } from "@/lib/publish/slug";

/** Copy a published app (code only, not its chat) into the signed-in user's projects. */
export async function remix(slug: string): Promise<{ error: string } | undefined> {
  if (!SLUG_PATTERN.test(slug)) return { error: "This app is no longer published." };
  const client = await insforgeServer();
  const { data: auth } = await client.auth.getCurrentUser();
  if (!auth?.user) redirect(`/login?next=${encodeURIComponent(`/remix/${slug}`)}`);
  // One transaction copies the published snapshot; a partial failure leaves no project.
  const { data: projectId, error } = await insforgeAdmin().database.rpc("remix_published", { p_user: auth.user.id, p_slug: slug });
  if (error) return { error: "Couldn't create your copy. Try again." };
  if (typeof projectId !== "string") return { error: "This app is no longer published." };
  redirect(`/project/${projectId}`);
}
