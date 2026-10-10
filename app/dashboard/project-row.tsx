"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteProject, renameProject } from "@/lib/projects/actions";
import { timeAgo } from "@/lib/time";

export type ProjectSummary = {
  id: string;
  title: string;
  updated_at: string;
  published_slug: string | null;
  version?: number | null;
};

export function ProjectRow({ project }: { project: ProjectSummary }) {
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(project.title);
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus after the menu has closed and released focus.
  React.useEffect(() => {
    if (!editing) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(t);
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = title.trim();
    if (!next || next === project.title) return setTitle(project.title);
    startTransition(async () => {
      const r = await renameProject(project.id, next);
      if (r?.error) {
        toast(r.error);
        setTitle(project.title);
      }
    });
  };

  return (
    <li className="group relative flex h-16 items-center gap-4 border-b px-4 transition-colors last:border-b-0 hover:bg-surface-2">
      {editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setTitle(project.title);
              setEditing(false);
            }
          }}
          aria-label="Project name"
          maxLength={120}
          className="h-9 min-w-0 flex-1 rounded-sm border border-[color:var(--accent)] bg-surface px-2 text-md font-medium text-ink shadow-[0_0_0_3px_var(--accent-soft)] focus:outline-none"
        />
      ) : (
        <Link href={`/project/${project.id}`} className="min-w-0 flex-1 truncate text-md font-medium text-ink after:absolute after:inset-0">
          {title}
        </Link>
      )}
      <span className="tabular relative text-sm text-ink-2">{project.version ? `v${project.version}` : "Draft"}</span>
      {project.published_slug && (
        <span className="relative rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">Published</span>
      )}
      <span className="tabular hidden w-32 text-right text-sm text-ink-2 sm:block">{timeAgo(project.updated_at)}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label={`Actions for ${title}`} disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          // Keep focus in the rename field instead of returning it to the trigger.
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogTitle>Delete “{title}”?</DialogTitle>
          <DialogDescription>Its chat, versions and published link are removed. This can’t be undone.</DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await deleteProject(project.id);
                  if (r?.error) toast(r.error);
                  setConfirming(false);
                })
              }
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </li>
  );
}
