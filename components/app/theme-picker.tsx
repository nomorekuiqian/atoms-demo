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
      <DropdownMenuContent align="start" className="w-[340px] max-w-[calc(100vw-24px)] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto p-2">
        <DropdownMenuItem onSelect={() => onChange(null)}>
          <span className="flex-1">Let the team decide</span>
          {!current && <Check />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="px-2 pb-2 text-xs text-ink-2">Style reference · the team adapts it to your app.</p>
        <div className="grid grid-cols-2 gap-2">{THEMES.map((t) => (
          <DropdownMenuItem key={t.id} role="menuitemradio" aria-checked={value===t.id} onSelect={() => onChange(t.id)} className="h-auto min-w-0 flex-col items-stretch gap-2 border p-2">
            <span aria-hidden className="block h-24 overflow-hidden border p-2 text-xs leading-tight" style={{background:t.swatch[0],color:t.swatch[1],fontFamily:t.preview.font,borderRadius:t.preview.radius,borderColor:t.swatch[1]}}>
              <span className="block text-xs font-bold">A little progress</span><span className="mt-1 block">Make room for good ideas.</span><span className="mt-2 inline-block px-2 py-1" style={{background:t.swatch[2],color:t.swatch[0],borderRadius:t.preview.radius}}>Start today</span>
            </span>
            <span className="flex items-center gap-2">
            <Swatch colors={t.swatch} />
            <span className="flex-1">{t.name}</span>
            {value === t.id && <Check />}
            </span>
          </DropdownMenuItem>
        ))}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
