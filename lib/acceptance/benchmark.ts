import "server-only";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { contractSchema } from "./contract";
export const benchmarkResult = z.object({
  taskId: z.string(),
  kind: z.string(),
  arm: z.enum(["direct", "team"]),
  ok: z.boolean(),
  versionId: z.string().uuid(),
  digest: z.string(),
  files: z.record(z.string(), z.string()),
  contract: contractSchema,
});
export async function readBenchmark() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.ENABLE_ACCEPTANCE_BENCHMARK !== "1"
  )
    throw new Error("Benchmark disabled");
  return z
    .object({ results: z.array(benchmarkResult) })
    .parse(
      JSON.parse(await readFile(".insforge/acceptance-benchmark.json", "utf8")),
    );
}
