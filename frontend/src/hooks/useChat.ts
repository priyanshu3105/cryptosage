import { useState, useCallback } from "react";
import type { ChatMessage, ChatSession, ApiError } from "@/types";
import { apiClient } from "@/services/api";

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await apiClient.post<{
        requestId: string;
        result: { answer: string };
      }>("/chat", {
        message: content,
        mode: "auto",
        sessionId: activeSessionId ?? undefined,
      });

      const aiMsg: ChatMessage = {
        id: response.requestId,
        role: "assistant",
        content: response.result?.answer ?? "No response received.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const apiErr = err as ApiError;
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: apiErr?.message ?? "Something went wrong. Check that the API is running and GROQ_API_KEY is set.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [activeSessionId]);

  const newSession = useCallback(() => {
    const session: ChatSession = {
      id: `cs-${Date.now()}`,
      title: "New Conversation",
      lastMessage: "",
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setMessages([]);
  }, []);

  return { sessions, activeSessionId, setActiveSessionId, messages, isLoading, isTyping, sendMessage, newSession };
}
