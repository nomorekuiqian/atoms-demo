import { History } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VersionCard({
  number,
  summary,
  current,
  onRestore,
  restoreLabel = "Restore",
  restoring,
}: {
  number: number;
  summary: string;
  current?: boolean;
  onRestore?: () => void;
  restoreLabel?: string;
  restoring?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-surface px-3 py-2.5 shadow-sm">
      <span className="tabular grid size-8 shrink-0 place-items-center rounded-sm bg-surface-2 text-sm font-semibold text-ink">v{number}</span>
      <div className="min-w-0 flex-1">
        <details><summary className="line-clamp-2 cursor-pointer text-base font-medium text-ink">{summary}</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-2">{summary}</p></details>
        {current && <p className="text-sm text-ink-2">Current version</p>}
      </div>
      {!current && onRestore && (
        <Button variant="ghost" size="sm" onClick={onRestore} loading={restoring}>
          {!restoring && <History aria-hidden />}
          {restoreLabel}
        </Button>
      )}
    </div>
  );
}
