"use client";

"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
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
        className={`mb-4 overflow-hidden bg-white border border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl transition-all duration-300 origin-bottom-right flex flex-col ${
          open ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none"
        }`}
        style={{ width: "min(420px, calc(100vw - 48px))", height: "min(700px, calc(100vh - 120px))" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#4F8DF7] text-white shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">AI Financial Analyst</p>
              <p className="text-[11px] text-white/80 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-white/20"></span>
                Active System
              </p>
            </div>
          </div>
          <button 
            onClick={() => setOpen(false)}
            className="p-2 shrink-0 rounded-lg text-white hover:bg-white/20 transition-all flex items-center justify-center active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto bg-white p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "bot" && (
                <div className="h-9 w-9 shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mt-1 shadow-sm">
                  <Bot className="h-5 w-5 text-[#4F8DF7]" />
                </div>
              )}
              <div className={cn(
                "max-w-[85%] rounded-2xl px-5 py-3.5 text-sm font-medium shadow-sm border transition-all",
                msg.role === "user" 
                  ? "bg-[#4F8DF7] text-white border-[#4F8DF7] rounded-tr-none shadow-[#4F8DF7]/20" 
                  : "bg-white border-gray-100 text-[#000000] rounded-tl-none"
              )}>
                <div className="whitespace-pre-wrap leading-relaxed tracking-tight">
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Data Insights:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s, sIdx) => (
                        <div key={sIdx} className="bg-blue-50/50 hover:bg-blue-50 rounded-lg px-2.5 py-1.5 text-[12px] border border-blue-100 transition-colors">
                          <span className="font-black text-[#4F8DF7]">{s.symbol}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mt-1 shadow-sm">
                <Bot className="h-5 w-5 text-[#4F8DF7]" />
              </div>
              <div className="max-w-[80%] bg-white border border-gray-100 rounded-2xl rounded-tl-none px-6 py-5 shadow-sm flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#4F8DF7]/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2.5 h-2.5 bg-[#4F8DF7]/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2.5 h-2.5 bg-[#4F8DF7] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions / Pill Buttons */}
        <div className="px-6 py-2 bg-white flex flex-wrap gap-2 shrink-0">
          {["Compare TCS & RELIANCE", "Portfolio Risk", "Market Trends"].map((text) => (
             <button 
                key={text}
                onClick={() => { setQuery(text); }}
                className="px-3 py-1.5 rounded-full bg-blue-50 text-[#4F8DF7] text-[11px] font-bold border border-blue-100 hover:bg-blue-100 transition-all active:scale-95"
             >
                {text}
             </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
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
                placeholder="Message AI Financial Analyst..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-4 pr-14 text-sm font-medium text-[#000000] focus:border-[#4F8DF7] focus:bg-white focus:ring-4 focus:ring-[#4F8DF7]/10 outline-none transition-all disabled:opacity-50 min-h-[56px] shadow-inner"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg bg-[#4F8DF7] text-white shadow-lg active:scale-90 flex items-center justify-center disabled:opacity-20 disabled:grayscale transition-all"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </form>
          <p className="text-center mt-4 text-[11px] font-bold text-gray-400 tracking-tight uppercase">AI insights may vary. Verify with professionals.</p>
        </div>
      </div>

      {/* FAB Button */}
      <button
        className="flex items-center justify-center h-16 w-16 rounded-2xl shadow-[0_10px_30px_rgba(79,141,247,0.4)] bg-[#4F8DF7] text-white hover:bg-[#2563EB] hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none ring-offset-2 ring-[#4F8DF7]/20"
        onClick={() => setOpen(!open)}
      >
        <div className={`transition-all duration-300 absolute ${open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}>
          <MessageCircle className="h-7 w-7" />
        </div>
        <div className={`transition-all duration-300 absolute ${open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}>
          <X className="h-7 w-7" />
        </div>
      </button>
    </div>
  );
}
