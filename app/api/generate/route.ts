import {elementContextSchema,elementProblem} from "@/lib/context/element";
import { fileReferenceSchema, referenceProblem } from "@/lib/context/references";
import { createHash, randomUUID } from "node:crypto";
import { insforgeAdmin } from "@/lib/insforge/admin";
import type { RunReceipt } from "@/lib/agents/persist";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { FIXTURES } from "@/fixtures";
import { isRunConflict } from "@/lib/agents/conflict";
import { mergeFiles } from "@/lib/agents/merge";
import { runPipeline } from "@/lib/agents/orchestrator";
import { loadHistory, loadProjectState, persistRun } from "@/lib/agents/persist";
import type { AgentEvent, ChatTurn, PipelineResult } from "@/lib/agents/types";
import { serverEnv } from "@/lib/env";
import { createMockLLM, pickFixture } from "@/lib/llm/mock";
import { createOpenRouterLLM } from "@/lib/llm/openrouter";
import { createRecordingLLM, toFixture } from "@/lib/llm/recording";
import type { LLM } from "@/lib/llm/types";
import { insforgeServer } from "@/lib/insforge/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  projectId: z.string().uuid(),
  requestId: z.string().uuid(),
  expectedVersionId: z.string().uuid().nullable(),
  /** Omit to (re)answer the project's most recent user message: first run after creation, or retry. */
  prompt: z.string().trim().min(1).max(4000).optional(),
  retry: z.boolean().default(false),
  mode: z.enum(["build", "fix"]).default("build"),
  errors: z.array(z.string().max(2000)).max(5).optional(),
  element:elementContextSchema.optional(),
  references: z.array(fileReferenceSchema).max(6).default([]),
  /** Dev only: save this run as fixtures/<record>.json (requires RECORD_FIXTURES=1). */
  record: z.string().regex(/^(new|edit)-[a-z0-9-]+$/).optional(),
  match: z.array(z.string()).optional(),
});

const json = (status: number, message: string) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  try { return await generate(request); } catch (error) {
    console.error("[generate preflight]", error);
    return json(503, "Could not read your project. Nothing was generated. Please retry.");
  }
}

async function generate(request: Request) {
  const env = serverEnv();
  const client = await insforgeServer();
  const { data: auth } = await client.auth.getCurrentUser();
  const user = auth?.user;
  if (!user) return json(401, "Sign in to build apps.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, "Invalid request.");
  const body = parsed.data;
  const db = client.database;

  const state = await loadProjectState(db, body.projectId);
  if (!state) return json(404, "Project not found.");

  const mock = env.LLM_MOCK === "1";
  const admin = insforgeAdmin().database;
  const fingerprint = createHash("sha256").update(JSON.stringify({ projectId: body.projectId, expectedVersionId: body.expectedVersionId, prompt: body.prompt ?? null, mode: body.mode, errors: body.errors ?? [], ...(body.references.length ? {references:body.references} : {}), ...(body.element?{element:body.element}:{}) })).digest("hex");
  // Replays bypass quota and history reads, but never ownership or payload identity.
  const { data: prior, error: priorError } = await admin.from("generation_requests").select("fingerprint, result, status").eq("id",body.requestId).eq("user_id",user.id).maybeSingle();
  if (priorError) throw new Error(priorError.message);
  if (prior && prior.fingerprint !== fingerprint) return json(409,"This request identifier belongs to different input.");
  const replay = (receipt: RunReceipt) => {
    const events: AgentEvent[] = [];
    if (receipt.version && receipt.files) events.push({ type: "version_created", versionId: receipt.version.id, number: receipt.version.number, summary: receipt.version.summary, files: receipt.files });
    events.push({type:"done"});
    return new Response(events.map(e => `data: ${JSON.stringify(e)}\n\n`).join(""), {headers:{"Content-Type":"text/event-stream", "Cache-Control":"no-store"}});
  };
  if (prior?.status === "complete") {
    const receipt = prior.result as RunReceipt;
    if (receipt.version?.id !== state.currentVersionId) return json(409,"This request was saved, but a newer version exists. Reload the project.");
    return replay(receipt);
  }
  if (state.currentVersionId !== body.expectedVersionId) return json(409,"The project changed. Reload before building.");
  const invalidReference=referenceProblem(body.references,state.currentVersionId,state.files);
  if(invalidReference)return json(invalidReference.status,invalidReference.message);
  const invalidElement=elementProblem(body.element,state.currentVersionId);
  if(invalidElement)return json(409,invalidElement);
  const history = await loadHistory(db, body.projectId, 12);
  let prompt = body.prompt;
  if (!prompt && body.mode === "fix") prompt = "Fix the runtime errors in the preview.";
  if (!prompt) {
    const idx = history.findLastIndex(m => m.role === "user");
    if (idx === -1) return json(409, "Nothing to build.");
    prompt = history[idx].content;
    history.splice(idx);
  }
  const turns: ChatTurn[] = history
    .filter((m) => ["user", "mike", "emma", "bob", "alex"].includes(m.role))
    .slice(-6)
    .map((m) => ({ role: m.role as ChatTurn["role"], content: m.content }));

  let llm: LLM;
  let recorder: ReturnType<typeof createRecordingLLM> | undefined;
  if (mock) {
    if (FIXTURES.length === 0) return json(503, "No mock fixtures recorded yet.");
    llm = createMockLLM(pickFixture(FIXTURES, body.mode === "fix" ? "fix-runtime-error" : prompt, Object.keys(state.files).length > 0));
  } else {
    if (!env.OPENROUTER_API_KEY) return json(503, "The AI service isn't configured.");
    llm = createOpenRouterLLM({ baseURL: env.OPENROUTER_BASE_URL, apiKey: env.OPENROUTER_API_KEY });
    if (body.record && process.env.NODE_ENV !== "production" && process.env.RECORD_FIXTURES === "1") {
      recorder = createRecordingLLM(llm);
      llm = recorder;
    }
  }

  const lease = randomUUID();
  const { data: claim, error: claimError } = await admin.rpc("claim_generation_v2", {
    p_id:body.requestId,p_project:body.projectId,p_user:user.id,p_expected:body.expectedVersionId,p_fingerprint:fingerprint,p_lease:lease,
    p_limit: user.email === env.DEMO_EMAIL ? env.DAILY_LIMIT_DEMO : env.DAILY_LIMIT, p_mock:mock, p_concurrency:2,
  });
  if (claimError) return json(isRunConflict(claimError) ? 409 : 503, isRunConflict(claimError) ? "This request is running or the project changed. Retry shortly, or reload the project." : "Could not start this request. Please retry.");
  if ((claim as {quota?:boolean;busy?:boolean})?.quota || (claim as {busy?:boolean})?.busy) return json(429,(claim as {message:string}).message);
  if ((claim as {conflict?:string})?.conflict) return json(409, (claim as {conflict:string}).conflict);
  if ((claim as {cached?:RunReceipt})?.cached) return replay((claim as {cached:RunReceipt}).cached);

  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener("abort", abort);
  if (request.signal.aborted) controller.abort();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      let closed = false;
      const send = (e: AgentEvent) => {
        if (closed) return;
        try {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
        } catch {
          closed = true;
        }
      };
      const ping = setInterval(() => {
        if (!closed) {
          try {
            ctrl.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            closed = true;
          }
        }
      }, 15_000);

      let result: PipelineResult | undefined;
      try {
        const gen = runPipeline(
          { prompt: prompt!, acceptance:state.acceptance,requestId:body.requestId, history: turns, files: state.files, mode: body.mode, errors: body.errors, references: body.references, element:body.element },
          { llm, models: { main: env.OPENROUTER_CHAT_MODEL, fast: env.OPENROUTER_FAST_MODEL }, signal: controller.signal },
        );
        for (let r = await gen.next(); ; r = await gen.next()) {
          if (r.done) {
            result = r.value;
            break;
          }
          send(r.value);
        }

        if (controller.signal.aborted) result.ok = false;
        const merged = result.ok ? mergeFiles(state.files, result.written) : null;
        const files = merged && "files" in merged ? merged.files : null;
        const receipt = await persistRun(admin, {
          requestId: body.requestId, lease, prompt: body.prompt, references: body.references, element:body.element,
          title: Object.keys(state.files).length === 0 ? result.title : undefined,
          merged: files,
          result,
          userId: user.id,
          mock, separateUsage:true,
        });
        const version = receipt.version;
        if (version && receipt.files) {
          const renamed = result.title && Object.keys(state.files).length === 0 ? result.title : undefined;
          send({ type: "version_created", versionId: version.id, number: version.number, summary: result.summary, title: renamed, files: receipt.files });
        }

        if (recorder && result.ok && body.record) {
          const fixture = toFixture(body.record, body.match ?? [], recorder.recorded);
          await writeFile(path.join(process.cwd(), "fixtures", `${body.record}.json`), JSON.stringify(fixture, null, 2));
        }
      } catch (err) {
        console.error("[generate]", err);
        const { error: releaseError } = await admin.from("generation_requests").update({status:"failed"}).eq("id",body.requestId).eq("lease",lease).eq("status","running");
        if (releaseError) console.error("[generate release]", releaseError.message);
        const conflict = err instanceof Error && isRunConflict(err);
        send({ type: "error", message: conflict ? "The project changed while building. Reload before making another change." : "Couldn't confirm this run. Retry to recover its saved result.", retryable: !conflict });
      } finally {
        request.signal.removeEventListener("abort", abort);
        const usage = llm.usage();
        const { error: usageError } = await admin.rpc("settle_generation_attempt", {
          p_lease:lease, p_user:user.id,
          p_usage: mock || !usage.length ? null : {model:[...new Set(usage.map(u=>u.model))].join(","),input:usage.reduce((n,u)=>n+u.input,0),output:usage.reduce((n,u)=>n+u.output,0)},
        });
        if (usageError) console.error("[generation usage]",usageError.message);
        send({ type: "done" });
        clearInterval(ping);
        if (!closed) ctrl.close();
      }
    },
    cancel() {
      controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
