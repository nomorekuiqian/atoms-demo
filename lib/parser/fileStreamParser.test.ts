import { describe, expect, it } from "vitest";
import { parseAll, validatePath, type ParserEvent } from "./fileStreamParser";

/** Merge adjacent deltas so chunking does not affect equality. */
function normalize(events: ParserEvent[]) {
  const out: ParserEvent[] = [];
  for (const e of events) {
    const last = out[out.length - 1];
    if (e.type === "text" && last?.type === "text") last.delta += e.delta;
    else if (e.type === "file_delta" && last?.type === "file_delta" && last.path === e.path) last.delta += e.delta;
    else out.push({ ...e });
  }
  return out;
}

function files(events: ParserEvent[]) {
  const map: Record<string, string> = {};
  for (const e of events) if (e.type === "file_delta") map[e.path] = (map[e.path] ?? "") + e.delta;
  return map;
}

const SAMPLE = `I'll build it in two files.
<file path="index.html">
<!doctype html><script src="app.js"></script><p>a < b && c > d</p>
</file>
<file path='app.js'>
if (a < b) console.log("</fil" + "e>");
</file>
<summary>Pomodoro timer with daily count</summary>`;

describe("FileStreamParser", () => {
  it("parses files, narration and summary from one chunk", () => {
    const ev = normalize(parseAll([SAMPLE]));
    expect(ev[0]).toEqual({ type: "text", delta: "I'll build it in two files.\n" });
    expect(files(ev)).toEqual({
      "index.html": `\n<!doctype html><script src="app.js"></script><p>a < b && c > d</p>\n`,
      "app.js": `\nif (a < b) console.log("</fil" + "e>");\n`,
    });
    expect(ev.filter((e) => e.type === "file_start").map((e) => (e as { path: string }).path)).toEqual(["index.html", "app.js"]);
    expect(ev.at(-1)).toEqual({ type: "summary", text: "Pomodoro timer with daily count" });
  });

  it("gives identical results when split at every character", () => {
    const whole = normalize(parseAll([SAMPLE]));
    const perChar = normalize(parseAll(SAMPLE.split("")));
    expect(perChar).toEqual(whole);
  });

  it("gives identical results for random chunk sizes", () => {
    const whole = normalize(parseAll([SAMPLE]));
    for (let seed = 1; seed < 40; seed++) {
      const chunks: string[] = [];
      let i = 0;
      while (i < SAMPLE.length) {
        const n = ((seed * 7 + i * 13) % 11) + 1;
        chunks.push(SAMPLE.slice(i, i + n));
        i += n;
      }
      expect(normalize(parseAll(chunks))).toEqual(whole);
    }
  });

  it("reports an unclosed file as invalid", () => {
    const ev = parseAll(['<file path="app.js">let x = 1;']);
    expect(ev.at(-1)).toEqual({ type: "file_invalid", path: "app.js", reason: "file was not closed" });
    expect(ev.some((e) => e.type === "file_end")).toBe(false);
  });

  it("rejects unsafe paths and skips their content", () => {
    const ev = normalize(parseAll(['<file path="../secret.js">bad</file><file path="ok.css">a{}</file>']));
    expect(ev[0]).toMatchObject({ type: "file_invalid", path: "../secret.js" });
    expect(files(ev)).toEqual({ "ok.css": "a{}" });
  });

  it("treats a stray < in narration as text", () => {
    const ev = normalize(parseAll(["Use a <div> and 3 < 4 here"]));
    expect(ev).toEqual([{ type: "text", delta: "Use a <div> and 3 < 4 here" }]);
  });

  it("handles a summary without files", () => {
    expect(normalize(parseAll(["Done.<summary> Nothing to change </summary>"]))).toEqual([
      { type: "text", delta: "Done." },
      { type: "summary", text: "Nothing to change" },
    ]);
  });
});

describe("validatePath", () => {
  it.each(["index.html", "js/app.js", "assets/logo.svg"])("accepts %s", (p) => expect(validatePath(p)).toBeNull());
  it.each(["../x.js", "/etc/passwd", "a/../b.js", "run.sh", "index", "a b.js"])("rejects %s", (p) =>
    expect(validatePath(p)).not.toBeNull(),
  );
});
