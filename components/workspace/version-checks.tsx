"use client";
import * as React from 'react';
import type {CheckRecord} from '@/lib/checks/static';
import {useWorkspace} from '@/lib/store/workspace';
const runtimeLabels={waiting:'Waiting for preview startup',observing:'Startup received · observing for 3 seconds',observed:'No errors received during observation',timeout:'Startup not received within 10 seconds',error:'Runtime errors received'};
export function VersionChecks({versionId}:{versionId:string|null}) {
 const projectId=useWorkspace(s=>s.projectId),observation=useWorkspace(s=>s.observation);
 const [record,setRecord]=React.useState<CheckRecord|null>(null),[error,setError]=React.useState(''),[retry,setRetry]=React.useState(0);
 React.useEffect(()=>{
  setRecord(null);setError('');if(!versionId)return;
  const ctrl=new AbortController();
  fetch(`/api/projects/${projectId}/versions/${versionId}`,{signal:ctrl.signal}).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.error);return b.checks as CheckRecord;}).then(r=>{if(!ctrl.signal.aborted)setRecord(r);}).catch(e=>{if(!ctrl.signal.aborted)setError(e.message || 'Checks unavailable.');});
  return()=>ctrl.abort();
 },[projectId,versionId,retry]);
 React.useEffect(()=>{
  if(record && observation?.versionId===record.versionId && observation.digest!==record.digest)useWorkspace.getState().set({observation:{...observation,digest:record.digest}});
 },[record,observation]);
 if(!versionId)return null;
 const current=record?.versionId===versionId?record:null;
 const runtime=observation?.versionId===versionId?observation:null;
 const label=error?'Checks unavailable':!current?'Checking saved files':current.errors.length?`${current.errors.length} static issue${current.errors.length===1?'':'s'}`:'Static checks passed';
 return <details className="shrink-0 border-b px-3 py-2 text-sm text-ink-2">
  <summary className="cursor-pointer select-none rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{label}<span className="mx-2" aria-hidden>·</span>{runtime?runtimeLabels[runtime.status]:'Preview not observed'}</summary>
  <div className="max-h-40 space-y-2 overflow-auto pt-3">
   {error && <p role="alert">{error} <button className="underline" onClick={()=>setRetry(n=>n+1)}>Retry checks</button></p>}
   {current?.errors.map((e,i)=><p key={i}><button className="font-mono underline" onClick={()=>useWorkspace.getState().set({tab:'code',activeFile:e.path})}>{e.path || 'Project'}</button>: {e.message}</p>)}
   {current && <p>Checked entry, paths, sizes and literal HTML/CSS references at {new Date(current.checkedAt).toLocaleTimeString()}. Snapshot {current.digest.slice(0,12)}.</p>}
   {current?.dependencies.length ? <p className="break-words">External dependencies: {current.dependencies.join(', ')}</p>:null}
   {current?.unchecked.map(text=><p key={text}>{text}</p>)}
   <p>Browser observations belong to this preview session. They do not prove all app features work.</p>
   {runtime?.status==='error' && <button className="underline" onClick={()=>useWorkspace.getState().set({tab:'preview',consoleOpen:true,issuesDismissed:false})}>View errors and Resolve</button>}
  </div>
 </details>;
}
