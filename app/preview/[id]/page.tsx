import Link from "next/link";
import { z } from "zod";
import { notFound } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import type { Files } from "@/lib/agents/types";
import { insforgeServer } from "@/lib/insforge/server";

export const dynamic = "force-dynamic";

/** Current version of the signed-in user's project, full screen (the workspace's "Open in new tab"). */
export default async function PreviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams:Promise<{versionId?:string}> }) {
  const { id } = await params;
  const {versionId}=await searchParams;
  if(!z.string().uuid().safeParse(id).success || (versionId && !z.string().uuid().safeParse(versionId).success))notFound();
  const db = (await insforgeServer()).database;
  const { data: project, error: projectError } = await db.from("projects").select("title, current_version_id").eq("id", id).maybeSingle();
  if (projectError) throw new Error("Could not load preview. Please retry.");
  if (!project?.current_version_id) notFound();
  const { data: version, error: versionError } = await db.from("versions").select("files, number").eq("id", versionId ?? project.current_version_id).eq("project_id",id).maybeSingle();
  if (versionError) throw new Error("Could not load version. Please retry.");
  if (!version) notFound();
  return <><AppFrame files={version.files as Files} storageKey={`atoms-lite:app-storage:${id}`} title={`${project.title} · v${version.number}`} topInset={40} /><div className="fixed inset-x-0 top-0 flex h-10 items-center justify-between border-b bg-surface px-4 text-sm text-ink"><span>{project.title} · Viewing v{version.number}</span><Link className="underline" href={`/project/${id}`}>Back to project</Link></div></>;
}
