"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHelpResponse } from "@/lib/help-assistant";
import { HELP_INTRO_MESSAGE, HELP_SUGGESTED_PROMPTS } from "@/lib/system-help-knowledge";
import { HelpMessageContent } from "@/components/help/HelpMessageContent";

type Message = {
  role: "user" | "bot";
  content: string;
};

export default function ChatFab() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: HELP_INTRO_MESSAGE },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, open]);

  // If user navigates to the full chatbot page, hide this floating help panel.
  useEffect(() => {
    if (pathname?.startsWith("/chatbot")) {
      setOpen(false);
    }
  }, [pathname]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 180));
      const answer = getHelpResponse(userMsg);
      setMessages((prev) => [...prev, { role: "bot", content: answer }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      <div
        className={`mb-4 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300 origin-bottom-right ${
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0"
        }`}
        style={{ width: "min(420px, calc(100vw - 48px))", height: "min(700px, calc(100vh - 120px))" }}
      >
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-gray-100 bg-[#4F8DF7] px-6 py-5 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/20 shadow-inner backdrop-blur-md">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">StockCompass Help</p>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/80">
                <span className="h-2 w-2 animate-pulse rounded-full border border-white/20 bg-emerald-400" />
                Product guide
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex shrink-0 items-center justify-center rounded-lg p-2 text-white transition-all hover:bg-white/20 active:scale-95"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto bg-white p-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex gap-4", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "bot" && (
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 shadow-sm">
                  <Bot className="h-5 w-5 text-[#4F8DF7]" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl border px-5 py-3.5 text-sm font-medium shadow-sm transition-all",
                  msg.role === "user"
                    ? "rounded-tr-none border-[#4F8DF7] bg-[#4F8DF7] text-white shadow-[#4F8DF7]/20"
                    : "rounded-tl-none border-gray-100 bg-white text-[#000000]"
                )}
              >
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap leading-relaxed tracking-tight">{msg.content}</div>
                ) : (
                  <HelpMessageContent content={msg.content} variant="light" />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start gap-4">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 shadow-sm">
                <Bot className="h-5 w-5 text-[#4F8DF7]" />
              </div>
              <div className="flex max-w-[80%] items-center gap-2 rounded-2xl rounded-tl-none border border-gray-100 bg-white px-6 py-5 shadow-sm">
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#4F8DF7]/30" style={{ animationDelay: "0ms" }} />
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#4F8DF7]/60" style={{ animationDelay: "150ms" }} />
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#4F8DF7]" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 bg-white px-6 py-2">
          {HELP_SUGGESTED_PROMPTS.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => setQuery(text)}
              className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-[#4F8DF7] transition-all hover:bg-blue-100 active:scale-95"
            >
              {text}
            </button>
          ))}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white p-6">
          <form onSubmit={handleSend} className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <textarea
                autoFocus={open}
                rows={1}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask how to use StockCompass…"
                className="min-h-[56px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-4 pr-14 text-sm font-medium text-[#000000] shadow-inner outline-none transition-all focus:border-[#4F8DF7] focus:bg-white focus:ring-4 focus:ring-[#4F8DF7]/10 disabled:opacity-50"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-[#4F8DF7] text-white shadow-lg transition-all active:scale-90 disabled:grayscale disabled:opacity-20"
                aria-label="Send"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </form>
          <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-tight text-gray-400">
            Help answers are from product docs, not live market data. For stock Q&amp;A use Chatbot (AI Tools).
          </p>
        </div>
      </div>

      <button
        type="button"
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#4F8DF7] text-white shadow-[0_10px_30px_rgba(79,141,247,0.4)] ring-offset-2 ring-[#4F8DF7]/20 transition-all duration-300 hover:scale-105 hover:bg-[#2563EB] focus:outline-none active:scale-95 pointer-events-auto"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close help" : "Open help"}
      >
        <div
          className={cn(
            "absolute transition-all duration-300",
            open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
        >
          <MessageCircle className="h-7 w-7" />
        </div>
        <div
          className={cn(
            "absolute transition-all duration-300",
            open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
        >
          <X className="h-7 w-7" />
        </div>
      </button>
    </div>
  );
}
