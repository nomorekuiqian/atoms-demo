import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { OAUTH_NEXT_COOKIE, OAUTH_VERIFIER_COOKIE } from "@/lib/auth/oauth";
const { exchange, createAuth } = vi.hoisted(() => ({ exchange: vi.fn(), createAuth: vi.fn() }));
vi.mock("@insforge/sdk/ssr", () => ({ createAuthActions: createAuth }));
import { GET } from "./route";

function request(query: string, verifier = "verifier", next = "/project/123?autostart=1") {
  const req = new NextRequest(`https://app.example/api/auth/callback${query}`);
  if (verifier) req.cookies.set(OAUTH_VERIFIER_COOKIE, verifier);
  req.cookies.set(OAUTH_NEXT_COOKIE, next);
  return req;
}
function expectCleared(response: Awaited<ReturnType<typeof GET>>) {
  expect(response.cookies.get(OAUTH_VERIFIER_COOKIE)?.value).toBe("");
  expect(response.cookies.get(OAUTH_NEXT_COOKIE)?.value).toBe("");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
}
beforeEach(() => {
  vi.resetAllMocks();
  createAuth.mockImplementation(({ responseCookies }) => ({ exchangeOAuthCode: async (...args: unknown[]) => {
    const result = await exchange(...args);
    if (result.data?.user) responseCookies.set("insforge_refresh_token", "session", { httpOnly: true });
    return result;
  } }));
  exchange.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
});
describe("OAuth callback", () => {
  it("exchanges PKCE on the server and preserves session cookies and destination", async () => {
    const response = await GET(request("?insforge_code=code"));
    expect(exchange).toHaveBeenCalledWith("code", "verifier");
    expect(response.headers.get("location")).toBe("https://app.example/project/123?autostart=1");
    expect(response.cookies.get("insforge_refresh_token")?.httpOnly).toBe(true);
    expectCleared(response);
  });
  it.each(["", "?error=access_denied", "?error=access_denied&insforge_code=code"])("handles cancellation or missing code: %s", async (query) => {
    const response = await GET(request(query));
    const url = new URL(response.headers.get("location")!);
    expect(url.searchParams.get("error")).toBe("oauth_failed");
    expect(url.searchParams.get("next")).toBe("/project/123?autostart=1");
    expect(exchange).not.toHaveBeenCalled();
    expectCleared(response);
  });
  it("rejects a missing or expired verifier", async () => {
    const response = await GET(request("?insforge_code=code", ""));
    expect(response.headers.get("location")).toContain("error=missing_verifier");
    expect(exchange).not.toHaveBeenCalled();
    expectCleared(response);
  });
  it.each(["https://evil.example", "//evil.example", "/\n/evil.example"])("rejects external destinations: %s", async (next) => {
    const response = await GET(request("?insforge_code=code", "verifier", next));
    expect(response.headers.get("location")).toBe("https://app.example/dashboard");
  });
  it.each(["error", "throw", "missing-user"])("recovers from exchange failure: %s", async (mode) => {
    if (mode === "throw") exchange.mockRejectedValue(new Error("network"));
    else exchange.mockResolvedValue({ data: null, error: mode === "error" ? { message: "expired" } : null });
    const response = await GET(request("?insforge_code=code"));
    expect(response.headers.get("location")).toContain("error=exchange_failed");
    expect(response.cookies.get("insforge_refresh_token")).toBeUndefined();
    expectCleared(response);
  });
});
