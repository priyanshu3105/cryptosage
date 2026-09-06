import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: true,
});

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  MONGODB_URI: z.string().min(1),

  JWT_SECRET: z.string().min(16),

  // Groq
  GROQ_API_KEY: z.string().min(1),
  GROQ_BASE_URL: z.string().url().default("https://api.groq.com/openai/v1"),
  GROQ_MODEL: z.string().default("openai/gpt-oss-20b"),

  // CORS
  CORS_ORIGIN: z.string().default("*"),

  // Timeouts
  EXTERNAL_API_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60000)
    .default(8000),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
