"use client";
import { useState } from "react";
import type { z } from "zod";
import type { benchmarkResult } from "@/lib/acceptance/benchmark";
import { AcceptanceRunner } from "@/components/workspace/acceptance-runner";
import { Button } from "@/components/ui/button";
export function BenchmarkPanel({
  results,
}: {
  results: z.infer<typeof benchmarkResult>[];
}) {
  const [index, setIndex] = useState(-1),
    [error, setError] = useState(""),
    [round, setRound] = useState(0);
  const item = results[index];
  return (
    <>
      <Button
        disabled={index >= 0 && index < results.length}
        onClick={() => {
          setRound((n) => n + 1);
          setError("");
          setIndex(0);
        }}
      >
        Run {results.length} generated candidates
      </Button>
      <p role="status" className="mt-4">
        {index === results.length
          ? "Browser benchmark completed."
          : index >= 0
            ? `Candidate ${index + 1}/${results.length}: ${item.taskId} · ${item.arm}`
            : "Not run in this session."}
      </p>
      {error && <p role="alert">{error}</p>}
      {item && (
        <AcceptanceRunner
          key={`${round}:${item.versionId}`}
          data={{ ...item, number: index + 1, observations: [], baseline: [] }}
          endpoint="/api/dev/acceptance-benchmark"
          disabled={false}
          autoStart
          onSaved={() => {}}
          onFinished={(failure) => {
            if (failure) {
              setError(failure);
              setIndex(-1);
            } else setIndex((n) => n + 1);
          }}
        />
      )}
    </>
  );
}
