"use client";

"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { chatWithStocks, ChatResponse } from "@/lib/stock-data";

type Message = {
  role: "user" | "bot";
  content: string;
  sources?: any[];
};

export default function ChatFab() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Hi! I'm StockCompass AI. Ask me about stock risks, predictions, or comparisons (e.g. 'Compare RELIANCE.NS and TCS.NS')."
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, open]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await chatWithStocks(userMsg);
      setMessages((prev) => [...prev, { role: "bot", content: res.answer, sources: res.sources }]);
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "bot", content: "Sorry, I encountered an error: " + (error.message || "Unknown error") }]);
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <div 
        className={`mb-4 overflow-hidden bg-white border shadow-2xl rounded-2xl transition-all duration-300 origin-bottom-right flex flex-col ${
          open ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none"
        }`}
        style={{ width: "min(400px, calc(100vw - 48px))", height: "min(650px, calc(100vh - 120px))" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b bg-primary text-primary-foreground shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">StockCompass Chat</p>
              <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Powered by pgvector + Ollama
              </p>
            </div>
          </div>
          <button 
            onClick={() => setOpen(false)}
            className="p-2 shrink-0 rounded-md text-primary-foreground hover:bg-primary-foreground/20 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "bot" && (
                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-auto">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm"
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-semibold text-slate-500">Sources:</p>
                    {msg.sources.map((s, sIdx) => (
                      <div key={sIdx} className="bg-slate-50 rounded p-2 text-xs border border-slate-100">
                        <span className="font-semibold text-primary">{s.symbol}</span> — {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200 flex items-center justify-center mt-auto">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-auto">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[80%] bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t shrink-0">
          <form onSubmit={handleSend} className="relative flex items-end gap-2">
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
              placeholder="Ask anything..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pb-3 pr-12 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50 min-h-[44px] max-h-[120px]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Send className="h-4 w-4 ml-0.5" />}
            </button>
          </form>
          <div className="text-center mt-2.5">
            <p className="text-[10px] text-slate-400">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        className="flex items-center justify-center h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        onClick={() => setOpen(!open)}
      >
        <div className={`transition-all duration-300 absolute ${open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}>
          <MessageCircle className="h-6 w-6" />
        </div>
        <div className={`transition-all duration-300 absolute ${open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}>
          <X className="h-6 w-6" />
        </div>
      </button>
    </div>
  );
}
