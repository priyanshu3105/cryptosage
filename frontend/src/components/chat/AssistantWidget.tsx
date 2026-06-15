import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  AlertTriangle,
  Bot,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/shared/Disclaimer";
import {
  assistantBubbleClasses,
  recoveryBannerText,
  useAssistantChat,
  type AssistantMessage,
} from "@/contexts/AssistantChatContext";

function variantIcon(message: AssistantMessage | undefined) {
  if (message?.variant === "error") return AlertTriangle;
  if (message?.variant === "refusal") return ShieldAlert;
  if (message?.variant === "fallback") return BookOpen;
  return Bot;
}

export function AssistantWidget() {
  const {
    sessions,
    activeSessionId,
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
  } = useAssistantChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/20 backdrop-blur-[1px] md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] justify-end sm:bottom-6 sm:right-6">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="assistant-panel"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-auto flex h-[min(720px,calc(100vh-2rem))] w-[min(960px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl dark:border-neon-cyan/15 dark:shadow-[0_0_40px_hsl(var(--neon-cyan)/0.08)] sm:h-[min(720px,calc(100vh-3rem))] sm:w-[min(980px,calc(100vw-3rem))] md:w-[min(980px,calc(100vw-6rem))]"
            >
              <AnimatePresence initial={false}>
                {showHistory && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 260, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="hidden shrink-0 overflow-hidden border-r border-border bg-card lg:block"
                  >
                    <div className="flex items-center justify-between border-b border-border px-3 py-3">
                      <span className="text-xs font-medium text-muted-foreground">History</span>
                      <Button variant="ghost" size="sm" onClick={newSession} className="h-7 w-7 p-0">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1 p-2">
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

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-card-foreground">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={newSession}
                      className="h-8 gap-1.5 px-2 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                      className="hidden h-8 px-2 lg:inline-flex"
                    >
                      {showHistory ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {showRecoveryBanner && (
                  <div className="border-b border-border px-4 py-3">
                    <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-card-foreground">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      <p>{recoveryBannerText(lastAssistantMessage)}</p>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                      <div className="max-w-md text-center">
                        <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Start a conversation with CryptoSage AI</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          {starterPrompts.map((prompt) => (
                            <button
                              key={prompt}
                              onClick={() => void sendMessage(prompt)}
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
                    const Icon = variantIcon(message);
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
                            isAssistant ? assistantBubbleClasses(message.variant) : "bg-primary text-primary-foreground"
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
                          onClick={() => void sendMessage(question)}
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
                          void sendMessage();
                        }
                      }}
                      placeholder="Ask about crypto markets, DeFi, or CryptoSage usage..."
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isTyping}
                    />
                    <Button onClick={() => void sendMessage()} disabled={!input.trim() || isTyping} size="sm">
                      {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="assistant-trigger"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.9 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open AI Assistant"
              >
                <MessageSquare className="h-6 w-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
