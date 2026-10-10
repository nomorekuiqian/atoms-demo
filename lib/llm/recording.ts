import type { Fixture } from "./mock";
import type { CallOptions, LLM } from "./types";

/** Wraps a real LLM and keeps each agent's full output so a run can be saved as a mock fixture. */
export function createRecordingLLM(inner: LLM): LLM & { recorded: Partial<Record<CallOptions["agent"], string>> } {
  const recorded: Partial<Record<CallOptions["agent"], string>> = {};
  return {
    recorded,
    usage: () => inner.usage(),
    async complete(opts) {
      const text = await inner.complete(opts);
      recorded[opts.agent] = text;
      return text;
    },
    async *stream(opts) {
      let text = "";
      for await (const delta of inner.stream(opts)) {
        text += delta;
        yield delta;
      }
      recorded[opts.agent] = text;
    },
  };
}

export function toFixture(name: string, match: string[], recorded: Partial<Record<CallOptions["agent"], string>>): Fixture {
  return { name, match, mike: recorded.mike ?? "", emma: recorded.emma ?? "", bob: recorded.bob ?? "", alex: recorded.alex ?? "" };
}
