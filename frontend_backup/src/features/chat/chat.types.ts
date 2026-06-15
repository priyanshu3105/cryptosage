export type ChatMode = "auto" | "market" | "defi";

export type ChatRequest = {
  message: string;
  mode: ChatMode;
  sessionId?: string;
};

export type ChatSource = {
  title: string;
  url: string | null;
  type: "doc" | "api" | "glossary";
};

export type ChatResponse = {
  requestId: string;
  timestamp: string;
  model: "llama-3.1-8b-instant";
  modeRequested: ChatMode;
  modeUsed: "market" | "defi";
  decision: {
    allowed: boolean;
    reason: string;
  };
  result: {
    type: "answer" | "refusal" | "error";
    answer: string;
    warnings: string[];
    suggestedQuestions: string[];
    sources: ChatSource[];
  };
  telemetry: {
    latencyMs: number;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    cacheHit: boolean;
  };
};