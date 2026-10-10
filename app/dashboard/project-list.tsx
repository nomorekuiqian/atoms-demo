"use client";
import {useState} from "react";
import {ProjectRow,type ProjectSummary} from "./project-row";
export function ProjectList({projects,renderedAt}:{projects:ProjectSummary[];renderedAt:number}){
 const [q,setQ]=useState(""),[filter,setFilter]=useState("all");const visible=projects.filter(p=>p.title.toLowerCase().includes(q.trim().toLowerCase())&&(filter==="all"||(filter==="published"?Boolean(p.published_slug):!p.published_slug)));
 return <><div className="flex flex-wrap gap-3 border-b p-4"><input aria-label="Search projects" placeholder="Search projects" value={q} onChange={e=>setQ(e.target.value)} className="h-11 min-w-0 flex-1 rounded-md border bg-bg px-3 text-sm"/><select aria-label="Project status" value={filter} onChange={e=>setFilter(e.target.value)} className="h-11 rounded-md border bg-bg px-3 text-sm"><option value="all">All projects</option><option value="published">Published</option><option value="unpublished">Unpublished</option></select></div><p role="status" className="px-4 py-3 text-xs text-ink-3">{visible.length} of {projects.length} recent projects</p>{visible.length?<ul>{visible.map(p=><ProjectRow key={p.id} project={p} renderedAt={renderedAt}/>)}</ul>:<p className="px-4 py-10 text-center text-sm text-ink-2">No matching projects. Try another name or status.</p>}</>;
}
