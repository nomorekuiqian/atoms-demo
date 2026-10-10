import type { AgentId } from "@/lib/agents/meta";
import { AgentAvatar, AgentLabel } from "./agent-avatar";
import { cn } from "@/lib/utils";
import { LiveLabel } from "./live-label";

export type AgentStatus = "thinking" | "working" | "done" | "stopped" | "failed";

const STATUS_TEXT: Record<"stopped" | "failed", string> = {
  stopped: "Stopped",
  failed: "Failed",
};

export function AgentMessage({
  agent,
  status,
  activity,
  children,
}: {
  agent: AgentId;
  status: AgentStatus;
  /** What the agent is doing right now, e.g. "Writing app.js". Shown while thinking/working. */
  activity?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="animate-rise">
      <header className="flex items-center gap-3">
        <AgentAvatar agent={agent} />
        <AgentLabel agent={agent} />
        {(status === "thinking" || status === "working") && (
          <LiveLabel className="ml-auto truncate text-sm">{activity ?? (status === "thinking" ? "Thinking" : "Working")}</LiveLabel>
        )}
        {(status === "stopped" || status === "failed") && (
          <span
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
              status === "failed" ? "bg-danger-soft text-danger" : "bg-surface-2 text-ink-2",
            )}
          >
            {STATUS_TEXT[status]}
          </span>
        )}
      </header>
      <div className="mt-3 space-y-3 pl-11 text-md leading-[1.6] text-ink">{children}</div>
    </article>
  );
}

/** Shown for an agent that has been assigned but has not produced output yet. */
export function AgentPending({ agent, label }: { agent: AgentId; label: string }) {
  return (
    <div className="flex items-center gap-3 text-base">
      <AgentAvatar agent={agent} size="sm" className="ml-1" />
      <LiveLabel>{label}</LiveLabel>
    </div>
  );
}
