"use client";
import * as React from 'react';
import {Button} from '@/components/ui/button';
import {useWorkspace,type UIMessage,type VersionRow} from '@/lib/store/workspace';

export function HistoryMore({kind}:{kind:'messages'|'versions'}) {
  const projectId=useWorkspace(s=>s.projectId);
  const cursor=useWorkspace(s=>kind==='messages'?s.messagesBefore:s.versionsBefore);
  const [busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
  const controller=React.useRef<AbortController|null>(null);
  React.useEffect(()=>()=>controller.current?.abort(),[projectId]);
  const load=async()=>{
    setBusy(true);setError('');
    const ctrl=new AbortController();controller.current=ctrl;
    try{
      const response=await fetch(`/api/projects/${projectId}/history?kind=${kind}&before=${cursor}`,{signal:ctrl.signal});
      const body=await response.json();if(!response.ok)throw new Error(body.error);
      const s=useWorkspace.getState();if(s.projectId!==projectId || ctrl.signal.aborted)return;
      if(kind==='messages')s.set({messages:[...(body.items as UIMessage[]).filter(m=>!s.messages.some(x=>x.id===m.id)),...s.messages],messagesBefore:body.nextBefore});
      else s.set({versions:[...s.versions,...(body.items as VersionRow[]).filter(v=>!s.versions.some(x=>x.id===v.id))].sort((a,b)=>b.number-a.number),versionsBefore:body.nextBefore});
    }catch(e){if(!ctrl.signal.aborted)setError(e instanceof Error?e.message:'Could not load history.');}
    finally{if(!ctrl.signal.aborted)setBusy(false);}
  };
  if(cursor==null)return null;
  return <div className="p-3 text-center"><Button variant="ghost" size="sm" disabled={busy} onClick={()=>void load()}>{busy?'Loading…':`Load older ${kind}`}</Button>{error && <p role="alert" className="mt-1 text-sm text-danger">{error}</p>}</div>;
}
