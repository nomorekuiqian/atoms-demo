import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Toaster } from "@/components/ui/toaster";
import { getCurrentUser, insforgeServer } from "@/lib/insforge/server";
import { type ProjectSummary } from "./project-row";

import { ProjectList } from "./project-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fdashboard");
  const { data, error } = await (await insforgeServer()).database
    .from("projects")
    .select("id, title, updated_at, published_slug, current:versions!projects_current_version_fk(number)")
    .order("updated_at", { ascending: false })
    .limit(100);
  type Row = Omit<ProjectSummary, "version"> & { current: { number: number } | null };
  const projects: ProjectSummary[] = ((data ?? []) as unknown as Row[]).map(({ current, ...p }) => ({
    ...p,
    version: current?.number ?? null,
  }));

  const renderedAt = Date.now();

  return (
    <AppShell user={user} title="My projects">
      <main className="mx-auto max-w-[880px] px-4 pb-24 pt-10 sm:px-6">
        <h1 className="font-serif text-display text-ink">Projects</h1>
        <p className="mt-3 text-base text-ink-2">Continue building, check what’s published, or start your next idea.</p>
        <div className="mt-8 overflow-hidden rounded-lg border bg-surface shadow-sm">
          {error ? (
            <EmptyState title="Couldn’t load projects" body="Refresh the page to try again." />
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              body="Describe an app and your team will build it."
              action={
                <Button asChild variant="primary">
                  <Link href="/">New project</Link>
                </Button>
              }
            />
          ) : (
            <ProjectList projects={projects} renderedAt={renderedAt} />
          )}
        </div>
      </main>
      <Toaster />
    </AppShell>
  );
}
