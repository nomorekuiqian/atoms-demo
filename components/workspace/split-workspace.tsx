"use client";
import * as React from "react";
import {cn} from "@/lib/utils";
const DEFAULT=38;
export function SplitWorkspace({chat,app,pane}:{chat:React.ReactNode;app:React.ReactNode;pane:"chat"|"app"}) {
 const root=React.useRef<HTMLDivElement>(null);
 const [share,setShare]=React.useState(DEFAULT),[dragging,setDragging]=React.useState(false);
 const update=React.useCallback((n:number)=>{
  const value=Math.max(30,Math.min(60,n));setShare(value);
  try{localStorage.setItem('atoms-lite:chat-share',String(value));}catch{}
 },[]);
 React.useEffect(()=>{try{const n=Number(localStorage.getItem('atoms-lite:chat-share'));if(n>=30 && n<=60)setShare(n);}catch{}},[]);
 return <div ref={root} className={cn('split-workspace relative min-h-0 flex-1 px-2 pb-2',dragging && 'select-none')} style={{'--chat-width':`${share}%`} as React.CSSProperties}>
  <section id="workspace-chat-panel" aria-label="Chat panel" className={cn('min-h-0 min-w-0',pane==='chat'?'block':'hidden lg:block')}>{chat}</section>
  <div role="separator" aria-label="Resize chat and app panels; Enter resets" aria-orientation="vertical" aria-valuemin={30} aria-valuemax={60} aria-valuenow={Math.round(share)} tabIndex={0}
   className="group relative hidden cursor-col-resize touch-none rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent lg:block"
   onDoubleClick={()=>update(DEFAULT)}
   onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End','Enter'].includes(e.key)){e.preventDefault();update(e.key==='Enter'?DEFAULT:e.key==='Home'?30:e.key==='End'?60:share+(e.key==='ArrowRight'?2:-2));}}}
   onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setDragging(true);}}
   onPointerMove={e=>{if(!dragging || !root.current)return;const r=root.current.getBoundingClientRect();update(100*(e.clientX-r.left-8)/(r.width-16));}}
   onPointerUp={()=>setDragging(false)} onPointerCancel={()=>setDragging(false)}>
   <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-transparent group-hover:bg-line-strong group-focus-visible:bg-accent" />
  </div>
  <section id="workspace-app-panel" aria-label="App panel" className={cn('min-h-0 min-w-0',pane==='app'?'block':'hidden lg:block')}>{app}</section>
  {dragging && <div aria-hidden className="fixed inset-0 z-50 cursor-col-resize" />}
 </div>;
}
