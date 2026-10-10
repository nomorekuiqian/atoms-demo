import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IssueReport({ count, message, onResolve, onConsole }: { count: number; message: string; onResolve: () => void; onConsole: () => void }) {
  return (
    <div role="alert" className="flex w-full max-w-[520px] items-center gap-3 rounded-lg border bg-surface p-2 pl-3 shadow-md animate-rise">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="whitespace-nowrap text-base font-medium text-ink">
          {count} runtime {count === 1 ? "error" : "errors"}
        </p>
        <p className="truncate font-mono text-xs text-ink-2">{message}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onConsole} className="hidden sm:inline-flex">
        Console
      </Button>
      <Button variant="primary" size="sm" onClick={onResolve}>
        Resolve
      </Button>
    </div>
  );
}
