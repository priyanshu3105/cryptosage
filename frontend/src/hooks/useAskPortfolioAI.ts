import { useState, useCallback } from "react";
import type { AskAIResponse, PortfolioLog, Holding, JournalFilters } from "@/types";
import { apiClient } from "@/services/api";

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AskAIResponse;
}

export function useAskPortfolioAI() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const ask = useCallback(async (
    question: string,
    logs: PortfolioLog[],
    holdings: Holding[],
    filters: JournalFilters,
    includeMarketContext: boolean
  ) => {
    const userMsg: AIMessage = { id: `ai-${Date.now()}`, role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await apiClient.post<AskAIResponse>("/chat/portfolio-insights", {
        question,
        includeHoldings: holdings.length > 0,
        includeMarketContext,
        filters: {
          from: filters.dateFrom,
          to: filters.dateTo,
          symbols: filters.coinId ? [filters.coinId.toUpperCase()] : undefined,
          actionTypes: filters.actionType ? [filters.actionType] : undefined,
          sentiment: filters.sentiment ? [filters.sentiment] : undefined,
          search: filters.search,
        },
        maxLogs: 50,
      });

      const aiMsg: AIMessage = {
        id: `ai-${Date.now() + 1}`,
        role: "assistant",
        content: response.answer,
        response,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => setMessages([]), []);

  return { messages, isLoading, ask, clearHistory };
}
