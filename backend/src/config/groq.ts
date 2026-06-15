import { env } from "./env";

export const groqConfig = {
  baseUrl: env.GROQ_BASE_URL,
  apiKey: env.GROQ_API_KEY,
  model: env.GROQ_MODEL,
  headers: {
    Authorization: `Bearer ${env.GROQ_API_KEY}`,
    "Content-Type": "application/json",
  },
  timeoutMs: env.EXTERNAL_API_TIMEOUT_MS,
};