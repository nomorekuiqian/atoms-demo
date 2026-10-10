export type Observation = {kind:"browser";digest?:string;versionId:string;sessionId:string;status:'waiting'|'observing'|'observed'|'timeout'|'error';startedAt:string;readyAt?:string;observedAt?:string;errors:number};
export type PreviewMessage = {source:'atoms-preview';sessionId:string;versionId:string} & (
  | {type:'ready'}
  | {type:'error';message:string;stack?:string}
  | {type:'console';level:'log'|'info'|'warn'|'error'|'debug';text:string}
  | {type:'storage';data:Record<string,string>}
);
export function parsePreviewMessage(data:unknown,sessionId:string,versionId:string):PreviewMessage|null {
  if(!data || typeof data!=='object')return null;
  const d=data as Record<string,unknown>;
  if(d.source!=='atoms-preview' || d.sessionId!==sessionId || d.versionId!==versionId)return null;
  const text=(v:unknown)=>typeof v==='string' && v.length<=8000;
  if(d.type==='ready')return d as PreviewMessage;
  if(d.type==='error' && text(d.message) && (d.stack==null || text(d.stack)))return d as PreviewMessage;
  if(d.type==='console' && ['log','info','warn','error','debug'].includes(String(d.level)) && text(d.text))return d as PreviewMessage;
  if(d.type==='storage' && d.data && typeof d.data==='object' && !Array.isArray(d.data)) {
    const entries=Object.entries(d.data);
    if(entries.length<=100 && entries.every(([k,v])=>k.length<=200 && text(v)) && JSON.stringify(d.data).length<=100000)return d as PreviewMessage;
  }
  return null;
}
