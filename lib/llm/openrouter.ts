import OpenAI from "openai";
import { LLMError, type CallOptions, type LLM, type Usage } from "./types";

function toLLMError(err: unknown): LLMError {
  if (err instanceof LLMError) return err;
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) return new LLMError("The AI service is busy or out of credit. Try again in a minute.", true, 429);
    if (err.status === 402) return new LLMError("The AI credit for this demo has run out.", false, 402);
    if (err.status && err.status >= 500) return new LLMError("The AI service had an error. Try again.", true, err.status);
    return new LLMError("The AI request was rejected.", false, err.status);
  }
  if (err instanceof Error && err.name === "AbortError") throw err;
  return new LLMError("Couldn't reach the AI service. Try again.", true);
}

/** OpenAI SDK pointed at the InsForge Model Gateway / OpenRouter. Server-only. */
export function createOpenRouterLLM(opts: { baseURL: string; apiKey: string }): LLM {
  const client = new OpenAI({ baseURL: opts.baseURL, apiKey: opts.apiKey, maxRetries: 1 });
  const usage: Usage[] = [];

  return {
    usage: () => usage,

    async complete({ model, messages, signal, maxTokens = 800 }: CallOptions) {
      try {
        const res = await client.chat.completions.create(
          { model, messages, max_tokens: maxTokens, temperature: 0.4 },
          { signal },
        );
        usage.push({ model, input: res.usage?.prompt_tokens ?? 0, output: res.usage?.completion_tokens ?? 0 });
        return res.choices[0]?.message?.content ?? "";
      } catch (err) {
        throw toLLMError(err);
      }
    },

    async *stream({ model, messages, signal, maxTokens = 8000 }: CallOptions) {
      let stream;
      try {
        stream = await client.chat.completions.create(
          { model, messages, max_tokens: maxTokens, temperature: 0.4, stream: true, stream_options: { include_usage: true } },
          { signal },
        );
      } catch (err) {
        throw toLLMError(err);
      }
      try {
        for await (const chunk of stream) {
          if (chunk.usage) {
            usage.push({ model, input: chunk.usage.prompt_tokens ?? 0, output: chunk.usage.completion_tokens ?? 0 });
          }
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) yield delta;
        }
      } catch (err) {
        throw toLLMError(err);
      }
    },
  };
}
