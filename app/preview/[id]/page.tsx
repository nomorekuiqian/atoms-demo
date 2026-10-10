import { notFound } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import type { Files } from "@/lib/agents/types";
import { insforgeServer } from "@/lib/insforge/server";

export const dynamic = "force-dynamic";

/** Current version of the signed-in user's project, full screen (the workspace's "Open in new tab"). */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = (await insforgeServer()).database;
  const { data: project, error: projectError } = await db.from("projects").select("title, current_version_id").eq("id", id).maybeSingle();
  if (projectError) throw new Error("Could not load preview. Please retry.");
  if (!project?.current_version_id) notFound();
  const { data: version, error: versionError } = await db.from("versions").select("files").eq("id", project.current_version_id).maybeSingle();
  if (versionError) throw new Error("Could not load version. Please retry.");
  if (!version) notFound();
  return <AppFrame files={version.files as Files} storageKey={`atoms-lite:app-storage:${id}`} title={project.title} />;
}
