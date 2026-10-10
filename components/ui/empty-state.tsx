import { cn } from "@/lib/utils";

export function EmptyState({ title, body, action, className }: { title: string; body?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      <p className="text-xl font-semibold text-ink">{title}</p>
      {body && <p className="mt-2 max-w-[36ch] text-base text-ink-2">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
