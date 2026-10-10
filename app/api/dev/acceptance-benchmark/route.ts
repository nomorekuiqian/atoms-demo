import { appendFile } from "node:fs/promises";
import { readBenchmark } from "@/lib/acceptance/benchmark";
import {
  observationInput,
  observationProblem,
} from "@/lib/acceptance/evidence";
export async function POST(request: Request) {
  const url = new URL(request.url);
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.ENABLE_ACCEPTANCE_BENCHMARK !== "1" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    return new Response(null, { status: 404 });
  if (
    !request.headers.get("origin") ||
    ![
      "http://" + request.headers.get("host"),
      "https://" + request.headers.get("host"),
    ].includes(request.headers.get("origin")!) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(request.headers.get("origin")!).hostname,
    )
  )
    return Response.json(
      { error: "Same-origin request required" },
      { status: 403 },
    );
  const input = observationInput.safeParse(
    await request.json().catch(() => null),
  );
  if (!input.success)
    return Response.json({ error: "Invalid evidence" }, { status: 400 });
  const report = await readBenchmark();
  // Two arms may produce identical files. Match the run using a dedicated header.
  const run = report.results.find(
    (r) => r.versionId === request.headers.get("x-benchmark-version"),
  );
  if (!run)
    return Response.json(
      { error: "Unknown benchmark candidate" },
      { status: 400 },
    );
  const problem = observationProblem(input.data, run.contract, run.digest);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  await appendFile(
    ".insforge/acceptance-benchmark-observations.jsonl",
    JSON.stringify({
      taskId: run.taskId,
      arm: run.arm,
      versionId: run.versionId,
      createdAt: new Date().toISOString(),
      ...input.data,
    }) + "\n",
    { mode: 0o600 },
  );
  return Response.json({ ok: true });
}
