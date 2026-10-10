"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Monitor, RotateCw, Smartphone, SquareTerminal, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { UserMenu } from "@/components/app/user-menu";
import { Toaster } from "@/components/ui/toaster";
import type { AgentEvent } from "@/lib/agents/types";
import { buildPreviewHtml } from "@/lib/preview/buildPreviewHtml";
import { readEvents } from "@/lib/sse/readEvents";
import { useWorkspace, type WorkspaceInit } from "@/lib/store/workspace";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { AgentMessage } from "./agent-message";
import { CodeView } from "./code-view";
import { Composer } from "./composer";
import { Markdown } from "./markdown";
import { PublishDialog } from "./publish-dialog";
import { VersionCard } from "./version-card";
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
  const controller = React.useRef<AbortController | null>(null);
  const store = useWorkspace;

  const run = React.useCallback(async (opts: { prompt: string | null; mode?: "build" | "fix"; errors?: string[] }) => {
    const s = store.getState();
    if (s.status !== "idle") return;
    s.startRun(opts.prompt);
    const ctrl = new AbortController();
    controller.current = ctrl;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: s.projectId, prompt: opts.prompt ?? undefined, mode: opts.mode, errors: opts.errors }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        store.getState().finishRun({ error: body?.error ?? "Couldn't start the build. Try again." });
        return;
      }
      for await (const e of readEvents<AgentEvent>(res.body)) store.getState().apply(e);
      store.getState().finishRun();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") store.getState().finishRun({ stopped: true });
      else store.getState().finishRun({ error: "The connection dropped. Your last version is unchanged." });
    } finally {
      controller.current = null;
    }
  }, [store]);

  const stop = React.useCallback(() => {
    store.getState().set({ status: "stopping" });
    controller.current?.abort();
  }, [store]);

  return { run, stop };
}

/* ───────────────────────────── chat ───────────────────────────── */

function Chat({ onSend, onStop, onRetry }: { onSend: (p: string) => void; onStop: () => void; onRetry: () => void }) {
  const messages = useWorkspace((s) => s.messages);
  const status = useWorkspace((s) => s.status);
  const runError = useWorkspace((s) => s.runError);
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
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-xl bg-surface-2 px-4 py-2.5 text-md text-ink">
              {m.content}
            </div>
          ) : (
            <AgentMessage key={m.id} agent={m.role} status={m.status} activity={m.activity}>
              {m.content.trim() && <Markdown text={m.content} />}
              {m.steps.length > 0 && <WorkingProcess steps={m.steps} />}
              {m.version && <VersionCard number={m.version.number} summary={m.version.summary} />}
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

function ToolButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          "grid size-8 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink [&_svg]:size-4",
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
  const files = useWorkspace((s) => s.files);
  const nonce = useWorkspace((s) => s.previewNonce);
  const device = useWorkspace((s) => s.device);
  const status = useWorkspace((s) => s.status);
  const frame = React.useRef<HTMLIFrameElement>(null);

  // Built once per version / refresh; storage is read at that moment only.
  const srcDoc = React.useMemo(
    () => (Object.keys(files).length ? buildPreviewHtml(files, { inject: true, storage: readAppStorage(projectId) }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, nonce, projectId],
  );

  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.source !== "atoms-preview") return;
      const { log } = useWorkspace.getState();
      if (e.data.type === "console") log({ level: e.data.level, text: String(e.data.text) });
      else if (e.data.type === "error") log({ level: "error", text: [e.data.message, e.data.stack].filter(Boolean).join("\n") });
      else if (e.data.type === "storage") {
        try {
          localStorage.setItem(storageKey(projectId), JSON.stringify(e.data.data));
        } catch {}
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [projectId]);

  if (!srcDoc) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <p className="text-base text-ink-2">{status === "idle" ? "Your app will appear here." : "Your app will appear here when Alex finishes."}</p>
      </div>
    );
  }
  return (
    <div className={cn("h-full", device === "phone" && "grid place-items-center overflow-auto bg-surface-2 p-4")}>
      <iframe
        ref={frame}
        key={nonce}
        title="App preview"
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-forms allow-modals"
        className={cn("block border-0 bg-[#ffffff]", device === "phone" ? "h-[760px] max-h-full w-[390px] rounded-lg border border-line shadow-md" : "h-full w-full")}
      />
    </div>
  );
}

function ConsoleDrawer() {
  const entries = useWorkspace((s) => s.console);
  const set = useWorkspace((s) => s.set);
  const list = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [entries]);
  return (
    <section aria-label="Console" className="flex h-48 shrink-0 flex-col border-t bg-surface">
      <header className="flex h-9 items-center gap-2 border-b px-3 text-sm">
        <span className="font-medium text-ink">Console</span>
        <span className="tabular text-ink-3">{entries.length}</span>
        <button type="button" onClick={() => set({ console: [] })} className="ml-auto rounded-sm px-2 py-0.5 text-ink-2 hover:bg-surface-2 hover:text-ink">
          Clear
        </button>
        <button type="button" aria-label="Close console" onClick={() => set({ consoleOpen: false })} className="grid size-6 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink">
          <X className="size-3.5" />
        </button>
      </header>
      <div ref={list} className="min-h-0 flex-1 overflow-auto py-1 font-mono text-[12px] leading-[18px]">
        {entries.length === 0 && <p className="px-3 py-2 font-sans text-sm text-ink-3">Logs and errors from your app show up here.</p>}
        {entries.map((e) => (
          <pre
            key={e.id}
            className={cn(
              "whitespace-pre-wrap border-b border-line px-3 py-1",
              e.level === "error" && "bg-danger-soft text-danger",
              e.level === "warn" && "bg-warning-soft text-warning",
            )}
          >
            {e.text}
          </pre>
        ))}
      </div>
    </section>
  );
}

function AppPanel() {
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
  const codeFiles = React.useMemo(() => ({ ...files, ...draft }), [files, draft]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-surface shadow-sm">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <Tabs value={tab} onValueChange={(v) => set({ tab: v as typeof tab })}>
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === "preview" && (
          <div className="ml-auto flex items-center gap-0.5">
            <span className="hidden items-center gap-0.5 sm:flex">
              <ToolButton label="Desktop" active={device === "desktop"} onClick={() => set({ device: "desktop" })}>
                <Monitor />
              </ToolButton>
              <ToolButton label="Phone" active={device === "phone"} onClick={() => set({ device: "phone" })}>
                <Smartphone />
              </ToolButton>
            </span>
            <ToolButton label="Refresh" onClick={() => set({ previewNonce: useWorkspace.getState().previewNonce + 1, console: [] })}>
              <RotateCw />
            </ToolButton>
            <ToolButton label="Open in new tab" onClick={() => window.open(`/preview/${useWorkspace.getState().projectId}`, "_blank", "noopener")}>
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
        )}
      </div>
      <div className="relative min-h-0 flex-1">
        <div className={cn("h-full", tab !== "preview" && "hidden")}>
          <Preview />
        </div>
        {tab === "code" && <CodeView files={codeFiles} active={activeFile} writing={writing} onSelect={(p) => set({ activeFile: p })} />}
        {tab === "versions" &&
          (versions.length ? (
            <div className="h-full overflow-y-auto">
              <VersionList
                versions={versions.map((v) => ({ id: v.id, number: v.number, summary: v.summary, when: timeAgo(v.created_at), published: v.id === publishedVersionId }))}
                currentId={currentVersionId ?? ""}
              />
            </div>
          ) : (
            <p className="p-6 text-base text-ink-2">Each finished build is saved here as a version.</p>
          ))}
      </div>
      {tab === "preview" && consoleOpen && <ConsoleDrawer />}
    </div>
  );
}

/* ───────────────────────────── shell ───────────────────────────── */

export function Workspace({ initial, email, autostart }: { initial: WorkspaceInit; email: string; autostart: boolean }) {
  const params = useSearchParams();
  const [ready, setReady] = React.useState(false);
  const { run, stop } = useRun();
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
          <Link href="/dashboard" aria-label="All projects" className="grid size-8 place-items-center rounded-full text-ink hover:bg-surface-2">
            <LogoMark className="size-5" />
          </Link>
          <h1 className="min-w-0 truncate text-base font-medium text-ink">{title}</h1>
          {currentNumber && <span className="tabular hidden rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-2 sm:inline">v{currentNumber}</span>}
          <div className="ml-auto flex items-center gap-2">
            <Tabs value={pane} onValueChange={(v) => set({ pane: v as "chat" | "app" })} className="md:hidden">
              <TabsList>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="app">App</TabsTrigger>
              </TabsList>
            </Tabs>
            <PublishDialog />
            <UserMenu email={email} />
          </div>
        </header>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 px-2 pb-2 md:grid-cols-[minmax(360px,38%)_1fr]">
          <div className={cn("min-h-0", pane === "chat" ? "block" : "hidden md:block")}>
            <Chat
              onSend={(prompt) => void run({ prompt })}
              onStop={stop}
              onRetry={() => void run({ prompt: null })}
            />
          </div>
          <div className={cn("min-h-0", pane === "app" ? "block" : "hidden md:block")}>
            <AppPanel />
          </div>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
