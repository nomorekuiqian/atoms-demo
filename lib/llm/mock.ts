import { LLMError, type CallOptions, type LLM } from "./types";

/** A recorded run: what each agent said. Stored as fixtures/<name>.json. */
export type Fixture = { name: string; match: string[]; mike: string; emma: string; bob: string; alex: string };

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

export function pickFixture(fixtures: Fixture[], prompt: string, hasFiles: boolean): Fixture {
  const p = prompt.toLowerCase();
  const pool = fixtures.filter((f) => f.name.startsWith(hasFiles ? "edit-" : "new-"));
  return pool.find((f) => f.match.some((m) => p.includes(m))) ?? pool[0] ?? fixtures[0];
}

/** Replays a fixture with realistic pacing. No network, no credit. */
export function createMockLLM(fixture: Fixture, opts: { chunkDelayMs?: number } = {}): LLM {
  const delay = opts.chunkDelayMs ?? 12;
  return {
    usage: () => [],
    async complete({ agent, signal }: CallOptions) {
      await sleep(delay * 20, signal);
      return fixture[agent];
    },
    async *stream({ agent, signal }: CallOptions) {
      const text = fixture[agent];
      if (!text) throw new LLMError(`Mock fixture "${fixture.name}" has no output for ${agent}.`, false);
      for (let i = 0; i < text.length; i += 24) {
        await sleep(delay, signal);
        yield text.slice(i, i + 24);
      }
    },
  };
}
