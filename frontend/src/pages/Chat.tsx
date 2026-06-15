import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Info,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { PageTransition } from "@/components/shared/Animations";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/shared/Disclaimer";
import { apiClient } from "@/services/api";

type MessageVariant = "answer" | "refusal" | "error" | "fallback";

type AssistantSource = {
  title: string;
  url: string | null;
  type: "doc" | "api" | "glossary";
};

type AssistantApiResponse = {
  requestId: string;
  timestamp: string;
  decision: {
    allowed: boolean;
    reason: string;
  };
  result: {
    type: "answer" | "refusal" | "error";
    answer: string;
    warnings: string[];
    suggestedQuestions: string[];
    sources: AssistantSource[];
  };
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  variant?: MessageVariant;
  meta?: {
    label?: string;
    failureReason?: string;
    warnings?: string[];
    suggestedQuestions?: string[];
    sources?: AssistantSource[];
  };
};

type ChatSession = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messages: ChatMessage[];
};

const STORAGE_KEY = "cryptosage-assistant-sessions";

const starterPrompts = [
  "What is TVL in DeFi?",
  "What does market cap mean in crypto?",
  "What is impermanent loss?",
  "How do I add a holding in CryptoSage?",
];

const localFallbacks = [
  {
    label: "Built-in DeFi Guide",
    matches: [/tvl\b/i, /total value locked/i],
    content:
      "TVL stands for Total Value Locked. It measures the total value of assets deposited in a DeFi protocol.\n\n" +
      "- Higher TVL can suggest stronger adoption or deeper liquidity.\n" +
      "- TVL alone does not prove a protocol is safe or profitable.\n" +
      "- It is best read alongside audits, fee generation, token incentives, and smart-contract risk.",
    suggestedQuestions: [
      "How should I interpret TVL changes over time?",
      "What risks should I check besides TVL?",
    ],
  },
  {
    label: "Built-in App Help",
    matches: [/add .*holding/i, /add .*asset/i, /how do i add/i],
    content:
      "In this build, the Portfolio screen shows an `Add Asset` button, but it is not wired to a working form yet.\n\n" +
      "The backend does support holdings data, so the gap is the current frontend flow on the Portfolio page rather than the data model itself.",
    suggestedQuestions: [
      "What can I do on the Portfolio page today?",
      "What is the difference between Portfolio and Journal?",
    ],
  },
  {
    label: "Built-in Market Guide",
    matches: [/market cap/i, /market capitalization/i],
    content:
      "Market cap is the current token price multiplied by circulating supply.\n\n" +
      "- It is a rough size metric for a crypto asset.\n" +
      "- It does not tell you whether a token is cheap or expensive by itself.\n" +
      "- It is more useful when combined with supply dynamics, liquidity, and project fundamentals.",
    suggestedQuestions: [
      "What is fully diluted valuation?",
      "How is market cap different from price?",
    ],
  },
  {
    label: "Built-in Risk Guide",
    matches: [/impermanent loss/i],
    content:
      "Impermanent loss is the value gap a liquidity provider can experience when pooled assets move in price relative to simply holding them outside the pool.\n\n" +
      "- The larger the price divergence, the larger the potential loss.\n" +
      "- Trading fees may offset some or all of it, but not always.\n" +
      "- It is most relevant in AMMs and liquidity pools.",
    suggestedQuestions: [
      "When is impermanent loss highest?",
      "How can I reduce liquidity-pool risk?",
    ],
  },
  {
    label: "Built-in Staking Guide",
    matches: [/staking/i, /restaking/i],
    content:
      "Staking usually means locking or delegating tokens to help secure a network in exchange for rewards.\n\n" +
      "- Common risks include lockups, slashing, validator issues, and price volatility.\n" +
      "- Liquid staking adds extra smart-contract and protocol risk.\n" +
      "- High yield should always be checked against where that yield comes from.",
    suggestedQuestions: [
      "What are the main staking risks?",
      "How is staking different from lending?",
    ],
  },
];

function readStoredSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatSession[]) : [];
  } catch {
    return [];
  }
}

function createSessionTitle(content: string) {
  const trimmed = content.trim();
  return trimmed.length <= 40 ? trimmed : `${trimmed.slice(0, 37)}...`;
}

function createPreview(content: string) {
  const trimmed = content.replace(/\s+/g, " ").trim();
  return trimmed.length <= 60 ? trimmed : `${trimmed.slice(0, 57)}...`;
}

function getLocalFallback(question: string) {
  const trimmed = question.trim();

  for (const entry of localFallbacks) {
    if (entry.matches.some((pattern) => pattern.test(trimmed))) {
      return {
        content: entry.content,
        label: entry.label,
        suggestedQuestions: entry.suggestedQuestions,
      };
    }
  }

  if (/\bjoke\b|\brecipe\b|\bmovie\b|\bweather\b/i.test(trimmed)) {
    return {
      content:
        "I can only help with cryptocurrency, DeFi, risk awareness, and CryptoSage app usage questions.",
      label: "Topic Limited",
      suggestedQuestions: [
        "What does market cap mean in crypto?",
        "What is impermanent loss in DeFi?",
      ],
    };
  }

  return null;
}

function assistantBubbleClasses(variant: MessageVariant | undefined) {
  if (variant === "error") {
    return "border border-destructive/25 bg-destructive/10 text-card-foreground";
  }

  if (variant === "refusal") {
    return "border border-warning/25 bg-warning/10 text-card-foreground";
  }

  if (variant === "fallback") {
    return "border border-primary/25 bg-primary/10 text-card-foreground";
  }

  return "bg-muted text-card-foreground";
}

function variantIcon(variant: MessageVariant | undefined) {
  if (variant === "error") return AlertTriangle;
  if (variant === "refusal") return ShieldAlert;
  if (variant === "fallback") return BookOpen;
  return Bot;
}

function fallbackWarningForReason(reason?: string) {
  if (reason === "Model response format invalid") {
    return "Live AI responded, but that reply had an invalid format, so this answer is using built-in guidance.";
  }

  return "Live AI is unavailable, so this answer is using built-in guidance.";
}

function recoveryBannerText(message?: ChatMessage) {
  if (message?.meta?.failureReason === "Model response format invalid") {
    return "The last live reply came back in an invalid format, so CryptoSage used built-in guidance for that answer.";
  }

  return "Live AI is having trouble right now. CryptoSage will still try to answer common crypto and app-help questions using built-in guidance.";
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => readStoredSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );
  const messages = activeSession?.messages ?? [];

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const appendMessage = useCallback((sessionId: string, message: ChatMessage) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session;

        const nextMessages = [...session.messages, message];
        const firstUserMessage = nextMessages.find((entry) => entry.role === "user");
        const title =
          session.title === "New Conversation" && firstUserMessage
            ? createSessionTitle(firstUserMessage.content)
            : session.title;

        return {
          ...session,
          title,
          preview: createPreview(message.content),
          updatedAt: message.timestamp,
          messages: nextMessages,
        };
      })
    );
  }, []);

  const ensureSession = useCallback((content?: string) => {
    const candidateId = activeSessionId ?? `cs-${Date.now()}`;

    setSessions((prev) => {
      const exists = prev.some((session) => session.id === candidateId);
      if (exists) return prev;

      return [
        {
          id: candidateId,
          title: content ? createSessionTitle(content) : "New Conversation",
          preview: content ? createPreview(content) : "New conversation",
          updatedAt: new Date().toISOString(),
          messages: [],
        },
        ...prev,
      ];
    });

    if (!activeSessionId) {
      setActiveSessionId(candidateId);
    }

    return candidateId;
  }, [activeSessionId]);

  const createAssistantMessage = useCallback(
    (response: AssistantApiResponse, question: string): ChatMessage => {
      const baseMessage: ChatMessage = {
        id: response.requestId,
        role: "assistant",
        content: response.result.answer,
        timestamp: response.timestamp,
        variant: response.result.type,
        meta: {
          label:
            response.result.type === "refusal"
              ? "Topic Limited"
              : response.result.type === "error"
                ? "Live AI Unavailable"
                : "Live AI",
          failureReason: response.decision.reason,
          warnings: response.result.warnings,
          suggestedQuestions: response.result.suggestedQuestions,
          sources: response.result.sources,
        },
      };

      if (response.result.type !== "error") {
        return baseMessage;
      }

      const fallback = getLocalFallback(question);
      if (!fallback) {
        return {
          ...baseMessage,
          content:
            "Live AI is temporarily unavailable. Try again in a moment, or ask one of the built-in crypto help topics below.",
          meta: {
            ...baseMessage.meta,
            suggestedQuestions: starterPrompts.slice(0, 3),
          },
        };
      }

      return {
        ...baseMessage,
        id: `${response.requestId}-fallback`,
        content: fallback.content,
        variant: "fallback",
        meta: {
          label: fallback.label,
          failureReason: response.decision.reason,
          warnings: [fallbackWarningForReason(response.decision.reason)],
          suggestedQuestions: fallback.suggestedQuestions,
          sources: [],
        },
      };
    },
    []
  );

  const handleSend = useCallback(
    async (seed?: string) => {
      const content = (seed ?? input).trim();
      if (!content || isTyping) return;

      const sessionId = ensureSession(content);
      const userMessage: ChatMessage = {
        id: `m-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      appendMessage(sessionId, userMessage);
      setInput("");
      setIsTyping(true);

      try {
        const response = await apiClient.post<AssistantApiResponse>("/chat", {
          message: content,
          mode: "auto",
          sessionId,
        });

        appendMessage(sessionId, createAssistantMessage(response, content));
      } catch {
        const fallback = getLocalFallback(content);
        const assistantMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: fallback
            ? fallback.content
            : "I could not reach the live assistant just now. Try again in a moment, or ask about TVL, market cap, impermanent loss, or CryptoSage app usage.",
          timestamp: new Date().toISOString(),
          variant: fallback ? "fallback" : "error",
          meta: {
            label: fallback ? fallback.label : "Connection Issue",
            failureReason: "Connection issue",
            warnings: ["The page could not reach the live assistant service."],
            suggestedQuestions: fallback?.suggestedQuestions ?? starterPrompts.slice(0, 3),
            sources: [],
          },
        };

        appendMessage(sessionId, assistantMessage);
      } finally {
        setIsTyping(false);
      }
    },
    [appendMessage, createAssistantMessage, ensureSession, input, isTyping]
  );

  const newSession = useCallback(() => {
    const sessionId = `cs-${Date.now()}`;
    const now = new Date().toISOString();
    const nextSession: ChatSession = {
      id: sessionId,
      title: "New Conversation",
      preview: "New conversation",
      updatedAt: now,
      messages: [],
    };

    setSessions((prev) => [nextSession, ...prev]);
    setActiveSessionId(sessionId);
  }, []);

  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");
  const suggestedQuestions = lastAssistantMessage?.meta?.suggestedQuestions ?? [];
  const showRecoveryBanner =
    lastAssistantMessage?.variant === "error" || lastAssistantMessage?.variant === "fallback";

  return (
    <PageTransition className="flex h-[calc(100vh-8rem)] gap-4">
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 md:block dark:border-neon-cyan/15 dark:shadow-[0_0_28px_hsl(var(--neon-cyan)/0.06)]"
          >
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="text-xs font-medium text-muted-foreground">History</span>
              <Button variant="ghost" size="sm" onClick={newSession} className="h-7 w-7 p-0">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-0.5 p-2">
              {sessions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  No chats yet
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      activeSessionId === session.id
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <p className="truncate font-medium">{session.title}</p>
                    <p className="mt-0.5 truncate text-muted-foreground">
                      {session.preview || "New conversation"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col rounded-xl border border-border bg-card shadow-card transition-all duration-300 dark:border-neon-cyan/15 dark:shadow-[0_0_32px_hsl(var(--neon-cyan)/0.08)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-card-foreground">AI Assistant</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="hidden md:flex"
          >
            {showSidebar ? "Hide" : "Show"} History
          </Button>
        </div>

        {showRecoveryBanner && (
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-card-foreground">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
              <p>{recoveryBannerText(lastAssistantMessage)}</p>
            </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md text-center">
                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Start a conversation with CryptoSage AI</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => void handleSend(prompt)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const Icon = variantIcon(message.variant);
            const isAssistant = message.role === "assistant";

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : assistantBubbleClasses(message.variant)
                  }`}
                >
                  {isAssistant && (
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{message.meta?.label ?? "Assistant"}</span>
                    </div>
                  )}

                  {isAssistant ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    message.content
                  )}

                  {isAssistant && message.meta?.warnings && message.meta.warnings.length > 0 && (
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {message.meta.warnings.map((warning) => (
                        <div key={warning} className="flex items-start gap-1.5">
                          <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAssistant && message.meta?.sources && message.meta.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.meta.sources.map((source) => (
                        <span
                          key={`${message.id}-${source.title}`}
                          className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground"
                        >
                          {source.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </motion.div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <Disclaimer />

          {suggestedQuestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => void handleSend(question)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Ask about crypto markets, DeFi, or CryptoSage usage..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isTyping}
            />
            <Button onClick={() => void handleSend()} disabled={!input.trim() || isTyping} size="sm">
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
