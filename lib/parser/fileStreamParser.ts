/**
 * Incremental parser for the engineer's streamed output:
 *
 *   narration text
 *   <file path="index.html">...full file...</file>
 *   <summary>one line</summary>
 *
 * Tags may be split across chunks at any byte. Pure and framework-free.
 */

export type ParserEvent =
  | { type: "text"; delta: string }
  | { type: "file_start"; path: string }
  | { type: "file_delta"; path: string; delta: string }
  | { type: "file_end"; path: string }
  | { type: "file_invalid"; path: string; reason: string }
  | { type: "summary"; text: string };

const OPEN_FILE = /^<file\s+path\s*=\s*(["'])([^"'<>]*)\1\s*>/;
const CLOSE_FILE = "</file>";
const OPEN_SUMMARY = "<summary>";
const CLOSE_SUMMARY = "</summary>";
/** Longest text we hold back while waiting to see whether it is the start of a tag. */
const MAX_TAG_LOOKAHEAD = 300;

export const SAFE_PATH = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*\.(html|css|js|json|svg|md|txt)$/;

export function validatePath(path: string): string | null {
  if (!path) return "empty path";
  if (path.includes("..")) return "path escapes the project";
  if (path.startsWith("/")) return "absolute path";
  if (!SAFE_PATH.test(path)) return "unsupported file name or type";
  return null;
}

type Mode = "text" | "file" | "summary" | "skip";

export class FileStreamParser {
  private buf = "";
  private mode: Mode = "text";
  private path = "";
  private summary = "";
  private openFiles = new Set<string>();

  push(chunk: string): ParserEvent[] {
    this.buf += chunk;
    return this.drain(false);
  }

  /** Flush at end of stream. An unclosed file is reported as invalid. */
  end(): ParserEvent[] {
    const events = this.drain(true);
    if (this.mode === "file" || this.mode === "skip") {
      if (this.mode === "file") events.push({ type: "file_invalid", path: this.path, reason: "file was not closed" });
      this.mode = "text";
    }
    if (this.mode === "summary") {
      events.push({ type: "summary", text: this.summary.trim() });
      this.mode = "text";
    }
    return events;
  }

  private drain(final: boolean): ParserEvent[] {
    const out: ParserEvent[] = [];
    for (;;) {
      if (this.mode === "text") {
        const lt = this.buf.indexOf("<");
        if (lt === -1) {
          this.emitText(out, this.buf);
          this.buf = "";
          return out;
        }
        this.emitText(out, this.buf.slice(0, lt));
        this.buf = this.buf.slice(lt);

        const fileMatch = OPEN_FILE.exec(this.buf);
        if (fileMatch) {
          const path = fileMatch[2].trim();
          this.buf = this.buf.slice(fileMatch[0].length);
          const problem = validatePath(path);
          if (problem) {
            out.push({ type: "file_invalid", path, reason: problem });
            this.mode = "skip";
          } else {
            this.path = path;
            this.mode = "file";
            this.openFiles.add(path);
            out.push({ type: "file_start", path });
          }
          continue;
        }
        if (this.buf.startsWith(OPEN_SUMMARY)) {
          this.buf = this.buf.slice(OPEN_SUMMARY.length);
          this.mode = "summary";
          this.summary = "";
          continue;
        }
        // Could this still become a tag once more bytes arrive?
        if (!final && this.couldBeTagPrefix(this.buf)) return out;
        // Not a tag: treat "<" as text.
        this.emitText(out, "<");
        this.buf = this.buf.slice(1);
        continue;
      }

      const close = this.mode === "summary" ? CLOSE_SUMMARY : CLOSE_FILE;
      const idx = this.buf.indexOf(close);
      if (idx === -1) {
        // Keep a tail that might be the start of the closing tag.
        const keep = final ? 0 : partialSuffix(this.buf, close);
        const body = this.buf.slice(0, this.buf.length - keep);
        this.consumeBody(out, body);
        this.buf = this.buf.slice(this.buf.length - keep);
        return out;
      }
      this.consumeBody(out, this.buf.slice(0, idx));
      this.buf = this.buf.slice(idx + close.length);
      if (this.mode === "file") out.push({ type: "file_end", path: this.path });
      if (this.mode === "summary") out.push({ type: "summary", text: this.summary.trim() });
      this.mode = "text";
    }
  }

  private consumeBody(out: ParserEvent[], body: string) {
    if (!body) return;
    if (this.mode === "file") out.push({ type: "file_delta", path: this.path, delta: body });
    else if (this.mode === "summary") this.summary += body;
  }

  private emitText(out: ParserEvent[], text: string) {
    if (!text) return;
    const last = out[out.length - 1];
    if (last?.type === "text") last.delta += text;
    else out.push({ type: "text", delta: text });
  }

  private couldBeTagPrefix(s: string): boolean {
    if (s.length > MAX_TAG_LOOKAHEAD) return false;
    if (OPEN_SUMMARY.startsWith(s)) return true;
    if (!s.includes(">")) return "<file".startsWith(s) || s.startsWith("<file");
    return false;
  }
}

/** Length of the longest suffix of `s` that is a proper prefix of `tag`. */
function partialSuffix(s: string, tag: string): number {
  for (let n = Math.min(tag.length - 1, s.length); n > 0; n--) {
    if (tag.startsWith(s.slice(s.length - n))) return n;
  }
  return 0;
}

/** Convenience for tests and fixtures: run a whole string through the parser. */
export function parseAll(chunks: string[]): ParserEvent[] {
  const p = new FileStreamParser();
  const events = chunks.flatMap((c) => p.push(c));
  return [...events, ...p.end()];
}
