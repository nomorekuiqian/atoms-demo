import {parseRequirements,readContract,extendContract,changeCriterion} from "@/lib/acceptance/contract";
/**
 * Mike → Emma → Bob → Alex pipeline. Framework-free: depends only on the LLM interface,
 * so it can move to an InsForge Edge Function unchanged.
 */
import { z } from "zod";
import { FileStreamParser } from "@/lib/parser/fileStreamParser";
import { LLMError, type LLM } from "@/lib/llm/types";
import { mergeFiles } from "./merge";
import {
  ALEX_SYSTEM,
  BOB_SYSTEM,
  EMMA_SYSTEM,
  MIKE_SYSTEM,
  alexUser,
  bobUser,
  emmaUser,
  extractJson,
  mikeUser,
  parseMikeHeader,
} from "./prompts";
import type { AgentId } from "./meta";
import type { AgentEvent, AgentOutput, Files, PipelineInput, PipelineResult, Route } from "./types";

export type PipelineDeps = {
  llm: LLM;
  models: { main: string; fast: string };
  signal?: AbortSignal;
};

const bobSchema = z.object({
  files: z.array(z.object({ path: z.string(), purpose: z.string().optional() })).catch([]),
  notes: z.string().optional(),
});

function isAbort(err: unknown) {
  return err instanceof Error && err.name === "AbortError";
}

export async function* runPipeline(
  input: PipelineInput,
  deps: PipelineDeps,
): AsyncGenerator<AgentEvent, PipelineResult> {
  const { llm, models, signal } = deps;
  const hasApp = Object.keys(input.files).length > 0;
  const agents: AgentOutput[] = [];
  let acceptance=readContract(input.acceptance);
  const result = (partial: Partial<PipelineResult> & Pick<PipelineResult, "route">): PipelineResult => ({
    agents, acceptance,
    written: {},
    summary: "",
    ok: false,
    usage: llm.usage(),
    ...partial,
  });

  let current: AgentId = "mike";
  let route: Route = hasApp ? "alex_only" : "full";

  try {
    // Mike: route + brief.
    yield { type: "agent_start", agent: "mike", activity: "Reading your request" };
    let brief: string;
    let title: string | undefined;
    if (input.mode === "fix") {
      route = "alex_only";
      brief = `Fix the runtime ${input.errors?.length === 1 ? "error" : "errors"} in the preview. Alex is on it.`;
    } else {
      // Stream Mike: header (route/title) first, then the brief as it is written.
      let raw = "";
      let header: ReturnType<typeof parseMikeHeader> = null;
      let shown = 0;
      for await (const delta of llm.stream({
        agent: "mike",
        model: models.fast,
        signal,
        maxTokens: 300,
        messages: [
          { role: "system", content: MIKE_SYSTEM },
          { role: "user", content: mikeUser(input.prompt, input.history, input.files) },
        ],
      })) {
        raw += delta;
        header ??= parseMikeHeader(raw);
        if (header) {
          const rest = parseMikeHeader(raw)!.rest;
          const lead = rest.trimStart();
          const fresh = lead.slice(shown);
          if (fresh) {
            shown = lead.length;
            yield { type: "text_delta", agent: "mike", delta: fresh };
          }
        }
      }
      const parsed = header ? parseMikeHeader(raw)! : null;
      route = hasApp && parsed ? parsed.route : "full";
      brief = (parsed?.rest ?? raw).trim() || input.prompt;
      title = parsed?.title;
      if (!parsed) yield { type: "text_delta", agent: "mike", delta: brief };
    }
    const assignment = route === "full" ? "Emma, Bob and Alex are on it." : "Small change, so this goes straight to Alex.";
    const mikeText = input.mode === "fix" ? brief : `${brief}\n\n${assignment}`;
    yield { type: "text_delta", agent: "mike", delta: input.mode === "fix" ? brief : `\n\n${assignment}` };
    yield { type: "agent_end", agent: "mike", status: "done" };
    agents.push({ agent: "mike", text: mikeText, status: "done", files: [] });

    // Emma: requirements.
    let requirements: string | undefined;
    let plan: string | undefined;
    if (route === "alex_only" && input.mode !== "fix") acceptance=extendContract(acceptance,{items:[changeCriterion(input.prompt,input.requestId ?? "request")]});
    if (route === "full") {
      current = "emma";
      yield { type: "agent_start", agent: "emma", activity: "Writing requirements" };
      requirements = "";
      for await (const delta of llm.stream({
        agent: "emma",
        model: models.fast,
        signal,
        maxTokens: 2500,
        messages: [
          { role: "system", content: EMMA_SYSTEM },
          { role: "user", content: emmaUser(input.prompt, brief) },
        ],
      })) {
        requirements += delta;
        // Structured model output is rendered only after validation.
      }
      acceptance=extendContract(acceptance,parseRequirements(requirements));
      const requirementsText=acceptance.items.length ? acceptance.items.map(i=>`- ${i.requirement} — ${i.expected} (${i.mode === "automatic" ? "ready for browser checks" : "manual check"})`).join("\n") : acceptance.notice!;
      yield {type:"text_delta",agent:"emma",delta:requirementsText};
      yield { type: "agent_end", agent: "emma", status: "done" };
      agents.push({ agent: "emma", text: requirementsText, status: "done", files: [] });

      // Bob: file plan.
      current = "bob";
      yield { type: "agent_start", agent: "bob", activity: "Planning the files" };
      const raw = await llm.complete({
        agent: "bob",
        model: models.fast,
        signal,
        maxTokens: 500,
        messages: [
          { role: "system", content: BOB_SYSTEM },
          { role: "user", content: bobUser(input.prompt, brief, requirements, input.files) },
        ],
      });
      const bob = bobSchema.parse(extractJson(raw) ?? {});
      const planLines = bob.files.map((f) => `- \`${f.path}\`${f.purpose ? ` — ${f.purpose}` : ""}`);
      const bobText = [bob.notes, planLines.join("\n")].filter(Boolean).join("\n\n") || "Plan: index.html, style.css, app.js.";
      yield { type: "text_delta", agent: "bob", delta: bobText };
      yield { type: "agent_end", agent: "bob", status: "done" };
      agents.push({ agent: "bob", text: bobText, status: "done", files: [] });
      plan = bobText;
    }

    // Alex: code.
    current = "alex";
    yield { type: "agent_start", agent: "alex", activity: input.mode === "fix" ? "Fixing the error" : "Writing code" };
    const parser = new FileStreamParser();
    const written: Files = {};
    const done: string[] = [];
    let narration = "";
    let summary = "";
    const invalid: string[] = [];
    const handle = function* (events: ReturnType<FileStreamParser["push"]>): Generator<AgentEvent> {
      for (const e of events) {
        if (e.type === "text") {
          narration += e.delta;
          yield { type: "text_delta", agent: "alex", delta: e.delta };
        } else if (e.type === "file_start") {
          written[e.path] = "";
          yield e;
        } else if (e.type === "file_delta") {
          written[e.path] += e.delta;
          yield e;
        } else if (e.type === "file_end") {
          written[e.path] = written[e.path].replace(/^\n/, "").replace(/\n$/, "");
          done.push(e.path);
          yield e;
        } else if (e.type === "file_invalid") {
          delete written[e.path];
          invalid.push(`${e.path}: ${e.reason}`);
        } else if (e.type === "summary") {
          summary = e.text;
        }
      }
    };
    for await (const chunk of llm.stream({
      agent: "alex",
      model: models.main,
      signal,
      maxTokens: 12000,
      messages: [
        { role: "system", content: ALEX_SYSTEM },
        {
          role: "user",
          content: alexUser({
            prompt: input.prompt,
            brief,
            requirements: `${requirements ?? ""}\nAcceptance contract (implement exact selectors; these checks have NOT run):\n${JSON.stringify(acceptance)}`,
            plan,
            files: input.files,
            history: input.history,
            mode: input.mode,
            errors: input.errors,
            references: input.references, element:input.element,
          }),
        },
      ],
    })) {
      yield* handle(parser.push(chunk));
    }
    yield* handle(parser.end());

    // Only fully closed files count.
    const complete: Files = Object.fromEntries(done.map((p) => [p, written[p]]));
    const merged = mergeFiles(input.files, complete);
    if (invalid.length > 0 || done.length === 0 || "error" in merged) {
      const error = invalid.length > 0 ? "Alex returned an incomplete or invalid file. Try a smaller change." : done.length === 0 ? "Alex didn't produce any files." : (merged as { error: string }).error;
      yield { type: "agent_end", agent: "alex", status: "failed" };
      agents.push({ agent: "alex", text: narration.trim(), status: "failed", files: done });
      yield { type: "error", message: `${error} Your last version is unchanged.`, retryable: true };
      return result({ route, title, error });
    }
    yield { type: "agent_end", agent: "alex", status: "done" };
    agents.push({ agent: "alex", text: narration.trim(), status: "done", files: done });
    if (invalid.length) console.warn("[pipeline] skipped files", invalid);
    return result({ route, title, written: complete, summary: summary || "Updated the app", ok: true });
  } catch (err) {
    const stopped = isAbort(err) || signal?.aborted;
    agents.push({ agent: current, text: "", status: stopped ? "stopped" : "failed", files: [] });
    yield { type: "agent_end", agent: current, status: stopped ? "stopped" : "failed" };
    if (!stopped) {
      const message = err instanceof LLMError ? err.message : "Something went wrong while building.";
      yield { type: "error", message: `${message} Your last version is unchanged.`, retryable: err instanceof LLMError ? err.retryable : true };
      if (!(err instanceof LLMError)) console.error("[pipeline]", err);
    }
    return result({ route, error: stopped ? "stopped" : String(err) });
  }
}
