"use client";
import * as React from "react";
import { AcceptanceRunner } from "./acceptance-runner";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/store/workspace";
import type { AcceptanceContract, Criterion } from "@/lib/acceptance/contract";
import {
  isRegression,
  type SavedObservation,
  type ObservationInput,
} from "@/lib/acceptance/evidence";
import type { Files } from "@/lib/agents/types";

export type AcceptanceData = {
  versionId: string;
  number: number;
  digest: string;
  contract: AcceptanceContract;
  files: Files;
  observations: SavedObservation[];
  baseline: SavedObservation[];
};
function ManualCheck({
  item,
  onSave,
  observation,
}: {
  item: Criterion;
  onSave: (
    id: string,
    status: "passed" | "failed",
    note: string,
  ) => Promise<void>;
  observation?: SavedObservation;
}) {
  const [note, setNote] = React.useState(""),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState("");
  const save = async (status: "passed" | "failed") => {
    setBusy(true);
    setError("");
    try {
      await onSave(item.id, status, note);
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm">
        Record a manual check{observation ? ` · ${observation.status}` : ""}
      </summary>
      <p className="mt-2 text-xs text-ink-2">
        Confirm only after you have performed the steps. This is your
        observation, separate from automated results.
      </p>
      <textarea
        aria-label={`Observation for ${item.requirement}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        placeholder="What did you observe?"
        className="mt-2 min-h-16 w-full rounded-md border bg-surface p-2 text-sm"
      />
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || !note.trim()}
          onClick={() => void save("passed")}
        >
          Confirm passed
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy || !note.trim()}
          onClick={() => void save("failed")}
        >
          Report failed
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {observation && (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-2">
          Your last observation: {observation.evidence.note} ·{" "}
          {new Date(observation.created_at).toLocaleString()}
        </p>
      )}
    </details>
  );
}
export function AcceptancePanel({
  onResolve,
}: {
  onResolve: (errors: string[]) => void;
}) {
  const projectId = useWorkspace((s) => s.projectId),
    versionId = useWorkspace((s) => s.viewing?.id ?? s.currentVersionId);
  if (!versionId)
    return (
      <p className="p-5 text-sm text-ink-2">
        Build an app to see its acceptance checklist.
      </p>
    );
  return (
    <AcceptanceVersion
      key={`${projectId}:${versionId}`}
      projectId={projectId}
      versionId={versionId}
      onResolve={onResolve}
    />
  );
}
function AcceptanceVersion({
  projectId,
  versionId,
  onResolve,
}: {
  projectId: string;
  versionId: string;
  onResolve: (errors: string[]) => void;
}) {
  const current = useWorkspace((s) => s.currentVersionId),
    status = useWorkspace((s) => s.status);
  const [data, setData] = React.useState<AcceptanceData | null>(null),
    [error, setError] = React.useState(""),
    [refresh, setRefresh] = React.useState(0);
  const endpoint = `/api/projects/${projectId}/versions/${versionId}/acceptance`;
  React.useEffect(() => {
    const controller = new AbortController();
    setError("");
    void fetch(endpoint, { signal: controller.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        return body;
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [endpoint, refresh]);
  const save = async (
    criterionId: string,
    checkStatus: "passed" | "failed",
    note: string,
  ) => {
    if (!data) throw new Error("Load the checklist first.");
    const body: ObservationInput = {
      id: crypto.randomUUID(),
      digest: data.digest,
      criterionId,
      kind: "manual",
      status: checkStatus,
      evidence: { note },
    };
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await r.json();
    if (!r.ok) throw new Error(result.error);
    setRefresh((n) => n + 1);
  };
  if (error)
    return (
      <div role="alert" className="p-5 text-sm">
        {error}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRefresh((n) => n + 1)}
        >
          Retry checklist
        </Button>
      </div>
    );
  if (!data)
    return (
      <p role="status" className="p-5 text-sm text-ink-2">
        Loading acceptance checklist…
      </p>
    );
  return (
    <section
      className="h-full overflow-y-auto p-4"
      aria-label="Acceptance checklist"
    >
      <h2 className="font-semibold">Acceptance · v{data.number}</h2>
      <p className="mt-1 text-sm text-ink-2">
        Requirements proposed by the team. A checklist is not evidence that the
        app works. Results belong only to this saved version.
      </p>
      {data.contract.notice && (
        <p className="mt-3 rounded-md border p-3 text-sm text-ink-2">
          {data.contract.notice}
        </p>
      )}
      {!data.contract.items.length && (
        <p className="mt-4 text-sm">
          No recorded criteria. You can still preview, edit and publish this
          version.
        </p>
      )}
      <AcceptanceRunner
        data={data}
        endpoint={endpoint}
        onSaved={() => setRefresh((n) => n + 1)}
        disabled={status !== "idle"}
      />
      <ol className="mt-4 space-y-4">
        {data.contract.items.map((item) => {
          const auto = data.observations.find(
            (o) => o.criterion_id === item.id && o.kind === "automatic",
          );
          const manual = data.observations.find(
            (o) => o.criterion_id === item.id && o.kind === "manual",
          );
          const regression = isRegression(
            auto,
            data.baseline.find((o) => o.criterion_id === item.id),
          );
          return (
            <li key={item.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start gap-2">
                <h3 className="min-w-0 flex-1 font-medium">
                  {item.requirement}
                </h3>
                <span className="text-xs text-ink-2">
                  {auto
                    ? `Automatic observation: ${auto.status}`
                    : item.mode === "automatic"
                      ? "Automatic check not run"
                      : "Manual check needed"}
                </span>
              </div>
              <p className="mt-2 text-sm">
                <strong>Do:</strong> {item.procedure}
              </p>
              <p className="mt-1 text-sm">
                <strong>Expect:</strong> {item.expected}
              </p>
              {regression && (
                <p role="alert" className="mt-2 text-sm text-danger">
                  Regression: this check passed on the parent version and failed
                  here.
                </p>
              )}
              {auto && (
                <>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-2">
                    {auto.evidence.note} ·{" "}
                    {new Date(auto.created_at).toLocaleString()}
                  </p>
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer">Observed steps</summary>
                    <ol className="mt-2 space-y-1">
                      {auto.evidence.steps?.map((step) => (
                        <li
                          key={step.index}
                          className="whitespace-pre-wrap break-words"
                        >
                          {step.index + 1}. {step.status}: {step.detail}
                        </li>
                      ))}
                    </ol>
                  </details>
                </>
              )}
              {(auto?.status === "failed" || manual?.status === "failed") &&
                versionId === current &&
                status === "idle" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() =>
                      onResolve([
                        `Acceptance failed: ${item.requirement}. Procedure: ${item.procedure}. Expected: ${item.expected}. Observation: ${(auto?.status === "failed" ? auto : manual)?.evidence.note}`,
                      ])
                    }
                  >
                    Repair this failure
                  </Button>
                )}
              <ManualCheck item={item} observation={manual} onSave={save} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
