import { cn } from "@/lib/utils";

/** Atoms Lite mark: a nucleus, its orbit, and one electron breaking out. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("size-6", className)}>
      <circle cx="11" cy="13" r="7.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="11" cy="13" r="2.6" fill="currentColor" />
      <circle cx="18.6" cy="5.4" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-[-0.01em]">Atoms Lite</span>
    </span>
  );
}
