import { NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { safeNext } from "@/lib/auth/redirect";
import { OAUTH_NEXT_COOKIE, OAUTH_VERIFIER_COOKIE } from "@/lib/auth/oauth";

export async function GET(request: NextRequest) {
  const next = safeNext(request.cookies.get(OAUTH_NEXT_COOKIE)?.value);
  const finish = (response: NextResponse) => {
    response.cookies.delete(OAUTH_VERIFIER_COOKIE);
    response.cookies.delete(OAUTH_NEXT_COOKIE);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  const fail = (error: string) => {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", error);
    url.searchParams.set("next", next);
    return finish(NextResponse.redirect(url));
  };
  const code = request.nextUrl.searchParams.get("insforge_code");
  if (request.nextUrl.searchParams.has("error") || !code) return fail("oauth_failed");
  const verifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value;
  if (!verifier) return fail("missing_verifier");

  const response = NextResponse.redirect(new URL(next, request.url));
  try {
    const auth = createAuthActions({ requestCookies: request.cookies, responseCookies: response.cookies });
    const { data, error } = await auth.exchangeOAuthCode(code, verifier);
    if (error || !data?.user) return fail("exchange_failed");
  } catch {
    return fail("exchange_failed");
  }
  return finish(response);
}
