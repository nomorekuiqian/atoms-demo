"use client";

import * as React from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FieldHint, Label } from "@/components/ui/input";
import { slugProblem, suggestSlug } from "@/lib/publish/slug";
import { useWorkspace } from "@/lib/store/workspace";

type Check = { state: "idle" | "checking" | "ok" | "bad"; message?: string };

function useSlugCheck(slug: string, projectId: string, enabled: boolean): Check {
  const [check, setCheck] = React.useState<Check>({ state: "idle" });
  React.useEffect(() => {
    if (!enabled) return;
    const problem = slugProblem(slug);
    if (problem) {
      setCheck({ state: "bad", message: problem });
      return;
    }
    setCheck({ state: "checking" });
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slug-available?slug=${encodeURIComponent(slug)}&projectId=${projectId}`, { signal: ctrl.signal });
        const body = await res.json();
        setCheck(body.available ? { state: "ok" } : { state: "bad", message: body.problem ?? "That link is taken." });
      } catch {
        /* aborted or offline: the publish call validates again */
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [slug, projectId, enabled]);
  return check;
}

function LinkRow({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="flex items-center gap-2 rounded-md border bg-surface-2 p-1 pl-3">
      <a href={url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-base text-ink underline-offset-4 hover:underline">
        {url.replace(/^https?:\/\//, "")}
      </a>
      <Button
        size="sm"
        variant="secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            toast("Couldn't copy. Select the link instead.");
          }
        }}
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button asChild size="sm" variant="ghost" aria-label="Open in a new tab">
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink />
        </a>
      </Button>
    </div>
  );
}

export function PublishDialog() {
  const projectId = useWorkspace((s) => s.projectId);
  const title = useWorkspace((s) => s.title);
  const slug = useWorkspace((s) => s.publishedSlug);
  const publishedVersionId = useWorkspace((s) => s.publishedVersionId);
  const currentVersionId = useWorkspace((s) => s.currentVersionId);
  const versions = useWorkspace((s) => s.versions);
  const set = useWorkspace((s) => s.set);

  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState<"publish" | "unpublish" | null>(null);
  const [error, setError] = React.useState<string>();
  const [justPublished, setJustPublished] = React.useState(false);
  const check = useSlugCheck(draft, projectId, open && !slug);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = slug ? `${origin}/p/${slug}` : "";
  const number = (id: string | null) => versions.find((v) => v.id === id)?.number;
  const outdated = Boolean(slug && publishedVersionId !== currentVersionId);

  const publish = async (nextSlug: string) => {
    setBusy("publish");
    setError(undefined);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: nextSlug }),
      });
      const body = await res.json();
      if (!res.ok) return setError(body.error ?? "Couldn't publish. Try again.");
      set({ publishedSlug: body.slug, publishedVersionId: body.versionId });
      setJustPublished(true);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const unpublish = async () => {
    setBusy("unpublish");
    try {
      const res = await fetch(`/api/projects/${projectId}/publish`, { method: "DELETE" });
      if (!res.ok) return toast("Couldn't unpublish. Try again.");
      set({ publishedSlug: null, publishedVersionId: null });
      setDraft(suggestSlug(title));
      setJustPublished(false);
      toast("Unpublished. The link no longer works.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setDraft(slug ?? suggestSlug(title));
          setError(undefined);
          setJustPublished(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="primary" disabled={!currentVersionId}>
          {slug ? "Published" : "Publish"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {slug ? (
          <>
            <DialogTitle>{justPublished ? "Your app is live!" : "Published"}</DialogTitle>
            <DialogDescription>
              Anyone with the link can use v{number(publishedVersionId)}.
            </DialogDescription>
            <div className="mt-5">
              <LinkRow url={url} />
            </div>
            {outdated && (
              <div className="mt-4 flex items-center gap-3 rounded-md border px-3 py-2.5">
                <p className="flex-1 text-base text-ink">v{number(currentVersionId)} isn’t live yet.</p>
                <Button size="sm" variant="primary" loading={busy === "publish"} onClick={() => publish(slug)}>
                  Update to v{number(currentVersionId)}
                </Button>
              </div>
            )}
            {error && <FieldHint error className="mt-3">{error}</FieldHint>}
            <div className="mt-6 flex justify-between gap-2">
              <Button variant="ghost" className="text-danger hover:text-danger" loading={busy === "unpublish"} onClick={unpublish}>
                Unpublish
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (check.state !== "bad") void publish(draft);
            }}
          >
            <DialogTitle>Publish</DialogTitle>
            <DialogDescription>Anyone with the link can use v{number(currentVersionId)}. You can unpublish any time.</DialogDescription>
            <div className="mt-5 space-y-1.5">
              <Label htmlFor="publish-slug">Link</Label>
              <div className="flex h-10 items-center rounded-md border border-line-strong bg-surface pl-3 text-base transition-[border-color,box-shadow] focus-within:border-[color:var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)] has-[[aria-invalid=true]]:border-danger">
                <span className="shrink-0 text-ink-2">{origin.replace(/^https?:\/\//, "")}/p/</span>
                <input
                  id="publish-slug"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  aria-invalid={check.state === "bad" || Boolean(error) || undefined}
                  aria-describedby="publish-slug-hint"
                  maxLength={30}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-full min-w-0 flex-1 bg-transparent pr-3 text-ink focus:outline-none"
                />
              </div>
              <FieldHint id="publish-slug-hint" error={check.state === "bad" || Boolean(error)}>
                {error ?? (check.state === "bad" ? check.message : check.state === "ok" ? "Available." : "6–30 lowercase letters, numbers or hyphens.")}
              </FieldHint>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={busy === "publish"} disabled={check.state === "bad" || check.state === "checking"}>
                Publish
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
