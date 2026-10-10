"use client";
import * as React from 'react';import {Download} from 'lucide-react';import {Button} from '@/components/ui/button';import {useWorkspace} from '@/lib/store/workspace';
export function ExportButton({versionId,number}:{versionId:string;number:number}) {
 const projectId=useWorkspace(s=>s.projectId),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
 const download=async()=>{setBusy(true);setError('');try{const r=await fetch(`/api/projects/${projectId}/export?versionId=${versionId}`);if(!r.ok){const b=await r.json();throw new Error(b.error??'Could not export this version.');}const blob=await r.blob(),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=r.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]??`app-v${number}.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(e){setError(e instanceof Error?e.message:'Could not export. Please retry.');}finally{setBusy(false);}};
 return <div className="min-w-0"><Button size="sm" variant="ghost" loading={busy} onClick={download}><Download aria-hidden/>Export v{number} ZIP</Button>{error&&<p role="alert" className="max-w-xs text-sm text-danger">{error} Try again.</p>}</div>;
}
