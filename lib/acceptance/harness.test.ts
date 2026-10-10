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
it("ignores hidden descendants when asserting visible text", async () => {
  type Fake = { tagName: string; style: Record<string, string>; hidden?: boolean; childNodes: (Fake | { nodeType: 3; nodeValue: string })[] };
  const t = (nodeValue: string) => ({ nodeType: 3 as const, nodeValue });
  const el = (childNodes: Fake["childNodes"], style: Record<string, string> = {}, hidden = false): Fake & { nodeType: 1 } => ({ nodeType: 1, tagName: "SPAN", style: { visibility: "visible", display: "inline", ...style }, hidden, childNodes });
  const root = {
    ...el([
      t("Total: 3"),
      el([t(" (old 5)")], { display: "none" }),
      el([t(" draft"), el([t(" items")], { visibility: "visible" })], { visibility: "hidden" }),
      el([t(" 9 unread")], { position: "absolute", width: "1px", height: "1px" }),
      el([t(" faded")], { opacity: "0" }),
      el([t(" tip")], {}, true),
    ]),
    tagName: "P", getClientRects: () => [{}],
  };
  const postMessage = vi.fn(), parent = { postMessage };
  let receive: (event: unknown) => Promise<void> = async () => {};
  vi.stubGlobal("window", { parent, addEventListener: (_n: string, cb: typeof receive) => { receive = cb; } });
  vi.stubGlobal("document", { querySelectorAll: () => [root] });
  vi.stubGlobal("getComputedStyle", (node: Fake) => node.style);
  const withHidden = (node: Fake): unknown => ({ ...node, hasAttribute: (name: string) => name === "hidden" && !!node.hidden, childNodes: node.childNodes.map(c => "tagName" in c ? withHidden(c) : c) });
  Object.assign(root, withHidden(root));
  acceptanceHarness({ sessionId: "s", versionId: "v" });
  await receive({ source: parent, data: { type: "atoms-acceptance-command", sessionId: "s", versionId: "v", actionId: "a", step: { kind: "expectText", selector: "#total", text: "Total: 3 items", match: "equals" } } });
  expect(postMessage.mock.calls[0][0]).toMatchObject({ status: "passed" });
});
