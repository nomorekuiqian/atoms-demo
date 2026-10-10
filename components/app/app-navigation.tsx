"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, FolderOpen, Home, Menu, Plus, Users, FileCode2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type RecentProject = { id: string; title: string };
type Props = { signedIn: boolean; recent: RecentProject[]; failed: boolean; mobile?: boolean };

export function AppNavigation({ signedIn, recent, failed, mobile = false }: Props) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "My projects", href: signedIn ? "/dashboard" : "/login?next=%2Fdashboard", icon: FolderOpen, active: "/dashboard" },
    { label: "Discover", href: "/discover", icon: Compass },
    { label: "AI team", href: "/team", icon: Users },
  ];
  const content = <div className="flex h-full flex-col">
    <Link href="/" aria-label="Atoms Lite home" className="mb-8 block w-fit rounded-sm" onClick={() => setOpen(false)}><Logo /></Link>
    <Link href="/#build" onClick={() => setOpen(false)} className="mb-6 flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-ink-on hover:opacity-90"><Plus className="size-4" aria-hidden />New project</Link>
    <nav aria-label="Main navigation" className="space-y-1">
      {items.map(({ label, href, icon: Icon, active }) => <Link key={label} href={href} onClick={() => setOpen(false)} aria-current={path === (active ?? href) ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors hover:bg-surface-3", path === (active ?? href) ? "bg-surface-3 font-medium text-ink" : "text-ink-2")}><Icon className="size-4" aria-hidden />{label}</Link>)}
    </nav>
    <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
      <h2 className="px-3 text-xs font-medium text-ink-3">Recent projects</h2>
      {signedIn ? failed ? <p className="px-3 py-3 text-sm text-ink-2">Couldn’t load projects. <Link className="underline" href="/dashboard" onClick={() => setOpen(false)}>View projects</Link></p> : recent.length ? <ul className="mt-2 space-y-1">{recent.map(p => <li key={p.id}><Link href={`/project/${p.id}`} onClick={() => setOpen(false)} className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink"><FileCode2 className="size-4 shrink-0" aria-hidden /><span className="truncate">{p.title}</span></Link></li>)}</ul> : <p className="px-3 py-3 text-sm text-ink-3">Your next idea starts here.</p> : <p className="px-3 py-3 text-sm leading-relaxed text-ink-3"><Link href="/login" className="text-ink-2 underline underline-offset-4" onClick={() => setOpen(false)}>Log in</Link> to pick up where you left off.</p>}
    </div>
    <nav aria-label="Resources" className="mt-6 space-y-1 border-t pt-4">
      <Link href="/help" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-ink-2 hover:bg-surface-3"><BookOpen className="size-4" aria-hidden />Help & getting started</Link>
      <a href="https://github.com/nomorekuiqian/atoms-demo" target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-ink-2 hover:bg-surface-3"><FileCode2 className="size-4" aria-hidden />Source on GitHub</a>
    </nav>
  </div>;
  if (!mobile) return <aside className="fixed inset-y-0 left-0 hidden w-56 border-r bg-bg px-4 py-6 md:block">{content}</aside>;
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger className="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-surface-2 md:hidden" aria-label="Open navigation"><Menu className="size-5" /></DialogTrigger>
    <DialogContent aria-describedby={undefined} className="inset-y-0 left-0 top-0 h-dvh w-[min(300px,calc(100vw-40px))] max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-bg px-5 py-6">
      <DialogTitle className="sr-only">Navigation</DialogTitle>
      {content}
    </DialogContent>
  </Dialog>;
}
