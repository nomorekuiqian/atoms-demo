import { describe, expect, it } from "vitest";
import { buildPreviewHtml, inlineAssets } from "./buildPreviewHtml";

const files = {
  "index.html": `<!doctype html><html><head><link rel="stylesheet" href="./style.css"><link rel="icon" href="x.png"></head>
<body><script src="app.js"></script><script src="https://cdn.tailwindcss.com"></script><script type="module" src="/mod.js"></script></body></html>`,
  "style.css": "body{color:red}",
  "app.js": 'console.log("</script>")',
  "mod.js": "export {}",
};

describe("inlineAssets", () => {
  it("inlines local CSS and JS with and without ./ or / prefixes", () => {
    const { html, missing } = inlineAssets(files["index.html"], files);
    expect(html).toContain("<style data-file=\"style.css\">\nbody{color:red}\n</style>");
    expect(html).toContain('<script data-file="app.js">');
    expect(html).toContain('<script type="module" data-file="mod.js">');
    expect(missing).toEqual(["x.png"]);
  });

  it("leaves external and non-stylesheet references alone", () => {
    const { html } = inlineAssets(files["index.html"], files);
    expect(html).toContain('<script src="https://cdn.tailwindcss.com"></script>');
    expect(html).toContain('<link rel="icon" href="x.png">');
  });

  it("escapes closing script tags inside inlined JS", () => {
    const { html } = inlineAssets(files["index.html"], files);
    expect(html).toContain('console.log("<\\/script>")');
    expect(html.match(/<\/script>/g)?.length).toBe(3);
  });

  it("reports missing local files and keeps their tags", () => {
    const { html, missing } = inlineAssets('<script src="gone.js"></script>', {});
    expect(missing).toEqual(["gone.js"]);
    expect(html).toBe('<script src="gone.js"></script>');
  });
});

describe("buildPreviewHtml", () => {
  it("injects the capture script first in <head>", () => {
    const html = buildPreviewHtml(files, { inject: true, storage: { a: "1" } });
    const head = html.indexOf("<head>");
    expect(html.indexOf("data-atoms-preview")).toBeGreaterThan(head);
    expect(html.indexOf("data-atoms-preview")).toBeLessThan(html.indexOf('data-file="style.css"'));
    expect(html).toContain('{"a":"1"}');
  });

  it("does not inject for the published page", () => {
    expect(buildPreviewHtml(files)).not.toContain("data-atoms-preview");
  });

  it("handles documents without <head>", () => {
    expect(buildPreviewHtml({ "index.html": "<p>hi</p>" }, { inject: true }).startsWith("<script data-atoms-preview>")).toBe(true);
    expect(buildPreviewHtml({ "index.html": "<html><body>x</body></html>" }, { inject: true })).toContain("<html><head><script data-atoms-preview>");
  });

  it("escapes < in seeded storage so it cannot close the script", () => {
    expect(buildPreviewHtml({ "index.html": "<p></p>" }, { inject: true, storage: { k: "</script><b>" } })).not.toContain("</script><b>");
  });

  it("returns a fallback page when there is no index.html", () => {
    expect(buildPreviewHtml({ "app.js": "x" })).toContain("Nothing to preview yet.");
  });
});

it("preserves external defer scheduling using an exact UTF-8 data URL",()=>{
 const code='document.querySelector("button").textContent="你好";';
 const html=buildPreviewHtml({'index.html':'<head><script src="app.js" defer></script></head><body><button>before</button></body>','app.js':code});
 expect(html).toContain('defer');
 const encoded=html.match(/base64,([^"<>]+)/)?.[1];
 expect(Buffer.from(encoded!,"base64").toString("utf8")).toBe(code);
});

it('uses the same normalized resource paths as static checking and supports bare attributes', () => {
  const html = buildPreviewHtml({'index.html':'<script src=./js/../app.js></script>', 'app.js':'console.log("works")'});
  expect(html).toContain('console.log("works")');
  expect(html).not.toContain('src=');
});
it('embeds SVG images and nested CSS assets without rewriting script strings', () => {
  const html = buildPreviewHtml({'index.html':'<link rel=stylesheet href=css/main.css><img src=icon.svg><script>const x = \'<img src="icon.svg">\';</script>', 'css/main.css':'p{background:url(../icon.svg)}', 'icon.svg':'<svg/>'});
  expect(html.match(/data:image\/svg\+xml;base64,/g)).toHaveLength(2);
  expect(html).toContain('const x = \'<img src="icon.svg">\'');
});
it('inlines CSS imports relative to the imported file and preserves media', () => {
  const html = buildPreviewHtml({'index.html':'<link rel=stylesheet href=css/main.css>', 'css/main.css':'@import "other.css" screen;', 'css/other.css':'p{background:url(../icon.svg)}', 'icon.svg':'<svg/>'});
  expect(html).toContain('@media screen');
  expect(html).toContain('data:image/svg+xml;base64,');
});
