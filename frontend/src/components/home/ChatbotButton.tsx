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
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-6 right-6 z-[100] flex h-[min(85vh,720px)] w-[min(calc(100vw-3rem),420px)] flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.15)] md:bottom-8 md:right-8"
            >
              {/* Top bar */}
              <div className="shrink-0 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#4F8DF7] shadow-sm">
                      <HelpCircle className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-bold tracking-tight text-slate-900">
                        StockCompass Help
                      </h3>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online Support
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    aria-label="Close help"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 scrollbar-thin scrollbar-thumb-slate-200"
              >
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      {msg.role === "bot" && (
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                          <Sparkles className="h-3.5 w-3.5 text-[#4F8DF7]" />
                        </div>
                      )}
                      <div
                        className={
                          msg.role === "user"
                            ? "max-w-[85%] rounded-2xl rounded-tr-md border border-[#4F8DF7]/30 bg-[#4F8DF7] px-4 py-2.5 text-xs leading-relaxed text-white shadow-sm"
                            : "max-w-[85%] rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs shadow-sm"
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
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                        <Sparkles className="h-3.5 w-3.5 text-[#4F8DF7]" />
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-2.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4F8DF7]" />
                        <span className="text-[11px] text-slate-500">Finding an answer…</span>
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              </div>

              {/* Common questions */}
              <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Topics
                </p>
                <div className="flex flex-col gap-1.5">
                  {HELP_SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applySuggestion(p)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-medium text-slate-600 shadow-sm transition hover:border-[#4F8DF7]/40 hover:bg-blue-50/50 hover:text-[#4F8DF7]"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input footer */}
              <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
                <form onSubmit={send}>
                  <div className="relative">
                    <input
                      id="landing-help-input"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask a question..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 pr-12 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F8DF7] focus:bg-white focus:ring-2 focus:ring-[#4F8DF7]/15"
                      disabled={loading}
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={loading || !query.trim()}
                      className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F8DF7] text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-35"
                      aria-label="Send"
                    >
                      {loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2.5 text-center text-[10px] leading-tight text-slate-400/80">
                    AI-powered assistant. Not financial advice.
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
