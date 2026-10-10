import { describe, expect, it } from "vitest";
import { createMockLLM, type Fixture } from "@/lib/llm/mock";
import { runPipeline } from "./orchestrator";
import type { AgentEvent, PipelineInput, PipelineResult } from "./types";

const fixture: Fixture = {
  name: "new-test",
  match: [],
  mike: "route: full\ntitle: Counter\n---\nBuild a counter.",
  emma: "- Increment and reset\n- Clean look",
  bob: '{"files":[{"path":"index.html","purpose":"markup"},{"path":"app.js","purpose":"logic"}],"notes":"Two files."}',
  alex: 'Building it.\n<file path="index.html">\n<button id="b">0</button><script src="app.js"></script>\n</file>\n<file path="app.js">\nlet n = 0;\n</file>\n<summary>Counter app</summary>',
};

const models = { main: "m", fast: "f" };

async function run(input: Partial<PipelineInput>, fx: Fixture = fixture, signal?: AbortSignal) {
  const gen = runPipeline(
    { prompt: "make a counter", history: [], files: {}, mode: "build", ...input },
    { llm: createMockLLM(fx, { chunkDelayMs: 0 }), models, signal },
  );
  const events: AgentEvent[] = [];
  let r = await gen.next();
  while (!r.done) {
    events.push(r.value);
    r = await gen.next();
  }
  return { events, result: r.value as PipelineResult };
}

const starts = (events: AgentEvent[]) => events.filter((e) => e.type === "agent_start").map((e) => (e as { agent: string }).agent);

describe("runPipeline", () => {
  it("runs the full team for a new app and returns the files", async () => {
    const { events, result } = await run({});
    expect(starts(events)).toEqual(["mike", "emma", "bob", "alex"]);
    expect(events.filter((e) => e.type === "agent_end").every((e) => (e as { status: string }).status === "done")).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.written).toEqual({
      "index.html": '<button id="b">0</button><script src="app.js"></script>',
      "app.js": "let n = 0;",
    });
    expect(result.summary).toBe("Counter app");
    expect(result.title).toBe("Counter");
    const mikeText = events.filter((e) => e.type === "text_delta" && e.agent === "mike").map((e) => (e as { delta: string }).delta).join("");
    expect(mikeText).toBe("Build a counter.\n\nEmma, Bob and Alex are on it.");
  });

  it("falls back to a full run when Mike ignores the format", async () => {
    const { events, result } = await run({ files: { "index.html": "<p></p>" } }, { ...fixture, mike: "Sure, building it now." });
    expect(starts(events)).toEqual(["mike", "emma", "bob", "alex"]);
    expect(result.agents[0].text).toContain("Sure, building it now.");
  });

  it("sends small changes straight to Alex", async () => {
    const fx = { ...fixture, mike: "route: alex_only\ntitle: Counter\n---\nMake it dark.", alex: '<file path="app.js">\nlet n = 1;\n</file><summary>Dark</summary>' };
    const { events, result } = await run({ files: { "index.html": "<p></p>", "app.js": "let n = 0;" } }, fx);
    expect(starts(events)).toEqual(["mike", "alex"]);
    expect(result.written).toEqual({ "app.js": "let n = 1;" });
  });

  it("always runs the full team when there is no app yet", async () => {
    const fx = { ...fixture, mike: "route: alex_only\n---\nx" };
    const { events } = await run({}, fx);
    expect(starts(events)).toEqual(["mike", "emma", "bob", "alex"]);
  });

  it("fix mode skips Emma and Bob and does not call Mike", async () => {
    const fx = { ...fixture, mike: "SHOULD NOT BE USED", alex: '<file path="app.js">\nfixed\n</file>' };
    const { events, result } = await run({ mode: "fix", errors: ["x is not defined"], files: { "index.html": "<p></p>" } }, fx);
    expect(starts(events)).toEqual(["mike", "alex"]);
    expect(events.find((e) => e.type === "text_delta" && e.agent === "mike")).toMatchObject({ delta: expect.stringContaining("Fix") });
    expect(result.ok).toBe(true);
  });

  it("fails without writing when Alex produces no complete file", async () => {
    const fx = { ...fixture, alex: 'Oops <file path="app.js">let n' };
    const { events, result } = await run({}, fx);
    expect(result.ok).toBe(false);
    expect(result.written).toEqual({});
    expect(events.at(-1)).toMatchObject({ type: "error", retryable: true });
  });

  it("stops cleanly on abort and produces no version", async () => {
    const controller = new AbortController();
    const gen = runPipeline(
      { prompt: "x", history: [], files: {}, mode: "build" },
      { llm: createMockLLM(fixture, { chunkDelayMs: 5 }), models, signal: controller.signal },
    );
    const events: AgentEvent[] = [];
    let r = await gen.next();
    while (!r.done) {
      events.push(r.value);
      if (r.value.type === "agent_start" && r.value.agent === "emma") controller.abort();
      r = await gen.next();
    }
    expect(r.value.ok).toBe(false);
    expect(events.at(-1)).toEqual({ type: "agent_end", agent: "emma", status: "stopped" });
    expect(events.some((e) => e.type === "error")).toBe(false);
  });
});
