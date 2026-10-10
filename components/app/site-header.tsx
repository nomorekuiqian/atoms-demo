import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";

export function SiteHeader({ email, children }: { email?: string | null; children?: React.ReactNode }) {
  return (
    <header className="flex h-16 items-center gap-2 px-4 sm:px-6">
      <Link href="/" className="rounded-sm" aria-label="Atoms Lite home">
        <Logo />
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link href="/discover">Discover</Link>
        </Button>
        {email && <Button asChild variant="ghost"><Link href="/dashboard">Projects</Link></Button>}
        {children}
        {email ? (
          <UserMenu email={email} />
        ) : (
          <>
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild variant="primary">
              <Link href="/login?mode=signup">Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
