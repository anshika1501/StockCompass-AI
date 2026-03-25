/**
 * chat-actions.ts
 *
 * Executes resolved intents by calling the existing StockCompass APIs.
 * Returns structured ActionResult objects that the UI renders as rich cards.
 *
 * MPIN guard: any portfolio write operation is gated behind MPIN verification.
 * Verification is cached for MPIN_TTL_MS milliseconds per session.
 */

import { API_BASE } from "./api-base";
import {
  getPortfolios, createPortfolio, deletePortfolio, updatePortfolio,
  addHolding, deleteHolding, searchLiveStocks,
  type Portfolio, type Holding,
} from "./portfolio-data";
import type { Intent, Slots } from "./chat-intents";

// ---------------------------------------------------------------------------
// MPIN cache (session-level, 5 minutes)
// ---------------------------------------------------------------------------

const MPIN_TTL_MS = 5 * 60 * 1000;
let _mpinVerifiedAt: number | null = null;

export function isMpinVerified(): boolean {
  if (_mpinVerifiedAt === null) return false;
  return Date.now() - _mpinVerifiedAt < MPIN_TTL_MS;
}

export function markMpinVerified(): void {
  _mpinVerifiedAt = Date.now();
}

export function clearMpinCache(): void {
  _mpinVerifiedAt = null;
}

// Actions that require MPIN
const MPIN_REQUIRED: Intent[] = [
  "PORTFOLIO_CREATE", "PORTFOLIO_DELETE", "PORTFOLIO_RENAME",
  "HOLDING_ADD", "HOLDING_REMOVE",
];

export function needsMpin(intent: Intent): boolean {
  return MPIN_REQUIRED.includes(intent);
}

// Actions that require confirmation
const CONFIRM_REQUIRED: Intent[] = ["PORTFOLIO_DELETE", "HOLDING_REMOVE"];
export function needsConfirm(intent: Intent): boolean {
  return CONFIRM_REQUIRED.includes(intent);
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("stock_compass_token") : null;
}

function getUser(): { name?: string; email?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("stock_compass_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Result types — the UI renders these as rich cards
// ---------------------------------------------------------------------------

export type CardType =
  | "text"
  | "portfolio_list"
  | "holding_list"
  | "stock_detail"
  | "stock_compare"
  | "sentiment_overview"
  | "sentiment_sector"
  | "sentiment_stock"
  | "pnl_table"
  | "sector_exposure"
  | "error"
  | "success";

export interface ActionResult {
  cardType: CardType;
  text: string;          // primary human-readable message (humble tone)
  data?: unknown;        // structured payload for the card renderer
}

// ---------------------------------------------------------------------------
// Verify MPIN via backend
// ---------------------------------------------------------------------------

export async function verifyMpin(mpin: string): Promise<boolean> {
  try {
    const r = await apiFetch<{ valid: boolean }>("/verify-mpin/", {
      method: "POST",
      body: JSON.stringify({ mpin }),
    });
    if (r.valid) markMpinVerified();
    return r.valid;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handlePortfolioList(): Promise<ActionResult> {
  const portfolios = await getPortfolios();
  if (!portfolios.length) {
    return {
      cardType: "text",
      text: "You don't have any portfolios yet. You can say **\"Create a portfolio called Growth\"** to get started! 😊",
    };
  }
  return {
    cardType: "portfolio_list",
    text: `Here are your ${portfolios.length} portfolio${portfolios.length > 1 ? "s" : ""}:`,
    data: portfolios,
  };
}

async function handlePortfolioCreate(slots: Slots): Promise<ActionResult> {
  const name = slots.portfolioName;
  if (!name) throw new Error("__MISSING_PORTFOLIO_NAME__");
  const portfolio = await createPortfolio(name);
  return {
    cardType: "success",
    text: `🎉 Portfolio **"${portfolio.name}"** has been created successfully! You can now add holdings to it.`,
    data: portfolio,
  };
}

async function handlePortfolioDelete(slots: Slots, portfolios: Portfolio[]): Promise<ActionResult> {
  const name = slots.portfolioName;
  if (!name) throw new Error("__MISSING_PORTFOLIO_NAME__");
  const found = portfolios.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
  if (!found) throw new Error(`I couldn't find a portfolio named **"${name}"**. Please check the name and try again.`);
  await deletePortfolio(found.id);
  return {
    cardType: "success",
    text: `✅ Portfolio **"${found.name}"** has been deleted successfully.`,
  };
}

async function handlePortfolioRename(slots: Slots, portfolios: Portfolio[]): Promise<ActionResult> {
  const { portfolioName, newName } = slots;
  if (!portfolioName || !newName) throw new Error("__MISSING_RENAME_SLOTS__");
  const found = portfolios.find((p) => p.name.toLowerCase().includes(portfolioName.toLowerCase()));
  if (!found) throw new Error(`I couldn't find a portfolio named **"${portfolioName}"**.`);
  const updated = await updatePortfolio(found.id, { name: newName });
  return {
    cardType: "success",
    text: `✅ Portfolio has been renamed to **"${updated.name}"** successfully!`,
  };
}

async function handleHoldingAdd(slots: Slots, portfolios: Portfolio[]): Promise<ActionResult> {
  const { ticker, quantity, price, portfolioName } = slots;
  if (!ticker) throw new Error("__MISSING_TICKER__");
  if (!quantity) throw new Error("__MISSING_QUANTITY__");
  if (!price) throw new Error("__MISSING_PRICE__");

  let portfolio: Portfolio | undefined;
  if (portfolioName) {
    portfolio = portfolios.find((p) => p.name.toLowerCase().includes(portfolioName.toLowerCase()));
  }
  if (!portfolio && portfolios.length === 1) portfolio = portfolios[0];
  if (!portfolio) throw new Error("__MISSING_PORTFOLIO__");

  // Try to resolve company name
  let companyName = ticker;
  try {
    const results = await searchLiveStocks(ticker);
    if (results.length) companyName = results[0].company_name;
  } catch { /* fallback to ticker */ }

  const holding = await addHolding(portfolio.id, ticker.toUpperCase(), companyName, quantity, price);
  return {
    cardType: "success",
    text: `✅ Added **${quantity} shares of ${ticker.toUpperCase()}** at ₹${price.toLocaleString("en-IN")} to **"${portfolio.name}"**. Great choice!`,
    data: holding,
  };
}

async function handleHoldingRemove(slots: Slots, portfolios: Portfolio[]): Promise<ActionResult> {
  const ticker = slots.ticker;
  if (!ticker) throw new Error("__MISSING_TICKER__");

  let found: Holding | undefined;
  let fromPortfolio = "";
  for (const p of portfolios) {
    const h = (p.holdings ?? []).find((h) => h.ticker.toLowerCase() === ticker.toLowerCase() || h.ticker.toLowerCase().startsWith(ticker.toLowerCase()));
    if (h) { found = h; fromPortfolio = p.name; break; }
  }
  if (!found) throw new Error(`I couldn't find a holding for **${ticker.toUpperCase()}** in any of your portfolios.`);
  await deleteHolding(found.id);
  return {
    cardType: "success",
    text: `✅ Removed **${found.ticker}** from **"${fromPortfolio}"** successfully.`,
  };
}

async function handleHoldingList(slots: Slots, portfolios: Portfolio[]): Promise<ActionResult> {
  if (!portfolios.length) {
    return { cardType: "text", text: "You don't have any portfolios yet." };
  }
  const name = slots.portfolioName;
  const target = name
    ? portfolios.find((p) => p.name.toLowerCase().includes(name.toLowerCase())) ?? portfolios[0]
    : portfolios[0];
  const holdings = target.holdings ?? [];
  if (!holdings.length) {
    return { cardType: "text", text: `Portfolio **"${target.name}"** has no holdings yet. Try adding some! 😊` };
  }
  return {
    cardType: "holding_list",
    text: `Here are the holdings in **"${target.name}"** (${holdings.length} positions):`,
    data: { portfolio: target, holdings },
  };
}

async function handlePortfolioTotal(portfolios: Portfolio[]): Promise<ActionResult> {
  if (!portfolios.length) {
    return { cardType: "text", text: "You don't have any portfolios yet." };
  }
  let total = 0;
  const breakdown: { name: string; value: number; count: number }[] = [];
  for (const p of portfolios) {
    const pVal = (p.holdings ?? []).reduce((s, h) => s + h.quantity * Number(h.buy_price), 0);
    total += pVal;
    breakdown.push({ name: p.name, value: pVal, count: (p.holdings ?? []).length });
  }
  return {
    cardType: "pnl_table",
    text: `Your total investment across ${portfolios.length} portfolio${portfolios.length > 1 ? "s" : ""} is **₹${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}**. Here's a breakdown:`,
    data: { total, breakdown },
  };
}

// ── Sentiment ────────────────────────────────────────────────────────────────

async function handleSentimentOverview(): Promise<ActionResult> {
  const data = await apiFetch<unknown[]>("/sentiment/sectors/");
  if (!data.length) {
    return { cardType: "text", text: "No sentiment data is available yet. You can say **\"Refresh sentiment\"** to fetch today's news! 😊" };
  }
  return {
    cardType: "sentiment_overview",
    text: "Here's today's market sentiment across all sectors:",
    data,
  };
}

async function handleSentimentSector(slots: Slots): Promise<ActionResult> {
  const sector = slots.sector;
  if (!sector) throw new Error("__MISSING_SECTOR__");
  const slug = sector.toLowerCase().replace(/ /g, "-").replace(/&/g, "and");
  const data = await apiFetch<unknown>(`/sentiment/sector/${slug}/`);
  return {
    cardType: "sentiment_sector",
    text: `Here's the sentiment analysis for the **${sector}** sector:`,
    data,
  };
}

async function handleSentimentStock(slots: Slots): Promise<ActionResult> {
  const ticker = slots.ticker;
  if (!ticker) throw new Error("__MISSING_TICKER__");
  const data = await apiFetch<unknown>(`/sentiment/stock/${ticker.toUpperCase()}/`);
  return {
    cardType: "sentiment_stock",
    text: `Here's the sentiment analysis for **${ticker.toUpperCase()}**:`,
    data,
  };
}

async function handleSentimentFilter(label: "BULLISH" | "BEARISH"): Promise<ActionResult> {
  const all = await apiFetch<{ sector: string; label: string; avg_score: number; article_count: number }[]>("/sentiment/sectors/");
  const filtered = all.filter((s) => s.label === label);
  const emoji = label === "BULLISH" ? "📈" : "📉";
  if (!filtered.length) {
    return { cardType: "text", text: `No ${label.toLowerCase()} sectors found in today's data. Try refreshing sentiment!` };
  }
  return {
    cardType: "sentiment_overview",
    text: `${emoji} Found **${filtered.length}** ${label.toLowerCase()} sector${filtered.length > 1 ? "s" : ""} today:`,
    data: filtered,
  };
}

async function handleSentimentRefresh(): Promise<ActionResult> {
  const data = await apiFetch<{ status: string; articles_saved: number; processed: number }>("/sentiment/refresh/", { method: "POST", body: "{}" });
  return {
    cardType: "success",
    text: `🔄 Sentiment refreshed! Processed **${data.processed}** stocks and saved **${data.articles_saved}** articles. The sector cards are now up to date.`,
  };
}

async function handleSentimentTopSector(): Promise<ActionResult> {
  const all = await apiFetch<{ sector: string; label: string; avg_score: number }[]>("/sentiment/sectors/");
  if (!all.length) return { cardType: "text", text: "No sentiment data available yet." };
  const top = all[0];
  return {
    cardType: "text",
    text: `🏆 The highest sentiment sector today is **${top.sector}** with a score of **${top.avg_score >= 0 ? "+" : ""}${top.avg_score.toFixed(3)}** (${top.label}).`,
  };
}

// ── Live stock data ──────────────────────────────────────────────────────────

async function handleStockPrice(slots: Slots): Promise<ActionResult> {
  const ticker = slots.ticker;
  if (!ticker) throw new Error("__MISSING_TICKER__");
  const data = await apiFetch<{
    symbol: string; name: string; current_price: number; previous_close: number;
    change_percent?: number; sector?: string;
  }>(`/stocks/live-detail/?ticker=${encodeURIComponent(ticker)}`);
  const change = data.current_price - (data.previous_close || data.current_price);
  const pct = data.previous_close ? ((change / data.previous_close) * 100).toFixed(2) : "0.00";
  const dir = change >= 0 ? "📈" : "📉";
  return {
    cardType: "stock_detail",
    text: `${dir} **${data.symbol}** (${data.name}) is trading at **₹${Number(data.current_price).toLocaleString("en-IN")}** (${change >= 0 ? "+" : ""}${pct}% today).`,
    data,
  };
}

async function handleStockCompare(slots: Slots): Promise<ActionResult> {
  const t1 = slots.ticker;
  const t2 = slots.query;
  if (!t1 || !t2) throw new Error("__MISSING_TICKERS__");
  const data = await apiFetch<unknown>(`/stocks/live-compare/?tickers=${encodeURIComponent(t1 + "," + t2)}`);
  return {
    cardType: "stock_compare",
    text: `Here's a comparison of **${t1.toUpperCase()}** vs **${t2.toUpperCase()}**:`,
    data,
  };
}

async function handleStockPE(slots: Slots): Promise<ActionResult> {
  const ticker = slots.ticker;
  if (!ticker) throw new Error("__MISSING_TICKER__");
  const data = await apiFetch<{ symbol: string; name: string; pe_ratio?: number; current_price: number }>(`/stocks/live-detail/?ticker=${encodeURIComponent(ticker)}`);
  const pe = data.pe_ratio ? `**${data.pe_ratio}**` : "not available";
  return {
    cardType: "stock_detail",
    text: `The P/E ratio of **${data.symbol}** (${data.name}) is ${pe}. Current price: ₹${Number(data.current_price).toLocaleString("en-IN")}.`,
    data,
  };
}

async function handleStock52Wk(slots: Slots): Promise<ActionResult> {
  const ticker = slots.ticker;
  if (!ticker) throw new Error("__MISSING_TICKER__");
  const data = await apiFetch<{
    symbol: string; name: string; current_price: number;
    fifty_two_week_high?: number; fifty_two_week_low?: number;
  }>(`/stocks/live-detail/?ticker=${encodeURIComponent(ticker)}`);
  return {
    cardType: "stock_detail",
    text: `**${data.symbol}** 52-week range — High: **₹${data.fifty_two_week_high ?? "N/A"}** / Low: **₹${data.fifty_two_week_low ?? "N/A"}**. Current: ₹${Number(data.current_price).toLocaleString("en-IN")}.`,
    data,
  };
}

async function handleStockSearch(slots: Slots): Promise<ActionResult> {
  const q = slots.query || slots.ticker || "";
  const results = await searchLiveStocks(q);
  if (!results.length) {
    return { cardType: "text", text: `I couldn't find any stocks matching **"${q}"**. Please try a different keyword.` };
  }
  return {
    cardType: "stock_compare",
    text: `Found ${results.length} result${results.length > 1 ? "s" : ""} for **"${q}"**:`,
    data: results,
  };
}

// ── Portfolio analytics ──────────────────────────────────────────────────────

async function handlePortfolioPnl(portfolios: Portfolio[]): Promise<ActionResult> {
  if (!portfolios.length) return { cardType: "text", text: "You don't have any portfolios yet." };

  const rows: { ticker: string; qty: number; buyPrice: number; currentPrice?: number; company: string }[] = [];
  for (const p of portfolios) {
    for (const h of p.holdings ?? []) {
      let cur: number | undefined;
      try {
        const d = await apiFetch<{ current_price: number }>(`/stocks/live-detail/?ticker=${encodeURIComponent(h.ticker)}`);
        cur = Number(d.current_price);
      } catch { /* live price unavailable */ }
      rows.push({ ticker: h.ticker, qty: h.quantity, buyPrice: Number(h.buy_price), currentPrice: cur, company: h.company_name });
    }
  }

  let totalPnl = 0;
  rows.forEach((r) => {
    if (r.currentPrice !== undefined) totalPnl += (r.currentPrice - r.buyPrice) * r.qty;
  });

  return {
    cardType: "pnl_table",
    text: `Here's your portfolio P&L. Total unrealised ${totalPnl >= 0 ? "gain" : "loss"}: **₹${Math.abs(totalPnl).toLocaleString("en-IN", { maximumFractionDigits: 2 })}** ${totalPnl >= 0 ? "📈" : "📉"}:`,
    data: { rows, totalPnl },
  };
}

async function handlePortfolioExposure(portfolios: Portfolio[]): Promise<ActionResult> {
  if (!portfolios.length) return { cardType: "text", text: "You don't have any portfolios yet." };
  const sectorMap: Record<string, number> = {};
  let total = 0;
  for (const p of portfolios) {
    for (const h of p.holdings ?? []) {
      const val = h.quantity * Number(h.buy_price);
      total += val;
      try {
        const d = await apiFetch<{ sector?: string }>(`/stocks/${encodeURIComponent(h.ticker)}/`);
        const sec = d.sector || "Unknown";
        sectorMap[sec] = (sectorMap[sec] || 0) + val;
      } catch {
        sectorMap["Unknown"] = (sectorMap["Unknown"] || 0) + val;
      }
    }
  }
  return {
    cardType: "sector_exposure",
    text: "Here's your sector exposure breakdown:",
    data: { sectorMap, total },
  };
}

async function handleDiversifiedSuggest(): Promise<ActionResult> {
  const sectors = await apiFetch<{ sector: string; id: string }[]>("/sectors/");
  const picks: { sector: string; stocks: unknown[] }[] = [];
  for (const sec of sectors.slice(0, 5)) {
    try {
      const stocks = await apiFetch<unknown[]>(`/sectors/${sec.id}/stocks/?limit=1`);
      picks.push({ sector: sec.sector || sec.id, stocks });
    } catch { /* skip */ }
  }
  return {
    cardType: "text",
    text: "A good diversified portfolio covers multiple sectors. Here are some top picks from our database — but please do your own research before investing! 🙏\n\n" +
      picks.map((p) => `• **${p.sector}**: 1-2 stocks`).join("\n"),
  };
}

async function handleMarketSummary(): Promise<ActionResult> {
  const [sectors, sentiment] = await Promise.all([
    apiFetch<{ name: string; stockCount: number }[]>("/sectors/"),
    apiFetch<{ label: string; avg_score: number; sector: string }[]>("/sentiment/sectors/").catch(() => []),
  ]);
  const bullish = (sentiment as { label: string }[]).filter((s) => s.label === "BULLISH").length;
  const bearish = (sentiment as { label: string }[]).filter((s) => s.label === "BEARISH").length;
  return {
    cardType: "text",
    text: `📊 **Today's Market Summary**\n\n• **${sectors.length}** sectors tracked, **${sectors.reduce((s, x) => s + (x.stockCount || 0), 0)}** securities listed\n• Sentiment: **${bullish} bullish** / **${bearish} bearish** sectors\n• ${bullish > bearish ? "Overall market mood looks positive 📈" : "Market mood is cautious today 📉"}`,
  };
}

async function handleStockAdvice(slots: Slots): Promise<ActionResult> {
  const ticker = slots.ticker;
  if (!ticker) throw new Error("__MISSING_TICKER__");

  let sentimentText = "";
  let peText = "";

  try {
    const s = await apiFetch<{ label: string; avg_score: number; article_count: number }>(`/sentiment/stock/${ticker.toUpperCase()}/`);
    sentimentText = `News sentiment is **${s.label}** (score: ${s.avg_score >= 0 ? "+" : ""}${s.avg_score.toFixed(3)}, ${s.article_count} articles).`;
  } catch { sentimentText = "Sentiment data not available for this ticker."; }

  try {
    const d = await apiFetch<{ pe_ratio?: number; name: string; current_price: number }>(`/stocks/live-detail/?ticker=${encodeURIComponent(ticker)}`);
    if (d.pe_ratio) peText = `P/E ratio is **${d.pe_ratio}**.`;
  } catch { /* skip */ }

  return {
    cardType: "text",
    text: `Here's a quick overview for **${ticker.toUpperCase()}**:\n\n${sentimentText}\n${peText}\n\n⚠️ *This is for informational purposes only and not financial advice. Please do your own research before investing!*`,
  };
}

// ---------------------------------------------------------------------------
// Main dispatch
// ---------------------------------------------------------------------------

export async function executeAction(
  intent: Intent,
  slots: Slots,
  portfolios: Portfolio[],
): Promise<ActionResult> {
  try {
    switch (intent) {
      // Portfolio CRUD
      case "PORTFOLIO_LIST":        return await handlePortfolioList();
      case "PORTFOLIO_CREATE":      return await handlePortfolioCreate(slots);
      case "PORTFOLIO_DELETE":      return await handlePortfolioDelete(slots, portfolios);
      case "PORTFOLIO_RENAME":      return await handlePortfolioRename(slots, portfolios);
      case "HOLDING_ADD":           return await handleHoldingAdd(slots, portfolios);
      case "HOLDING_REMOVE":        return await handleHoldingRemove(slots, portfolios);
      case "HOLDING_LIST":          return await handleHoldingList(slots, portfolios);
      case "PORTFOLIO_TOTAL":       return await handlePortfolioTotal(portfolios);

      // Sentiment
      case "SENTIMENT_OVERVIEW":    return await handleSentimentOverview();
      case "SENTIMENT_SECTOR":      return await handleSentimentSector(slots);
      case "SENTIMENT_STOCK":       return await handleSentimentStock(slots);
      case "SENTIMENT_BULLISH_SECTORS": return await handleSentimentFilter("BULLISH");
      case "SENTIMENT_BEARISH_SECTORS": return await handleSentimentFilter("BEARISH");
      case "SECTOR_NEWS":           return await handleSentimentSector(slots);
      case "SENTIMENT_REFRESH":     return await handleSentimentRefresh();
      case "SENTIMENT_TOP_SECTOR":  return await handleSentimentTopSector();

      // Live stock
      case "STOCK_PRICE":           return await handleStockPrice(slots);
      case "STOCK_COMPARE":         return await handleStockCompare(slots);
      case "STOCK_PE":              return await handleStockPE(slots);
      case "STOCK_52WK":            return await handleStock52Wk(slots);
      case "STOCK_SEARCH":          return await handleStockSearch(slots);
      case "STOCK_SECTOR_LOOKUP":   return await handleStockSearch(slots);
      case "NIFTY_TOP": {
        const data = await apiFetch<unknown[]>("/nifty50/");
        return { cardType: "stock_compare", text: "Here are the Nifty 50 stocks:", data };
      }
      case "SECTOR_STOCKS": {
        if (!slots.sector) throw new Error("__MISSING_SECTOR__");
        const slug = slots.sector.toLowerCase().replace(/ /g, "-").replace(/&/g, "and");
        const data = await apiFetch<unknown[]>(`/sectors/${slug}/stocks/`);
        return { cardType: "stock_compare", text: `Stocks in **${slots.sector}**:`, data };
      }

      // Analytics
      case "PORTFOLIO_PNL":         return await handlePortfolioPnl(portfolios);
      case "PORTFOLIO_EXPOSURE":    return await handlePortfolioExposure(portfolios);
      case "PORTFOLIO_BEST_STOCK":  return await handlePortfolioPnl(portfolios);
      case "PORTFOLIO_OVERVALUED":  return await handlePortfolioPnl(portfolios);
      case "STOCK_ADVICE":          return await handleStockAdvice(slots);
      case "DIVERSIFIED_SUGGEST":   return await handleDiversifiedSuggest();
      case "MARKET_SUMMARY":        return await handleMarketSummary();

      // Meta
      case "GREETING": {
        const user = getUser();
        const name = user?.name || "there";
        return {
          cardType: "text",
          text: `Hello, ${name}! 👋 I'm your StockCompass assistant. I'm here to help you with your portfolios, live stock prices, market sentiment, and much more. What would you like to know today?`,
        };
      }
      case "HELP":
        return {
          cardType: "text",
          text: [
            "Of course! Here's what I can help you with: 😊",
            "",
            "**📁 Portfolio Management**",
            "• _Show my portfolios_ · _Create portfolio called Growth_",
            "• _Add 10 shares of TCS at ₹3500 to Growth_",
            "• _Remove TCS from my portfolio_",
            "• _My total investment_",
            "",
            "**📊 Sentiment & News**",
            "• _Market sentiment_ · _IT sector sentiment_",
            "• _Is TCS bullish or bearish?_ · _Which sectors are bullish?_",
            "• _Refresh sentiment_",
            "",
            "**📈 Live Stock Data**",
            "• _Price of RELIANCE_ · _Compare TCS and Infosys_",
            "• _PE ratio of Wipro_ · _52-week high of TATAMOTORS_",
            "",
            "**💡 Analytics**",
            "• _My portfolio P&L_ · _Sector exposure_",
            "• _Should I buy TCS?_ · _Market summary_",
          ].join("\n"),
        };

      default:
        return {
          cardType: "text",
          text: "I'm sorry, I didn't quite understand that. Could you rephrase it? You can say **\"Help\"** to see everything I can do for you! 🙏",
        };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Something went wrong";
    // Bubble up missing-slot errors so the caller can ask a follow-up question
    if (msg.startsWith("__MISSING_")) throw err;
    return {
      cardType: "error",
      text: `I'm sorry, something went wrong: ${msg}. Please try again! 🙏`,
    };
  }
}
