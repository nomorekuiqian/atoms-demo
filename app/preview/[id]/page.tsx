import { notFound } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import type { Files } from "@/lib/agents/types";
import { insforgeServer } from "@/lib/insforge/server";

export const dynamic = "force-dynamic";

/** Current version of the signed-in user's project, full screen (the workspace's "Open in new tab"). */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = (await insforgeServer()).database;
  const { data: project } = await db.from("projects").select("title, current_version_id").eq("id", id).maybeSingle();
  if (!project?.current_version_id) notFound();
  const { data: version } = await db.from("versions").select("files").eq("id", project.current_version_id).maybeSingle();
  if (!version) notFound();
  return <AppFrame files={version.files as Files} storageKey={`atoms-lite:app-storage:${id}`} title={project.title} />;
}
