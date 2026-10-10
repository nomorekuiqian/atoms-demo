const ESCAPES: Record<string, string> = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };

/** Incrementally decodes a flat JSON object of string fields, such as streamed
 * `writeFile` tool input. Linear in input size; an in-progress value is exposed
 * as a decoded prefix. Anything that is not a flat string object stops decoding.
 */
export class StreamedStringObject {
  private raw = "";
  private i = 0;
  private phase: "open" | "key" | "colon" | "value-start" | "value" | "next" | "end" | "bad" = "open";
  private key = "";
  private value = "";
  readonly fields: Record<string, string> = {};

  push(delta: string): this {
    this.raw += delta;
    this.scan();
    return this;
  }

  /** Complete value, or the decoded prefix of the value still being streamed. */
  read(name: string): { value: string; complete: boolean } | undefined {
    if (Object.hasOwn(this.fields, name)) return { value: this.fields[name], complete: true };
    if (this.phase === "value" && this.key === name) return { value: this.value, complete: false };
    return undefined;
  }

  private skip() {
    while (this.i < this.raw.length && /\s/.test(this.raw[this.i])) this.i++;
  }

  private scan() {
    const raw = this.raw;
    while (this.i < raw.length && this.phase !== "end" && this.phase !== "bad") {
      if (this.phase !== "value") this.skip();
      if (this.i >= raw.length) return;
      const c = raw[this.i];
      switch (this.phase) {
        case "open":
          this.phase = c === "{" ? "key" : "bad"; this.i++; break;
        case "key": {
          if (c === "}") { this.phase = "end"; this.i++; break; }
          if (c !== '"') { this.phase = "bad"; return; }
          const close = /^"((?:[^"\\]|\\.)*)"/.exec(raw.slice(this.i, this.i + 200));
          if (!close) { if (raw.length - this.i >= 200) this.phase = "bad"; return; }
          this.key = JSON.parse(close[0]) as string;
          this.i += close[0].length; this.phase = "colon"; break;
        }
        case "colon":
          this.phase = c === ":" ? "value-start" : "bad"; this.i++; break;
        case "value-start":
          if (c !== '"') { this.phase = "bad"; return; }
          this.value = ""; this.i++; this.phase = "value"; break;
        case "value": {
          let run = this.i;
          while (run < raw.length && raw[run] !== '"' && raw[run] !== "\\") run++;
          this.value += raw.slice(this.i, run);
          this.i = run;
          if (run >= raw.length) return;
          if (raw[run] === '"') {
            this.fields[this.key] = this.value; this.value = "";
            this.i++; this.phase = "next"; break;
          }
          const kind = raw[run + 1];
          if (kind === undefined) return;
          if (kind === "u") {
            const hex = raw.slice(run + 2, run + 6);
            if (hex.length < 4) return;
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) { this.phase = "bad"; return; }
            this.value += String.fromCharCode(parseInt(hex, 16));
            this.i = run + 6;
          } else if (Object.hasOwn(ESCAPES, kind)) {
            this.value += ESCAPES[kind]; this.i = run + 2;
          } else { this.phase = "bad"; return; }
          break;
        }
        case "next":
          if (c === ",") this.phase = "key";
          else if (c === "}") this.phase = "end";
          else { this.phase = "bad"; return; }
          this.i++; break;
      }
    }
  }
}
