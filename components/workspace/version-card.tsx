import { History } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VersionCard({
  number,
  summary,
  current,
  onRestore,
}: {
  number: number;
  summary: string;
  current?: boolean;
  onRestore?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-surface px-3 py-2.5 shadow-sm">
      <span className="tabular grid size-8 place-items-center rounded-sm bg-surface-2 text-sm font-semibold text-ink">
        v{number}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-ink">{summary}</p>
        <p className="text-sm text-ink-2">{current ? "Current version" : `Version ${number}`}</p>
      </div>
      {!current && onRestore && (
        <Button variant="ghost" size="sm" onClick={onRestore}>
          <History aria-hidden />
          Restore
        </Button>
      )}
    </div>
  );
}
