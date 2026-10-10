import { writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { FIXTURES } from "@/fixtures";
import { mergeFiles } from "@/lib/agents/merge";
import { runPipeline } from "@/lib/agents/orchestrator";
import { generationsToday, loadHistory, loadProjectState, persistRun } from "@/lib/agents/persist";
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
  /** Omit to answer the project's last unanswered user message (first run after creation). */
  prompt: z.string().trim().min(1).max(4000).optional(),
  mode: z.enum(["build", "fix"]).default("build"),
  errors: z.array(z.string().max(2000)).max(5).optional(),
  /** Dev only: save this run as fixtures/<record>.json (requires RECORD_FIXTURES=1). */
  record: z.string().regex(/^(new|edit)-[a-z0-9-]+$/).optional(),
  match: z.array(z.string()).optional(),
});

const json = (status: number, message: string) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
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
  if (!mock) {
    const limit = user.email === env.DEMO_EMAIL ? env.DAILY_LIMIT_DEMO : env.DAILY_LIMIT;
    if ((await generationsToday(db)) >= limit) {
      return json(429, `You've used today's ${limit} builds. Come back tomorrow${user.email === env.DEMO_EMAIL ? " or create your own account" : ""}.`);
    }
  }

  // The prompt: either new (saved now) or the last unanswered user message.
  const history = await loadHistory(db, body.projectId, 7);
  let prompt = body.prompt;
  if (prompt) {
    const { error } = await db.from("messages").insert([{ project_id: body.projectId, role: "user", content: prompt }]);
    if (error) return json(500, "Couldn't save your message.");
  } else if (body.mode === "fix") {
    prompt = "Fix the runtime errors in the preview.";
  } else {
    const last = history.at(-1);
    if (!last || last.role !== "user") return json(409, "Nothing to build.");
    prompt = last.content;
    history.pop();
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

  const controller = new AbortController();
  request.signal.addEventListener("abort", () => controller.abort());
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
          { prompt: prompt!, history: turns, files: state.files, mode: body.mode, errors: body.errors },
          { llm, models: { main: env.OPENROUTER_CHAT_MODEL, fast: env.OPENROUTER_FAST_MODEL }, signal: controller.signal },
        );
        for (let r = await gen.next(); ; r = await gen.next()) {
          if (r.done) {
            result = r.value;
            break;
          }
          send(r.value);
        }

        const merged = result.ok ? mergeFiles(state.files, result.written) : null;
        const files = merged && "files" in merged ? merged.files : null;
        const version = await persistRun(db, {
          projectId: body.projectId,
          previous: state.files,
          previousNumber: state.currentNumber,
          merged: files,
          result,
          userId: user.id,
          mock,
        });
        if (version) send({ type: "version_created", versionId: version.id, number: version.number, summary: result.summary });

        if (recorder && result.ok && body.record) {
          const fixture = toFixture(body.record, body.match ?? [], recorder.recorded);
          await writeFile(path.join(process.cwd(), "fixtures", `${body.record}.json`), JSON.stringify(fixture, null, 2));
        }
      } catch (err) {
        console.error("[generate]", err);
        send({ type: "error", message: "Couldn't save this run. Your last version is unchanged.", retryable: true });
      } finally {
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
