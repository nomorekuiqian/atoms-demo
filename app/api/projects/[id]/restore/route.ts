import { z } from "zod";
import { insforgeServer } from "@/lib/insforge/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ versionId: z.string().uuid() });
const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status });

/** Restore = copy an old snapshot into a new version. History is never rewritten. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await insforgeServer();
  const { data: auth } = await client.auth.getCurrentUser();
  if (!auth?.user) return json(401, { error: "Sign in first." });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "Invalid request." });
  const db = client.database;

  const { data: source } = await db
    .from("versions")
    .select("id, number, files")
    .eq("id", parsed.data.versionId)
    .eq("project_id", id)
    .maybeSingle();
  if (!source) return json(404, { error: "Version not found." });

  const { data: latest } = await db.from("versions").select("number").eq("project_id", id).order("number", { ascending: false }).limit(1);
  const number = (latest?.[0]?.number ?? 0) + 1;
  const summary = `Restored from v${source.number}`;
  const { data: version, error } = await db
    .from("versions")
    .insert([{ project_id: id, number, files: source.files, summary }])
    .select("id, number, summary, created_at")
    .single();
  if (error || !version) return json(error?.code === "23505" ? 409 : 500, { error: "Couldn't restore. Try again." });

  const [upd, msg] = await Promise.all([
    db.from("projects").update({ current_version_id: version.id }).eq("id", id),
    db
      .from("messages")
      .insert([{ project_id: id, role: "system", content: summary, meta: { kind: "restore", from: source.number }, version_id: version.id }])
      .select("id")
      .single(),
  ]);
  if (upd.error) return json(500, { error: "Couldn't restore. Try again." });
  return json(200, { version, files: source.files, messageId: msg.data?.id ?? null });
}
