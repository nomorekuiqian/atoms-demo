import { describe, expect, it } from "vitest";
import { readEvents } from "./readEvents";

function streamOf(chunks: string[]) {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(c) {
      chunks.forEach((s) => c.enqueue(enc.encode(s)));
      c.close();
    },
  });
}

describe("readEvents", () => {
  it("parses events split across chunks and skips comments", async () => {
    const out = [];
    for await (const e of readEvents(streamOf(['data: {"a"', ':1}\n\n: ping\n\nda', 'ta: {"b":2}\n\n']))) out.push(e);
    expect(out).toEqual([{ a: 1 }, { b: 2 }]);
  });
});
