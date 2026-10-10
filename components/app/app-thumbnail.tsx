"use client";

import * as React from "react";
import type { Files } from "@/lib/agents/types";
import { buildPreviewHtml } from "@/lib/preview/buildPreviewHtml";

/** Live, non-interactive miniature of a generated app (sandboxed, scaled down). */
export function AppThumbnail({ files, title }: { files: Files; title: string }) {
  const srcDoc = React.useMemo(() => buildPreviewHtml(files), [files]);
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-surface-2" aria-hidden>
      <iframe
        title={`${title} preview`}
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        loading="lazy"
        tabIndex={-1}
        className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[0.25] border-0 bg-[#ffffff]"
      />
    </div>
  );
}
