import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type VersionItem = { id: string; number: number; summary: string; when: string; published?: boolean };

/** Versions tab: one surface, hairline-divided rows. */
export function VersionList({
  versions,
  currentId,
  viewingId,
  onView,
  onRestore,
}: {
  versions: VersionItem[];
  currentId: string;
  viewingId?: string;
  onView?: (id: string) => void;
  onRestore?: (id: string) => void;
}) {
  return (
    <ol className="divide-y divide-[color:var(--line)]">
      {versions.map((v) => {
        const current = v.id === currentId;
        return (
          <li
            key={v.id}
            className={cn(
              "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2",
              viewingId === v.id && "bg-accent-soft hover:bg-accent-soft",
            )}
          >
            <button type="button" onClick={() => onView?.(v.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className="tabular w-8 shrink-0 text-sm font-semibold text-ink-2">v{v.number}</span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-base font-medium text-ink">{v.summary}</span>
                <span className="block text-sm text-ink-2">
                  {v.when}
                  {current && " · Current"}
                  {viewingId===v.id && " · Viewing"}
                  {v.published && " · Published"}
                </span>
              </span>
            </button>
            {!current && onRestore && (
              <Button variant="ghost" size="sm" onClick={() => onRestore(v.id)} className="transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
                <History aria-hidden /> Restore v{v.number}
              </Button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
