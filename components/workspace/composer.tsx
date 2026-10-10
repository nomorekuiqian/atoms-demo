"use client";

import * as React from "react";
import { ArrowUp, Loader2, Square } from "lucide-react";
import { cn } from "@/lib/utils";

/** The prompt box: home page hero and workspace chat input share it. */
export function Composer({
  placeholder = "Describe the app you want to build",
  busy = false,
  size = "md",
  value,
  onChange,
  onSubmit,
  onStop,
  footer,
  className,
  textareaRef,
}: {
  placeholder?: string;
  busy?: boolean;
  size?: "md" | "lg";
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  footer?: React.ReactNode;
  className?: string;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const canSend = value.trim().length > 0 && !busy;
  return (
    <form
      className={cn(
        "rounded-xl border border-line-strong bg-surface shadow-sm transition-[box-shadow,border-color] focus-within:border-[color:var(--accent)] focus-within:shadow-[0_0_0_4px_var(--accent-soft)]",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSubmit();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        rows={size === "lg" ? 3 : 2}
        className={cn(
          "block w-full resize-none bg-transparent px-5 pt-4 text-ink placeholder:text-ink-3 focus:outline-none",
          size === "lg" ? "text-lg" : "text-md",
        )}
      />
      <div className="flex items-center gap-2 px-3 pb-3 pt-1">
        <div className="flex min-w-0 flex-1 items-center gap-2">{footer}</div>
        {busy && !onStop ? (
          <span className="grid size-9 place-items-center rounded-full bg-surface-3 text-ink-2" role="status" aria-label="Working">
            <Loader2 className="size-[18px] animate-spin" aria-hidden />
          </span>
        ) : busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop"
            className="grid size-9 place-items-center rounded-full bg-ink text-ink-on transition-opacity hover:opacity-85"
          >
            <Square className="size-3.5 fill-current" aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send"
            className="grid size-9 place-items-center rounded-full bg-ink text-ink-on transition-opacity hover:opacity-85 disabled:bg-surface-3 disabled:text-ink-3"
          >
            <ArrowUp className="size-[18px]" aria-hidden />
          </button>
        )}
      </div>
    </form>
  );
}
