import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "@/contexts/SessionContext";
import { apiClient } from "@/services/api";

type MessageVariant = "answer" | "refusal" | "error" | "fallback";

type AssistantSource = {
  title: string;
  url: string | null;
  type: "doc" | "api" | "glossary";
};

export type AssistantMessage = {
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

export type AssistantSession = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messages: AssistantMessage[];
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

type AssistantChatContextType = {
  sessions: AssistantSession[];
  activeSessionId: string | null;
  activeSession: AssistantSession | null;
  messages: AssistantMessage[];
  input: string;
  setInput: (value: string) => void;
  isTyping: boolean;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  showHistory: boolean;
  setShowHistory: (value: boolean) => void;
  starterPrompts: string[];
  suggestedQuestions: string[];
  showRecoveryBanner: boolean;
  lastAssistantMessage?: AssistantMessage;
  sendMessage: (seed?: string) => Promise<void>;
  newSession: () => void;
  setActiveSessionId: (id: string) => void;
};

const AssistantChatContext = createContext<AssistantChatContextType | null>(null);

const starterPrompts = [
  "What is TVL in DeFi?",
  "What does market cap mean in crypto?",
  "What is impermanent loss?",
  "How do I add a holding in CryptoSage?",
];

const localFallbacks = [
  {
    label: "Built-in DeFi Risk Guide",
    matches: [/risks?.*tvl/i, /tvl.*risks?/i, /besides tvl/i, /besides.*tvl/i],
    content:
      "TVL is only one signal. Besides TVL, useful risk checks include:\n\n" +
      "- Smart-contract risk: audits, bug history, and how complex the code is.\n" +
      "- Admin / governance risk: who can pause, upgrade, or move funds.\n" +
      "- Oracle and bridge risk: where prices and cross-chain transfers come from.\n" +
      "- Liquidity and exit risk: whether you can withdraw without huge slippage.\n" +
      "- Incentive risk: whether yields depend on temporary token rewards.\n" +
      "- Concentration risk: a few wallets or assets dominating the protocol.\n\n" +
      "High TVL does not mean a protocol is safe.",
    suggestedQuestions: [
      "What is an audit in DeFi?",
      "What is impermanent loss?",
    ],
  },
  {
    label: "Built-in Privacy Coin Guide",
    matches: [/\bzcash\b/i, /\bzec\b/i],
    content:
      "Zcash (ZEC) is a cryptocurrency focused on optional privacy.\n\n" +
      "- It uses zero-knowledge proofs (zk-SNARKs) so some transactions can hide sender, receiver, and amount.\n" +
      "- Users can usually choose transparent or shielded transfers.\n" +
      "- Like other crypto assets, it still carries market, liquidity, regulatory, and technology risks.\n" +
      "- Privacy features and exchange support can vary by jurisdiction and venue.",
    suggestedQuestions: [
      "How do privacy coins differ from Bitcoin?",
      "What does market cap mean in crypto?",
    ],
  },
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

function createStorageKey(userId?: string | null) {
  return `cryptosage-assistant-sessions:${userId ?? "guest"}`;
}

function readStoredSessions(userId?: string | null): AssistantSession[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(createStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AssistantSession[]) : [];
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

function fallbackWarningForReason(reason?: string) {
  if (reason === "Model response format invalid") {
    return "Live AI responded, but that reply had an invalid format, so this answer is using built-in guidance.";
  }

  return "Live AI is unavailable, so this answer is using built-in guidance.";
}

export function recoveryBannerText(message?: AssistantMessage) {
  if (message?.meta?.failureReason === "Model response format invalid") {
    return "The last live reply came back in an invalid format, so CryptoSage used built-in guidance for that answer.";
  }

  return "Live AI is having trouble right now. CryptoSage will still try to answer common crypto and app-help questions using built-in guidance.";
}

export function assistantBubbleClasses(variant: MessageVariant | undefined) {
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

export function AssistantChatProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const userId = user?.id;
  const storageKey = useMemo(() => createStorageKey(userId), [userId]);
  const hasLoadedRef = useRef(false);

  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setActiveSessionId(null);
      setInput("");
      setIsOpen(false);
      hasLoadedRef.current = false;
      return;
    }

    const storedSessions = readStoredSessions(userId);
    setSessions(storedSessions);
    setActiveSessionId(storedSessions[0]?.id ?? null);
    hasLoadedRef.current = true;
  }, [userId]);

  useEffect(() => {
    if (!userId || !hasLoadedRef.current || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [userId, sessions, storageKey]);

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  const messages = activeSession?.messages ?? [];

  const appendMessage = useCallback((sessionId: string, message: AssistantMessage) => {
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
    (response: AssistantApiResponse, question: string): AssistantMessage => {
      const baseMessage: AssistantMessage = {
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

  const sendMessage = useCallback(
    async (seed?: string) => {
      const content = (seed ?? input).trim();
      if (!content || isTyping) return;

      const sessionId = ensureSession(content);
      const userMessage: AssistantMessage = {
        id: `m-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      appendMessage(sessionId, userMessage);
      setInput("");
      setIsTyping(true);
      setIsOpen(true);

      try {
        const response = await apiClient.post<AssistantApiResponse>("/chat", {
          message: content,
          mode: "auto",
          sessionId,
        });

        appendMessage(sessionId, createAssistantMessage(response, content));
      } catch {
        const fallback = getLocalFallback(content);
        const assistantMessage: AssistantMessage = {
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
    const nextSession: AssistantSession = {
      id: sessionId,
      title: "New Conversation",
      preview: "New conversation",
      updatedAt: now,
      messages: [],
    };

    setSessions((prev) => [nextSession, ...prev]);
    setActiveSessionId(sessionId);
    setInput("");
    setIsOpen(true);
  }, []);

  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");
  const suggestedQuestions = lastAssistantMessage?.meta?.suggestedQuestions ?? [];
  const showRecoveryBanner =
    lastAssistantMessage?.variant === "error" || lastAssistantMessage?.variant === "fallback";

  const value = useMemo<AssistantChatContextType>(
    () => ({
      sessions,
      activeSessionId,
      activeSession,
      messages,
      input,
      setInput,
      isTyping,
      isOpen,
      setIsOpen,
      showHistory,
      setShowHistory,
      starterPrompts,
      suggestedQuestions,
      showRecoveryBanner,
      lastAssistantMessage,
      sendMessage,
      newSession,
      setActiveSessionId,
    }),
    [
      sessions,
      activeSessionId,
      activeSession,
      messages,
      input,
      isTyping,
      isOpen,
      showHistory,
      suggestedQuestions,
      showRecoveryBanner,
      lastAssistantMessage,
      sendMessage,
      newSession,
    ]
  );

  return <AssistantChatContext.Provider value={value}>{children}</AssistantChatContext.Provider>;
}

export function useAssistantChat() {
  const context = useContext(AssistantChatContext);
  if (!context) throw new Error("useAssistantChat must be used within AssistantChatProvider");
  return context;
}
