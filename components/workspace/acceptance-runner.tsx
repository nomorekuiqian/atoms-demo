"use client";
import * as React from "react";
import { parseStepResult } from "@/lib/acceptance/protocol";
import { Button } from "@/components/ui/button";
import { buildAcceptanceHtml } from "@/lib/acceptance/harness";
import { executeCriterion } from "@/lib/acceptance/execute";
import { parsePreviewMessage } from "@/lib/preview/protocol";
import type { AcceptanceStep } from "@/lib/acceptance/contract";
import type { ObservationInput } from "@/lib/acceptance/evidence";
import type { AcceptanceData } from "./acceptance-panel";

export function AcceptanceRunner({
  data,
  endpoint,
  onSaved,
  disabled,
  autoStart = false,
  onFinished,
}: {
  data: AcceptanceData;
  endpoint: string;
  onSaved: () => void;
  disabled: boolean;
  autoStart?: boolean;
  onFinished?: (error?: string) => void;
}) {
  const frame = React.useRef<HTMLIFrameElement>(null),
    controller = React.useRef<AbortController | null>(null);
  const [busy, setBusy] = React.useState(false),
    [progress, setProgress] = React.useState(""),
    [error, setError] = React.useState("");
  React.useEffect(() => () => controller.current?.abort(), []);
  const run = async () => {
    if (busy || !frame.current) return;
    const ctrl = new AbortController();
    controller.current = ctrl;
    setBusy(true);
    setError("");
    let sessionId = "",
      storage: Record<string, string> = {},
      errors: string[] = [];
    let pending: {
      type: "ready" | "step";
      actionId?: string;
      resolve: (r: {
        status: "passed" | "failed" | "inconclusive";
        detail: string;
      }) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    } | null = null;
    const cancelPending = () => {
      if (pending) {
        clearTimeout(pending.timer);
        pending.reject(new Error("Verification stopped."));
        pending = null;
      }
    };
    ctrl.signal.addEventListener("abort", cancelPending);
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const preview = parsePreviewMessage(
        event.data,
        sessionId,
        data.versionId,
      );
      if (preview?.type === "storage") {
        storage = preview.data;
        return;
      }
      if (preview?.type === "error") {
        errors.push(preview.message);
        return;
      }
      if (preview?.type === "ready" && pending?.type === "ready") {
        const p = pending;
        pending = null;
        clearTimeout(p.timer);
        p.resolve({ status: "passed", detail: "Startup received" });
        return;
      }
      const result =
        pending?.type === "step"
          ? parseStepResult(
              event.data,
              sessionId,
              data.versionId,
              pending.actionId!,
            )
          : null;
      if (result && pending?.type === "step") {
        const p = pending;
        pending = null;
        clearTimeout(p.timer);
        p.resolve(result);
      }
    };
    window.addEventListener("message", receive);
    const wait = (type: "ready" | "step", actionId?: string) =>
      new Promise<{
        status: "passed" | "failed" | "inconclusive";
        detail: string;
      }>((resolve, reject) => {
        ctrl.signal.throwIfAborted();
        pending = {
          type,
          actionId,
          resolve,
          reject,
          timer: setTimeout(
            () => {
              pending = null;
              reject(
                new Error(
                  type === "ready"
                    ? "No startup signal within 10 seconds."
                    : "No step response within 5 seconds.",
                ),
              );
            },
            type === "ready" ? 10000 : 5000,
          ),
        };
      });
    const load = async () => {
      ctrl.signal.throwIfAborted();
      sessionId = crypto.randomUUID();
      const ready = wait("ready");
      frame.current!.srcdoc = buildAcceptanceHtml(
        data.files,
        { sessionId, versionId: data.versionId },
        storage,
      );
      await ready;
    };
    const execute = async (step: AcceptanceStep) => {
      if (step.kind === "wait") {
        await new Promise<void>((resolve, reject) => {
          const abort = () => {
            clearTimeout(timer);
            reject(new Error("Stopped."));
          };
          const timer = setTimeout(() => {
            ctrl.signal.removeEventListener("abort", abort);
            resolve();
          }, step.ms);
          ctrl.signal.addEventListener("abort", abort, { once: true });
        });
        return { status: "passed" as const, detail: `Waited ${step.ms} ms.` };
      }
      const actionId = crypto.randomUUID(),
        result = wait("step", actionId);
      frame.current!.contentWindow!.postMessage(
        {
          type: "atoms-acceptance-command",
          sessionId,
          versionId: data.versionId,
          actionId,
          step,
        },
        "*",
      );
      return result;
    };
    let count = 0,
      passed = 0,
      failure: string | undefined;
    try {
      for (const item of data.contract.items.filter(
        (i) => i.mode === "automatic",
      )) {
        ctrl.signal.throwIfAborted();
        storage = {};
        errors = [];
        const result = await executeCriterion(
          item,
          { load, execute, errors: () => errors },
          ctrl.signal,
          (i) =>
            setProgress(
              `${item.requirement} · step ${i + 1}/${item.steps.length}`,
            ),
        );
        ctrl.signal.throwIfAborted();
        const body: ObservationInput = {
          id: crypto.randomUUID(),
          digest: data.digest,
          criterionId: item.id,
          kind: "automatic",
          ...result,
          evidence: { ...result.evidence, sessionId },
        };
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-benchmark-version": data.versionId,
          },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        const saved = await response.json();
        if (!response.ok)
          throw new Error(saved.error ?? "Could not save test evidence.");
        count++;
        if (result.status === "passed") passed++;
      }
      setProgress(
        `Observed ${passed}/${count} automatic checks passing. Manual checks still need your review.`,
      );
    } catch (e) {
      failure = e instanceof Error ? e.message : "Checks could not finish.";
      if (!ctrl.signal.aborted) setError(failure);
      else setProgress("Stopped. Unfinished checks have not been verified.");
    } finally {
      cancelPending();
      ctrl.signal.removeEventListener("abort", cancelPending);
      window.removeEventListener("message", receive);
      if (frame.current) frame.current.srcdoc = "";
      controller.current = null;
      setBusy(false);
      onSaved();
      onFinished?.(failure);
    }
  };
  const runRef = React.useRef(run);
  runRef.current = run;
  const started = React.useRef(false);
  React.useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active && autoStart && !started.current) {
        started.current = true;
        void runRef.current();
      }
    });
    return () => {
      active = false;
    };
  }, [autoStart]);
  const automatic = data.contract.items.filter(
    (i) => i.mode === "automatic",
  ).length;
  if (!automatic) return null;
  return (
    <div className="mt-4 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || disabled}
          onClick={() => void run()}
        >
          Run {automatic} automatic checks
        </Button>
        {busy && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => controller.current?.abort()}
          >
            Stop checks
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-2">
        Uses a separate sandbox and empty test storage. Your preview data stays
        unchanged. These are browser observations, not a security guarantee or
        complete business tests.
      </p>
      {progress && (
        <p role="status" className="mt-2 text-sm">
          {progress}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <iframe
        ref={frame}
        title="Acceptance test sandbox"
        sandbox="allow-scripts allow-forms allow-modals"
        className={busy ? "mt-3 h-48 w-full rounded border bg-white" : "hidden"}
      />
    </div>
  );
}
