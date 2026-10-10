import { describe, expect, it } from "vitest";
import { StreamedStringObject } from "./input-stream";

const json = JSON.stringify({ path: "app.js", content: 'const s = "a\\b";\n\tlet x = "é 😀 </script>";\u0001' });

describe("StreamedStringObject", () => {
  it("decodes the same values as JSON.parse at every split point", () => {
    for (const size of [1, 2, 3, 7, 64]) {
      const s = new StreamedStringObject();
      let previous = "";
      for (let i = 0; i < json.length; i += size) {
        s.push(json.slice(i, i + size));
        const now = s.read("content")?.value ?? "";
        expect(now.startsWith(previous)).toBe(true);
        previous = now;
      }
      expect(s.fields).toEqual(JSON.parse(json));
    }
  });

  it("exposes an in-progress prefix and marks completion", () => {
    const s = new StreamedStringObject().push('{"path": "index.html", "content": "<h1>Hi\\');
    expect(s.read("path")).toEqual({ value: "index.html", complete: true });
    expect(s.read("content")).toEqual({ value: "<h1>Hi", complete: false });
    s.push('n</h1>"}');
    expect(s.read("content")).toEqual({ value: "<h1>Hi\n</h1>", complete: true });
  });

  it("handles content before path and stops on non-string values", () => {
    const s = new StreamedStringObject().push('{"content":"x","path":"a.js"}');
    expect(s.fields).toEqual({ content: "x", path: "a.js" });
    const bad = new StreamedStringObject().push('{"path":1,"content":"x"}');
    expect(bad.read("content")).toBeUndefined();
  });
});
