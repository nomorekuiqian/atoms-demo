import { describe, expect, it } from "vitest";
import { mergeFiles } from "./merge";

describe("mergeFiles", () => {
  it("keeps files Alex did not rewrite", () => {
    const r = mergeFiles({ "index.html": "<p>1</p>", "app.js": "a" }, { "app.js": "b" });
    expect(r).toEqual({ files: { "index.html": "<p>1</p>", "app.js": "b" } });
  });
  it("requires index.html", () => {
    expect(mergeFiles({}, { "app.js": "x" })).toEqual({ error: "The app has no index.html." });
  });
  it("limits file count", () => {
    const many = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`f${i}.js`, "x"]));
    expect("error" in mergeFiles({ "index.html": "x" }, many)).toBe(true);
  });
  it("limits file size", () => {
    expect("error" in mergeFiles({}, { "index.html": "x".repeat(100_001) })).toBe(true);
  });
});
