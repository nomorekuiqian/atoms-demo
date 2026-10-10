import type { AgentId } from "./meta";
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
  if (error || !project) return null;
  let files: Files = {};
  let currentNumber = 0;
  if (project.current_version_id) {
    const { data: v } = await db.from("versions").select("files, number").eq("id", project.current_version_id).maybeSingle();
    files = (v?.files as Files) ?? {};
    currentNumber = v?.number ?? 0;
  }
  return { id: project.id, title: project.title, files, currentVersionId: project.current_version_id, currentNumber };
}

/** Latest messages for context, oldest first. */
export async function loadHistory(db: Db, projectId: string, limit = 6) {
  const { data } = await db
    .from("messages")
    .select("role, content, version_id, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as { role: string; content: string }[]).reverse();
}

async function nextVersionNumber(db: Db, projectId: string): Promise<number> {
  const { data } = await db.from("versions").select("number").eq("project_id", projectId).order("number", { ascending: false }).limit(1);
  return (data?.[0]?.number ?? 0) + 1;
}

/**
 * Write the run's outcome. Agent messages are always saved; a version only when the run produced a
 * valid project. Returns the new version, if any.
 */
export async function persistRun(
  db: Db,
  opts: {
    projectId: string;
    previous: Files;
    previousNumber: number;
    merged: Files | null;
    result: PipelineResult;
    userId: string;
    mock: boolean;
  },
): Promise<{ id: string; number: number } | null> {
  const { projectId, merged, result } = opts;
  let version: { id: string; number: number } | null = null;

  if (merged && result.ok) {
    for (let attempt = 0; attempt < 2 && !version; attempt++) {
      // Fast path: the number we loaded; on a unique-violation race, re-read it.
      const number = attempt === 0 ? opts.previousNumber + 1 : await nextVersionNumber(db, projectId);
      const { data, error } = await db
        .from("versions")
        .insert([{ project_id: projectId, number, files: merged, summary: result.summary }])
        .select("id, number")
        .single();
      if (!error && data) version = data;
      else if (error?.code !== "23505") throw new Error(`version insert failed: ${error?.message}`);
    }
    if (!version) throw new Error("version insert failed after retry");
  }

  const rows = result.agents.map((a) => ({
    project_id: projectId,
    role: a.agent as AgentId,
    content: a.text,
    meta: { status: a.status, files: a.files, route: result.route, ...(a.agent === "alex" && result.summary ? { summary: result.summary } : {}) },
    version_id: a.agent === "alex" && version ? version.id : null,
  }));
  const writes: PromiseLike<{ error: { message: string } | null }>[] = [];
  if (version) {
    const patch: Record<string, unknown> = { current_version_id: version.id };
    if (result.title && Object.keys(opts.previous).length === 0) patch.title = result.title;
    writes.push(db.from("projects").update(patch).eq("id", projectId));
  }
  if (rows.length) writes.push(db.from("messages").insert(rows));
  if (!opts.mock && result.usage.length) {
    const input = result.usage.reduce((n, u) => n + u.input, 0);
    const output = result.usage.reduce((n, u) => n + u.output, 0);
    writes.push(
      db.from("usage_logs").insert([{ project_id: projectId, model: [...new Set(result.usage.map((u) => u.model))].join(","), input_tokens: input, output_tokens: output }]),
    );
  }
  const failed = (await Promise.all(writes)).find((r) => r.error);
  if (failed?.error) throw new Error(`persist failed: ${failed.error.message}`);
  return version;
}

/** Generations started today (UTC) by the current user. Counts real runs only. */
export async function generationsToday(db: Db): Promise<number> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { data } = await db.from("usage_logs").select("id").gte("created_at", since.toISOString()).limit(1000);
  return data?.length ?? 0;
}
