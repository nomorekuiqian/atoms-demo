import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/app/site-header";
import { AppThumbnail } from "@/components/app/app-thumbnail";
import { getCurrentUser } from "@/lib/insforge/server";
import { getPublished } from "@/lib/remix/load";
import { RemixButton } from "./remix-button";

export const dynamic = "force-dynamic";

export default async function RemixPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/remix/${slug}`)}`);
  const app = await getPublished(slug);
  if (!app) notFound();
  return (
    <div className="min-h-dvh">
      <SiteHeader email={user.email} />
      <main className="mx-auto flex max-w-[560px] flex-col items-center px-4 pb-24 pt-12 text-center">
        <h1 className="text-balance font-serif text-display text-ink">Remix “{app.title}”</h1>
        <p className="mt-3 text-md text-ink-2">You get your own copy of the code to change however you like. The original stays as it is.</p>
        <div className="mt-8 w-full overflow-hidden rounded-lg border bg-surface shadow-sm">
          <AppThumbnail files={app.files} title={app.title} />
        </div>
        <div className="mt-8">
          <RemixButton slug={slug} />
        </div>
        <Link href={`/p/${slug}`} className="mt-4 text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline">
          Open the app instead
        </Link>
      </main>
    </div>
  );
}
