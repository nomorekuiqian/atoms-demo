"use client";
import {useState} from "react";
import Link from "next/link";
import {ChevronDown} from "lucide-react";
import {ARTICLES} from "./articles";
export function HelpContent(){const [q,setQ]=useState("");const items=ARTICLES.filter(a=>`${a.question} ${a.answer} ${a.topic}`.toLowerCase().includes(q.trim().toLowerCase()));return <>
 <input type="search" aria-label="Search help" placeholder="Search versions, publishing, errors…" value={q} onChange={e=>setQ(e.target.value)} className="mt-6 h-12 w-full rounded-md border bg-surface px-4 text-base"/>
 <nav aria-label="Help topics" className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-ink-2">{[...new Set(ARTICLES.map(a=>a.topic))].map(topic=><a key={topic} href={`#${ARTICLES.find(a=>a.topic===topic)!.id}`} onClick={()=>setQ("")} className="underline underline-offset-4">{topic}</a>)}</nav>
 <p className="mt-6 text-sm text-ink-3" role="status">{items.length} articles</p>
 {items.length? <div className="mt-3 divide-y border-y">{items.map(a=><details key={a.id} id={a.id} className="group scroll-mt-6 py-5 target:rounded-md target:bg-surface-2 target:px-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden"><span><span className="mb-1 block text-xs text-ink-3">{a.topic}</span><span className="text-base font-medium">{a.question}</span></span><ChevronDown aria-hidden className="size-4 shrink-0 transition-transform group-open:rotate-180"/></summary><p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-ink-2">{a.answer}</p>{a.example&&<div className="mt-3"><p className="text-sm text-ink-2">Example: {a.example}</p><Link href={`/?prompt=${encodeURIComponent(a.example)}#build`} className="mt-2 inline-block text-sm underline underline-offset-4">Try this prompt</Link></div>}</details>)}</div>:<div className="py-12"><p className="text-sm text-ink-2">No matching articles. Try “publish”, “data” or “error”.</p><button onClick={()=>setQ("")} className="mt-3 text-sm underline">Clear search</button></div>}
 <p className="mt-8 text-sm text-ink-2">Still stuck? <a href="https://github.com/nomorekuiqian/atoms-demo/issues" target="_blank" rel="noreferrer" className="underline underline-offset-4">Report a reproducible issue on GitHub</a>. Include the steps and error message, but leave out passwords and private data.</p>
 </>}
