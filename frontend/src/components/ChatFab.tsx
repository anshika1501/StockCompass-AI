"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, X, Send, Loader2, Bot, Maximize2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseIntent, type Slots, type Intent } from "@/lib/chat-intents";
import {
  executeAction, verifyMpin, needsMpin, needsConfirm,
  isMpinVerified, type ActionResult,
} from "@/lib/chat-actions";
import { getPortfolios, type Portfolio } from "@/lib/portfolio-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  result?: ActionResult;
  isTyping?: boolean;
}

interface PendingAction {
  intent: Intent;
  slots: Slots;
  step: string;
}

// ---------------------------------------------------------------------------
// Minimal markdown renderer
// ---------------------------------------------------------------------------

function RichText({ text, invert }: { text: string; invert?: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className={invert ? "text-white" : "text-slate-900"}>{p.slice(2, -2)}</strong>
          : p.split("\n").map((line, j) => (
              <span key={`${i}-${j}`}>{j > 0 && <br />}{line}</span>
            ))
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Compact card renderer (abbreviated for the floating bubble)
// ---------------------------------------------------------------------------

function CompactCard({ result }: { result: ActionResult }) {
  const d = result.data as Record<string, unknown> | undefined;
  if (!d) return null;

  if (result.cardType === "portfolio_list") {
    const portfolios = d as Portfolio[];
    return (
      <div className="mt-2 space-y-1.5">
        {(portfolios as Portfolio[]).slice(0, 4).map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs">
            <span className="font-semibold text-slate-700">{p.name}</span>
            <span className="text-slate-500">{(p.holdings ?? []).length} holdings</span>
          </div>
        ))}
      </div>
    );
  }

  if (result.cardType === "sentiment_overview") {
    const sectors = d as { sector: string; label: string; avg_score: number }[];
    return (
      <div className="mt-2 space-y-1">
        {sectors.slice(0, 5).map((s) => (
          <div key={s.sector} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs">
            <span className="truncate font-medium text-slate-700 max-w-[120px]">{s.sector}</span>
            <span className={cn("font-bold", s.label === "BULLISH" ? "text-emerald-600" : s.label === "BEARISH" ? "text-rose-600" : "text-amber-600")}>
              {s.avg_score >= 0 ? "+" : ""}{s.avg_score.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main floating ChatFab
// ---------------------------------------------------------------------------

export default function ChatFab() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "bot", text: "Hello! 👋 I'm your StockCompass assistant. Ask me about portfolios, stock prices, or market sentiment!" },
  ]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [showMpin, setShowMpin] = useState(false);
  const [mpinValue, setMpinValue] = useState("");
  const [mpinError, setMpinError] = useState("");

  const pendingRef = useRef<PendingAction | null>(null);
  const pendingAfterMpinRef = useRef<(() => Promise<void>) | null>(null);
  const pendingAfterConfirmRef = useRef<(() => Promise<void>) | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Hide on chatbot page
  useEffect(() => {
    if (pathname?.startsWith("/chatbot")) setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages, open, showMpin]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stock_compass_token") : null;
    if (token) getPortfolios().then(setPortfolios).catch(() => {});
  }, [open]);

  const pushBot = useCallback((text: string, result?: ActionResult) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "bot", text, result }]);
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text }]);
  }, []);

  const pushTyping = useCallback(() => {
    const id = `typing-${Date.now()}`;
    setMessages((prev) => [...prev, { id, role: "bot", text: "", isTyping: true }]);
    return id;
  }, []);

  const removeTyping = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const executeWithGuards = useCallback(async (intent: Intent, slots: Slots) => {
    const run = async () => {
      const tid = pushTyping();
      try {
        const result = await executeAction(intent, slots, portfolios);
        removeTyping(tid);
        pushBot(result.text, result);
        if (["PORTFOLIO_CREATE","PORTFOLIO_DELETE","PORTFOLIO_RENAME","HOLDING_ADD","HOLDING_REMOVE"].includes(intent)) {
          getPortfolios().then(setPortfolios).catch(() => {});
        }
      } catch (err: unknown) {
        removeTyping(tid);
        const msg = err instanceof Error ? err.message : "";
        if (msg.startsWith("__MISSING_")) {
          const step = msg.replace("__MISSING_", "").toLowerCase();
          pendingRef.current = { intent, slots, step: `need_${step}` };
          const prompts: Record<string, string> = {
            need_portfolio_name: "What would you like to name the portfolio?",
            need_ticker: "Which stock ticker? (e.g., TCS.NS)",
            need_quantity: "How many shares?",
            need_price: "What was the buy price per share (₹)?",
            need_portfolio: `Which portfolio? ${portfolios.map((p) => p.name).join(" / ")}`,
            need_sector: "Which sector? (e.g., IT, Banking)",
          };
          pushBot(prompts[`need_${step}`] || "Could you provide more details?");
        } else {
          pushBot(`Sorry, something went wrong: ${msg}`);
        }
      }
    };

    if (needsConfirm(intent)) {
      pendingAfterConfirmRef.current = async () => {
        if (needsMpin(intent) && !isMpinVerified()) {
          pendingAfterMpinRef.current = run;
          setShowMpin(true);
        } else await run();
      };
      pushBot(`⚠️ Are you sure you want to proceed? Type **yes** to confirm or **no** to cancel.`);
      pendingRef.current = { intent, slots, step: "need_confirm" };
      return;
    }

    if (needsMpin(intent) && !isMpinVerified()) {
      pendingAfterMpinRef.current = run;
      setShowMpin(true);
      return;
    }

    await run();
  }, [portfolios, pushBot, pushTyping, removeTyping]);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setLoading(true);
    pushUser(trimmed);

    try {
      if (pendingRef.current) {
        const pending = pendingRef.current;

        if (pending.step === "need_confirm") {
          pendingRef.current = null;
          if (trimmed.toLowerCase() === "yes" && pendingAfterConfirmRef.current) {
            const fn = pendingAfterConfirmRef.current;
            pendingAfterConfirmRef.current = null;
            await fn();
          } else {
            pushBot("Action cancelled. Let me know if there's anything else I can help with! 😊");
          }
          return;
        }

        const slots = { ...pending.slots };
        const t = trimmed;
        switch (pending.step) {
          case "need_portfolio_name": slots.portfolioName = t; break;
          case "need_new_name":       slots.newName = t; break;
          case "need_ticker":         slots.ticker = t.toUpperCase(); break;
          case "need_quantity":       slots.quantity = parseInt(t, 10); break;
          case "need_price":          slots.price = parseFloat(t.replace(/[^0-9.]/g, "")); break;
          case "need_sector":         slots.sector = t; break;
        }
        pendingRef.current = null;
        await executeWithGuards(pending.intent, slots);
        return;
      }

      const { intent, slots } = parseIntent(trimmed);
      await executeWithGuards(intent, slots);
    } finally {
      setLoading(false);
    }
  }, [loading, pushUser, pushBot, executeWithGuards]);

  const handleMpinSubmit = useCallback(async () => {
    if (mpinValue.length !== 4) { setMpinError("Enter exactly 4 digits."); return; }
    const valid = await verifyMpin(mpinValue);
    setMpinValue("");
    if (!valid) { setMpinError("Incorrect MPIN. Please try again."); return; }
    setMpinError("");
    setShowMpin(false);
    pushBot("MPIN verified! ✅");
    if (pendingAfterMpinRef.current) {
      const fn = pendingAfterMpinRef.current;
      pendingAfterMpinRef.current = null;
      await fn();
    }
  }, [mpinValue, pushBot]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat panel */}
      <div
        className={cn(
          "mb-4 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-300 origin-bottom-right",
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0"
        )}
        style={{ width: "min(400px, calc(100vw - 48px))", height: "min(600px, calc(100vh - 120px))" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-[#4F8DF7] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">StockCompass AI</p>
              <p className="flex items-center gap-1 text-[11px] font-semibold text-white/80">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                30 operations · always here
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setOpen(false); router.push("/chatbot"); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20"
              title="Open full chatbot"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-white p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "bot" && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                  <Bot className="h-4 w-4 text-[#4F8DF7]" />
                </div>
              )}
              <div className={cn(
                "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                msg.role === "user"
                  ? "rounded-tr-none bg-[#4F8DF7] text-white"
                  : "rounded-tl-none border border-gray-100 bg-white text-slate-800"
              )}>
                {msg.isTyping ? (
                  <div className="flex gap-1 py-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                  </div>
                ) : (
                  <>
                    <div className="leading-relaxed">
                      <RichText text={msg.text} invert={msg.role === "user"} />
                    </div>
                    {msg.result && <CompactCard result={msg.result} />}
                  </>
                )}
              </div>
            </div>
          ))}

          {/* MPIN prompt inline */}
          {showMpin && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#4F8DF7]" />
                <p className="text-xs font-bold text-slate-700">Enter your 4-digit MPIN</p>
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={mpinValue}
                onChange={(e) => { setMpinValue(e.target.value.replace(/\D/g, "").slice(0, 4)); setMpinError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleMpinSubmit()}
                autoFocus
                className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xl font-bold tracking-[0.4em] outline-none focus:border-[#4F8DF7]"
              />
              {mpinError && <p className="mb-2 text-xs text-rose-600">{mpinError}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setShowMpin(false); setMpinValue(""); pushBot("Action cancelled. 😊"); }} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
                <button onClick={handleMpinSubmit} className="flex-1 rounded-lg bg-[#4F8DF7] py-1.5 text-xs font-semibold text-white">Confirm</button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-gray-100 bg-white p-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              disabled={loading || showMpin}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-[#4F8DF7] focus:bg-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || showMpin}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F8DF7] text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>

      {/* FAB button */}
      <button
        type="button"
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F8DF7] text-white shadow-[0_8px_25px_rgba(79,141,247,0.4)] transition-all duration-300 hover:scale-105 hover:bg-blue-600 focus:outline-none active:scale-95"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        <div className={cn("absolute transition-all duration-300", open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")}>
          <MessageCircle className="h-6 w-6" />
        </div>
        <div className={cn("absolute transition-all duration-300", open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")}>
          <X className="h-6 w-6" />
        </div>
      </button>
    </div>
  );
}
