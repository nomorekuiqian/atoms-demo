import {toUIMessage, type MessageRow, MESSAGE_COLUMNS, HISTORY_PAGE_SIZE} from "@/lib/projects/history";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace/workspace";
import type { Files } from "@/lib/agents/types";
import { getCurrentUser, insforgeServer } from "@/lib/insforge/server";
import type { VersionRow } from "@/lib/store/workspace";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autostart?: string }>;
}) {
  const { id } = await params;
  const { autostart } = await searchParams;
  if (!UUID.test(id)) notFound();
  const user = await getCurrentUser();
  const db = (await insforgeServer()).database;

  const { data: project, error: projectError } = await db
    .from("projects")
    .select("id, title, current_version_id, published_version_id, published_slug")
    .eq("id", id)
    .maybeSingle();
  if (projectError) throw new Error("Could not load project. Please retry.");
  if (!project || !user) notFound();

  const [messages, versions, current] = await Promise.all([
    db
      .from("messages")
      .select(MESSAGE_COLUMNS)
      .eq("project_id", id)
      .order("sequence", { ascending: false })
      .limit(HISTORY_PAGE_SIZE + 1),
    db.from("versions").select("id, number, summary, created_at").eq("project_id", id).order("number", { ascending: false }).limit(HISTORY_PAGE_SIZE + 1),
    project.current_version_id
      ? db.from("versions").select("files").eq("id", project.current_version_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (messages.error || versions.error || current.error || (project.current_version_id && !current.data)) throw new Error("Could not load project history. Please retry.");

  const messagePage = (messages.data ?? []) as unknown as MessageRow[];
  const versionPage = (versions.data ?? []) as VersionRow[];
  const visibleMessages = messagePage.slice(0,HISTORY_PAGE_SIZE);
  const visibleVersions = versionPage.slice(0,HISTORY_PAGE_SIZE);
  const pinnedIds = [project.current_version_id,project.published_version_id].filter((v):v is string=>Boolean(v) && !visibleVersions.some(row=>row.id===v));
  if(pinnedIds.length){
    const pinned=await db.from("versions").select("id, number, summary, created_at").eq("project_id",id).in("id",pinnedIds);
    if(pinned.error)throw new Error("Could not read pinned versions.");
    visibleVersions.push(...(pinned.data??[]) as VersionRow[]);
  }
  return (
    <Suspense>
      <Workspace
        key={project.id}
        email={user.email}
        autostart={autostart === "1"}
        initial={{
          projectId: project.id,
          title: project.title,
          messages: visibleMessages.toReversed().map(toUIMessage),
          messagesBefore: messagePage.length > HISTORY_PAGE_SIZE ? visibleMessages.at(-1)!.sequence : null,
          versionsBefore: versionPage.length > HISTORY_PAGE_SIZE ? versionPage[HISTORY_PAGE_SIZE - 1].number : null,
          files: ((current.data as { files?: Files } | null)?.files ?? {}) as Files,
          versions: visibleVersions.map((v) => ({ ...v, summary: v.summary ?? `Version ${v.number}` })),
          currentVersionId: project.current_version_id,
          publishedVersionId: project.published_version_id,
          publishedSlug: project.published_slug,
        }}
      />
    </Suspense>
  );
}
