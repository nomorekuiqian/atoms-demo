"use client";
import * as React from "react";
import Image from "next/image";
import { AGENTS, type AgentId } from "@/lib/agents/meta";
import { cn } from "@/lib/utils";

const TINT: Record<AgentId, string> = {
  mike: "bg-mike-soft text-mike",
  emma: "bg-emma-soft text-emma",
  bob: "bg-bob-soft text-bob",
  alex: "bg-alex-soft text-alex",
};

export function AgentAvatar({ agent, size = "md", className }: { agent: AgentId; size?: "sm" | "md"; className?: string }) {
  const [failed,setFailed]=React.useState(false),[loaded,setLoaded]=React.useState(false);
  return (
    <span
      data-agent-avatar={agent}
      aria-hidden
      className={cn(
        "relative inline-grid overflow-hidden shrink-0 place-items-center rounded-full font-semibold",
        size === "md" ? "size-8 text-sm" : "size-6 text-xs",
        TINT[agent],
        className,
      )}
    >
      <span className={loaded && !failed?"invisible":""}>{AGENTS[agent].name[0]}</span>
      {!failed && <Image src={`/assets/agents/${agent}-v1.webp`} alt="" width={96} height={96} unoptimized onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} className="absolute inset-0 size-full object-contain" />}
    </span>
  );
}

export function AgentLabel({ agent }: { agent: AgentId }) {
  return (
    <span className="flex items-center gap-2 text-base">
      <span className="font-medium text-ink">{AGENTS[agent].name}</span>
      <span className="h-3 w-px bg-line-strong" aria-hidden />
      <span className="text-ink-2">{AGENTS[agent].role}</span>
    </span>
  );
}
