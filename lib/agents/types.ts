import type { AgentId } from "./meta";

export type Files = Record<string, string>;

export type StepStatus = "done" | "running" | "failed";
export type AgentRunStatus = "done" | "stopped" | "failed";

/** Server-sent events streamed from /api/generate (PRD §5.3). */
export type AgentEvent =
  | { type: "agent_start"; agent: AgentId; activity: string }
  | { type: "text_delta"; agent: AgentId; delta: string }
  | { type: "file_start"; path: string }
  | { type: "file_delta"; path: string; delta: string }
  | { type: "file_end"; path: string }
  | { type: "agent_end"; agent: AgentId; status: AgentRunStatus }
  | { type: "version_created"; versionId: string; number: number; summary: string; title?: string }
  | { type: "error"; message: string; retryable: boolean }
  | { type: "done" };

export type Route = "full" | "alex_only";
export type Mode = "build" | "fix";

export type ChatTurn = { role: "user" | AgentId; content: string };

export type PipelineInput = {
  prompt: string;
  history: ChatTurn[];
  files: Files;
  mode: Mode;
  /** Runtime errors reported by the preview, for mode "fix". */
  errors?: string[];
};

export type AgentOutput = {
  agent: AgentId;
  text: string;
  status: AgentRunStatus;
  files: string[];
};

export type PipelineResult = {
  route: Route;
  title?: string;
  agents: AgentOutput[];
  /** Files Alex wrote this run (complete contents). Empty when nothing usable was produced. */
  written: Files;
  summary: string;
  ok: boolean;
  error?: string;
  usage: { model: string; input: number; output: number }[];
};
