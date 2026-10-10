"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Copy,
  ExternalLink,
  Monitor,
  MoreHorizontal,
  Pencil,
  RotateCw,
  Smartphone,
  SquareTerminal,
  Trash2,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldHint, Input, Label } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { AgentAvatar } from "@/components/workspace/agent-avatar";
import { AgentMessage, AgentPending } from "@/components/workspace/agent-message";
import { CodeView } from "@/components/workspace/code-view";
import { VersionList } from "@/components/workspace/version-list";
import { ProjectRow } from "@/app/dashboard/project-row";
import { Composer } from "@/components/workspace/composer";
import { IssueReport } from "@/components/workspace/issue-report";
import { VersionCard } from "@/components/workspace/version-card";
import { WorkingProcess } from "@/components/workspace/working-process";
import { cn } from "@/lib/utils";

const EXAMPLES = ["Pomodoro timer", "Expense tracker", "Snake game", "Personal homepage"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t py-10">
      <h2 className="mb-6 text-xl font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function IconButton({ label, active, children }: { label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
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

function PomodoroApp() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-[#fff8f1] text-[#3b2f2f]">
      <p className="text-lg font-medium">Focus</p>
      <p className="tabular text-[96px] font-semibold leading-none tracking-[-0.03em]">24:59</p>
      <div className="flex gap-3">
        <span className="rounded-full bg-[#b9412f] px-7 py-3 font-medium text-[#ffffff]">Pause</span>
        <span className="rounded-full border border-[#ead8c7] bg-[#ffffff] px-7 py-3 font-medium">Reset</span>
      </div>
      <p className="text-[#6b5a4a]">Today: 3 pomodoros</p>
    </div>
  );
}

const FILES: Record<string, string> = {
  "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Focus</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main class="timer">
      <p class="label">Focus</p>
      <p id="clock" class="clock">25:00</p>
      <p id="today">Today: 0 pomodoros</p>
    </main>
    <script src="app.js"></script>
  </body>
</html>`,
  "style.css": `body { margin: 0; font-family: system-ui; background: #fff8f1; }\n.clock { font-size: 96px; font-weight: 600; }`,
  "app.js": `const key = new Date().toDateString();\nlet done = Number(localStorage.getItem(key) ?? 0);\n\nfunction finish() {\n  done += 1;\n  localStorage.setItem(key, String(done));\n  render();\n}`,
};

const VERSIONS = [
  { id: "v2", number: 2, summary: "Dark theme, larger buttons", when: "4 min ago", published: true },
  { id: "v1", number: 1, summary: "Pomodoro timer", when: "12 min ago" },
];

function Workspace({ initialTab, initialPane }: { initialTab: string; initialPane: "chat" | "app" }) {
  const [draft, setDraft] = React.useState("");
  const [pane, setPane] = React.useState<"chat" | "app">(initialPane);
  const [tab, setTab] = React.useState(initialTab);
  const [file, setFile] = React.useState("app.js");
  return (
    <div className="flex h-[680px] flex-col overflow-hidden rounded-lg border bg-bg shadow-sm md:h-[760px]">
      <header className="flex h-14 items-center gap-2 px-4">
        <LogoMark className="size-5" />
        <button type="button" className="flex min-w-0 items-center gap-1 rounded-full px-2 py-1 text-base font-medium hover:bg-surface-2">
          <span className="truncate">Pomodoro timer</span> <ChevronDown className="size-3.5 shrink-0 text-ink-2" aria-hidden />
        </button>
        <span className="tabular hidden rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-2 sm:inline">v2</span>
        <div className="ml-auto flex items-center gap-2">
          <Tabs value={pane} onValueChange={(v) => setPane(v as "chat" | "app")} className="md:hidden">
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="app">App</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="secondary" className="hidden sm:inline-flex">Share</Button>
          <Button variant="primary">Publish</Button>
        </div>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 px-2 pb-2 md:grid-cols-[minmax(360px,38%)_1fr]">
        <div className={cn("min-h-0 flex-col", pane === "chat" ? "flex" : "hidden md:flex")}>
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-4">
            <div className="ml-auto w-fit max-w-[85%] rounded-xl bg-surface-2 px-4 py-2.5 text-md text-ink">
              Add a counter for how many pomodoros I finished today.
            </div>
            <AgentMessage agent="mike" status="done">
              <p>Small change, so this goes straight to Alex: a daily counter saved in the browser that resets at midnight.</p>
            </AgentMessage>
            <AgentMessage agent="alex" status="working" activity="Writing app.js">
              <WorkingProcess
                steps={[
                  { kind: "note", text: "I'll add the counter next to the timer and store it per day." },
                  { kind: "tool", action: "Read", path: "app.js", status: "done" },
                  { kind: "tool", action: "Write", path: "index.html", status: "done" },
                  { kind: "tool", action: "Write", path: "style.css", status: "done" },
                  { kind: "tool", action: "Write", path: "app.js", status: "running" },
                ]}
              />
            </AgentMessage>
          </div>
          <div className="px-2 pb-2">
            <Composer value={draft} onChange={setDraft} onSubmit={() => setDraft("")} busy onStop={() => toast("Stopped. v2 is unchanged.")} placeholder="Describe a change" />
          </div>
        </div>
        <div className={cn("min-h-0 flex-col overflow-hidden rounded-lg border bg-surface shadow-sm", pane === "app" ? "flex" : "hidden md:flex")}>
          <div className="flex h-12 items-center gap-2 border-b px-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="versions">Versions</TabsTrigger>
              </TabsList>
            </Tabs>
            {tab === "preview" && (
              <div className="ml-auto hidden items-center gap-0.5 sm:flex">
                <IconButton label="Desktop" active>
                  <Monitor />
                </IconButton>
                <IconButton label="Phone">
                  <Smartphone />
                </IconButton>
                <IconButton label="Refresh">
                  <RotateCw />
                </IconButton>
                <IconButton label="Open in new tab">
                  <ExternalLink />
                </IconButton>
                <span className="mx-1 h-4 w-px bg-line-strong" aria-hidden />
                <IconButton label="Console">
                  <SquareTerminal />
                </IconButton>
              </div>
            )}
          </div>
          <div className="relative min-h-0 flex-1">
            {tab === "preview" && (
              <>
                <PomodoroApp />
                <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
                  <IssueReport count={1} message="TypeError: Cannot read properties of null (reading 'textContent')" onResolve={() => toast("Alex is fixing 1 error")} onConsole={() => {}} />
                </div>
              </>
            )}
            {tab === "code" && <CodeView files={FILES} active={file} writing="app.js" onSelect={setFile} />}
            {tab === "versions" && <VersionList versions={VERSIONS} currentId="v2" onRestore={(id) => toast(`Restored ${id} as v3`)} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [draft, setDraft] = React.useState("");
  return (
    <div className="flex flex-col items-center rounded-lg border bg-bg px-6 pb-20 pt-24">
      <h1 className="text-balance text-center font-serif text-display text-ink sm:text-display-lg">What should we build?</h1>
      <Composer
        size="lg"
        value={draft}
        onChange={setDraft}
        onSubmit={() => setDraft("")}
        className="mt-10 w-full max-w-[720px] shadow-md"
        placeholder="Describe the app you want to build"
      />
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((e) => (
          <button key={e} type="button" onClick={() => setDraft(`Build a ${e.toLowerCase()}`)} className="h-8 rounded-full border bg-surface px-3.5 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

const SWATCHES = [
  ["bg", "--bg"], ["surface", "--surface"], ["surface-2", "--surface-2"], ["surface-3", "--surface-3"],
  ["ink", "--ink"], ["ink-2", "--ink-2"], ["ink-3", "--ink-3"], ["accent", "--accent"],
  ["accent-soft", "--accent-soft"], ["danger", "--danger"], ["success", "--success"], ["warning", "--warning"],
] as const;

export function Specimen({
  initialTheme,
  initialTab,
  initialPane,
}: {
  initialTheme: "light" | "dark";
  initialTab: string;
  initialPane: "chat" | "app";
}) {
  const [theme, setTheme] = React.useState(initialTheme);
  return (
    <TooltipProvider>
      <div className={cn(theme === "dark" && "dark", "min-h-dvh bg-bg text-ink")}>
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8">
          <div className="mb-8 flex items-center justify-between">
            <Logo />
            <Tabs value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
              <TabsList>
                <TabsTrigger value="light">Light</TabsTrigger>
                <TabsTrigger value="dark">Dark</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Workspace initialTab={initialTab} initialPane={initialPane} />

          <Section title="Home">
            <Home />
          </Section>

          <Section title="Color">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {SWATCHES.map(([name, v]) => (
                <div key={name} className="overflow-hidden rounded-md border bg-surface">
                  <div className="h-14 border-b" style={{ background: `var(${v})` }} />
                  <p className="px-3 py-2 font-mono text-xs text-ink-2">{name}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {(["mike", "emma", "bob", "alex"] as const).map((a) => (
                <span key={a} className="flex items-center gap-2 text-base text-ink-2">
                  <AgentAvatar agent={a} /><AgentAvatar agent={a} size="sm" /> {a[0].toUpperCase() + a.slice(1)}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Type">
            <div className="space-y-4">
              <p className="font-serif text-display sm:text-display-lg">What should we build?</p>
              <p className="font-serif text-display">Your projects</p>
              <p className="text-2xl font-semibold">Publish your app</p>
              <p className="text-xl font-semibold">Versions</p>
              <p className="text-lg">Alex is writing app.js</p>
              <p className="max-w-[65ch] text-md text-ink">Small change, so this goes straight to Alex: a daily counter saved in the browser that resets at midnight.</p>
              <p className="text-base text-ink-2">Updated 3 minutes ago</p>
              <p className="text-sm text-ink-2">6–30 lowercase letters, numbers or hyphens</p>
              <p className="font-mono text-sm">const today = new Date().toDateString();</p>
            </div>
          </Section>

          <Section title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Publish</Button>
              <Button variant="secondary">Share</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="secondary">Remix</Button>
              <Button variant="danger">Delete project</Button>
              <Button variant="primary" loading>Publishing</Button>
              <Button variant="secondary" disabled>Disabled</Button>
              <Button variant="primary" size="lg">Continue with demo account</Button>
              <Button variant="ghost" size="icon" aria-label="More"><MoreHorizontal /></Button>
            </div>
          </Section>

          <Section title="Fields">
            <div className="grid max-w-[720px] gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Link</Label>
                <Input id="slug" defaultValue="Hello" aria-invalid="true" />
                <FieldHint error>Use 6–30 lowercase letters, numbers or hyphens.</FieldHint>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" disabled placeholder="Disabled" />
              </div>
            </div>
          </Section>

          <Section title="Messages and versions">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
              <div className="min-w-0 space-y-7">
                <AgentMessage agent="emma" status="done">
                  <ul className="list-disc space-y-1 pl-5 marker:text-ink-3">
                    <li>25-minute focus, 5-minute break</li>
                    <li>Start, pause and reset</li>
                    <li>Count of sessions finished today</li>
                  </ul>
                </AgentMessage>
                <AgentMessage agent="alex" status="stopped">
                  <p className="text-ink-2">Stopped before finishing. Your last version is unchanged.</p>
                </AgentMessage>
                <AgentMessage agent="bob" status="failed">
                  <p className="text-ink-2">The model didn&apos;t respond.</p>
                  <Button variant="secondary" size="sm">Try again</Button>
                </AgentMessage>
              </div>
              <div className="min-w-0 space-y-3">
                <AgentPending agent="bob" label="Bob is planning the files" />
                <VersionCard number={3} summary="Daily counter" current />
                <VersionCard number={2} summary="Dark theme, larger buttons" onRestore={() => toast("Restored v2 as v4")} />
                              </div>
            </div>
          </Section>

          <Section title="Menus, dialogs, toasts">
            <div className="flex flex-wrap items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">Project <ChevronDown aria-hidden /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem><Pencil /> Rename</DropdownMenuItem>
                  <DropdownMenuItem><Copy /> Copy link</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive><Trash2 /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="primary">Publish</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Publish</DialogTitle>
                  <DialogDescription>Anyone with the link can use this app.</DialogDescription>
                  <div className="mt-5 space-y-1.5">
                    <Label htmlFor="pub-slug">Link</Label>
                    <div className="flex h-10 items-center rounded-md border border-line-strong bg-surface pl-3 text-base focus-within:border-[color:var(--accent)]">
                      <span className="text-ink-2">your-site/p/</span>
                      <input id="pub-slug" defaultValue="my-pomodoro" className="h-full min-w-0 flex-1 bg-transparent pr-3 text-ink focus:outline-none" />
                    </div>
                    <FieldHint>6–30 lowercase letters, numbers or hyphens.</FieldHint>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="primary">Publish</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="secondary" onClick={() => toast("Link copied")}>Show toast</Button>
            </div>
          </Section>

          <Section title="Projects">
            <div className="overflow-hidden rounded-lg border bg-surface shadow-sm">
              <ul>
                <ProjectRow renderedAt={new Date("2026-10-10T00:00:00Z").getTime()} project={{ id: "00000000-0000-0000-0000-000000000001", title: "Pomodoro timer", updated_at: new Date(Date.now() - 4 * 60000).toISOString(), published_slug: "my-pomodoro", version: 3 }} />
                <ProjectRow renderedAt={new Date("2026-10-10T00:00:00Z").getTime()} project={{ id: "00000000-0000-0000-0000-000000000002", title: "Expense tracker", updated_at: new Date(Date.now() - 26 * 3600000).toISOString(), published_slug: null, version: 1 }} />
              </ul>
            </div>
          </Section>

          <Section title="Empty state">
            <div className="rounded-lg border bg-surface">
              <EmptyState title="No projects yet" body="Describe an app on the home page and your team will build it." action={<Button variant="primary">New project</Button>} />
            </div>
          </Section>
        </div>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
