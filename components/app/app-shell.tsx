import Link from "next/link";
import { insforgeServer } from "@/lib/insforge/server";
import { AppNavigation, type RecentProject } from "./app-navigation";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";

export async function AppShell({ user, title, children }: { user: { id: string; email?: string } | null; title: string; children: React.ReactNode }) {
  let recent: RecentProject[] = [];
  let failed = false;
  if (user) {
    try {
      const {data, error} = await (await insforgeServer()).database.from("projects").select("id,title").eq("owner_id", user.id).order("updated_at", {ascending: false}).limit(5);
      failed = Boolean(error);
      if (!error) recent = (data ?? []) as RecentProject[];
    } catch { failed = true; }
  }
  return <div className="min-h-dvh md:pl-56">
    <AppNavigation signedIn={Boolean(user)} recent={recent} failed={failed} />
    <header className="flex h-16 items-center gap-2 px-4 sm:px-8">
      <AppNavigation mobile signedIn={Boolean(user)} recent={recent} failed={failed} />
      <span className="text-sm text-ink-2">{title}</span>
      <div className="ml-auto flex items-center gap-2">
        {user?.email ? <UserMenu email={user.email} /> : <><Button asChild variant="ghost"><Link href="/login">Log in</Link></Button><Button asChild variant="primary"><Link href="/login?mode=signup">Sign up</Link></Button></>}
      </div>
    </header>
    {children}
  </div>;
}
