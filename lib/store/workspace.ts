"use client";

import type { FileReference } from "@/lib/context/references";
import type { Observation } from "@/lib/preview/protocol";
import { create } from "zustand";
import type { AgentId } from "@/lib/agents/meta";
import type { AgentEvent, Files } from "@/lib/agents/types";
import type { Step } from "@/components/workspace/working-process";

export type MessageStatus = "thinking" | "working" | "done" | "stopped" | "failed";

export type UIMessage = {
  id: string;
  role: "user" | "system" | AgentId;
  content: string;
  references?: FileReference[];
  status: MessageStatus;
  activity?: string;
  steps: Step[];
  version?: { number: number; summary: string };
};

export type VersionRow = { id: string; number: number; summary: string; created_at: string };

export type ConsoleEntry = { id: number; level: "log" | "info" | "warn" | "error" | "debug"; text: string };

export type WorkspaceInit = {
  projectId: string;
  title: string;
  messages: UIMessage[];
  files: Files;
  versions: VersionRow[];
  currentVersionId: string | null;
  publishedVersionId: string | null;
  publishedSlug: string | null;
};

type State = WorkspaceInit & {
  status: "idle" | "streaming" | "stopping";
  observation: Observation | null;
  fileReferences: FileReference[];
  /** Files Alex is writing in the current run; merged into `files` when a version is created. */
  draft: Files;
  writing: string | null;
  tab: "preview" | "code" | "versions";
  pane: "chat" | "app";
  activeFile: string | null;
  device: "desktop" | "phone";
  previewNonce: number;
  console: ConsoleEntry[];
  consoleOpen: boolean;
  runError: { message: string; retryable: boolean } | null;
  lastPrompt: string | null;
  /** Issue Report dismissed for the current preview load. */
  issuesDismissed: boolean;
  /** A past version shown read-only in Preview/Code (Versions tab). */
  viewing: { id: string; number: number; files: Files } | null;
  versionLoading: string | null;
  versionError: {id:string;message:string}|null;
};

type Actions = {
  init: (data: WorkspaceInit) => void;
  set: (patch: Partial<State>) => void;
  startRun: (prompt: string | null, references?:FileReference[]) => void;
  apply: (e: AgentEvent) => void;
  finishRun: (opts?: { stopped?: boolean; error?: string }) => void;
  log: (entry: Omit<ConsoleEntry, "id">) => void;
  restored: (v: VersionRow, files: Files, messageId: string | null) => void;
};

let consoleId = 0;
let localId = 0;
const tempId = () => `local-${++localId}`;

export const useWorkspace = create<State & Actions>((set, get) => ({
  projectId: "",
  title: "",
  messages: [],
  files: {},
  versions: [],
  currentVersionId: null,
  publishedVersionId: null,
  publishedSlug: null,
  status: "idle",
  observation: null,
  fileReferences: [],
  draft: {},
  writing: null,
  tab: "preview",
  pane: "chat",
  activeFile: null,
  device: "desktop",
  previewNonce: 0,
  console: [],
  consoleOpen: false,
  runError: null,
  lastPrompt: null,
  issuesDismissed: false,
  viewing: null,
  versionLoading: null,
  versionError: null,

  init: (data) =>
    set({
      ...data,
      status: "idle",
      draft: {},
      writing: null,
      tab: "preview",
      pane: "chat",
      activeFile: Object.keys(data.files)[0] ?? null,
      console: [],
      runError: null,
      viewing: null,
      observation: null,
      fileReferences: [],
      versionLoading: null,
      versionError: null,
    }),

  set: (patch) => set(patch),

  startRun: (prompt,references) =>
    set((s) => ({
      status: "streaming",
      draft: {},
      writing: null,
      runError: null,
      lastPrompt: prompt ?? s.lastPrompt,
      messages: prompt ? [...s.messages, { id: tempId(), role: "user", content: prompt, references, status: "done", steps: [] }] : s.messages,
    })),

  apply: (e) => {
    const s = get();
    const updateLast = (agent: AgentId, fn: (m: UIMessage) => UIMessage) => {
      const idx = s.messages.findLastIndex((m) => m.role === agent);
      if (idx === -1) return s.messages;
      const next = s.messages.slice();
      next[idx] = fn(next[idx]);
      return next;
    };
    switch (e.type) {
      case "agent_start":
        set({
          messages: [...s.messages, { id: tempId(), role: e.agent, content: "", status: "thinking", activity: e.activity, steps: [] }],
        });
        break;
      case "text_delta":
        set({ messages: updateLast(e.agent, (m) => ({ ...m, content: m.content + e.delta })) });
        break;
      case "file_start":
        set({
          draft: { ...s.draft, [e.path]: "" },
          writing: e.path,
          activeFile: s.tab === "code" ? e.path : s.activeFile,
          messages: updateLast("alex", (m) => ({
            ...m,
            status: "working",
            activity: `Writing ${e.path}`,
            steps: [...m.steps, { kind: "tool", action: "Write", path: e.path, status: "running" }],
          })),
        });
        break;
      case "file_delta":
        set({ draft: { ...s.draft, [e.path]: (s.draft[e.path] ?? "") + e.delta } });
        break;
      case "file_end":
        set({
          writing: null,
          messages: updateLast("alex", (m) => ({
            ...m,
            steps: m.steps.map((st) => (st.kind === "tool" && st.path === e.path && st.status === "running" ? { ...st, status: "done" } : st)),
          })),
        });
        break;
      case "agent_end":
        set({
          messages: updateLast(e.agent, (m) => ({
            ...m,
            status: e.status,
            activity: undefined,
            steps: m.steps.map((st) => (st.kind === "tool" && st.status === "running" ? { ...st, status: e.status === "done" ? "done" : "failed" } : st)),
          })),
        });
        break;
      case "version_created": {
        const files = e.files;
        set({
          files,
          draft: {},
          viewing: null,
          title: e.title ?? s.title,
          currentVersionId: e.versionId,
          versions: [{ id: e.versionId, number: e.number, summary: e.summary, created_at: new Date().toISOString() }, ...s.versions.filter(v => v.id !== e.versionId)],
          messages: updateLast("alex", (m) => ({ ...m, version: { number: e.number, summary: e.summary } })),
          previewNonce: s.previewNonce + 1,
          console: [],
          issuesDismissed: false,
          tab: s.tab === "code" ? "code" : "preview",
          pane: "app",
        });
        break;
      }
      case "error":
        set({ runError: { message: e.message, retryable: e.retryable } });
        break;
      case "done":
        break;
    }
  },

  finishRun: (opts) =>
    set((s) => ({
      status: "idle",
      writing: null,
      draft: {},
      runError: opts?.error ? { message: opts.error, retryable: true } : s.runError,
      // Anything still live when the stream ends was cut off: settle its status and running steps.
      messages: s.messages.map((m) =>
        m.status === "thinking" || m.status === "working" || m.steps.some((st) => st.kind === "tool" && st.status === "running")
          ? {
              ...m,
              status: m.status === "thinking" || m.status === "working" ? (opts?.stopped ? "stopped" : "failed") : m.status,
              activity: undefined,
              steps: m.steps.map((st) => (st.kind === "tool" && st.status === "running" ? { ...st, status: "failed" } : st)),
            }
          : m,
      ),
    })),

  log: (entry) => set((s) => ({ console: [...s.console.slice(-199), { ...entry, id: ++consoleId }] })),

  restored: (v, files, messageId) =>
    set((s) => ({
      files,
      currentVersionId: v.id,
      versions: [v, ...s.versions],
      viewing: null,
      previewNonce: s.previewNonce + 1,
      console: [],
      issuesDismissed: false,
      tab: "preview",
      messages: [
        ...s.messages,
        { id: messageId ?? tempId(), role: "system", content: v.summary, status: "done", steps: [], version: { number: v.number, summary: v.summary } },
      ],
    })),
}));

/** Distinct runtime errors from the current preview load, most recent first (max 5). */
export function selectIssues(s: { console: ConsoleEntry[] }): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = s.console.length - 1; i >= 0 && out.length < 5; i--) {
    const e = s.console[i];
    if (e.level !== "error") continue;
    const key = e.text.split("\n")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e.text.slice(0, 1500));
  }
  return out;
}
