import { Suspense } from "react";
import Image from "next/image";
import { SiteHeader } from "@/components/app/site-header";
import { getCurrentUser } from "@/lib/insforge/server";
import { HomeComposer } from "./home-composer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader email={user?.email} />
      <main className="flex flex-1 flex-col items-center px-4 pb-16 pt-8 sm:pt-[6vh]">
        <Image
          src="/assets/illustrations/build-still-life-v1.webp"
          alt=""
          aria-hidden="true"
          width={840}
          height={480}
          priority
          unoptimized
          draggable={false}
          className="pointer-events-none h-[160px] w-[280px] select-none object-contain sm:h-[220px] sm:w-[385px]"
        />
        <h1 className="text-balance text-center font-serif text-display text-ink sm:text-display-lg">
          What should we build?
        </h1>
        <div className="mt-7 flex w-full justify-center sm:mt-9">
          <Suspense>
            <HomeComposer signedIn={Boolean(user)} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
