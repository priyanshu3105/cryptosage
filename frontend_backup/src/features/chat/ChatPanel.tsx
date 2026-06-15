import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../api/client";
import { getApiErrorMessage } from "../auth/AuthContext";
import type { ChatMode, ChatResponse } from "./chat.types";

type ChatEntry =
  | { id: string; role: "user"; message: string }
  | { id: string; role: "assistant"; response: ChatResponse };

function createSessionId() {
  return `session-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function ChatPanel() {
  const [mode, setMode] = useState<ChatMode>("auto");
  const [message, setMessage] = useState("");
  const [sessionId] = useState(createSessionId);
  const [entries, setEntries] = useState<ChatEntry[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      response: {
        requestId: "welcome",
        timestamp: new Date().toISOString(),
        model: "llama-3.1-8b-instant",
        modeRequested: "auto",
        modeUsed: "market",
        decision: { allowed: true, reason: "Welcome message" },
        result: {
          type: "answer",
          answer: "Ask about crypto basics, DeFi risks, market concepts, or how to interpret the data in this app.",
          warnings: [],
          suggestedQuestions: [
            "What does market cap tell you in crypto?",
            "How does impermanent loss work?",
          ],
          sources: [],
        },
        telemetry: {
          latencyMs: 0,
          tokens: { prompt: 0, completion: 0, total: 0 },
          cacheHit: false,
        },
      },
    },
  ]);

  const chatMutation = useMutation({
    mutationFn: (input: { message: string; mode: ChatMode }) =>
      api.askChat({ ...input, sessionId }),
    onSuccess: (response, variables) => {
      setEntries((current) => [
        ...current,
        { id: `user-${response.requestId}`, role: "user", message: variables.message },
        { id: `assistant-${response.requestId}`, role: "assistant", response },
      ]);
      setMessage("");
    },
  });

  const currentError = chatMutation.error
    ? getApiErrorMessage(chatMutation.error, "Unable to reach the chat service right now.")
    : null;

  const suggestedQuestions = useMemo(() => {
    const lastAssistant = [...entries].reverse().find((entry) => entry.role === "assistant");
    return lastAssistant?.role === "assistant" ? lastAssistant.response.result.suggestedQuestions : [];
  }, [entries]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    await chatMutation.mutateAsync({ message: trimmed, mode });
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <section className="glass-card rounded-2xl border border-quantix.border/70 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-heading text-lg text-quantix.text">AI Guide</div>
            <p className="text-xs text-quantix.muted">Educational answers with telemetry and sources.</p>
          </div>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as ChatMode)}
            className="rounded-lg border border-quantix.border bg-quantix.card/80 px-3 py-2 text-xs text-quantix.text"
          >
            <option value="auto">Auto</option>
            <option value="market">Market</option>
            <option value="defi">DeFi</option>
          </select>
        </div>
      </section>

      <section className="glass-card flex min-h-0 flex-1 flex-col rounded-2xl border border-quantix.border/70 p-4">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {entries.map((entry) =>
            entry.role === "user" ? (
              <div key={entry.id} className="rounded-2xl bg-quantix.primary/15 px-4 py-3 text-sm text-quantix.text">
                {entry.message}
              </div>
            ) : (
              <div key={entry.id} className="rounded-2xl border border-quantix.border/70 bg-quantix.card/65 p-4">
                <div className="text-sm leading-6 text-quantix.text">{entry.response.result.answer}</div>
                {entry.response.result.warnings.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {entry.response.result.warnings.map((warning) => (
                      <div
                        key={warning}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-quantix.muted">
                  <span className="rounded-full border border-quantix.border px-2 py-1">{entry.response.result.type}</span>
                  <span className="rounded-full border border-quantix.border px-2 py-1">{entry.response.modeUsed}</span>
                  <span className="rounded-full border border-quantix.border px-2 py-1">{entry.response.telemetry.latencyMs} ms</span>
                  <span className="rounded-full border border-quantix.border px-2 py-1">{entry.response.telemetry.tokens.total} tokens</span>
                  <span className="rounded-full border border-quantix.border px-2 py-1">cache {entry.response.telemetry.cacheHit ? "hit" : "miss"}</span>
                </div>

                {entry.response.result.sources.length > 0 ? (
                  <div className="mt-3">
                    <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-quantix.muted">Sources</div>
                    <div className="space-y-2 text-xs">
                      {entry.response.result.sources.map((source) => (
                        <div key={`${entry.id}-${source.title}`} className="rounded-lg border border-quantix.border/60 px-3 py-2">
                          <div className="font-medium text-quantix.text">{source.title}</div>
                          <div className="mt-1 flex items-center justify-between gap-3 text-quantix.muted">
                            <span>{source.type}</span>
                            {source.url ? (
                              <a href={source.url} target="_blank" rel="noreferrer" className="text-quantix.primary hover:underline">
                                Open
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          )}

          {chatMutation.isPending ? (
            <div className="rounded-2xl border border-quantix.border/70 bg-quantix.card/65 px-4 py-3 text-sm text-quantix.muted">
              Thinking...
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-3 border-t border-quantix.border/60 pt-4">
          {suggestedQuestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => setMessage(question)}
                  className="rounded-full border border-quantix.border px-3 py-1.5 text-xs text-quantix.muted hover:bg-quantix.card"
                >
                  {question}
                </button>
              ))}
            </div>
          ) : null}

          {currentError ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {currentError}
            </div>
          ) : null}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-quantix.border bg-quantix.card/80 px-4 py-3 text-sm text-quantix.text placeholder:text-quantix.muted"
              placeholder="Ask about market cap, TVL, staking risk, or how to read your portfolio..."
            />
            <button
              type="submit"
              disabled={chatMutation.isPending || message.trim().length === 0}
              className="w-full rounded-xl bg-quantix.primary px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {chatMutation.isPending ? "Sending..." : "Ask CryptoSage"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
