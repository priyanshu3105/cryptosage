import axios from "axios";
import { groqConfig } from "../config/groq";
import { groqClient } from "../clients/groq.client";
import { topicGateService } from "./topicGate.service";
import { policyGuardService } from "./policyGuard.service";
import { ragService } from "./rag.service";
import {
  ChatRequest,
  ChatResponse,
  PortfolioInsightsRequest,
  PortfolioInsightsResponse,
} from "../validators/chat.schema";
import { logger } from "../config/logger";
import { chatSessionRepo } from "../repositories/chatSession.repo";
import { portfolioRepo } from "../repositories/portfolio.repo";
import { portfolioLogRepo } from "../repositories/portfolioLog.repo";
import { marketService } from "./market.service";

const SYSTEM_PROMPT = `
You are CryptoSage, a cryptocurrency and DeFi financial literacy assistant.
Stay strictly within educational crypto, DeFi, risk awareness, protocol explanation, and app usage topics.
Never provide financial advice, investment recommendations, predictions, or unrelated help.
Return only valid JSON with this shape:
{
  "answer": "string",
  "warnings": ["string"],
  "suggestedQuestions": ["string"],
  "sources": [{ "title": "string", "url": "string|null", "type": "doc|api|glossary" }]
}
Keep the answer concise, accurate, and educational.
`;

class ModelResponseFormatError extends Error {
  readonly cause: unknown;
  readonly raw: string;

  constructor(message: string, raw: string, cause?: unknown) {
    super(message);
    this.name = "ModelResponseFormatError";
    this.raw = raw;
    this.cause = cause;
  }
}

type GroqChatMessage = Parameters<typeof groqClient.chat>[0][number];

function stripMarkdownFence(raw: string) {
  const trimmed = raw.trim();
  return trimmed.startsWith("```")
    ? trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")
    : trimmed;
}

function extractJsonObject(raw: string) {
  const firstBrace = raw.indexOf("{");
  if (firstBrace === -1) return raw;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = firstBrace; index < raw.length; index += 1) {
    const char = raw[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(firstBrace, index + 1);
      }
    }
  }

  return raw.slice(firstBrace);
}

function escapeControlCharactersInStrings(raw: string) {
  let result = "";
  let inString = false;
  let escaped = false;

  for (const char of raw) {
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      result += char;
      inString = !inString;
      continue;
    }

    if (inString) {
      if (char === "\n") {
        result += "\\n";
        continue;
      }

      if (char === "\r") {
        result += "\\r";
        continue;
      }

      if (char === "\t") {
        result += "\\t";
        continue;
      }

      if (char.charCodeAt(0) < 32) {
        result += `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
        continue;
      }
    }

    result += char;
  }

  return result;
}

function parseModelJson(raw: string) {
  const stripped = stripMarkdownFence(raw);
  const extracted = extractJsonObject(stripped);
  const sanitized = escapeControlCharactersInStrings(extracted);
  const candidates = [stripped, extracted, sanitized].filter(Boolean);

  let lastError: unknown = null;
  for (const candidate of [...new Set(candidates)]) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw new ModelResponseFormatError("Model returned invalid JSON", raw, lastError);
}

async function chatWithStructuredJson<T>(
  messages: GroqChatMessage[],
  requestId: string,
  schemaHint?: string
) {
  const retryInstruction = [
    "Your previous reply was not valid JSON.",
    "Return only valid minified JSON with double-quoted keys and strings.",
    "Do not include markdown fences, commentary, or raw line breaks inside string values.",
    schemaHint ? `Required shape: ${schemaHint}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await groqClient.chat(
      attempt === 1 ? messages : [...messages, { role: "system", content: retryInstruction }]
    );

    try {
      return {
        parsed: parseModelJson(response.content) as T,
        response,
      };
    } catch (error) {
      lastError = error;
      logger.warn(
        {
          requestId,
          attempt,
          preview: response.content.slice(0, 240),
        },
        "Model returned invalid JSON; retrying structured response"
      );
    }
  }

  throw lastError;
}

function buildResponse(args: {
  requestId: string;
  modeRequested: "market" | "defi" | "auto";
  modeUsed: "market" | "defi";
  allowed: boolean;
  reason: string;
  type: "answer" | "refusal" | "error";
  answer: string;
  warnings?: string[];
  suggestedQuestions?: string[];
  sources?: Array<{ title: string; url: string | null; type: "doc" | "api" | "glossary" }>;
  latencyMs: number;
  tokens?: { prompt: number; completion: number; total: number };
  cacheHit?: boolean;
}): ChatResponse {
  return {
    requestId: args.requestId,
    timestamp: new Date().toISOString(),
    model: "llama-3.1-8b-instant",
    modeRequested: args.modeRequested,
    modeUsed: args.modeUsed,
    decision: {
      allowed: args.allowed,
      reason: args.reason,
    },
    result: {
      type: args.type,
      answer: args.answer,
      warnings: args.warnings ?? [],
      suggestedQuestions: args.suggestedQuestions ?? [],
      sources: (args.sources ?? []).slice(0, 6),
    },
    telemetry: {
      latencyMs: args.latencyMs,
      tokens: args.tokens ?? { prompt: 0, completion: 0, total: 0 },
      cacheHit: args.cacheHit ?? false,
    },
  };
}

function describeUpstreamFailure(error: unknown) {
  if (!axios.isAxiosError(error)) {
    if (error instanceof ModelResponseFormatError) {
      return {
        reason: "Model response format invalid",
        answer:
          "Live AI responded, but the reply format was invalid and could not be processed safely.",
        warnings: ["The assistant fell back because the model did not return valid JSON."],
      };
    }

    return {
      reason: "Groq request failed",
      answer: "The chat service is temporarily unavailable. Please try again in a moment.",
      warnings: ["No financial advice was generated."],
    };
  }

  const status = error.response?.status;
  if (status === 401 || status === 403) {
    return {
      reason: "Groq authentication failed",
      answer:
        "Live AI is unavailable because the configured model key was rejected by the upstream provider.",
      warnings: ["Check the backend GROQ_API_KEY configuration and restart the API."],
    };
  }

  if (status === 429) {
    return {
      reason: "Groq rate limit reached",
      answer: "Live AI is rate limited right now. Please wait a moment and try again.",
      warnings: ["The upstream model provider temporarily rejected the request volume."],
    };
  }

  if (error.code === "ECONNABORTED") {
    return {
      reason: "Groq request timed out",
      answer: "Live AI took too long to respond. Please try again in a moment.",
      warnings: ["The upstream model provider did not respond before the timeout."],
    };
  }

  return {
    reason: "Groq request failed",
    answer: "The chat service is temporarily unavailable. Please try again in a moment.",
    warnings: ["No financial advice was generated."],
  };
}

export const chatService = {
  async ask(input: ChatRequest, requestId: string): Promise<ChatResponse> {
    const startedAt = Date.now();
    const gate = topicGateService.classify(input.message, input.mode);

    if (!gate.allowed) {
      logger.info({ requestId, matchedSignals: gate.matchedSignals }, "Chat request blocked by topic gate");
      return buildResponse({
        requestId,
        modeRequested: input.mode,
        modeUsed: gate.modeUsed,
        allowed: false,
        reason: gate.reason,
        type: "refusal",
        answer: "I can only help with cryptocurrency, DeFi, risk awareness, and CryptoSage app usage questions.",
        warnings: ["This assistant does not answer unrelated or off-domain questions."],
        suggestedQuestions: [
          "What does market capitalization mean in crypto?",
          "What is impermanent loss in DeFi?",
        ],
        latencyMs: Date.now() - startedAt,
      });
    }

    const retrieval = await ragService.retrieveContext(input.message);
    const hasGroundedContext = retrieval.confidence >= 0.2;

    try {
      if (input.sessionId) {
        const existingSession = await chatSessionRepo.findBySessionId(input.sessionId);
        if (!existingSession) {
          await chatSessionRepo.create({ sessionId: input.sessionId, mode: input.mode });
        }
        await chatSessionRepo.appendMessage(input.sessionId, { role: "user", content: input.message });
      }

      const { parsed, response } = await chatWithStructuredJson<{
        answer?: string;
        warnings?: string[];
        suggestedQuestions?: string[];
        sources?: Array<{ title: string; url: string | null; type: "doc" | "api" | "glossary" }>;
      }>(
        [
          { role: "system", content: SYSTEM_PROMPT.trim() },
          {
            role: "system",
            content: hasGroundedContext
              ? `Mode to use: ${gate.modeUsed}. Grounded context:\n${retrieval.context}`
              : `Mode to use: ${gate.modeUsed}. No strong retrieval context was found, so answer conservatively using only high-confidence educational explanations within crypto and DeFi scope.`,
          },
          { role: "user", content: input.message },
        ],
        requestId,
        '{ "answer": "string", "warnings": ["string"], "suggestedQuestions": ["string"], "sources": [{ "title": "string", "url": "string|null", "type": "doc|api|glossary" }] }'
      );

      const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
      if (!answer || !policyGuardService.isSafeAnswer(answer)) {
        logger.warn({ requestId }, "Chat response refused by policy guard");
        return buildResponse({
          requestId,
          modeRequested: input.mode,
          modeUsed: gate.modeUsed,
          allowed: true,
          reason: "Model output violated safety policy",
          type: "refusal",
          answer: "I can explain concepts and risks, but I cannot provide financial advice or predictions.",
          warnings: ["Ask for educational explanations instead of investment recommendations."],
          suggestedQuestions: [
            "What are the risks of leveraged crypto trading?",
            "How does staking work in DeFi?",
          ],
          sources: retrieval.sources,
          latencyMs: Date.now() - startedAt,
          tokens: response.usage,
        });
      }

      const candidate = buildResponse({
        requestId,
        modeRequested: input.mode,
        modeUsed: gate.modeUsed,
        allowed: true,
        reason: hasGroundedContext
          ? gate.reason
          : `${gate.reason}; answered without strong retrieval support`,
        type: "answer",
        answer,
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings.slice(0, 10) : [],
        suggestedQuestions: policyGuardService.sanitizeSuggestions(
          Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : []
        ),
        sources:
          Array.isArray(parsed.sources) && parsed.sources.length > 0
            ? parsed.sources
            : retrieval.sources,
        latencyMs: Date.now() - startedAt,
        tokens: response.usage,
        cacheHit: hasGroundedContext,
      });

      const validated = policyGuardService.validateResponseShape(candidate);
      if (!validated.success) {
        logger.warn({ requestId, issues: validated.error.issues }, "Chat response failed schema validation");
        return buildResponse({
          requestId,
          modeRequested: input.mode,
          modeUsed: gate.modeUsed,
          allowed: true,
          reason: "Model output failed contract validation",
          type: "refusal",
          answer: "I could not format a safe educational response for that request.",
          warnings: ["Please rephrase the question more specifically."],
          suggestedQuestions: ["What is an AMM?", "What does market cap tell you in crypto?"],
          sources: retrieval.sources,
          latencyMs: Date.now() - startedAt,
          tokens: response.usage,
        });
      }

      if (input.sessionId) {
        await chatSessionRepo.appendMessage(input.sessionId, {
          role: "assistant",
          content: validated.data.result.answer,
        });
      }

      logger.info(
        { requestId, latencyMs: validated.data.telemetry.latencyMs, modeUsed: validated.data.modeUsed },
        "Chat response completed"
      );
      return validated.data;
    } catch (error) {
      logger.error({ requestId, err: error }, "Chat upstream request failed");
      const failure = describeUpstreamFailure(error);
      return buildResponse({
        requestId,
        modeRequested: input.mode,
        modeUsed: gate.modeUsed,
        allowed: true,
        reason: failure.reason,
        type: "error",
        answer: failure.answer,
        warnings: failure.warnings,
        suggestedQuestions: [],
        sources: retrieval.sources,
        latencyMs: Date.now() - startedAt,
      });
    }
  },

  async askPortfolioInsights(
    userId: string,
    input: PortfolioInsightsRequest
  ): Promise<PortfolioInsightsResponse> {
    const logQuery = {
      from: input.filters?.from,
      to: input.filters?.to,
      symbols: input.filters?.symbols,
      actionTypes: input.filters?.actionTypes,
      sentiment: input.filters?.sentiment,
      search: input.filters?.search,
      page: 1,
      pageSize: input.maxLogs,
    };

    const [{ items: logs }, portfolio] = await Promise.all([
      portfolioLogRepo.listByUser(userId, logQuery),
      portfolioRepo.getByUser(userId),
    ]);

    const holdings = input.includeHoldings ? (portfolio?.holdings ?? []) : [];
    const symbols = Array.from(
      new Set(
        [
          ...logs.map((log) => log.symbol).filter(Boolean),
          ...holdings.map((holding) => holding.symbol).filter(Boolean),
        ].map((value) => String(value).toUpperCase())
      )
    );

    let marketSnapshot = "";
    if (input.includeMarketContext && symbols.length > 0) {
      const topSymbols = symbols.slice(0, 5);
      const marketLines: string[] = [];
      for (const symbol of topSymbols) {
        const matchingHolding = holdings.find((h) => h.symbol?.toUpperCase() === symbol);
        if (matchingHolding) {
          try {
            const market = await marketService.getCoinPrice(matchingHolding.coinId);
            marketLines.push(`${symbol}: ${market.currency} ${market.price}`);
          } catch {
            marketLines.push(`${symbol}: unavailable`);
          }
        }
      }
      if (marketLines.length > 0) {
        marketSnapshot = `Market snapshot:\n${marketLines.join("\n")}`;
      }
    }

    const context = {
      question: input.question,
      holdings: holdings.map((holding) => ({
        coinId: holding.coinId,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        buyPrice: holding.buyPrice,
      })),
      logs: logs.map((log) => ({
        createdAt: log.createdAt,
        symbol: log.symbol,
        actionType: log.actionType,
        quantity: log.quantity,
        price: log.price,
        sentiment: log.sentiment,
        note: log.note.slice(0, 600),
      })),
      marketSnapshot,
    };

    const prompt = [
      "You are CryptoSage. Analyze the user's own portfolio records and logs.",
      "Return only valid JSON with this shape:",
      '{ "answer": "string", "insights": ["string"], "caveats": ["string"] }',
      "Do not provide financial advice. Keep insights educational and risk-aware.",
      JSON.stringify(context),
    ].join("\n\n");

    const { parsed, response } = await chatWithStructuredJson<{
      answer?: string;
      insights?: string[];
      caveats?: string[];
    }>(
      [
        { role: "system", content: "You are a crypto literacy assistant." },
        { role: "user", content: prompt },
      ],
      `portfolio-${userId}`,
      '{ "answer": "string", "insights": ["string"], "caveats": ["string"] }'
    );

    return {
      answer:
        typeof parsed.answer === "string" && parsed.answer.trim().length > 0
          ? parsed.answer.trim()
          : "I could not generate a reliable portfolio insight summary at this time.",
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 10) : [],
      caveats: Array.isArray(parsed.caveats)
        ? parsed.caveats.slice(0, 10)
        : [
            "This is educational information, not financial advice.",
            "Double-check assumptions against live market conditions.",
          ],
      contextUsed: {
        logsCount: logs.length,
        usedHoldings: input.includeHoldings,
        usedMarketContext: input.includeMarketContext,
        symbols,
      },
      usage: response.usage,
    };
  },
};
