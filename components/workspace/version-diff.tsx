"use client";
import * as React from 'react';
import type {Files} from '@/lib/agents/types';
import {fileChanges,lineEndings,textChanges} from '@/lib/versions/diff';
import {ExportButton} from "./export-button";
import {Button} from '@/components/ui/button';
import {useWorkspace} from '@/lib/store/workspace';
type Snapshot={id:string;number:number;summary:string;files:Files};
function FileDiff({before,after}:{before:string;after:string}) {
 const [result,setResult]=React.useState<Awaited<ReturnType<typeof textChanges>>|null>(null);
 React.useEffect(()=>{let live=true;void textChanges(before,after).then(r=>{if(live)setResult(r);});return()=>{live=false;};},[before,after]);
 if(!result)return <p role="status" className="p-3 text-sm text-ink-2">Comparing…</p>;
 return <><p className="px-3 py-2 text-sm text-ink-2">Before: {lineEndings(before)} · After: {lineEndings(after)}{result.limited?' · Large change: showing complete before/after blocks.':''}</p><div className="max-h-96 overflow-auto border-t" tabIndex={0} aria-label="File differences"><pre className="w-max min-w-full text-xs leading-6">{result.changes.length===0 && <span className="block px-3">Empty file</span>}{result.changes.map((c,i)=><span key={i} className={`block px-3 ${c.added?'bg-accent-soft text-accent-ink':c.removed?'bg-danger-soft text-danger':'text-ink-2'}`}><span className="select-none">{c.added?'+ Added':c.removed?'− Removed':'Unchanged'}{':\n'}</span>{c.value || '(empty file)'}</span>)}</pre></div></>;
}
export function VersionDiff({active}:{active:boolean}) {
 const projectId=useWorkspace(s=>s.projectId),versions=useWorkspace(s=>s.versions),current=useWorkspace(s=>s.currentVersionId),published=useWorkspace(s=>s.publishedVersionId),viewing=useWorkspace(s=>s.viewing?.id);
 const [selected,setSelected]=React.useState<string>(''),[retry,setRetry]=React.useState(0),[data,setData]=React.useState<{version:Snapshot;previous:Snapshot|null}|null>(null),[error,setError]=React.useState(''),[path,setPath]=React.useState(''),[expanded,setExpanded]=React.useState(false);
 const id=selected || viewing || current;
 React.useEffect(()=>{if(!active || !id)return;const controller=new AbortController();setData(null);setError('');setExpanded(false);
 void fetch(`/api/projects/${projectId}/versions/${id}?compare=previous`,{signal:controller.signal}).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.error??'Could not compare versions.');return b;}).then(b=>{setData(b);setPath(fileChanges(b.previous?.files??{},b.version.files)[0]?.path??'');}).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>controller.abort();},[active,id,projectId,retry]);
 const changes=data?fileChanges(data.previous?.files??{},data.version.files):[];
 return <section className="min-w-0 border-b p-4" aria-label="Version comparison"><div className="flex flex-wrap items-center gap-2"><h3 className="flex-1 font-semibold">Changes</h3><label className="sr-only" htmlFor="diff-version">Compare version</label><select id="diff-version" value={id??''} onChange={e=>setSelected(e.target.value)} className="max-w-full rounded-md border bg-surface px-2 py-1 text-sm">{versions.map(v=><option value={v.id} key={v.id}>v{v.number}{v.id===current?' · Current':''}{v.id===published?' · Published':''}{v.id===viewing?' · Viewing':''}</option>)}</select></div>
 {error?<div role="alert" className="mt-3 text-sm">{error} <Button size="sm" variant="ghost" onClick={()=>setRetry(n=>n+1)}>Retry comparison</Button></div>:!data?<p role="status" className="mt-3 text-sm text-ink-2">Loading comparison…</p>:<><p className="mt-2 text-sm text-ink-2">{data.previous?`v${data.previous.number} → v${data.version.number}`:`First version · v${data.version.number}`}{data.version.id===current?' · Current':''}{data.version.id===published?' · Published':''}{data.version.id===viewing?' · Viewing':''}</p><ExportButton versionId={data.version.id} number={data.version.number} /><p className="mt-2 whitespace-pre-wrap break-words text-sm">{data.version.summary}</p>{!changes.length?<p className="mt-3 text-sm text-ink-2">No source changes.</p>:<><p className="mt-3 text-sm text-ink-2">{changes.map(c=>c.kind).filter(k=>k==='added').length} added · {changes.filter(c=>c.kind==='modified').length} modified · {changes.filter(c=>c.kind==='deleted').length} deleted</p><label className="sr-only" htmlFor="diff-file">Changed file</label><select id="diff-file" value={path} onChange={e=>{setPath(e.target.value);setExpanded(false);}} className="mt-2 w-full rounded-md border bg-surface p-2 text-sm">{changes.map(c=><option key={c.path} value={c.path}>{c.path} · {c.kind}</option>)}</select><Button className="mt-2" variant="ghost" size="sm" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>{expanded?'Hide file changes':'Show file changes'}</Button>{expanded && <FileDiff key={`${id}:${path}`} before={data.previous?.files[path]??''} after={data.version.files[path]??''}/>}</>}</>}
 </section>;
}
