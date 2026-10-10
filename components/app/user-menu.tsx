"use client";

import { LayoutGrid, LogOut } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";

export function UserMenu({ email }: { email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className="grid size-8 place-items-center rounded-full bg-surface-3 text-sm font-semibold uppercase text-ink transition-opacity hover:opacity-80"
      >
        {email[0]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <p className="truncate px-2.5 py-1.5 text-sm text-ink-2">{email}</p>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutGrid /> Projects
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
