"use client";

import { FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Code tab: file list + read-only mono viewer with line numbers. Highlighting is layered on in M3. */
export function CodeView({
  files,
  active,
  writing,
  onSelect,
}: {
  files: Record<string, string>;
  active: string;
  writing?: string;
  onSelect: (path: string) => void;
}) {
  const lines = (files[active] ?? "").split("\n");
  return (
    <div className="flex h-full min-h-0">
      <nav aria-label="Files" className="w-48 shrink-0 space-y-0.5 overflow-y-auto border-r p-2">
        {Object.keys(files).map((path) => (
          <button
            key={path}
            type="button"
            onClick={() => onSelect(path)}
            aria-current={path === active ? "page" : undefined}
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left font-mono text-[12.5px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink",
              path === active && "bg-accent-soft text-accent-ink hover:bg-accent-soft hover:text-accent-ink",
            )}
          >
            <FileCode2 className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{path}</span>
            {writing === path && <span className="ml-auto size-1.5 shrink-0 animate-breathe rounded-full bg-accent" aria-label="Writing" />}
          </button>
        ))}
      </nav>
      <pre className="min-w-0 flex-1 overflow-auto py-3 font-mono text-[12.5px] leading-[20px] text-ink">
        <code className="grid grid-cols-[auto_1fr]">
          {lines.map((line, i) => (
            <span key={i} className="contents">
              <span className="tabular select-none pl-4 pr-4 text-right text-ink-3">{i + 1}</span>
              <span className="whitespace-pre pr-6">{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
