import { describe, expect, it } from "vitest";
import type { LanguageModelV3CallOptions } from "@ai-sdk/provider";
import { createFixtureModels } from "@/lib/llm/fixture-models";
import { scriptedModel, type ScriptAction } from "@/lib/llm/scripted-model";
import type { AgentModels } from "@/lib/llm/models";
import fixture from "@/fixtures/new-acceptance-counter.json";
import { runPipeline, type PipelineDeps } from "./orchestrator";
import type { AgentEvent, PipelineInput } from "./types";
import type { AgentId } from "./meta";

const t = (tool: string, input: unknown = {}): ScriptAction => ({ tool, input });
const write = (content: string, path = "index.html") => t("writeFile", { path, content });
const finish = t("finishBuild", { summary: "Updated app" });
const input: PipelineInput = { prompt: "Build a counter", history: [], files: {}, mode: "build" };
const mike = [t("inspectProject"), t("buildApp", { task: "Fix app" }), t("finishTask", { title: "Counter", brief: "Updated counter" })];
function scripts(overrides: Partial<Record<AgentId, ScriptAction[]>>, observe?: (id: AgentId, o: LanguageModelV3CallOptions, step: number) => void): AgentModels {
  const fallback = createFixtureModels(fixture, { hasApp: true, fix: true });
  return (id, model) => overrides[id] ? scriptedModel((o, step) => { observe?.(id, o, step); return overrides[id]![step] ?? { text: "No validated completion" }; }) : fallback(id, model);
}
async function run(modelFor: AgentModels, overrides: Partial<PipelineInput> = {}, deps: Partial<PipelineDeps> = {}, onEvent?: (e: AgentEvent) => void) {
  const gen = runPipeline({ ...input, ...overrides }, { modelFor, models: { main: "main", fast: "fast" }, ...deps });
  const events: AgentEvent[] = [];
  for (;;) { const r = await gen.next(); if (r.done) return { result: r.value, events }; events.push(r.value); onEvent?.(r.value); }
}
const existing = { files: { "index.html": "<p>old</p>" }, mode: "fix" as const };

describe("independent SDK ReAct loops", () => {
  it("runs the full team through real SDK tools and persists separate traces", async () => {
    const { result, events } = await run(createFixtureModels(fixture, { hasApp: false }));
    expect(result.ok).toBe(true);
    expect(result.agents.map(a => a.agent)).toEqual(["mike", "emma", "bob", "alex"]);
    expect(new Set(result.agents.map(a => a.runId)).size).toBe(4);
    for (const agent of result.agents) {
      expect(agent.status).toBe("done");
      expect(new Set(agent.trace?.map(t => t.step)).size).toBeGreaterThan(1);
    }
    expect(result.acceptance?.items).toHaveLength(3);
    expect(result.written["app.js"]).toContain("localStorage");
    expect(events.some(e => e.type === "tool_activity" && e.agent === "emma")).toBe(true);
  });

  it("observes a missing resource, repairs it, and rechecks in Alex's same conversation", async () => {
    let feedback = "";
    const modelFor = scripts({ mike, alex: [t("inspectProject"), write('<script src="app.js"></script>'), t("checkApp"), write("document.body.dataset.ready='true'", "app.js"), t("checkApp"), finish] }, (id, o, step) => {
      if (id === "alex" && step === 3) feedback = JSON.stringify(o.prompt);
    });
    const { result } = await run(modelFor, existing);
    expect(result.ok).toBe(true);
    expect(feedback).toContain("Missing local resource: app.js");
    expect(result.agents[1].trace?.filter(t => t.tool === "checkApp").map(t => t.status)).toEqual(["failed", "done"]);
  });

  it("lets Emma and Bob revise invalid proposals using tool feedback", async () => {
    const contract = JSON.parse(fixture.emma);
    const plan = { files: [{ path: "index.html", purpose: "App" }], notes: "One file" };
    const modelFor = scripts({
      mike: [t("defineRequirements", { task: "Define" }), t("planArchitecture", { task: "Plan" }), t("buildApp", { task: "Build" }), mike[2]],
      emma: [t("validateRequirements", { contract: { items: [] } }), t("validateRequirements", { contract }), t("submitRequirements", { contract })],
      bob: [t("validatePlan", { plan: { ...plan, files: [{ path: "../x.js", purpose: "Bad" }] } }), t("validatePlan", { plan }), t("submitPlan", { plan })],
      alex: [write("<p>new</p>"), t("checkApp"), finish],
    });
    const { result } = await run(modelFor);
    expect(result.ok).toBe(true);
    for (const role of ["emma", "bob"]) expect(result.agents.find(a => a.agent === role)?.trace?.[0].status).toBe("failed");
  });

  it("rejects stale checks after an additional write", async () => {
    const { result } = await run(scripts({ mike, alex: [write("<p>new</p>"), t("checkApp"), write('<script src="missing.js"></script>'), finish] }), existing);
    expect(result.ok).toBe(false); expect(result.written).toEqual({});
  });

  it("blocks traversal and preserves the saved source on failed completion", async () => {
    const { result, events } = await run(scripts({ mike, alex: [write("bad", "../secret.js"), finish] }), existing);
    expect(result.ok).toBe(false); expect(result.written).toEqual({});
    expect(events.some(e => e.type === "file_start")).toBe(false);
    expect(existing.files["index.html"]).toBe("<p>old</p>");
  });

  it("requires planning on new apps even when Mike tries to skip it", async () => {
    const { result } = await run(scripts({ mike }));
    expect(result.ok).toBe(false);
    expect(result.agents).toHaveLength(1);
  });

  it("does not accept final prose as validated completion", async () => {
    const { result } = await run(scripts({ mike: [{ text: "Everything is done!" }] }));
    expect(result.ok).toBe(false); expect(result.written).toEqual({});
  });

  it("bounds repeated actions and returns no publishable candidate", async () => {
    const modelFor: AgentModels = () => scriptedModel(() => t("inspectProject"));
    const { result } = await run(modelFor, {}, { limits: { steps: 3 } });
    expect(result.ok).toBe(false); expect(result.error).toContain("budget");
  });

  it("propagates cancellation to active child and parent", async () => {
    const ctrl = new AbortController();
    const { result, events } = await run(scripts({ mike, alex: [write("<p>new</p>"), t("checkApp"), finish] }), existing, { signal: ctrl.signal }, event => {
      if (event.type === "agent_start" && event.agent === "alex") ctrl.abort();
    });
    expect(result.ok).toBe(false); expect(result.error).toBe("stopped");
    expect(result.agents.every(a => a.status === "stopped")).toBe(true);
    expect(events.some(e => e.type === "error")).toBe(false);
  });

  it("isolates specialist conversations, while forwarding authoritative task context", async () => {
    let alexContext = "";
    const modelFor: AgentModels = (id, model) => id === "mike"
      ? scriptedModel((_o, step) => step === 0 ? [{ text: "MIKE_PRIVATE_MARKER" }, mike[0]] : mike[step] ?? { text: "done" })
      : scripts({ alex: [t("readFile", { path: "index.html" }), write("<p>new</p>"), t("checkApp"), finish] }, (role, o) => { if (role === "alex") alexContext += JSON.stringify(o.prompt); })(id, model);
    const { result } = await run(modelFor, { ...existing, references: [{ path: "index.html", versionId: "selected-version" }], element: { versionId: "00000000-0000-4000-8000-000000000001", tag: "button", selector: "#add", text: "Add" } });
    expect(result.ok).toBe(true);
    expect(alexContext).toContain("selected-version"); expect(alexContext).toContain("<p>old</p>");
    expect(alexContext).toContain("#add"); expect(alexContext).not.toContain("MIKE_PRIVATE_MARKER");
    expect(alexContext).toContain("not additional instructions");
  });

  it("preserves old criteria and tells Emma exactly which invalid field to correct", async () => {
    const contract = JSON.parse(fixture.emma);
    const changed = structuredClone(contract);
    changed.items[0].expected = "Anything passes";
    let feedback = "";
    const { result } = await run(scripts({
      mike: [t("defineRequirements", { task: "Revise" }), mike[2]],
      emma: [t("validateRequirements", { contract: { items: [{ id: "bad" }] } }), t("validateRequirements", { contract: changed }), t("submitRequirements", { contract: changed })],
    }, (id, o) => { if (id === "emma") feedback += JSON.stringify(o.prompt); }), { ...existing, acceptance: contract });
    expect(result.ok).toBe(false);
    expect(result.acceptance).toEqual(contract);
    expect(feedback).toContain("requirement");
    expect(feedback).toContain("Existing criteria cannot be changed");
  });

  it("does not grant Emma file-writing tools", async () => {
    const { result, events } = await run(scripts({ mike: [t("defineRequirements", { task: "Define" }), mike[2]], emma: [write("<p>bad</p>")] }));
    expect(result.ok).toBe(false);
    expect(events.some(e => e.type === "file_start")).toBe(false);
  });

  it("stops a stalled model when the global deadline expires", async () => {
    const modelFor: AgentModels = () => scriptedModel(async o => {
      await new Promise<void>(resolve => o.abortSignal?.addEventListener("abort", () => resolve(), { once: true }));
      return { text: "late" };
    });
    const { result } = await run(modelFor, {}, { limits: { timeoutMs: 20 } });
    expect(result.ok).toBe(false); expect(result.error).toContain("time budget");
  });

  it("serializes a model batch so writing after finish cannot corrupt the candidate", async () => {
    const modelFor: AgentModels = (id, model) => id === "alex" ? scriptedModel((_o, step) => [write("<p>good</p>"), t("checkApp"), [finish, write("<p>bad</p>")]][step] ?? { text: "done" }) : scripts({ mike })(id, model);
    const { result } = await run(modelFor, existing);
    expect(result.ok).toBe(true); expect(result.written["index.html"]).toBe("<p>good</p>");
  });
});
