"use client";

import * as React from "react";
import type {ElementContext} from "@/lib/context/element";
import type { FileReference } from "@/lib/context/references";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Monitor, RotateCw, Smartphone, SquareTerminal, MousePointer2, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { UserMenu } from "@/components/app/user-menu";
import { Toaster } from "@/components/ui/toaster";
import { parsePreviewMessage } from "@/lib/preview/protocol";
import { VersionChecks } from "./version-checks";
import { buildPreviewHtml } from "@/lib/preview/buildPreviewHtml";
import { AcceptancePanel } from "./acceptance-panel";
import { HistoryMore } from "./history-more";
import { RunScope } from "@/lib/store/runScope";
import { readRun } from "@/lib/sse/readRun";
import { toast } from "sonner";
import { selectIssues, useWorkspace, type VersionRow, type WorkspaceInit } from "@/lib/store/workspace";
import type { Files } from "@/lib/agents/types";
import { useShallow } from "zustand/react/shallow";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { SplitWorkspace } from "./split-workspace";
import { AgentMessage } from "./agent-message";
import { CodeView } from "./code-view";
import { IssueReport } from "./issue-report";
import { Composer } from "./composer";
import { Markdown } from "./markdown";
import { PublishDialog } from "./publish-dialog";
import { VersionCard } from "./version-card";
import { ExportButton } from "./export-button";
import { VersionDiff } from "./version-diff";
import { VersionList } from "./version-list";
import { WorkingProcess } from "./working-process";

const storageKey = (projectId: string) => `atoms-lite:app-storage:${projectId}`;

function readAppStorage(projectId: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(storageKey(projectId)) ?? "{}");
  } catch {
    return {};
  }
}

/* ───────────────────────────── run control ───────────────────────────── */

function useRun() {
  const scope = React.useRef(new RunScope());
  React.useEffect(() => { const current = scope.current; return () => current.cancel(); }, []);
  const store = useWorkspace;
  type RunOptions = { prompt: string | null; mode?: "build" | "fix"; errors?: string[]; retry?: boolean; requestId?: string; expectedVersionId?: string | null; references?:FileReference[]; element?:ElementContext };
  const lastRun = React.useRef<RunOptions | null>(null);

  const run = React.useCallback(async (opts: RunOptions) => {
    const s = store.getState();
    if (s.status !== "idle") return;
    opts = { ...opts, element:opts.element ?? (opts.mode==="fix"?undefined:s.selectedElement??undefined), references: opts.references ?? (opts.mode==="fix"?[]:s.fileReferences), requestId: opts.requestId ?? crypto.randomUUID(), expectedVersionId: opts.expectedVersionId === undefined ? s.currentVersionId : opts.expectedVersionId };
    lastRun.current = opts;
    s.startRun(opts.retry ? null : opts.prompt, opts.references,opts.element);
    if(!opts.retry && opts.mode!=="fix")s.set({fileReferences:[],selectedElement:null,selecting:false});
    const token = scope.current.start(s.projectId, opts.requestId!);
    const current = () => token.current(store.getState().projectId);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: s.projectId, prompt: opts.prompt ?? undefined, mode: opts.mode, errors: opts.errors, retry: opts.retry, requestId: opts.requestId, expectedVersionId: opts.expectedVersionId, references: opts.references,element:opts.element }),
        signal: token.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        if (current()) store.getState().finishRun({ error: body?.error ?? "Couldn't start the build. Try again." });
        return;
      }
      await readRun(res.body, e => { if (current()) store.getState().apply(e); });
      if (current()) store.getState().finishRun();
    } catch (err) {
      if (!current()) return;
      if (err instanceof Error && err.name === "AbortError") store.getState().finishRun({ stopped: true });
      else store.getState().finishRun({ error: "The connection dropped before confirmation. Try again to recover the result." });
    } finally {
      token.finish();
    }
  }, [store]);

  const stop = React.useCallback(() => {
    store.getState().set({ status: "stopping" });
    scope.current.stop();
  }, [store]);

  const retry = React.useCallback(() => {
    if (lastRun.current) return run({ ...lastRun.current, retry: true });
  }, [run]);
  return { run, stop, retry };
}

/* ───────────────────────────── versions ───────────────────────────── */

function useVersions() {
  const [busy, setBusy] = React.useState<string | null>(null);
  const loading=React.useRef<{seq:number;controller?:AbortController}>({seq:0});
  React.useEffect(()=>()=>loading.current.controller?.abort(),[]);

  const restore = React.useCallback(async (versionId: string) => {
    const { projectId, status, restored } = useWorkspace.getState();
    if (status !== "idle") return toast("Wait for the current build to finish.");
    loading.current.controller?.abort();++loading.current.seq;
    useWorkspace.getState().set({versionLoading:null,versionError:null});
    setBusy(versionId);
    try {
      const res = await fetch(`/api/projects/${projectId}/restore`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ versionId, expectedVersionId: useWorkspace.getState().currentVersionId }),
      });
      const body = await res.json();
      if (!res.ok) return toast(body.error ?? "Couldn't restore. Try again.");
      if (useWorkspace.getState().projectId !== projectId) return;
      restored(body.version as VersionRow, body.files as Files, body.messageId);
      toast(`${body.version.summary} as v${body.version.number}`);
    } catch {
      toast("Couldn't reach the server. Try again.");
    } finally {
      setBusy(null);
    }
  }, []);

  const view = React.useCallback(async (versionId: string) => {
    loading.current.controller?.abort();
    const seq=++loading.current.seq;
    const {projectId,currentVersionId,set,tab}=useWorkspace.getState();
    if(versionId===currentVersionId)return set({viewing:null,tab:"preview",versionLoading:null,versionError:null});
    const controller=new AbortController();loading.current.controller=controller;
    set({versionLoading:versionId,versionError:null});
    try {
      const res=await fetch(`/api/projects/${projectId}/versions/${versionId}`,{signal:controller.signal});
      const body=await res.json();if(!res.ok)throw new Error(body.error);
      if(seq!==loading.current.seq || useWorkspace.getState().projectId!==projectId)return;
      const latest=useWorkspace.getState();
      set({viewing:{id:body.version.id,number:body.version.number,files:body.version.files},tab:latest.tab===tab?"preview":latest.tab,console:[],issuesDismissed:true,versionLoading:null});
    }catch(error){
      if(seq===loading.current.seq && !controller.signal.aborted)set({versionLoading:null,versionError:{id:versionId,message:error instanceof Error?error.message:"Could not load this version."}});
    }
  }, []);

  return { restore, view, busy };
}

/* ───────────────────────────── chat ───────────────────────────── */

function Chat({
  onSend,
  onStop,
  onRetry,
  onRestore,
  restoring,
}: {
  onSend: (p: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onRestore: (versionId: string) => void;
  restoring: string | null;
}) {
  const messages = useWorkspace((s) => s.messages);
  const versions = useWorkspace((s) => s.versions);
  const currentVersionId = useWorkspace((s) => s.currentVersionId);
  const currentNumber = versions.find((v) => v.id === currentVersionId)?.number;
  // Revert on a version card = go back to the version before it.
  const before = (n: number) => versions.find((v) => v.number === n - 1);
  const revert = async (n: number) => {
    const s=useWorkspace.getState();
    if(before(n))return onRestore(before(n)!.id);
    try {
      const res=await fetch(`/api/projects/${s.projectId}/history?kind=versions&before=${n}`);
      const body=await res.json();if(!res.ok)throw new Error(body.error);
      const target=(body.items as VersionRow[]).find(v=>v.number===n-1);
      if(useWorkspace.getState().projectId!==s.projectId)return;
      if(!target)throw new Error("Previous version was not found.");
      onRestore(target.id);
    }catch(e){toast(e instanceof Error?e.message:"Could not load previous version.");}
  };
  const status = useWorkspace((s) => s.status);
  const runError = useWorkspace((s) => s.runError);
  const fileReferences=useWorkspace(s=>s.fileReferences);
  const selectedElement=useWorkspace(s=>s.selectedElement);
  const [draft, setDraft] = React.useState("");
  const scroller = React.useRef<HTMLDivElement>(null);
  const pinned = React.useRef(true);

  React.useEffect(() => {
    const el = scroller.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [messages, runError]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-5"
        aria-live="polite"
      >
        <HistoryMore kind="messages" />
        {messages.map((m) =>
          m.role === "system" ? (
            <div key={m.id} className="space-y-2">
              <p className="text-center text-sm text-ink-2">{m.content}</p>
              {m.version && <VersionCard number={m.version.number} summary={m.version.summary} current={m.version.number === currentNumber} />}
            </div>
          ) : m.role === "user" ? (
            <div key={m.id} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-xl bg-surface-2 px-4 py-2.5 text-md text-ink">
              {m.content}
              {m.element && <p className="mt-2 text-xs text-ink-2" title={m.element.selector}>Selected {m.element.tag}: {m.element.text || "element"} · v{versions.find(v=>v.id===m.element?.versionId)?.number ?? "?"}</p>}
              {m.references?.length ? <div className="mt-2 flex flex-wrap gap-1">{m.references.map(ref=><span key={ref.path} className="rounded border px-2 py-0.5 font-mono text-xs" title={ref.versionId}>{ref.path} · {versions.find(v=>v.id===ref.versionId)?`v${versions.find(v=>v.id===ref.versionId)!.number}`:"saved version"}</span>)}</div>:null}
            </div>
          ) : (
            <AgentMessage key={m.id} agent={m.role} status={m.status} activity={m.activity}>
              {m.content.trim() && <Markdown text={m.content} />}
              {m.steps.length > 0 && <WorkingProcess steps={m.steps} />}
              {m.version && (
                <VersionCard
                  number={m.version.number}
                  summary={m.version.summary}
                  current={m.version.number === currentNumber}
                  restoreLabel="Revert"
                  onRestore={m.version.number > 1 && status === "idle" ? () => void revert(m.version!.number) : undefined}
                  restoring={restoring === before(m.version.number)?.id}
                />
              )}
            </AgentMessage>
          ),
        )}
        {runError && (
          <div role="alert" className="flex items-start gap-3 rounded-md border bg-surface px-4 py-3 text-base">
            <p className="flex-1 text-ink">{runError.message}</p>
            {runError.retryable && status === "idle" && (
              <Button size="sm" variant="secondary" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="px-2 pb-2">
        {selectedElement && <div className="mb-2 min-w-0 rounded-md border bg-surface p-2 text-sm"><button type="button" aria-label="Remove selected element" className="flex w-full items-center gap-2 text-left" onClick={()=>useWorkspace.getState().set({selectedElement:null})}><MousePointer2 className="size-4 shrink-0" aria-hidden/><span className="min-w-0 flex-1 truncate">{selectedElement.tag}: {selectedElement.text || "element"}</span><X className="size-3 shrink-0" aria-hidden/></button><p className="mt-1 text-xs text-ink-2">A visual clue for Alex; dynamic elements may need more detail.</p></div>}
        {fileReferences.length>0 && <div aria-label="Selected file references" className="mb-2 flex flex-wrap gap-1">{fileReferences.map(ref=><button key={ref.path} type="button" aria-label={`Remove ${ref.path} reference`} className="inline-flex max-w-full items-center gap-1 rounded-md border bg-surface px-2 py-1 text-sm text-ink" onClick={()=>useWorkspace.getState().set({fileReferences:fileReferences.filter(r=>r.path!==ref.path)})}><span className="truncate font-mono">{ref.path}</span><span>v{versions.find(v=>v.id===ref.versionId)?.number ?? "?"}</span><X className="size-3" aria-hidden /></button>)}</div>}
        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={() => {
            onSend(draft.trim());
            setDraft("");
            pinned.current = true;
          }}
          busy={status !== "idle"}
          onStop={onStop}
          placeholder={messages.length ? "Describe a change" : "Describe the app you want to build"}
        />
      </div>
    </div>
  );
}

/* ───────────────────────────── preview ───────────────────────────── */

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?:boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          "grid size-8 place-items-center disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink [&_svg]:size-4",
          active && "bg-surface-2 text-ink",
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

function Preview() {
  const projectId = useWorkspace((s) => s.projectId);
  const currentFiles = useWorkspace((s) => s.files);
  const viewing = useWorkspace((s) => s.viewing);
  const files = viewing?.files ?? currentFiles;
  const currentVersionId = useWorkspace((s) => s.currentVersionId);
  const versionId = viewing?.id ?? currentVersionId;
  const nonce = useWorkspace((s) => s.previewNonce);
  const device = useWorkspace((s) => s.device);
  const status = useWorkspace((s) => s.status);
  const frame = React.useRef<HTMLIFrameElement>(null);
  const selecting=useWorkspace(s=>s.selecting);
  const runError=useWorkspace(s=>s.runError);

  const [instanceId] = React.useState(() => crypto.randomUUID());
  const sessionId = `${instanceId}:${projectId}:${versionId}:${nonce}`;

  // Built once per version / refresh; storage is read at that moment only.
  const srcDoc = React.useMemo(
    () => (Object.keys(files).length ? buildPreviewHtml(files, { inject: true, storage: readAppStorage(projectId), session: {id:sessionId,versionId:versionId ?? ""} }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, nonce, projectId, sessionId, versionId],
  );

  React.useEffect(()=>{useWorkspace.getState().set({selectedElement:null,selecting:false});},[sessionId]);
  React.useEffect(()=>{
    frame.current?.contentWindow?.postMessage({type:"atoms-select",sessionId,versionId,enabled:selecting && !viewing && status==="idle"},"*");
    const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")useWorkspace.getState().set({selecting:false});};
    window.addEventListener("keydown",escape);return()=>window.removeEventListener("keydown",escape);
  },[selecting,sessionId,versionId,viewing,status]);

  React.useEffect(() => {
    if (!versionId || !srcDoc) return;
    const store = useWorkspace;
    store.getState().set({observation:{kind:"browser",versionId,sessionId,status:"waiting",startedAt:new Date().toISOString(),errors:0}});
    const startup = setTimeout(() => {
      const observation = store.getState().observation;
      if(observation?.sessionId===sessionId && observation.status==="waiting")store.getState().set({observation:{...observation,status:"timeout"}});
    },10000);
    let watch: ReturnType<typeof setTimeout> | undefined;
    let lastSelection=0;
    const onMessage = (e: MessageEvent) => {
      if(e.source !== frame.current?.contentWindow)return;
      const data=parsePreviewMessage(e.data,sessionId,versionId);
      if(!data)return;
      const {log,set,observation}=store.getState();
      if(data.type==="selection-exit"){set({selecting:false});return;}
      if(data.type==="element-selected"){
        const state=store.getState();
        if(!state.selecting || state.viewing || state.status!=="idle" || state.currentVersionId!==versionId || Date.now()-lastSelection<200)return;
        lastSelection=Date.now();set({selectedElement:data.element,selecting:false,pane:"chat"});return;
      }
      if(data.type==="ready") {
        clearTimeout(startup);
        if(observation?.sessionId!==sessionId || observation.readyAt)return;
        set({observation:{...observation,status:observation.errors ? "error":"observing",readyAt:new Date().toISOString()}});
        watch=setTimeout(()=>{
          const latest=store.getState().observation;
          if(latest?.sessionId===sessionId)set({observation:{...latest,status:latest.errors?"error":"observed",observedAt:new Date().toISOString()}});
        },3000);
      } else if(data.type==="storage") {
        try {localStorage.setItem(storageKey(projectId),JSON.stringify(data.data));}catch{}
      } else {
        const level=data.type==="error"?"error":data.level;
        log({level,text:data.type==="error"?[data.message,data.stack].filter(Boolean).join("\n"):data.text});
        if(level==="error" && observation?.sessionId===sessionId)set({observation:{...observation,status:"error",errors:observation.errors+1}});
      }
    };
    window.addEventListener("message",onMessage);
    return ()=>{clearTimeout(startup);clearTimeout(watch);window.removeEventListener("message",onMessage);};
  },[projectId,versionId,sessionId,srcDoc]);

  if (!srcDoc) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div className="max-w-xs">{!runError && <Image src="/assets/illustrations/empty-project-v1.webp" width={180} height={180} unoptimized alt="" className="mx-auto mb-4" />}<p className="text-base text-ink-2">{runError?"The build did not finish. Retry from the chat.":status === "idle" ? "Describe your app in the chat to begin." : "Your app will appear here when Alex finishes."}</p></div>
      </div>
    );
  }
  return (
    <div className={cn("relative h-full", device === "phone" && "grid place-items-center overflow-auto bg-surface-2 p-4")}>
      {selecting && <p className="pointer-events-none absolute inset-x-3 top-3 z-10 rounded-md border bg-surface px-3 py-2 text-center text-sm shadow-sm" role="status">Select an element · Esc to cancel</p>}
      <iframe
        ref={frame}
        key={nonce}
        title="App preview"
        onLoad={() => {frame.current?.contentWindow?.postMessage({type:"atoms-probe",sessionId,versionId},"*");frame.current?.contentWindow?.postMessage({type:"atoms-select",sessionId,versionId,enabled:useWorkspace.getState().selecting},"*");}}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-forms allow-modals"
        className={cn("block border-0 bg-[#ffffff]", device === "phone" ? "h-[760px] max-h-full w-[390px] max-w-full rounded-lg border border-line shadow-md" : "h-full w-full")}
      />
    </div>
  );
}

function ConsoleDrawer() {
  const entries=useWorkspace(s=>s.console),set=useWorkspace(s=>s.set);
  const list=React.useRef<HTMLDivElement>(null),pinned=React.useRef(true);
  const start=React.useRef<{y:number;height:number}|null>(null);
  const [height,setHeight]=React.useState(192),[dragging,setDragging]=React.useState(false),[maximum,setMaximum]=React.useState(360);
  const resize=React.useCallback((value:number)=>{
    const next=Math.max(64,Math.min(maximum,value));setHeight(next);
    try{localStorage.setItem("atoms-lite:console-height",String(next));}catch{}
  },[maximum]);
  React.useEffect(()=>{
    const adapt=()=>{const max=Math.max(64,Math.min(480,window.innerHeight*.4));setMaximum(max);setHeight(h=>Math.min(h,max));};
    adapt();try{const n=Number(localStorage.getItem("atoms-lite:console-height"));if(n>=64)setHeight(Math.min(n,window.innerHeight*.4,480));}catch{}
    window.addEventListener("resize",adapt);return()=>window.removeEventListener("resize",adapt);
  },[]);
  React.useEffect(()=>{if(list.current && pinned.current)list.current.scrollTop=list.current.scrollHeight;},[entries]);
  return <section aria-label="Console" className="relative flex shrink-0 flex-col bg-surface" style={{height}}>
    <div role="separator" aria-label="Resize console; Enter resets" aria-orientation="horizontal" aria-valuemin={64} aria-valuemax={maximum} aria-valuenow={height} tabIndex={0}
      className="h-2 shrink-0 cursor-row-resize touch-none border-t hover:bg-surface-2 focus-visible:bg-accent-soft"
      onDoubleClick={()=>resize(192)}
      onKeyDown={e=>{if(["ArrowUp","ArrowDown","Home","End","Enter"].includes(e.key)){e.preventDefault();resize(e.key==="Enter"?192:e.key==="Home"?64:e.key==="End"?maximum:height+(e.key==="ArrowUp"?16:-16));}}}
      onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);start.current={y:e.clientY,height};setDragging(true);}}
      onPointerMove={e=>{if(start.current)resize(start.current.height+start.current.y-e.clientY);}}
      onPointerUp={()=>{start.current=null;setDragging(false);}} onPointerCancel={()=>{start.current=null;setDragging(false);}} />
    <header className="flex h-9 shrink-0 items-center gap-2 border-b px-3 text-sm">
      <span className="font-medium text-ink">Console</span><span className="tabular text-ink-3">{entries.length}</span>
      <button type="button" onClick={()=>set({console:[]})} className="ml-auto rounded-sm px-2 py-0.5 text-ink-2 hover:bg-surface-2">Clear</button>
      <button type="button" aria-label="Close console" onClick={()=>set({consoleOpen:false})} className="grid size-6 place-items-center rounded-full text-ink-2 hover:bg-surface-2"><X className="size-3.5" /></button>
    </header>
    <div ref={list} onScroll={e=>{const el=e.currentTarget;pinned.current=el.scrollHeight-el.scrollTop-el.clientHeight<40;}} className="min-h-0 flex-1 overflow-auto py-1 font-mono text-[12px] leading-[18px]">
      {!entries.length && <p className="px-3 py-2 font-sans text-sm text-ink-3">Logs and errors from your app show up here.</p>}
      {entries.map(e=><pre key={e.id} className={cn("whitespace-pre-wrap break-words border-b border-line px-3 py-1",e.level==="error" && "bg-danger-soft text-danger",e.level==="warn" && "bg-warning-soft text-warning")}>{e.text}</pre>)}
    </div>
    {dragging && <div aria-hidden className="fixed inset-0 z-50 cursor-row-resize" />}
  </section>;
}

function AppPanel({
  onResolve,
  onView,
  onRestore,
  restoring,
}: {
  onResolve: (errors: string[]) => void;
  onView: (versionId: string) => void;
  onRestore: (versionId: string) => void;
  restoring: string | null;
}) {
  const viewing = useWorkspace((s) => s.viewing);
  const tab = useWorkspace((s) => s.tab);
  const device = useWorkspace((s) => s.device);
  const consoleOpen = useWorkspace((s) => s.consoleOpen);
  const consoleErrors = useWorkspace((s) => s.console.filter((c) => c.level === "error").length);
  const files = useWorkspace((s) => s.files);
  const draft = useWorkspace((s) => s.draft);
  const writing = useWorkspace((s) => s.writing);
  const activeFile = useWorkspace((s) => s.activeFile);
  const versions = useWorkspace((s) => s.versions);
  const currentVersionId = useWorkspace((s) => s.currentVersionId);
  const publishedVersionId = useWorkspace((s) => s.publishedVersionId);
  const set = useWorkspace((s) => s.set);
  const codeFiles = React.useMemo(() => viewing?.files ?? { ...files, ...draft }, [files, draft, viewing]);
  const issues = useWorkspace(useShallow(selectIssues));
  const issuesDismissed = useWorkspace((s) => s.issuesDismissed);
  const idle = useWorkspace((s) => s.status === "idle");
  const versionLoading=useWorkspace(s=>s.versionLoading),versionError=useWorkspace(s=>s.versionError);

  const fileReferences=useWorkspace(s=>s.fileReferences);
  const selecting=useWorkspace(s=>s.selecting);
  const selectedPath=activeFile && Object.hasOwn(codeFiles,activeFile)?activeFile:Object.keys(codeFiles)[0];
  const selectedAlready=fileReferences.some(ref=>ref.path===selectedPath && ref.versionId===currentVersionId);
  const referenceFile=()=>{
    if(!selectedPath || !currentVersionId || viewing)return;
    if(fileReferences.length>=6)return toast("Select at most 6 files.");
    set({fileReferences:[...fileReferences,{path:selectedPath,versionId:currentVersionId}],pane:"chat"});
  };

  return (
    <Tabs value={tab} onValueChange={v=>set({tab:v as typeof tab,selecting:false})} className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-surface shadow-sm">
      <div className="relative flex h-[84px] shrink-0 flex-col justify-between gap-1 border-b px-3 py-2">
          <TabsList className="self-start">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="acceptance">Acceptance</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
          </TabsList>
          <div className={cn("ml-auto flex h-8 items-center gap-0.5",tab!=="preview" && "invisible")} aria-hidden={tab!=="preview"} inert={tab!=="preview"}>
            <span className="flex items-center gap-0.5">
              <ToolButton label="Desktop" active={device === "desktop"} onClick={() => set({ device: "desktop" })}>
                <Monitor />
              </ToolButton>
              <ToolButton label="Phone" active={device === "phone"} onClick={() => set({ device: "phone" })}>
                <Smartphone />
              </ToolButton>
            </span>
            <ToolButton label={selecting?"Cancel element selection":"Select element"} active={selecting} disabled={Boolean(viewing) || !idle || !currentVersionId} onClick={()=>set({selecting:!selecting})}><MousePointer2 /></ToolButton>
            <ToolButton label="Refresh" onClick={() => set({ previewNonce: useWorkspace.getState().previewNonce + 1, console: [], issuesDismissed: false })}>
              <RotateCw />
            </ToolButton>
            <ToolButton label="Open in new tab" onClick={() => window.open(`/preview/${useWorkspace.getState().projectId}?versionId=${viewing?.id ?? currentVersionId}`, "_blank", "noopener")}>
              <ExternalLink />
            </ToolButton>
            <span className="mx-1 h-4 w-px bg-line-strong" aria-hidden />
            <ToolButton label="Console" active={consoleOpen} onClick={() => set({ consoleOpen: !consoleOpen })}>
              <span className="relative">
                <SquareTerminal />
                {consoleErrors > 0 && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-danger ring-2 ring-[color:var(--surface)]" aria-label={`${consoleErrors} errors`} />}
              </span>
            </ToolButton>
          </div>
        {tab!=="preview" && <div className="absolute inset-x-3 bottom-2 flex h-8 items-center gap-2"><p className="min-w-0 flex-1 truncate text-sm text-ink-2">{tab==="code"?`${Object.keys(codeFiles).length} source files · Read-only`:tab==="acceptance"?"Version-bound requirements and observations":`${versions.length} saved versions`}</p>{tab==="code" && <Button size="sm" variant="secondary" disabled={!selectedPath || !currentVersionId || Boolean(viewing) || !idle || selectedAlready} title={viewing?"Return to current to reference a file":selectedPath} onClick={referenceFile}>{selectedAlready?"Added to chat":"Add file to chat"}</Button>}</div>}
      </div>
      {versionLoading && <p role="status" className="shrink-0 border-b px-3 py-2 text-sm text-ink-2">Loading version… Your current preview stays available.</p>}
      {versionError && <div role="alert" className="flex shrink-0 items-center gap-2 border-b px-3 py-2 text-sm"><p className="flex-1">{versionError.message}</p><Button size="sm" variant="ghost" onClick={()=>onView(versionError.id)}>Retry version</Button></div>}
      <VersionChecks versionId={viewing?.id ?? currentVersionId} />
      {viewing && tab !== "versions" && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-accent-soft px-3 py-2 text-base">
          <span className="flex-1 text-accent-ink">Viewing v{viewing.number}. Your current version is unchanged.</span>
          <Button size="sm" variant="ghost" onClick={() => currentVersionId && onView(currentVersionId)}>
            Back to current
          </Button>
          <Button size="sm" variant="primary" loading={restoring === viewing.id} onClick={() => onRestore(viewing.id)}>
            Restore v{viewing.number}
          </Button>
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        <TabsContent value="acceptance" className="m-0 h-full min-w-0"><AcceptancePanel onResolve={onResolve}/></TabsContent>
        <TabsContent value="preview" forceMount className="m-0 h-full min-w-0 data-[state=inactive]:hidden">
          <Preview />
        </TabsContent>
        {tab === "preview" && idle && !viewing && issues.length > 0 && !issuesDismissed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-[520px]">
              <IssueReport
                count={issues.length}
                message={issues[0].split("\n")[0]}
                onResolve={() => onResolve(issues)}
                onConsole={() => set({ consoleOpen: true })}
                onDismiss={() => set({ issuesDismissed: true })}
              />
            </div>
          </div>
        )}
        <TabsContent value="code" forceMount className="m-0 h-full min-w-0 data-[state=inactive]:hidden"><div className="flex h-full min-h-0 flex-col">{(viewing?.id ?? currentVersionId) && <div className="shrink-0 border-b px-3"><ExportButton versionId={(viewing?.id ?? currentVersionId)!} number={viewing?.number ?? versions.find(v=>v.id===currentVersionId)?.number ?? 1} /></div>}<div className="min-h-0 flex-1"><CodeView files={codeFiles} active={activeFile} writing={writing} onSelect={(p) => set({ activeFile: p })} visible={tab==="code"} scrollKey={`${useWorkspace.getState().projectId}:${viewing?.id ?? currentVersionId}`} /></div></div></TabsContent>
        <TabsContent value="versions" forceMount className="m-0 h-full min-w-0 data-[state=inactive]:hidden">
          {versions.length ? (
            <div className="h-full overflow-y-auto">
              <VersionDiff active={tab==="versions"} />
              <VersionList
                versions={versions.map((v) => ({ id: v.id, number: v.number, summary: v.summary, when: timeAgo(v.created_at), published: v.id === publishedVersionId }))}
                currentId={currentVersionId ?? ""}
                viewingId={viewing?.id}
                onView={onView}
                onRestore={idle ? onRestore : undefined}
              />
            <HistoryMore kind="versions" />
            </div>
          ) : (
            <p className="p-6 text-base text-ink-2">Each finished build is saved here as a version.</p>
          )}
        </TabsContent>
      </div>
      {consoleOpen && <div className={cn("shrink-0",tab!=="preview" && "hidden")}><ConsoleDrawer /></div>}
    </Tabs>
  );
}

/* ───────────────────────────── shell ───────────────────────────── */

export function Workspace({ initial, email, autostart }: { initial: WorkspaceInit; email: string; autostart: boolean }) {
  const params = useSearchParams();
  const [ready, setReady] = React.useState(false);
  const { run, stop, retry } = useRun();
  const { restore, view, busy } = useVersions();
  const title = useWorkspace((s) => s.title);
  const pane = useWorkspace((s) => s.pane);
  const set = useWorkspace((s) => s.set);
  const versions = useWorkspace((s) => s.versions);
  const currentVersionId = useWorkspace((s) => s.currentVersionId);
  const currentNumber = versions.find((v) => v.id === currentVersionId)?.number;

  // Initialise once per project; later server re-renders must not reset a run in progress.
  const initFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (initFor.current === initial.projectId) return;
    initFor.current = initial.projectId;
    useWorkspace.getState().init(initial);
    setReady(true);
  }, [initial]);

  // First build right after the project was created from the home page.
  const started = React.useRef(false);
  React.useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    // Drop ?autostart without a navigation (a refresh must not start another build).
    if (params.get("autostart")) window.history.replaceState(null, "", `/project/${initial.projectId}`);
    const last = initial.messages.at(-1);
    if (autostart && last?.role === "user") void run({ prompt: null });
  }, [ready, autostart, initial, params, run]);

  if (!ready) return null;

  return (
    <TooltipProvider>
      <div className="flex h-dvh flex-col bg-bg">
        <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:px-4">
          <Link href="/dashboard" aria-label="All projects" className="grid size-8 place-items-center disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-ink hover:bg-surface-2">
            <LogoMark className="size-5" />
          </Link>
          <h1 className="min-w-0 truncate text-base font-medium text-ink">{title}</h1>
          {currentNumber && <span className="tabular hidden rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-2 sm:inline">v{currentNumber}</span>}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div role="group" aria-label="Workspace panel" className="inline-flex rounded-full bg-surface-2 p-0.5 lg:hidden">
              {(["chat","app"] as const).map(value=><button key={value} type="button" aria-pressed={pane===value} aria-controls={`workspace-${value}-panel`} onClick={()=>set({pane:value})} className={cn("h-7 rounded-full px-3 text-sm font-medium text-ink-2",pane===value && "bg-surface text-ink shadow-sm")}>{value==="chat"?"Chat":"App"}</button>)}
            </div>
            <PublishDialog />
            <UserMenu email={email} />
          </div>
        </header>
        <SplitWorkspace pane={pane}
          chat={<Chat onSend={(prompt)=>void run({prompt})} onStop={stop} onRetry={()=>void retry()} onRestore={id=>void restore(id)} restoring={busy} />}
          app={<AppPanel onResolve={errors=>void run({prompt:null,mode:"fix",errors})} onView={id=>void view(id)} onRestore={id=>void restore(id)} restoring={busy} />}
        />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
