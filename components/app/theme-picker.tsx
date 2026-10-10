"use client";

import { Check, ChevronDown, Palette } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { THEMES } from "@/lib/themes";

function Swatch({ colors }: { colors: [string, string, string] }) {
  return (
    <span className="flex -space-x-1" aria-hidden>
      {colors.map((c, i) => (
        <span key={i} className="size-3.5 rounded-full border border-line-strong" style={{ background: c }} />
      ))}
    </span>
  );
}

export function ThemePicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const current = THEMES.find((t) => t.id === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-full border bg-surface px-3 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
        {current ? <Swatch colors={current.swatch} /> : <Palette className="size-3.5" aria-hidden />}
        {current ? current.name : "Theme"}
        <ChevronDown className="size-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        <DropdownMenuItem onSelect={() => onChange(null)}>
          <span className="flex-1">Let the team decide</span>
          {!current && <Check />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => onChange(t.id)}>
            <Swatch colors={t.swatch} />
            <span className="flex-1">{t.name}</span>
            {value === t.id && <Check />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
