import { cn } from "@/lib/utils";

/** In-progress text with a light sweep across it: the one live motion in the workspace. */
export function LiveLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span role="status" className={cn("live-sweep text-ink-2", className)}>
      {children}
    </span>
  );
}
