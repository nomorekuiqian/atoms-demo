import {elementContextSchema} from "@/lib/context/element";
import { fileReferenceSchema, type FileReference } from "@/lib/context/references";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace/workspace";
import type { AgentId } from "@/lib/agents/meta";
import type { Files } from "@/lib/agents/types";
import { getCurrentUser, insforgeServer } from "@/lib/insforge/server";
import type { UIMessage, VersionRow } from "@/lib/store/workspace";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MessageRow = {
  id: string;
  role: "user" | AgentId | "system";
  content: string;
  meta: { status?: string; files?: string[]; references?:FileReference[]; element?:unknown } | null;
  version: { number: number; summary: string | null } | null;
};

function toUIMessage(m: MessageRow): UIMessage {
  const status = (m.meta?.status ?? "done") as UIMessage["status"];
  return {
    id: m.id,
    role: m.role as UIMessage["role"],
    content: m.content,
    element:elementContextSchema.safeParse(m.meta?.element).success ? elementContextSchema.parse(m.meta?.element):undefined,
    references: Array.isArray(m.meta?.references) ? m.meta.references.slice(0,6).filter(ref=>fileReferenceSchema.safeParse(ref).success) : undefined,
    status: status === "thinking" || status === "working" ? "stopped" : status,
    steps: (m.meta?.files ?? []).map((path) => ({ kind: "tool" as const, action: "Write" as const, path, status: status === "failed" ? "failed" : "done" })),
    version: m.version ? { number: m.version.number, summary: m.version.summary ?? `Version ${m.version.number}` } : undefined,
  };
}

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
      .select("id, role, content, meta, version:versions(number, summary)")
      .eq("project_id", id)
      .order("created_at", { ascending: true })
      .limit(300),
    db.from("versions").select("id, number, summary, created_at").eq("project_id", id).order("number", { ascending: false }).limit(100),
    project.current_version_id
      ? db.from("versions").select("files").eq("id", project.current_version_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (messages.error || versions.error || current.error || (project.current_version_id && !current.data)) throw new Error("Could not load project history. Please retry.");

  return (
    <Suspense>
      <Workspace
        email={user.email}
        autostart={autostart === "1"}
        initial={{
          projectId: project.id,
          title: project.title,
          messages: ((messages.data ?? []) as unknown as MessageRow[]).map(toUIMessage),
          files: ((current.data as { files?: Files } | null)?.files ?? {}) as Files,
          versions: ((versions.data ?? []) as VersionRow[]).map((v) => ({ ...v, summary: v.summary ?? `Version ${v.number}` })),
          currentVersionId: project.current_version_id,
          publishedVersionId: project.published_version_id,
          publishedSlug: project.published_slug,
        }}
      />
    </Suspense>
  );
}
