import { z } from "zod";

// Server-side env. Import only from server code.
const serverEnvSchema = z.object({
  NEXT_PUBLIC_INSFORGE_URL: z.string().url(),
  NEXT_PUBLIC_INSFORGE_ANON_KEY: z.string().min(1),
  INSFORGE_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_CHAT_MODEL: z.string().default("anthropic/claude-sonnet-5.5"),
  OPENROUTER_FAST_MODEL: z.string().default("anthropic/claude-haiku-5.5"),
  LLM_MOCK: z.enum(["0", "1"]).default("0"),
  DEMO_EMAIL: z.string().email().optional(),
  DEMO_PASSWORD: z.string().optional(),
  DAILY_LIMIT: z.coerce.number().int().positive().default(30),
  DAILY_LIMIT_DEMO: z.coerce.number().int().positive().default(10),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}
