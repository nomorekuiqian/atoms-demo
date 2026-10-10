"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Search } from "lucide-react";
import covers from "@/lib/assets/examples.json";
import { EXAMPLE_DETAILS } from "@/lib/examples/catalog";
import type { PublishedApp } from "@/lib/remix/load";
import { AppThumbnail } from "@/components/app/app-thumbnail";
import { Button } from "@/components/ui/button";
const KEY = "atoms-lite:saved-apps:v1";
export function Explore({ apps }: { apps: PublishedApp[] }) {
  const [query,setQuery]=useState(""),[sort,setSort]=useState("latest"),[onlySaved,setOnlySaved]=useState(false),[saved,setSaved]=useState<string[]>([]),[ready,setReady]=useState(false),[error,setError]=useState("");
  useEffect(()=>{try{const v=JSON.parse(localStorage.getItem(KEY)??"[]");if(Array.isArray(v))setSaved(v.filter(x=>typeof x==="string"));}catch{}setReady(true);},[]);
  function toggle(slug:string){const next=saved.includes(slug)?saved.filter(s=>s!==slug):[...saved,slug];setSaved(next);try{localStorage.setItem(KEY,JSON.stringify(next));setError("");}catch{setError("Saved for this visit only. Your browser couldn’t store this collection.");}}
  const visible=apps.filter(a=>(!onlySaved||saved.includes(a.slug))&&`${a.title} ${EXAMPLE_DETAILS[a.slug]?.description??""}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>sort==="name"?a.title.localeCompare(b.title):b.updatedAt.localeCompare(a.updatedAt));
  return <>
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <label className="flex h-11 w-full min-w-0 flex-none items-center sm:w-auto sm:flex-1 gap-2 rounded-md border bg-surface px-3"><Search className="size-4 shrink-0 text-ink-3" aria-hidden/><input aria-label="Search apps" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search apps" className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none" /></label>
      <Button variant={onlySaved?"secondary":"ghost"} aria-pressed={onlySaved} onClick={()=>setOnlySaved(!onlySaved)} disabled={!ready}><Bookmark className="size-4"/>Saved</Button>
      <select aria-label="Sort apps" value={sort} onChange={e=>setSort(e.target.value)} className="h-11 rounded-md border bg-surface px-3 text-sm text-ink"><option value="latest">Recently updated</option><option value="name">Name A–Z</option></select>
    </div>
    <p className="mt-3 text-sm text-ink-2" role="status">{visible.length} {visible.length===1?"app":"apps"}{onlySaved?" · Saved on this browser only":" · Browse the latest 100 published apps"}</p>
    {error&&<p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    {!visible.length?<div className="py-16 text-center"><h2 className="text-lg font-medium">{onlySaved?"No saved matches":"No apps found"}</h2><p className="mt-2 text-sm text-ink-2">{onlySaved?"Save an app with its bookmark button, or try a different search.":"Try a shorter search or come back after an app is published."}</p><Button className="mt-4" onClick={()=>{setQuery("");setOnlySaved(false);}}>Show all apps</Button></div>:<ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{visible.map(app=><li key={app.projectId} className="min-w-0">
      <Link href={`/p/${app.slug}`} aria-label={`Open ${app.title}`} className="block overflow-hidden rounded-lg border"><AppThumbnail files={app.files} title={app.title} cover={covers.find(c=>c.captureProjectId===app.projectId&&c.captureVersionId===app.versionId)?.outputPath.replace(/^public/,"")}/></Link>
      <div className="mt-3 flex items-start gap-2"><div className="min-w-0 flex-1"><Link href={`/p/${app.slug}`} className="text-base font-medium hover:underline">{app.title}</Link>{EXAMPLE_DETAILS[app.slug]?.template&&<p className="mt-1 text-xs text-ink-3">Starter template</p>}</div><button disabled={!ready} onClick={()=>toggle(app.slug)} aria-label={`${saved.includes(app.slug)?"Unsave":"Save"} ${app.title}`} aria-pressed={saved.includes(app.slug)} className="grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-surface-3"><Bookmark className="size-4" fill={saved.includes(app.slug)?"currentColor":"none"}/></button></div>
      <p className="mt-1 text-sm leading-relaxed text-ink-2">{EXAMPLE_DETAILS[app.slug]?.description??"Open this published app to explore what it does."}</p>
      <div className="mt-3 flex gap-4 text-sm"><Link href={`/p/${app.slug}`} className="text-ink underline underline-offset-4">Open app</Link><Link href={`/remix/${app.slug}`} className="text-ink-2 underline underline-offset-4">Remix this app</Link></div>
    </li>)}</ul>}
    <div className="mt-12 border-t pt-6"><h2 className="text-lg font-medium">Start with something that already works</h2><p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-ink-2">Open an app to try it, then choose Remix to copy its code into your account. Its original conversation and browser data stay behind. Your changes won’t affect the original.</p><Link href="/help#remix" className="mt-3 inline-block text-sm underline underline-offset-4">How Remix works</Link></div>
  </>;
}
