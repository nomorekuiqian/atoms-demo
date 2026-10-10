import "./load-project-ts.cjs";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { tasks } from "../benchmarks/acceptance-tasks.mjs";
const require = createRequire(import.meta.url),
  { checkFiles } = require("../lib/checks/static.ts");
const report = JSON.parse(
  await readFile(".insforge/acceptance-benchmark.json", "utf8"),
);
const raw = await readFile(
  ".insforge/acceptance-benchmark-observations.jsonl",
  "utf8",
);
const observations = raw.trim().split("\n").map(JSON.parse);
for (const result of report.results) {
  result.observations = result.contract.items.map((item) =>
    observations.findLast(
      (o) => o.versionId === result.versionId && o.criterionId === item.id,
    ),
  );
  if (result.observations.some((o) => !o))
    throw new Error(`Missing browser evidence: ${result.taskId} ${result.arm}`);
  result.static = checkFiles(result.files);
  result.behaviorPassed =
    result.ok && result.observations.every((o) => o.status === "passed");
}
if (report.results.length !== 20)
  throw new Error("Expected both arms for all 10 tasks");
const summary = ["direct", "team"].map((arm) => {
  const rows = report.results.filter((r) => r.arm === arm),
    usage = rows.flatMap((r) => r.usage);
  return {
    arm,
    candidates: rows.length,
    behaviorPassed: rows.filter((r) => r.behaviorPassed).length,
    checksPassed: rows
      .flatMap((r) => r.observations)
      .filter((o) => o.status === "passed").length,
    checks: rows.flatMap((r) => r.observations).length,
    editPreserved: rows.filter((r) => r.kind === "edit" && r.behaviorPassed)
      .length,
    fixPassed: rows.filter((r) => r.kind === "fix" && r.behaviorPassed).length,
    inputTokens: usage.reduce((n, u) => n + u.input, 0),
    outputTokens: usage.reduce((n, u) => n + u.output, 0),
    elapsedMs: rows.reduce((n, r) => n + r.elapsedMs, 0),
    generationFailures: rows.filter((r) => !r.ok).length,
  };
});
const destination = "benchmarks/results/2026-10-10";
await mkdir(destination, { recursive: true });
await writeFile(
  `${destination}/results.json`,
  JSON.stringify(
    {
      ...report,
      summary,
      tasks,
      verification: {
        kind: "real-browser",
        scope:
          "fixed behavioral assertions only; not visual or complete business acceptance",
        runnerCorrection:
          "Actionability wait added after initial hidden-iframe race. All unchanged outputs rerun. Earlier observations retained in observations.jsonl.",
      },
    },
    null,
    2,
  ),
);
await writeFile(`${destination}/observations.jsonl`, raw);
console.log(JSON.stringify(summary, null, 2));
