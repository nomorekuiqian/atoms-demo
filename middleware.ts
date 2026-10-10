import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";

const PROTECTED = ["/dashboard", "/project", "/preview", "/remix"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  await updateSession({ requestCookies: request.cookies, responseCookies: response.cookies });

  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const signedIn = Boolean(
    response.cookies.get("insforge_access_token")?.value ?? request.cookies.get("insforge_access_token")?.value,
  );

  if (needsAuth && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/refresh|p/).*)"],
};
