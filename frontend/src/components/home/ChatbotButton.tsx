"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Loader2, Sparkles, HelpCircle } from "lucide-react";
import { getHelpResponse } from "@/lib/help-assistant";
import { HELP_INTRO_MESSAGE, HELP_SUGGESTED_PROMPTS } from "@/lib/system-help-knowledge";
import { HelpMessageContent } from "@/components/help/HelpMessageContent";

type Msg = { role: "user" | "bot"; content: string };

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "bot", content: HELP_INTRO_MESSAGE }]);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const sendQuestion = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 150));
      setMessages((m) => [...m, { role: "bot", content: getHelpResponse(trimmed) }]);
    } finally {
      setLoading(false);
    }
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setQuery("");
    await sendQuestion(q);
  };

  const applySuggestion = (text: string) => {
    void sendQuestion(text);
  };

  return (
    <>
      {/* Launcher — only when panel closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[100] md:bottom-8 md:right-8"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setIsOpen(true)}
              className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-white text-[#4F8DF7] shadow-[0_10px_40px_rgba(79,141,247,0.35)] ring-1 ring-slate-900/5 transition-colors hover:bg-slate-50"
              aria-expanded={false}
              aria-label="Open StockCompass help"
            >
              <MessageSquare className="h-6 w-6" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close help overlay"
              className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="StockCompass help"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[min(85vh,820px)] flex-col border-t border-slate-200/90 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.12)]"
            >
              {/* Top bar — full width, aligned */}
              <div className="shrink-0 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-4 py-4 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#4F8DF7] shadow-sm">
                      <HelpCircle className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                        StockCompass Help
                      </h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Product guide
                        </span>
                        <span className="hidden text-slate-400 sm:inline">·</span>
                        <span className="hidden sm:inline">How to use the platform</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    aria-label="Close help"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages — white inner canvas */}
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5 sm:px-6 lg:px-8"
              >
                <div className="mx-auto max-w-4xl space-y-5">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      {msg.role === "bot" && (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                          <Sparkles className="h-4 w-4 text-[#4F8DF7]" />
                        </div>
                      )}
                      <div
                        className={
                          msg.role === "user"
                            ? "max-w-[min(100%,28rem)] rounded-2xl rounded-tr-md border border-[#4F8DF7]/30 bg-[#4F8DF7] px-4 py-3 text-sm leading-relaxed text-white shadow-sm"
                            : "max-w-[min(100%,36rem)] rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm shadow-sm"
                        }
                      >
                        {msg.role === "user" ? (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        ) : (
                          <HelpMessageContent content={msg.content} variant="light" />
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                        <Sparkles className="h-4 w-4 text-[#4F8DF7]" />
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-5 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-[#4F8DF7]" />
                        <span className="text-sm text-slate-500">Finding an answer…</span>
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              </div>

              {/* Common questions — full width strip, all prompts */}
              <div className="shrink-0 border-t border-slate-100 bg-slate-50/90 px-4 py-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                  <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-left">
                    Common questions
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {HELP_SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => applySuggestion(p)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs font-medium leading-snug text-slate-800 shadow-sm transition hover:border-[#4F8DF7]/40 hover:bg-blue-50/50 hover:text-[#4F8DF7] sm:text-sm"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input footer — full width */}
              <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
                <form onSubmit={send} className="mx-auto max-w-6xl">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
                    <div className="relative flex-1">
                      <input
                        id="landing-help-input"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask how to use StockCompass…"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-14 text-sm text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-[#4F8DF7] focus:ring-2 focus:ring-[#4F8DF7]/20"
                        disabled={loading}
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-[#4F8DF7] text-white shadow-md transition hover:bg-blue-600 disabled:opacity-35"
                        aria-label="Send"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-slate-400 sm:text-left">
                    Answers are from product documentation. Not live market or investment advice.
                  </p>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
