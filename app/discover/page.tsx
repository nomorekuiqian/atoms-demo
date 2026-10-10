import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { getCurrentUser } from "@/lib/insforge/server";
import { listPublished } from "@/lib/remix/load";
import { Explore } from "./explore";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Discover · Atoms Lite" };
export default async function DiscoverPage() {
  const [user,apps]=await Promise.all([getCurrentUser(),listPublished(100)]);
  return <AppShell user={user} title="Discover"><main className="mx-auto max-w-[1120px] px-4 pb-24 pt-10 sm:px-6"><h1 className="font-serif text-display text-ink">Discover</h1><p className="mt-3 max-w-[60ch] text-base text-ink-2">Useful little apps, playful experiments and starting points for your next idea. Try one, then make it yours.</p><Explore apps={apps}/></main></AppShell>;
}
