import { z } from "zod";

export const ChatModeSchema = z.enum(["market", "defi", "auto"]);
export const ChatModeUsedSchema = z.enum(["market", "defi"]);
export const ChatResultTypeSchema = z.enum(["answer", "refusal", "error"]);
export const ChatSourceTypeSchema = z.enum(["doc", "api", "glossary"]);

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  mode: ChatModeSchema.default("auto"),
  sessionId: z.string().trim().min(8).max(64).optional(),
});

export const ChatSourceSchema = z.object({
  title: z.string().min(1).max(120),
  url: z.url().nullable(),
  type: ChatSourceTypeSchema,
});

export const ChatResponseSchema = z.object({
  requestId: z.string().min(8).max(64),
  timestamp: z.iso.datetime(),
  model: z.literal("llama-3.1-8b-instant"),
  modeRequested: ChatModeSchema,
  modeUsed: ChatModeUsedSchema,
  decision: z.object({
    allowed: z.boolean(),
    reason: z.string().min(1).max(200),
  }),
  result: z.object({
    type: ChatResultTypeSchema,
    answer: z.string().min(0).max(4000),
    warnings: z.array(z.string().max(160)).max(10),
    suggestedQuestions: z.array(z.string().max(120)).max(6),
    sources: z.array(ChatSourceSchema).max(6),
  }),
  telemetry: z.object({
    latencyMs: z.number().int().min(0).max(60000),
    tokens: z.object({
      prompt: z.number().int().min(0).max(200000),
      completion: z.number().int().min(0).max(200000),
      total: z.number().int().min(0).max(200000),
    }),
    cacheHit: z.boolean(),
  }),
});

const PortfolioInsightActionSchema = z.enum(["buy", "sell", "note", "analysis", "risk"]);
const PortfolioInsightSentimentSchema = z.enum(["bullish", "bearish", "neutral"]);

export const PortfolioInsightsRequestSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  includeHoldings: z.boolean().default(true),
  includeMarketContext: z.boolean().default(false),
  filters: z
    .object({
      from: z.iso.datetime().optional(),
      to: z.iso.datetime().optional(),
      symbols: z.array(z.string().trim().min(1).max(20)).max(50).optional(),
      actionTypes: z.array(PortfolioInsightActionSchema).max(10).optional(),
      sentiment: z.array(PortfolioInsightSentimentSchema).max(3).optional(),
      search: z.string().trim().max(120).optional(),
    })
    .optional(),
  maxLogs: z.number().int().min(1).max(100).default(50),
});

export const PortfolioInsightsResponseSchema = z.object({
  answer: z.string().min(1).max(8000),
  insights: z.array(z.string().max(300)).max(10),
  caveats: z.array(z.string().max(300)).max(10),
  contextUsed: z.object({
    logsCount: z.number().int().min(0).max(100),
    usedHoldings: z.boolean(),
    usedMarketContext: z.boolean(),
    symbols: z.array(z.string().max(20)).max(50),
  }),
  usage: z.object({
    prompt: z.number().int().min(0),
    completion: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type PortfolioInsightsRequest = z.infer<typeof PortfolioInsightsRequestSchema>;
export type PortfolioInsightsResponse = z.infer<typeof PortfolioInsightsResponseSchema>;
