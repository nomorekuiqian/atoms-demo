"use server";

import { redirect } from "next/navigation";
import { insforgeAdmin } from "@/lib/insforge/admin";
import { insforgeServer } from "@/lib/insforge/server";
import { getPublished } from "./load";

/** Copy a published app (code only, not its chat) into the signed-in user's projects. */
export async function remix(slug: string): Promise<{ error: string } | undefined> {
  const client = await insforgeServer();
  const { data: auth } = await client.auth.getCurrentUser();
  if (!auth?.user) redirect(`/login?next=${encodeURIComponent(`/remix/${slug}`)}`);
  const source = await getPublished(slug);
  if (!source) return { error: "This app is no longer published." };

  const db = client.database;
  const title = `${source.title} remix`.slice(0, 120);
  const { data: project, error } = await db.from("projects").insert([{ title }]).select("id").single();
  if (error || !project) return { error: "Couldn't create your copy. Try again." };
  const { data: version, error: vErr } = await db
    .from("versions")
    .insert([{ project_id: project.id, number: 1, files: source.files, summary: `Remixed from ${source.title}` }])
    .select("id")
    .single();
  if (vErr || !version) return { error: "Couldn't copy the app. Try again." };

  await Promise.all([
    db.from("projects").update({ current_version_id: version.id }).eq("id", project.id),
    db.from("messages").insert([
      { project_id: project.id, role: "system", content: `Remixed from ${source.title}`, meta: { kind: "remix", slug }, version_id: version.id },
    ]),
    // remixed_from is server-maintained (not writable by users).
    insforgeAdmin().database.from("projects").update({ remixed_from: source.projectId }).eq("id", project.id),
  ]);
  redirect(`/project/${project.id}`);
}
