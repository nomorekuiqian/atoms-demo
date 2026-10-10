import { afterEach, it, expect, vi } from "vitest";
import { acceptanceHarness, buildAcceptanceHtml } from "./harness";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("waits for a control to become visible before dispatching the action", async () => {
  vi.useFakeTimers();
  let visible = false;
  const click = vi.fn(),
    postMessage = vi.fn();
  const parent = { postMessage };
  let receive: (event: unknown) => Promise<void> = async () => {};
  vi.stubGlobal("window", {
    parent,
    addEventListener: (_name: string, callback: typeof receive) => {
      receive = callback;
    },
  });
  vi.stubGlobal("document", {
    querySelectorAll: () => [
      {
        getClientRects: () => (visible ? [{}] : []),
        hasAttribute: () => false,
        click,
      },
    ],
  });
  vi.stubGlobal("getComputedStyle", () => ({
    visibility: "visible",
    display: "block",
  }));
  vi.stubGlobal("HTMLAnchorElement", class {});
  acceptanceHarness({ sessionId: "s", versionId: "v" });
  const action = receive({
    source: parent,
    data: {
      type: "atoms-acceptance-command",
      sessionId: "s",
      versionId: "v",
      actionId: "a",
      step: { kind: "click", selector: "#add" },
    },
  });
  expect(click).not.toHaveBeenCalled();
  visible = true;
  await vi.advanceTimersByTimeAsync(100);
  await action;
  expect(click).toHaveBeenCalledOnce();
  expect(postMessage.mock.calls[0][0].status).toBe("passed");
});
it("adds restrictive test CSP and escapes identity before generated code", () => {
  const html = buildAcceptanceHtml(
    {
      "index.html":
        '<html><head></head><body><script>console.log("app")</script></body></html>',
    },
    { sessionId: "</script>", versionId: "v" },
    {},
  );
  expect(html).toContain("connect-src 'none'");
  expect(html.indexOf("atoms-acceptance-command")).toBeLessThan(
    html.indexOf('console.log("app")'),
  );
  expect(html).toContain("\\u003c/script>");
});
