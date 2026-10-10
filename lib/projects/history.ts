import {elementContextSchema} from "@/lib/context/element";
import { fileReferenceSchema, type FileReference } from "@/lib/context/references";
import type { AgentId } from "@/lib/agents/meta";
import type { UIMessage } from "@/lib/store/workspace";
export const HISTORY_PAGE_SIZE = 50;
export const MESSAGE_COLUMNS = "id, sequence, role, content, meta, version:versions(number, summary)";
export type MessageRow = {
  id: string;
  sequence: number;
  role: "user" | AgentId | "system";
  content: string;
  meta: { status?: string; files?: string[]; references?:FileReference[]; element?:unknown } | null;
  version: { number: number; summary: string | null } | null;
};

export function toUIMessage(m: MessageRow): UIMessage {
  const status = (m.meta?.status ?? "done") as UIMessage["status"];
  return {
    id: m.id,
    role: m.role as UIMessage["role"],
    content: m.content,
    element:elementContextSchema.safeParse(m.meta?.element).success ? elementContextSchema.parse(m.meta?.element):undefined,
    references: Array.isArray(m.meta?.references) ? m.meta.references.slice(0,6).filter(ref=>fileReferenceSchema.safeParse(ref).success) : undefined,
    status: status === "thinking" || status === "working" ? "stopped" : status,
    steps: (m.meta?.files ?? []).map((path) => ({ kind: "tool" as const, action: "Write" as const, path, status: status === "failed" ? "failed" : "done" })),
    version: m.version ? { number: m.version.number, summary: m.version.summary ?? `Version ${m.version.number}` } : undefined,
  };
}

