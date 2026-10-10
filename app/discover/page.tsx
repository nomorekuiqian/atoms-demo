import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/app/site-header";
import { AppThumbnail } from "@/components/app/app-thumbnail";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/insforge/server";
import { listPublished } from "@/lib/remix/load";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Discover · Atoms Lite" };

export default async function DiscoverPage() {
  const [user, apps] = await Promise.all([getCurrentUser(), listPublished()]);
  return (
    <div className="min-h-dvh">
      <SiteHeader email={user?.email} />
      <main className="mx-auto max-w-[1120px] px-4 pb-24 pt-10 sm:px-6">
        <h1 className="font-serif text-display text-ink">Discover</h1>
        <p className="mt-2 text-md text-ink-2">Apps people built and published. Open one, or remix it into your own project.</p>
        {apps.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-surface">
            <EmptyState title="Nothing published yet" body="Publish an app from your workspace and it shows up here." />
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <li key={app.slug} className="group overflow-hidden rounded-lg border bg-surface shadow-sm transition-shadow hover:shadow-md">
                <Link href={`/p/${app.slug}`} className="block" aria-label={`Open ${app.title}`}>
                  <AppThumbnail files={app.files} title={app.title} />
                </Link>
                <div className="flex items-center gap-3 border-t px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/p/${app.slug}`} className="block truncate text-md font-medium text-ink hover:underline">
                      {app.title}
                    </Link>
                    <p className="tabular text-sm text-ink-2">{timeAgo(app.updatedAt)}</p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/remix/${app.slug}`}>Remix</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
