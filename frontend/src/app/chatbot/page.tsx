"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Suspense } from "react";
import {
  Bot, Send, Loader2, TrendingUp, TrendingDown, Minus,
  Briefcase, BarChart2, Activity, Sparkles, RefreshCw,
  ChevronRight, ShieldCheck, Cpu, Zap, AlertCircle,
  BookOpen, Settings2, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseIntent, type Slots, type Intent } from "@/lib/chat-intents";
import {
  executeAction, verifyMpin, needsMpin, needsConfirm,
  isMpinVerified, type ActionResult,
} from "@/lib/chat-actions";
import { getPortfolios, type Portfolio } from "@/lib/portfolio-data";
import { API_BASE } from "@/lib/api-base";
import Navigation from "@/components/Navigation";

// ============================================================================
// Shared types
// ============================================================================

type Role = "user" | "bot";

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  result?: ActionResult;
  isTyping?: boolean;
}

interface PendingAction {
  intent: Intent;
  slots: Slots;
  step: string;
}

// ============================================================================
// Quick suggestion chips (Smart Assistant tab)
// ============================================================================

const SUGGESTIONS = [
  "My portfolios",
  "Market sentiment",
  "Price of TCS.NS",
  "My total investment",
  "Bullish sectors",
  "Market summary",
  "Help",
];

// ============================================================================
// Sentiment label helpers
// ============================================================================

const LABEL_COLOR: Record<string, string> = {
  BULLISH: "text-emerald-600 bg-emerald-50 ring-emerald-200",
  NEUTRAL: "text-amber-600 bg-amber-50 ring-amber-200",
  BEARISH: "text-rose-600 bg-rose-50 ring-rose-200",
};

function LabelBadge({ label }: { label: string }) {
  const Icon = label === "BULLISH" ? TrendingUp : label === "BEARISH" ? TrendingDown : Minus;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1", LABEL_COLOR[label] ?? LABEL_COLOR["NEUTRAL"])}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

// ============================================================================
// Rich card renderers (Smart Assistant)
// ============================================================================

function PortfolioListCard({ data }: { data: Portfolio[] }) {
  return (
    <div className="mt-2 space-y-2">
      {data.map((p) => (
        <div key={p.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-500">{(p.holdings ?? []).length} holdings</p>
            </div>
            <p className="text-sm font-semibold text-[#4F8DF7]">
              ₹{(p.holdings ?? []).reduce((s, h) => s + h.quantity * Number(h.buy_price), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HoldingListCard({ data }: { data: { portfolio: Portfolio; holdings: Portfolio["holdings"] } }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2 text-left">Ticker</th>
            <th className="px-4 py-2 text-right">Qty</th>
            <th className="px-4 py-2 text-right">Buy Price</th>
            <th className="px-4 py-2 text-right">Cost Basis</th>
          </tr>
        </thead>
        <tbody>
          {data.holdings.map((h) => (
            <tr key={h.id} className="border-b border-slate-50 last:border-0">
              <td className="px-4 py-2 font-bold text-[#4F8DF7]">
                {h.ticker}
                <p className="text-[10px] font-normal text-slate-400">{h.company_name}</p>
              </td>
              <td className="px-4 py-2 text-right font-semibold text-slate-700">{h.quantity}</td>
              <td className="px-4 py-2 text-right text-slate-600">₹{Number(h.buy_price).toLocaleString("en-IN")}</td>
              <td className="px-4 py-2 text-right font-semibold text-slate-900">₹{(h.quantity * Number(h.buy_price)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SentimentOverviewCard({ data }: { data: { sector: string; label: string; avg_score: number; bullish_count: number; bearish_count: number; article_count: number }[] }) {
  return (
    <div className="mt-2 space-y-1.5">
      {data.slice(0, 8).map((s) => (
        <div key={s.sector} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{s.sector}</p>
            <p className="text-[10px] text-slate-400">{s.article_count} articles · ▲{s.bullish_count} ▼{s.bearish_count}</p>
          </div>
          <div className="ml-3 flex items-center gap-2 shrink-0">
            <span className={cn("text-sm font-extrabold tabular-nums", s.avg_score >= 0.05 ? "text-emerald-600" : s.avg_score <= -0.05 ? "text-rose-600" : "text-amber-600")}>
              {s.avg_score >= 0 ? "+" : ""}{s.avg_score.toFixed(3)}
            </span>
            <LabelBadge label={s.label} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SentimentSectorCard({ data }: {
  data: {
    sector: string;
    snapshot: { label: string; avg_score: number; bullish_count: number; neutral_count: number; bearish_count: number; article_count: number };
    articles: { id: number; ticker: string; headline: string; source: string; compound_score: number; label: string }[];
  }
}) {
  const snap = data.snapshot;
  return (
    <div className="mt-2 space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Score", value: (snap.avg_score >= 0 ? "+" : "") + snap.avg_score.toFixed(3), color: "text-slate-900" },
          { label: "Articles", value: snap.article_count, color: "text-slate-600" },
          { label: "Bullish", value: snap.bullish_count, color: "text-emerald-600" },
          { label: "Bearish", value: snap.bearish_count, color: "text-rose-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={cn("text-lg font-extrabold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>
      <LabelBadge label={snap.label} />
      <div className="space-y-1.5">
        {data.articles.slice(0, 4).map((a) => (
          <div key={a.id} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-white p-3">
            <LabelBadge label={a.label} />
            <p className="flex-1 text-xs font-medium text-slate-700 leading-snug">{a.headline}</p>
            <span className={cn("shrink-0 text-xs font-bold tabular-nums", a.compound_score >= 0.05 ? "text-emerald-600" : a.compound_score <= -0.05 ? "text-rose-600" : "text-amber-600")}>
              {a.compound_score >= 0 ? "+" : ""}{a.compound_score.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PnlCard({ data }: {
  data: {
    rows?: { ticker: string; qty: number; buyPrice: number; currentPrice?: number; company: string }[];
    breakdown?: { name: string; value: number; count: number }[];
    total?: number;
    totalPnl?: number;
  }
}) {
  if (data.breakdown) {
    return (
      <div className="mt-2 space-y-1.5">
        {data.breakdown.map((b) => (
          <div key={b.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div>
              <p className="text-sm font-bold text-slate-800">{b.name}</p>
              <p className="text-xs text-slate-400">{b.count} holdings</p>
            </div>
            <p className="text-sm font-extrabold text-[#4F8DF7]">₹{b.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl border border-[#4F8DF7]/30 bg-blue-50 px-3 py-2">
          <p className="text-sm font-bold text-slate-800">Total</p>
          <p className="text-sm font-extrabold text-[#4F8DF7]">₹{(data.total || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
        </div>
      </div>
    );
  }
  if (data.rows) {
    return (
      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 text-left">Stock</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Buy</th>
              <th className="px-3 py-2 text-right">Now</th>
              <th className="px-3 py-2 text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => {
              const pnl = r.currentPrice !== undefined ? (r.currentPrice - r.buyPrice) * r.qty : undefined;
              return (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-2 font-bold text-[#4F8DF7]">{r.ticker}</td>
                  <td className="px-3 py-2 text-right">{r.qty}</td>
                  <td className="px-3 py-2 text-right">₹{r.buyPrice.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 text-right">{r.currentPrice ? `₹${r.currentPrice.toLocaleString("en-IN")}` : "—"}</td>
                  <td className={cn("px-3 py-2 text-right font-bold", pnl === undefined ? "text-slate-400" : pnl >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {pnl !== undefined ? `${pnl >= 0 ? "+" : ""}₹${Math.abs(pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

// ============================================================================
// Markdown-light text renderer
// ============================================================================

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : p.split("\n").map((line, j) => (
              <span key={`${i}-${j}`}>{j > 0 && <br />}{line}</span>
            ))
      )}
    </>
  );
}

// ============================================================================
// Message bubble (shared)
// ============================================================================

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const renderCard = (result: ActionResult) => {
    const d = result.data as Record<string, unknown> | undefined;
    switch (result.cardType) {
      case "portfolio_list":     return <PortfolioListCard data={d as Portfolio[]} />;
      case "holding_list":       return <HoldingListCard data={d as { portfolio: Portfolio; holdings: Portfolio["holdings"] }} />;
      case "sentiment_overview": return <SentimentOverviewCard data={d as { sector: string; label: string; avg_score: number; bullish_count: number; bearish_count: number; article_count: number }[]} />;
      case "sentiment_sector":   return <SentimentSectorCard data={d as { sector: string; snapshot: { label: string; avg_score: number; bullish_count: number; neutral_count: number; bearish_count: number; article_count: number }; articles: { id: number; ticker: string; headline: string; source: string; compound_score: number; label: string }[] }} />;
      case "pnl_table":          return <PnlCard data={d as { rows?: { ticker: string; qty: number; buyPrice: number; currentPrice?: number; company: string }[]; breakdown?: { name: string; value: number; count: number }[]; total?: number; totalPnl?: number }} />;
      default: return null;
    }
  };
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#4F8DF7] shadow-sm">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
        isUser
          ? "rounded-tr-none bg-[#4F8DF7] text-white"
          : "rounded-tl-none border border-slate-200 bg-white text-slate-800",
      )}>
        {msg.isTyping ? (
          <div className="flex gap-1.5 py-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <>
            <div className="leading-relaxed"><RichText text={msg.text} /></div>
            {msg.result && renderCard(msg.result)}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MPIN overlay
// ============================================================================

function MpinInput({ onSubmit, onCancel }: { onSubmit: (pin: string) => void; onCancel: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    if (pin.length !== 4) { setError("Please enter exactly 4 digits."); return; }
    setError(""); onSubmit(pin);
  };
  return (
    <div className="mx-auto max-w-xs rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[#4F8DF7]" />
        <p className="text-sm font-bold text-slate-800">Enter your MPIN</p>
      </div>
      <p className="mb-4 text-xs text-slate-500">For your security, please enter your 4-digit MPIN to proceed with this action.</p>
      <input
        type="password" inputMode="numeric" maxLength={4} placeholder="••••"
        value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        onKeyDown={(e) => e.key === "Enter" && submit()} autoFocus
        className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none transition focus:border-[#4F8DF7] focus:ring-2 focus:ring-[#4F8DF7]/15"
      />
      {error && <p className="mb-2 text-xs text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
        <button onClick={submit} className="flex-1 rounded-xl bg-[#4F8DF7] py-2 text-sm font-semibold text-white transition hover:bg-blue-600">Confirm</button>
      </div>
    </div>
  );
}

// ============================================================================
// Confirm dialog
// ============================================================================

function ConfirmDialog({ text, onConfirm, onCancel }: { text: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="mx-auto max-w-xs rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-800">⚠️ Are you sure?</p>
      <p className="mb-4 text-xs text-slate-600">{text}</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={onConfirm} className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-semibold text-white hover:bg-rose-600">Delete</button>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 1 — Smart AI Assistant
// ============================================================================

function SmartAssistantTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hello! 👋 I'm your StockCompass AI assistant. I can help you manage portfolios, check live stock prices, read market sentiment, and much more. What would you like to know today? 😊",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const pendingRef = useRef<PendingAction | null>(null);
  const [showMpin, setShowMpin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const pendingAfterMpinRef = useRef<(() => Promise<void>) | null>(null);
  const pendingAfterConfirmRef = useRef<(() => Promise<void>) | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stock_compass_token") : null;
    setIsLoggedIn(!!token);
    if (token) getPortfolios().then(setPortfolios).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, showMpin, showConfirm]);

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
            need_portfolio_name: "Of course! What would you like to name the portfolio? 😊",
            need_ticker: "Sure! Which stock ticker? (e.g., TCS.NS)",
            need_quantity: "Got it! How many shares would you like to add?",
            need_price: "Almost there! What was the buy price per share (₹)?",
            need_portfolio: "Which portfolio? " + portfolios.map((p) => `**${p.name}**`).join(" / "),
            need_new_name: "What would you like to rename it to?",
            need_sector: "Which sector? (e.g., IT, Banking, Healthcare)",
            need_tickers: "Please provide two ticker symbols to compare (e.g., TCS.NS and INFY.NS).",
          };
          pushBot(prompts[`need_${step}`] || "Could you please provide a bit more information?");
        } else {
          pushBot(`I'm sorry, something went wrong: ${msg}. Please try again! 🙏`);
        }
      }
    };

    const requiresMpin = needsMpin(intent) && !isMpinVerified();
    const requiresConfirm = needsConfirm(intent);

    if (requiresConfirm) {
      const label = intent === "PORTFOLIO_DELETE" ? `delete portfolio "${slots.portfolioName}"` : `remove ${slots.ticker} from your portfolio`;
      setConfirmText(`This will permanently ${label}. This action cannot be undone.`);
      pendingAfterConfirmRef.current = async () => {
        setShowConfirm(false);
        if (requiresMpin) { pendingAfterMpinRef.current = run; setShowMpin(true); }
        else await run();
      };
      setShowConfirm(true);
      return;
    }

    if (requiresMpin) { pendingAfterMpinRef.current = run; setShowMpin(true); return; }
    await run();
  }, [portfolios, pushBot, pushTyping, removeTyping]);

  const handleSlotCollection = useCallback(async (pending: PendingAction, userText: string) => {
    const slots = { ...pending.slots };
    const t = userText.trim();
    switch (pending.step) {
      case "need_portfolio_name": slots.portfolioName = t; break;
      case "need_new_name":       slots.newName = t; break;
      case "need_ticker":         slots.ticker = t.toUpperCase(); break;
      case "need_quantity":       slots.quantity = parseInt(t.replace(/[^0-9]/g, ""), 10); break;
      case "need_price":          slots.price = parseFloat(t.replace(/[^0-9.]/g, "")); break;
      case "need_sector":         slots.sector = t; break;
      case "need_portfolio_select": {
        const found = portfolios.find((p) => p.name.toLowerCase().includes(t.toLowerCase()));
        if (found) { slots.portfolioName = found.name; }
        else { pushBot(`I couldn't find a portfolio named "${t}". Please try again.`); return; }
        break;
      }
    }
    pendingRef.current = null;
    await executeWithGuards(pending.intent, slots);
  }, [portfolios, executeWithGuards, pushBot]);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setLoading(true);
    pushUser(trimmed);
    try {
      if (pendingRef.current) { await handleSlotCollection(pendingRef.current, trimmed); return; }
      const { intent, slots } = parseIntent(trimmed);
      if (
        ["PORTFOLIO_LIST","PORTFOLIO_CREATE","PORTFOLIO_DELETE","PORTFOLIO_RENAME",
          "HOLDING_ADD","HOLDING_REMOVE","HOLDING_LIST","PORTFOLIO_TOTAL","PORTFOLIO_PNL",
          "PORTFOLIO_EXPOSURE","PORTFOLIO_BEST_STOCK","PORTFOLIO_OVERVALUED"].includes(intent) && !isLoggedIn
      ) {
        pushBot("I'd love to help with that! Please **sign in** first to access your portfolio features. 😊");
        return;
      }
      await executeWithGuards(intent, slots);
    } finally { setLoading(false); }
  }, [loading, pushUser, pushBot, handleSlotCollection, executeWithGuards, isLoggedIn]);

  const handleMpinSubmit = useCallback(async (pin: string) => {
    const valid = await verifyMpin(pin);
    if (!valid) { pushBot("Hmm, that MPIN doesn't seem right. Please try again. 🔐"); setShowMpin(false); return; }
    pushBot("MPIN verified! ✅ Proceeding with your request…");
    setShowMpin(false);
    if (pendingAfterMpinRef.current) { const fn = pendingAfterMpinRef.current; pendingAfterMpinRef.current = null; await fn(); }
  }, [pushBot]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  return (
    <div className="flex min-h-0 flex-1">
      {/* Sidebar */}
      <div className="hidden w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-slate-200 bg-white p-3 lg:flex">
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Actions</p>
        {[
          { icon: Briefcase,  label: "My portfolios",     msg: "Show my portfolios" },
          { icon: BarChart2,  label: "Market sentiment",  msg: "Market sentiment" },
          { icon: TrendingUp, label: "Bullish sectors",   msg: "Which sectors are bullish?" },
          { icon: Activity,   label: "Market summary",    msg: "Market summary" },
          { icon: Sparkles,   label: "Stock advice",      msg: "Should I buy TCS.NS?" },
          { icon: RefreshCw,  label: "Refresh sentiment", msg: "Refresh sentiment" },
        ].map((item) => (
          <button key={item.label} onClick={() => handleSend(item.msg)} disabled={loading}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-[#4F8DF7] disabled:opacity-50">
            <item.icon className="h-4 w-4 shrink-0 text-[#4F8DF7]" />
            {item.label}
            <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
          {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
          {showMpin && (
            <MpinInput onSubmit={handleMpinSubmit}
              onCancel={() => { setShowMpin(false); pushBot("No problem, the action was cancelled. Let me know if you need anything else! 😊"); }} />
          )}
          {showConfirm && (
            <ConfirmDialog text={confirmText}
              onConfirm={async () => { if (pendingAfterConfirmRef.current) { const fn = pendingAfterConfirmRef.current; pendingAfterConfirmRef.current = null; await fn(); } }}
              onCancel={() => { setShowConfirm(false); pushBot("Action cancelled. Let me know if you need anything else! 😊"); }} />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-slate-100 bg-white px-4 py-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => handleSend(s)} disabled={loading}
              className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#4F8DF7] transition hover:bg-blue-100 disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea ref={inputRef} rows={1} value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`; }}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything — portfolios, prices, sentiment…"
              disabled={loading || showMpin || showConfirm}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#4F8DF7] focus:bg-white focus:ring-2 focus:ring-[#4F8DF7]/10 disabled:opacity-50"
            />
            <button onClick={() => handleSend(input)} disabled={!input.trim() || loading || showMpin || showConfirm}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4F8DF7] text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-40">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 2 — Research AI (Ollama / RAG)
// ============================================================================

interface RagMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  sources?: { symbol: string; name: string; sector: string; distance: number }[];
  error?: boolean;
}

function ResearchAiTab() {
  const [messages, setMessages] = useState<RagMessage[]>([
    {
      id: "rag-welcome",
      role: "bot",
      text: "Hello! 👋 I'm the StockCompass Research AI, powered by your local Ollama model.\n\nI use vector embeddings (pgvector) to find the most relevant stocks and generate a concise research answer with risk levels, short-term predictions, and buy/hold/sell suggestions.\n\nPlease make sure Ollama is running locally before asking a question. 🙏",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [chatModel, setChatModel] = useState("tinyllama");
  const [embedModel, setEmbedModel] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: RagMessage = { id: Date.now().toString(), role: "user", text: trimmed };
    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: typingId, role: "bot", text: "", error: false }]);

    try {
      const body: Record<string, string> = { query: trimmed, model: chatModel };
      if (ollamaUrl) body.base_url = ollamaUrl;
      if (embedModel.trim()) body.embed_model = embedModel.trim();

      const res = await fetch(`${API_BASE}/chatbot/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setMessages((prev) => prev.filter((m) => m.id !== typingId));

      if (!res.ok || data.error) {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(), role: "bot", error: true,
          text: `⚠️ ${data.error || `Request failed (${res.status}). Is Ollama running at ${ollamaUrl}?`}`,
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(), role: "bot",
          text: data.answer || "No response received.",
          sources: data.sources || [],
        }]);
      }
    } catch (err: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      const msg = err instanceof Error ? err.message : "Network error";
      setMessages((prev) => [...prev, {
        id: Date.now().toString(), role: "bot", error: true,
        text: `⚠️ Could not reach Ollama at **${ollamaUrl}**: ${msg}. Please make sure Ollama is running. 🙏`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Ollama config banner */}
      <div className="shrink-0 border-b border-slate-200 bg-amber-50">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex w-full items-center gap-2 px-5 py-2.5 text-left text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
        >
          <Settings2 className="h-4 w-4 shrink-0" />
          <span>Ollama Settings · model: <strong>{chatModel}</strong> · url: <strong>{ollamaUrl}</strong></span>
          <span className="ml-auto flex items-center gap-1">
            {showSettings ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showSettings ? "collapse" : "configure"}
          </span>
        </button>
        {showSettings && (
          <div className="border-t border-amber-200 bg-amber-50 px-5 py-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Ollama Base URL", value: ollamaUrl, set: setOllamaUrl, placeholder: "http://localhost:11434" },
                { label: "Chat Model", value: chatModel, set: setChatModel, placeholder: "tinyllama" },
                { label: "Embed Model (optional)", value: embedModel, set: setEmbedModel, placeholder: "nomic-embed-text" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-amber-700">{f.label}</label>
                  <input
                    value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-700 outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-amber-600">
              Leave Embed Model empty to use general knowledge mode (no pgvector lookup).
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "bot" && (
              <div className={cn("mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm", msg.error ? "bg-rose-100" : "bg-violet-600")}>
                {msg.error ? <AlertCircle className="h-4 w-4 text-rose-600" /> : <Cpu className="h-4 w-4 text-white" />}
              </div>
            )}
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
              msg.role === "user"
                ? "rounded-tr-none bg-violet-600 text-white"
                : msg.error
                ? "rounded-tl-none border border-rose-200 bg-rose-50 text-rose-800"
                : "rounded-tl-none border border-slate-200 bg-white text-slate-800"
            )}>
              {/* typing indicator */}
              {msg.id.startsWith("typing") ? (
                <div className="flex gap-1.5 py-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap leading-relaxed"><RichText text={msg.text} /></div>
                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <BookOpen className="h-3 w-3" /> Vector Sources ({msg.sources.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((s) => (
                          <span key={s.symbol} className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            {s.symbol} · {s.sector} · d={s.distance.toFixed(3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Research AI suggestion chips */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-slate-100 bg-white px-4 py-2">
        {[
          "Best IT stocks to buy now",
          "Compare TCS and Infosys",
          "Low risk banking stocks",
          "High PE ratio pharma stocks",
          "Diversified portfolio suggestion",
          "Undervalued FMCG stocks",
          "Top Nifty 50 performers",
          "Safe energy sector picks",
        ].map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="shrink-0 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={1} value={input}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`; }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
            placeholder="Ask the Research AI about stocks, risk, or comparisons…"
            disabled={loading}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-400/10 disabled:opacity-50"
          />
          <button onClick={() => handleSend(input)} disabled={!input.trim() || loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-40">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] font-medium text-slate-400">
          Powered by Ollama · Requires a running local model
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main layout with tabs
// ============================================================================

type Tab = "smart" | "research";

function ChatbotContent() {
  const [activeTab, setActiveTab] = useState<Tab>("smart");

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col bg-slate-50">
      {/* Tab header */}
      <div className="shrink-0 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex">
          {/* Smart AI tab */}
          <button
            onClick={() => setActiveTab("smart")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold transition border-b-2",
              activeTab === "smart"
                ? "border-[#4F8DF7] text-[#4F8DF7] bg-blue-50/60"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#4F8DF7]/10">
              <Zap className={cn("h-3.5 w-3.5", activeTab === "smart" ? "text-[#4F8DF7]" : "text-slate-400")} />
            </div>
            Smart Assistant
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", activeTab === "smart" ? "bg-[#4F8DF7] text-white" : "bg-slate-200 text-slate-500")}>
              30 ops
            </span>
          </button>

          {/* Research AI tab */}
          <button
            onClick={() => setActiveTab("research")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold transition border-b-2",
              activeTab === "research"
                ? "border-violet-600 text-violet-600 bg-violet-50/60"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100">
              <Cpu className={cn("h-3.5 w-3.5", activeTab === "research" ? "text-violet-600" : "text-slate-400")} />
            </div>
            Research AI
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", activeTab === "research" ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-500")}>
              Ollama
            </span>
          </button>
        </div>
      </div>

      {/* Tab content — each fills remaining height */}
      <div className="flex min-h-0 flex-1 flex-col">
        {activeTab === "smart"    && <SmartAssistantTab />}
        {activeTab === "research" && <ResearchAiTab />}
      </div>
    </div>
  );
}

export default function ChatbotPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <Suspense fallback={
        <div className="flex h-[calc(100vh-56px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4F8DF7]" />
        </div>
      }>
        <ChatbotContent />
      </Suspense>
    </div>
  );
}
