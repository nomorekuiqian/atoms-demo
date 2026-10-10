"use client";

import * as React from "react";
import { FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LANG: Record<string, string> = { html: "html", css: "css", js: "javascript", json: "json", svg: "xml", md: "markdown" };

/** Highlight with Shiki once the file is complete; loaded lazily so it never blocks first paint. */
function useHighlighted(code: string, path: string, enabled: boolean) {
  const [html, setHtml] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!enabled || code.length > 120_000) return setHtml(null);
    let cancelled = false;
    const lang = LANG[path.split(".").pop() ?? ""] ?? "text";
    import("shiki")
      .then(({ codeToHtml }) =>
        codeToHtml(code, { lang, themes: { light: "github-light", dark: "github-dark" }, defaultColor: false }),
      )
      .then((out) => !cancelled && setHtml(out))
      .catch(() => !cancelled && setHtml(null));
    return () => {
      cancelled = true;
    };
  }, [code, path, enabled]);
  return enabled ? html : null;
}

/** Code tab: file list + read-only viewer with line numbers. */
export function CodeView({
  files,
  active,
  writing,
  onSelect,
}: {
  files: Record<string, string>;
  active: string | null;
  writing?: string | null;
  onSelect: (path: string) => void;
}) {
  const paths = Object.keys(files);
  const current = active && files[active] !== undefined ? active : paths[0];
  const code = current ? files[current] : "";
  const highlighted = useHighlighted(code, current ?? "", Boolean(current) && writing !== current);
  const lines = code.split("\n");
  const viewer = React.useRef<HTMLDivElement>(null);

  // Follow the file while it is being written.
  React.useEffect(() => {
    if (writing && writing === current && viewer.current) viewer.current.scrollTop = viewer.current.scrollHeight;
  }, [code, writing, current]);

  if (!current) {
    return <p className="p-6 text-base text-ink-2">Files appear here as Alex writes them.</p>;
  }

  return (
    <div className="flex h-full min-h-0">
      <nav aria-label="Files" className="w-44 shrink-0 space-y-0.5 overflow-y-auto border-r p-2 sm:w-48">
        {paths.map((path) => (
          <button
            key={path}
            type="button"
            onClick={() => onSelect(path)}
            aria-current={path === current ? "page" : undefined}
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left font-mono text-[12.5px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink",
              path === current && "bg-accent-soft text-accent-ink hover:bg-accent-soft hover:text-accent-ink",
            )}
          >
            <FileCode2 className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{path}</span>
            {writing === path && <span className="ml-auto size-1.5 shrink-0 animate-breathe rounded-full bg-accent" aria-label="Writing" />}
          </button>
        ))}
      </nav>
      <div ref={viewer} className="min-w-0 flex-1 overflow-auto font-mono text-[12.5px] leading-[20px] text-ink">
        {highlighted ? (
          <div className="code-shiki" dangerouslySetInnerHTML={{ __html: highlighted }} />
        ) : (
          <pre className="py-3">
            <code className="grid grid-cols-[auto_1fr]">
              {lines.map((line, i) => (
                <span key={i} className="contents">
                  <span className="tabular select-none pl-4 pr-4 text-right text-ink-3">{i + 1}</span>
                  <span className="whitespace-pre pr-6">{line || " "}</span>
                </span>
              ))}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
}
