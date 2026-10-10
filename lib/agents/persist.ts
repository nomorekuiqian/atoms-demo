import type { Files, PipelineResult } from "./types";

// Structural type for the user-scoped InsForge database client (RLS applies).
type Db = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type ProjectState = {
  id: string;
  title: string;
  files: Files;
  currentVersionId: string | null;
  currentNumber: number;
};

export async function loadProjectState(db: Db, projectId: string): Promise<ProjectState | null> {
  const { data: project, error } = await db
    .from("projects")
    .select("id, title, current_version_id")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(`Project read failed: ${error.message}`);
  if (!project) return null;
  let files: Files = {};
  let currentNumber = 0;
  if (project.current_version_id) {
    const { data: v, error: versionError } = await db.from("versions").select("files, number").eq("id", project.current_version_id).maybeSingle();
    if (versionError || !v) throw new Error("Current version could not be read.");
    files = v.files as Files;
    currentNumber = v?.number ?? 0;
  }
  return { id: project.id, title: project.title, files, currentVersionId: project.current_version_id, currentNumber };
}

/** Latest messages for context, oldest first. */
export async function loadHistory(db: Db, projectId: string, limit = 6) {
  const { data, error } = await db
    .from("messages")
    .select("role, content, version_id, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`History read failed: ${error.message}`);
  return ((data ?? []) as { role: string; content: string }[]).reverse();
}

export type RunReceipt = { version: { id: string; number: number; summary: string; created_at: string } | null; files: Files | null };
type RpcDb = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }> };

/** One database transaction owns the snapshot, pointer, messages and usage. */
export async function persistRun(db: RpcDb, opts: {
  requestId: string; lease: string; userId: string; merged: Files | null;
  result: PipelineResult; mock: boolean; prompt?: string; title?: string;
}): Promise<RunReceipt> {
  const { result } = opts;
  const messages = [
    ...(opts.prompt ? [{ role: "user", content: opts.prompt, meta: {} }] : []),
    ...result.agents.map(a => ({ role: a.agent, content: a.text, meta: { status: a.status, files: a.files, route: result.route, summary: result.summary } })),
  ];
  const { data, error } = await db.rpc("finish_generation", {
    p_id: opts.requestId, p_user: opts.userId, p_lease: opts.lease,
    p_files: result.ok ? opts.merged : null, p_summary: result.summary,
    p_title: opts.title ?? null, p_messages: messages,
    p_usage: opts.mock || !result.usage.length ? null : {
      model: [...new Set(result.usage.map(u => u.model))].join(","),
      input: result.usage.reduce((n,u) => n+u.input,0), output: result.usage.reduce((n,u) => n+u.output,0),
    },
  });
  if (error || !data) throw new Error(error?.message ?? "Run could not be saved.");
  if ((data as {conflict?:string}).conflict) throw new Error((data as {conflict:string}).conflict);
  return data as RunReceipt;
}

/** Generations started today (UTC) by the current user. Counts real runs only. */
export async function generationsToday(db: Db): Promise<number> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { data, error } = await db.from("usage_logs").select("id").gte("created_at", since.toISOString()).limit(1000);
  if (error) throw new Error(`Usage read failed: ${error.message}`);
  return data?.length ?? 0;
}
