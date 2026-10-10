import { notFound } from "next/navigation";
import { readBenchmark } from "@/lib/acceptance/benchmark";
import { BenchmarkPanel } from "./panel";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.ENABLE_ACCEPTANCE_BENCHMARK !== "1"
  )
    notFound();
  const report = await readBenchmark();
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">
        Independent acceptance benchmark
      </h1>
      <p className="my-4">
        Real model outputs, fixed assertions, isolated browser sessions.
        Generated criteria do not determine the score. Development-only.
      </p>
      <BenchmarkPanel results={report.results} />
    </main>
  );
}
