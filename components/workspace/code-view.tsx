"use client";

import * as React from "react";
import { FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LANG: Record<string, string> = { html: "html", css: "css", js: "javascript", json: "json", svg: "xml", md: "markdown" };

/** Highlight with Shiki once the file is complete; loaded lazily so it never blocks first paint. */
function useHighlighted(code: string, path: string, enabled: boolean) {
  const [result, setResult] = React.useState<{path:string;code:string;html:string}|null>(null);
  React.useEffect(() => {
    if (!enabled || code.length > 120_000) return setResult(null);
    let cancelled = false;
    const lang = LANG[path.split(".").pop() ?? ""] ?? "text";
    import("shiki")
      .then(({ codeToHtml }) =>
        codeToHtml(code, { lang, themes: { light: "github-light", dark: "github-dark" }, defaultColor: false }),
      )
      .then((out) => !cancelled && setResult({path,code,html:out}))
      .catch(() => !cancelled && setResult(null));
    return () => {
      cancelled = true;
    };
  }, [code, path, enabled]);
  return enabled && result?.path===path && result.code===code ? result.html : null;
}

/** Code tab: file list + read-only viewer with line numbers. */
export function CodeView({
  files,
  active,
  writing,
  onSelect,
  scrollKey = "default",
  visible = true,
}: {
  files: Record<string, string>;
  active: string | null;
  writing?: string | null;
  onSelect: (path: string) => void;
  scrollKey?: string;
  visible?: boolean;
}) {
  const paths = Object.keys(files);
  const current = active && files[active] !== undefined ? active : paths[0];
  const code = current ? files[current] : "";
  const highlighted = useHighlighted(code, current ?? "", Boolean(current) && writing !== current);
  const lines = code.split("\n");
  const viewer = React.useRef<HTMLDivElement>(null);
  const positions=React.useRef(new Map<string,{top:number;left:number}>());
  const positionKey=`${scrollKey}:${current}`;
  const displayedKey=React.useRef(positionKey);
  React.useLayoutEffect(()=>{
    displayedKey.current=positionKey;
    const el=viewer.current;
    if(!el || !visible || !el.clientHeight)return;
    const saved=positions.current.get(positionKey);
    el.scrollTop=saved?.top ?? 0;el.scrollLeft=saved?.left ?? 0;
  },[positionKey,highlighted,visible]);

  // Follow the file while it is being written.
  React.useEffect(() => {
    if (writing && writing === current && viewer.current) viewer.current.scrollTop = viewer.current.scrollHeight;
  }, [code, writing, current]);

  if (!current) {
    return <p className="p-6 text-base text-ink-2">Files appear here as Alex writes them.</p>;
  }

  return (
    <div className="code-layout flex h-full min-h-0 flex-col">
      <div className="code-file-picker shrink-0 border-b p-2">
        <label className="flex items-center gap-2 text-sm text-ink-2">File
          <select aria-label="File" value={current} onChange={e=>onSelect(e.target.value)} className="h-9 min-w-0 flex-1 rounded-md border bg-surface px-2 font-mono text-sm text-ink">{paths.map(path=><option key={path} value={path}>{path}</option>)}</select>
        </label>
      </div>
      <div className="flex min-h-0 flex-1">
      <nav aria-label="Files" className="code-file-list w-44 shrink-0 space-y-0.5 overflow-y-auto border-r p-2">
        {paths.map((path) => (
          <button
            key={path}
            title={path}
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
      <div ref={viewer} onScroll={e=>{if(visible && e.currentTarget.clientHeight)positions.current.set(displayedKey.current,{top:e.currentTarget.scrollTop,left:e.currentTarget.scrollLeft});}} className="min-w-0 flex-1 overflow-auto font-mono text-[12.5px] leading-[20px] text-ink">
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
    </div>
  );
}
