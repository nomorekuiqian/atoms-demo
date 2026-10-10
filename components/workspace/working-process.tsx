"use client";

import * as React from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Check, ChevronDown, FileCode2, FileText, Loader2, X } from "lucide-react";

export type StepStatus = "done" | "running" | "failed";

export type Step =
  | { kind: "note"; text: string }
  | { kind: "tool"; action: "Read" | "Write"; path: string; status: StepStatus };

const VISIBLE_TOOLS = 3;

function ToolRow({ step }: { step: Extract<Step, { kind: "tool" }> }) {
  const Icon = step.action === "Write" ? FileCode2 : FileText;
  return (
    <div className="flex h-9 items-center gap-2 rounded-md border bg-surface px-3 text-sm">
      <Icon className="size-4 text-ink-2" aria-hidden />
      <span className="text-ink-2">{step.action === "Write" ? "Write file" : "Read file"}</span>
      <span className="truncate font-mono text-[12.5px] text-ink">{step.path}</span>
      <span className="ml-auto">
        {step.status === "done" && <Check className="size-4 text-success" aria-label="Done" />}
        {step.status === "running" && <Loader2 className="size-4 animate-spin text-accent" aria-label="In progress" />}
        {step.status === "failed" && <X className="size-4 text-danger" aria-label="Failed" />}
      </span>
    </div>
  );
}

/** Collapsible "Working process" timeline inside an agent message. The latest tool rows stay visible. */
export function WorkingProcess({ steps, defaultOpen = true }: { steps: Step[]; defaultOpen?: boolean }) {
  const [showAll, setShowAll] = React.useState(false);
  const toolCount = steps.filter((s) => s.kind === "tool").length;
  const hidden = showAll ? 0 : Math.max(0, toolCount - VISIBLE_TOOLS);
  let toolIndex = 0;

  return (
    <Collapsible.Root defaultOpen={defaultOpen}>
      <Collapsible.Trigger className="group flex items-center gap-1.5 rounded-sm text-sm text-ink-2 transition-colors hover:text-ink">
        Working process
        <span className="tabular text-ink-3">
          · {toolCount} {toolCount === 1 ? "step" : "steps"}
        </span>
        <ChevronDown className="size-3.5 transition-transform group-data-[state=closed]:-rotate-90" aria-hidden />
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2 border-l border-line-strong pl-4">
        <ol className="space-y-2">
          {steps.map((step, i) => {
            if (step.kind === "note") {
              return (
                <li key={i} className="text-base text-ink-2">
                  {step.text}
                </li>
              );
            }
            toolIndex += 1;
            if (toolIndex <= hidden) {
              // Collapsed rows are replaced by one chip, in their own place in the timeline.
              return toolIndex === 1 ? (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="inline-flex h-7 items-center gap-1 rounded-full border bg-surface px-2.5 text-xs font-medium text-ink-2 hover:text-ink"
                  >
                    Show {hidden} earlier
                    <ChevronDown className="size-3.5" aria-hidden />
                  </button>
                </li>
              ) : null;
            }
            return (
              <li key={i} className="animate-rise">
                <ToolRow step={step} />
              </li>
            );
          })}
        </ol>
        {showAll && toolCount > VISIBLE_TOOLS && (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="mt-2 inline-flex h-7 items-center gap-1 rounded-full border bg-surface px-2.5 text-xs font-medium text-ink-2 hover:text-ink"
          >
            Show less
            <ChevronDown className="size-3.5 rotate-180" aria-hidden />
          </button>
        )}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
