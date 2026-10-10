/**
 * Turn a multi-file project into one HTML document for a sandboxed iframe (srcdoc) or the public page.
 * Local <link rel="stylesheet"> and <script src> references are inlined; external URLs are left alone.
 */
import type { Files } from "@/lib/agents/types";

export type PreviewOptions = {
  /** Inject console/error capture and the storage bridge (workspace preview only). */
  inject?: boolean;
  /** Seed for the in-frame localStorage shim. */
  storage?: Record<string, string>;
};

const EXTERNAL = /^(?:[a-z]+:)?\/\//i;

function localPath(ref: string): string | null {
  const clean = ref.trim().split(/[?#]/)[0];
  if (!clean || EXTERNAL.test(clean) || clean.startsWith("data:")) return null;
  return clean.replace(/^\.\//, "").replace(/^\//, "");
}

const escapeScript = (code: string) => code.replace(/<\/script/gi, "<\\/script");
const escapeStyle = (css: string) => css.replace(/<\/style/gi, "<\\/style");
const attr = (tag: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i").exec(tag)?.[2];

export function inlineAssets(html: string, files: Files): { html: string; missing: string[] } {
  const missing: string[] = [];

  let out = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel\s*=\s*(["'])stylesheet\1/i.test(tag)) return tag;
    const href = attr(tag, "href");
    const path = href ? localPath(href) : null;
    if (!path) return tag;
    if (files[path] === undefined) {
      missing.push(path);
      return tag;
    }
    return `<style data-file="${path}">\n${escapeStyle(files[path])}\n</style>`;
  });

  out = out.replace(/<script\b([^>]*)>\s*<\/script>/gi, (tag, attrs: string) => {
    const src = attr(tag, "src");
    const path = src ? localPath(src) : null;
    if (!path) return tag;
    if (files[path] === undefined) {
      missing.push(path);
      return tag;
    }
    const rest = attrs.replace(/\s*\bsrc\s*=\s*(["']).*?\1/i, "");
    return `<script${rest} data-file="${path}">\n${escapeScript(files[path])}\n</script>`;
  });

  return { html: out, missing };
}

/** Runs first inside the preview: storage shim + console/error forwarding to the parent workspace. */
function captureScript(storage: Record<string, string>, missing: string[]): string {
  const seed = JSON.stringify(storage).replace(/</g, "\\u003c");
  const warn = JSON.stringify(missing.map((m) => `Missing file: ${m}`));
  return `<script data-atoms-preview>
(function () {
  var post = function (msg) { try { parent.postMessage(Object.assign({ source: "atoms-preview" }, msg), "*"); } catch (e) {} };
  function makeStorage(seed, persist) {
    var data = Object.assign({}, seed);
    var sync = function () { if (persist) post({ type: "storage", data: data }); };
    var api = {
      getItem: function (k) { k = String(k); return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
      setItem: function (k, v) { data[String(k)] = String(v); sync(); },
      removeItem: function (k) { delete data[String(k)]; sync(); },
      clear: function () { data = {}; sync(); },
      key: function (i) { return Object.keys(data)[i] || null; }
    };
    Object.defineProperty(api, "length", { get: function () { return Object.keys(data).length; } });
    return api;
  }
  // The sandbox has an opaque origin, so real Web Storage throws. Provide a shim the workspace persists.
  try { Object.defineProperty(window, "localStorage", { value: makeStorage(${seed}, true), configurable: true }); } catch (e) {}
  try { Object.defineProperty(window, "sessionStorage", { value: makeStorage({}, false), configurable: true }); } catch (e) {}

  var fmt = function (v) {
    if (v instanceof Error) return v.stack || v.message;
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  };
  ["log", "info", "warn", "error", "debug"].forEach(function (level) {
    var orig = console[level];
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      post({ type: "console", level: level, text: args.map(fmt).join(" ") });
      return orig && orig.apply(console, arguments);
    };
  });
  window.addEventListener("error", function (e) {
    post({ type: "error", message: e.message || "Error", stack: e.error && e.error.stack, line: e.lineno });
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    post({ type: "error", message: "Unhandled promise rejection: " + (r && r.message ? r.message : fmt(r)), stack: r && r.stack });
  });
  ${warn}.forEach(function (m) { post({ type: "console", level: "warn", text: m }); });
  post({ type: "ready" });
})();
</script>`;
}

function fallbackPage(message: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;display:grid;place-items:center;min-height:100vh;font:14px system-ui,sans-serif;color:#5d5d5d;background:#fff">${message}</body></html>`;
}

export function buildPreviewHtml(files: Files, opts: PreviewOptions = {}): string {
  const index = files["index.html"];
  if (!index?.trim()) return fallbackPage("Nothing to preview yet.");
  const { html, missing } = inlineAssets(index, files);
  if (!opts.inject) return html;

  const script = captureScript(opts.storage ?? {}, missing);
  const head = /<head\b[^>]*>/i.exec(html);
  if (head) return html.slice(0, head.index + head[0].length) + script + html.slice(head.index + head[0].length);
  const htmlTag = /<html\b[^>]*>/i.exec(html);
  if (htmlTag) return html.slice(0, htmlTag.index + htmlTag[0].length) + `<head>${script}</head>` + html.slice(htmlTag.index + htmlTag[0].length);
  return script + html;
}
