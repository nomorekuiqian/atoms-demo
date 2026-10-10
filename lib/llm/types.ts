export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type Usage = { model: string; input: number; output: number };

export type CallOptions = {
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  maxTokens?: number;
  /** Which agent is calling; mock replay uses it to pick the recorded output. */
  agent: "mike" | "emma" | "bob" | "alex";
};

/** Minimal LLM surface the orchestrator depends on. Real (OpenRouter) and mock implementations. */
export interface LLM {
  stream(opts: CallOptions): AsyncIterable<string>;
  complete(opts: CallOptions): Promise<string>;
  /** Token usage collected so far. */
  usage(): Usage[];
}

export class LLMError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
  }
}
