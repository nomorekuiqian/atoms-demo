import "./load-project-ts.cjs";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { tasks } from "../benchmarks/acceptance-tasks.mjs";
const require = createRequire(import.meta.url);
const { createOpenRouterLLM } = require("../lib/llm/openrouter.ts");
const { runPipeline } = require("../lib/agents/orchestrator.ts");
const { ALEX_SYSTEM, alexUser } = require("../lib/agents/prompts.ts");
const { FileStreamParser } = require("../lib/parser/fileStreamParser.ts");
const { mergeFiles } = require("../lib/agents/merge.ts");
if (!process.env.OPENROUTER_API_KEY)
  throw new Error("Gateway key is required; this benchmark never uses mock.");
const file = ".insforge/acceptance-benchmark.json";
const model = process.env.OPENROUTER_CHAT_MODEL || "anthropic/claude-haiku-5.5";
const limit = Number(process.env.BENCHMARK_TASK_LIMIT || 10);
const hash = createHash("sha256").update(JSON.stringify(tasks)).digest("hex");
let report = {
  schema: 1,
  createdAt: new Date().toISOString(),
  model,
  maxOutputTokens: 12000,
  temperature: 0.4,
  tasksHash: hash,
  mode: "real",
  results: [],
};
try {
  report = JSON.parse(await readFile(file, "utf8"));
  if (report.tasksHash !== hash || report.model !== model)
    throw new Error(
      "Benchmark configuration changed. Archive the previous report first.",
    );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
await mkdir(".insforge", { recursive: true });
for (const [i, task] of tasks.slice(0, limit).entries())
  for (const arm of i % 2 ? ["team", "direct"] : ["direct", "team"]) {
    if (report.results.some((r) => r.taskId === task.id && r.arm === arm))
      continue;
    const llm = createOpenRouterLLM({
      baseURL: process.env.OPENROUTER_BASE_URL,
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    const start = Date.now(),
      signal = AbortSignal.timeout(180000);
    let result,
      raw = "";
    const input = {
      prompt: task.prompt,
      files: task.files,
      history: [],
      mode: task.kind === "fix" ? "fix" : "build",
      errors: task.errors,
      acceptance: task.kind === "new" ? { items: [] } : { items: task.checks },
      requestId: randomUUID(),
    };
    try {
      if (arm === "team") {
        const stream = runPipeline(input, {
          llm,
          models: { main: model, fast: model },
          signal,
        });
        for (;;) {
          const step = await stream.next();
          if (step.done) {
            result = step.value;
            break;
          }
        }
      } else {
        for await (const delta of llm.stream({
          agent: "alex",
          model,
          maxTokens: 12000,
          signal,
          messages: [
            { role: "system", content: ALEX_SYSTEM },
            {
              role: "user",
              content: alexUser({
                ...input,
                brief: task.prompt,
                requirements: JSON.stringify({ items: task.checks }),
              }),
            },
          ],
        }))
          raw += delta;
        const parser = new FileStreamParser(),
          written = {},
          complete = [];
        let invalid = false;
        for (const e of [...parser.push(raw), ...parser.end()]) {
          if (e.type === "file_start") written[e.path] = "";
          if (e.type === "file_delta") written[e.path] += e.delta;
          if (e.type === "file_end") complete.push(e.path);
          if (e.type === "file_invalid") invalid = true;
        }
        const merged = mergeFiles(
          task.files,
          Object.fromEntries(complete.map((p) => [p, written[p]])),
        );
        result = {
          ok: !invalid && complete.length > 0 && !("error" in merged),
          written,
          route: "direct",
          acceptance: { items: task.checks },
        };
      }
    } catch (e) {
      result = { ok: false, error: e.message, written: {} };
    }
    const files = result.ok ? { ...task.files, ...result.written } : {};
    const digest = createHash("sha256")
      .update(
        JSON.stringify(
          Object.keys(files)
            .sort()
            .map((p) => [p, files[p]]),
        ),
      )
      .digest("hex");
    report.results.push({
      taskId: task.id,
      kind: task.kind,
      arm,
      model,
      elapsedMs: Date.now() - start,
      usage: llm.usage(),
      ok: result.ok,
      error: result.error ?? null,
      route: result.route ?? null,
      files,
      digest,
      versionId: randomUUID(),
      contract: { items: task.checks },
      generatedContract: result.acceptance ?? null,
      raw: arm === "direct" ? raw : null,
    });
    await writeFile(file, JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log(
      task.id,
      arm,
      result.ok ? "generated" : "FAILED",
      Date.now() - start,
      "ms",
      JSON.stringify(llm.usage()),
    );
    if (!result.ok)
      throw new Error(
        "Stopped on generation failure. Raw partial result preserved; investigate before continuing.",
      );
  }
