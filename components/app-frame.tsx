"use client";

import * as React from "react";
import type { Files } from "@/lib/agents/types";
import { buildPreviewHtml } from "@/lib/preview/buildPreviewHtml";

/**
 * Full-viewport host for a generated app. The app runs in a sandboxed iframe with an opaque origin
 * (no allow-same-origin), so it can't reach this site's cookies or APIs. Its localStorage is a shim
 * that this trusted host persists under `storageKey` in the visitor's browser.
 */
export function AppFrame({ files, storageKey, title }: { files: Files; storageKey: string; title: string }) {
  const frame = React.useRef<HTMLIFrameElement>(null);
  const [srcDoc, setSrcDoc] = React.useState<string | null>(null);

  React.useEffect(() => {
    let storage: Record<string, string> = {};
    try {
      storage = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    } catch {}
    setSrcDoc(buildPreviewHtml(files, { inject: true, storage }));
  }, [files, storageKey]);

  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.source !== "atoms-preview" || e.data.type !== "storage") return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(e.data.data));
      } catch {}
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [storageKey]);

  if (!srcDoc) return null;
  return (
    <iframe
      ref={frame}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-forms allow-modals"
      className="fixed inset-0 block h-dvh w-full border-0 bg-[#ffffff]"
    />
  );
}
