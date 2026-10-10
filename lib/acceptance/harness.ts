import type { AcceptanceStep } from "@/lib/acceptance/contract";
import { buildPreviewHtml } from "@/lib/preview/buildPreviewHtml";
import type { Files } from "@/lib/agents/types";

/** Self-contained platform harness. No eval, network, parent DOM or host filesystem access. */
export function acceptanceHarness(identity: {
  sessionId: string;
  versionId: string;
}) {
  const post = window.parent.postMessage.bind(window.parent);
  const query = document.querySelectorAll.bind(document);
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const validSelector = /^(#[A-Za-z][\w-]*|\[data-testid="[A-Za-z][\w-]*"\])$/;
  const visible = (el: Element) =>
    el.getClientRects().length > 0 &&
    getComputedStyle(el).visibility !== "hidden" &&
    getComputedStyle(el).display !== "none";
  const text = (el: Element) =>
    String(el.textContent ?? "")
      .replace(/\s+/g, " ")
      .trim();
  let busy = false;
  const seen = new Set<string>();
  window.addEventListener("message", async (event: MessageEvent) => {
    const data = event.data;
    if (
      event.source !== window.parent ||
      !data ||
      data.type !== "atoms-acceptance-command" ||
      data.sessionId !== identity.sessionId ||
      data.versionId !== identity.versionId ||
      typeof data.actionId !== "string" ||
      data.actionId.length > 100 ||
      busy ||
      seen.has(data.actionId)
    )
      return;
    seen.add(data.actionId);
    if (seen.size > 24) return;
    busy = true;
    let status: "passed" | "failed" | "inconclusive" = "passed",
      detail = "";
    try {
      const step = data.step as AcceptanceStep;
      if (!step || !("selector" in step) || !validSelector.test(step.selector))
        throw new Error("Unsupported selector or operation.");
      const elements = () => Array.from(query(step.selector)).filter(visible);
      if (step.kind === "click" || step.kind === "fill") {
        // Startup can precede the host's visible-frame render or app hydration.
        // Wait for an actionable control, as assertions already wait for their result.
        const deadline = Date.now() + 1800;
        let found = elements();
        while (
          (found.length !== 1 || found[0].hasAttribute("disabled")) &&
          Date.now() < deadline
        ) {
          await sleep(100);
          found = elements();
        }
        if (found.length !== 1) {
          status = "failed";
          throw new Error(
            `Expected one visible control; found ${found.length}.`,
          );
        }
        const el = found[0] as HTMLElement;
        if (el.hasAttribute("disabled")) {
          status = "failed";
          throw new Error("Control is disabled.");
        }
        if (step.kind === "click") {
          if (
            el instanceof HTMLAnchorElement &&
            !el.getAttribute("href")?.startsWith("#")
          )
            throw new Error(
              "Navigation is outside the supported test actions.",
            );
          el.click();
          detail = `Clicked ${step.selector}`;
        } else {
          if (!(
            el instanceof HTMLInputElement ||
            el instanceof HTMLTextAreaElement ||
            el instanceof HTMLSelectElement
          ))
            throw new Error("Fill requires an input, textarea or select.");
          if (
            el instanceof HTMLInputElement &&
            ["password", "file", "hidden"].includes(el.type)
          )
            throw new Error("This input type is excluded from tests.");
          if (typeof step.value !== "string" || step.value.length > 300)
            throw new Error("Invalid input value.");
          const proto =
            el instanceof HTMLInputElement
              ? HTMLInputElement.prototype
              : el instanceof HTMLTextAreaElement
                ? HTMLTextAreaElement.prototype
                : HTMLSelectElement.prototype;
          Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(
            el,
            step.value,
          );
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          detail = `Filled ${step.selector}`;
        }
      } else {
        let matched = false;
        const deadline = Date.now() + 1800;
        do {
          const found = elements();
          if (step.kind === "expectCount") {
            matched = found.length === step.count;
            detail = `Visible count ${found.length}; expected ${step.count}`;
          } else if (found.length !== 1) {
            detail = `Expected one visible element; found ${found.length}`;
          } else if (step.kind === "expectText") {
            const actual = text(found[0]);
            matched =
              step.match === "equals"
                ? actual === step.text
                : actual.includes(step.text);
            detail = `Observed "${actual.slice(0, 220)}"; expected ${step.match} "${String(step.text).slice(0, 220)}"`;
          } else if (step.kind === "expectAttribute") {
            if (
              !["disabled", "aria-pressed", "aria-expanded", "type"].includes(
                step.name,
              )
            )
              throw new Error("Unsupported attribute.");
            const actual = found[0].getAttribute(step.name);
            matched = actual === step.value;
            detail = `${step.name}: ${JSON.stringify(actual)}; expected ${JSON.stringify(step.value)}`;
          } else throw new Error("Unsupported assertion.");
          if (matched) break;
          await sleep(100);
        } while (Date.now() < deadline);
        status = matched ? "passed" : "failed";
      }
    } catch (error) {
      if (status !== "failed") status = "inconclusive";
      detail =
        error instanceof Error
          ? error.message
          : "Action could not be executed.";
    }
    post(
      {
        source: "atoms-acceptance",
        ...identity,
        type: "step-result",
        actionId: data.actionId,
        status,
        detail: detail.slice(0, 600),
      },
      "*",
    );
    busy = false;
  });
}

export function buildAcceptanceHtml(
  files: Files,
  identity: { sessionId: string; versionId: string },
  storage: Record<string, string>,
): string {
  const html = buildPreviewHtml(files, {
    inject: true,
    session: { id: identity.sessionId, versionId: identity.versionId },
    storage,
  });
  const policy =
    "default-src 'none'; script-src 'unsafe-inline' data: https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com; style-src 'unsafe-inline' https:; img-src data: https:; font-src data: https:; connect-src 'none'; form-action 'none'; base-uri 'none';";
  const injection = `<meta http-equiv="Content-Security-Policy" content="${policy}"><script>(${acceptanceHarness.toString()})(${JSON.stringify(identity).replace(/</g, "\\u003c")});</script>`;
  const head = /<head\b[^>]*>/i.exec(html);
  return head
    ? html.slice(0, head.index + head[0].length) +
        injection +
        html.slice(head.index + head[0].length)
    : injection + html;
}
