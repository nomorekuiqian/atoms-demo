import { Suspense } from "react";
import { SiteHeader } from "@/components/app/site-header";
import { getCurrentUser } from "@/lib/insforge/server";
import { HomeComposer } from "./home-composer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader email={user?.email} />
      <main className="flex flex-1 flex-col items-center px-4 pb-24 pt-[18vh]">
        <h1 className="text-balance text-center font-serif text-display text-ink sm:text-display-lg">
          What should we build?
        </h1>
        <div className="mt-10 flex w-full justify-center">
          <Suspense>
            <HomeComposer signedIn={Boolean(user)} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
