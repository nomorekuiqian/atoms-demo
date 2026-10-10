import { checkVersion } from "@/lib/checks/server";
import type { Files } from "@/lib/agents/types";
import { z } from "zod";
import { insforgeAdmin } from "@/lib/insforge/admin";
import { insforgeServer } from "@/lib/insforge/server";
import { slugProblem } from "@/lib/publish/slug";

export const dynamic = "force-dynamic";

const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status });

/** The caller's own project (RLS-checked) or null. */
async function ownProject(id: string) {
  const client = await insforgeServer();
  const { data: auth } = await client.auth.getCurrentUser();
  if (!auth?.user) return { error: json(401, { error: "Sign in first." }) };
  const { data, error } = await client.database
    .from("projects")
    .select("id, current_version_id, published_slug, published_version_id")
    .eq("id", id)
    .maybeSingle();
  if (error) return { error: json(503, { error: "Could not read the project. Please retry." }) };
  if (!data) return { error: json(404, { error: "Project not found." }) };
  return { project: data as { id: string; current_version_id: string | null; published_slug: string | null; published_version_id: string | null } };
}

const bodySchema = z.object({ slug: z.string().trim().toLowerCase().optional(), versionId: z.string().uuid() });

/** Publish the current version (or update an existing link to it). Publishing fields are written with the admin key. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await ownProject(id);
  if ("error" in owned) return owned.error;
  const { project } = owned;
  if (!project.current_version_id) return json(409, { error: "Build the app before publishing." });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return json(400, {error:"Select a saved version before publishing."});
  if (parsed.data.versionId !== project.current_version_id) return json(409,{error:"The current version changed. Reload and preview it before publishing."});
  const db = insforgeAdmin().database;
  const snapshot = await db.from("versions").select("files").eq("id",parsed.data.versionId).eq("project_id",project.id).maybeSingle();
  if (snapshot.error) return json(503,{error:"Could not read this version. Please retry."});
  if (!snapshot.data) return json(404,{error:"Version not found."});
  const checks = checkVersion(parsed.data.versionId,snapshot.data.files as Files);
  if (checks.errors.length) return json(422,{error:"Fix static issues before publishing: " + checks.errors.map(e => e.message).join("; "),checks});
  const slug = parsed.success ? (parsed.data.slug ?? project.published_slug ?? "") : "";
  const problem = slugProblem(slug);
  if (problem) return json(400, { error: problem, field: "slug" });

  const { data, error } = await insforgeAdmin()
    .database.from("projects")
    .update({ published_slug: slug, published_version_id: project.current_version_id })
    .eq("id", project.id)
    .eq("current_version_id", parsed.data.versionId)
    .select("published_slug, published_version_id")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return json(409, { error: "That link is taken. Try another.", field: "slug" });
    console.error("[publish]", error);
    return json(500, { error: "Couldn't publish. Try again." });
  }
  if (!data) return json(409,{error:"The current version changed during publishing. Preview the new version and retry."});
  return json(200, { slug: data.published_slug, versionId: data.published_version_id });
}

/** Unpublish: the link stops working immediately. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await ownProject(id);
  if ("error" in owned) return owned.error;
  const { error } = await insforgeAdmin()
    .database.from("projects")
    .update({ published_slug: null, published_version_id: null })
    .eq("id", owned.project.id);
  if (error) return json(500, { error: "Couldn't unpublish. Try again." });
  return json(200, { ok: true });
}
