/**
 * chat-intents.ts
 *
 * Keyword-based intent detection + slot extraction for the StockCompass chatbot.
 * No external NLP needed — pure TypeScript rule matching.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Intent =
  // --- Portfolio CRUD ---
  | "PORTFOLIO_LIST"
  | "PORTFOLIO_CREATE"
  | "PORTFOLIO_DELETE"
  | "PORTFOLIO_RENAME"
  | "HOLDING_ADD"
  | "HOLDING_REMOVE"
  | "HOLDING_LIST"
  | "PORTFOLIO_TOTAL"
  // --- Sentiment ---
  | "SENTIMENT_OVERVIEW"
  | "SENTIMENT_SECTOR"
  | "SENTIMENT_STOCK"
  | "SENTIMENT_BULLISH_SECTORS"
  | "SENTIMENT_BEARISH_SECTORS"
  | "SECTOR_NEWS"
  | "SENTIMENT_REFRESH"
  | "SENTIMENT_TOP_SECTOR"
  // --- Live stock data ---
  | "STOCK_PRICE"
  | "STOCK_COMPARE"
  | "STOCK_SECTOR_LOOKUP"
  | "SECTOR_STOCKS"
  | "STOCK_PE"
  | "STOCK_52WK"
  | "STOCK_SEARCH"
  | "NIFTY_TOP"
  // --- Analytics ---
  | "PORTFOLIO_OVERVALUED"
  | "PORTFOLIO_EXPOSURE"
  | "PORTFOLIO_BEST_STOCK"
  | "STOCK_ADVICE"
  | "DIVERSIFIED_SUGGEST"
  | "PORTFOLIO_PNL"
  | "MARKET_SUMMARY"
  // --- Meta ---
  | "GREETING"
  | "HELP"
  | "UNKNOWN";

export interface Slots {
  ticker?: string;
  portfolioName?: string;
  quantity?: number;
  price?: number;
  sector?: string;
  newName?: string;
  query?: string;
}

export interface ParsedIntent {
  intent: Intent;
  slots: Slots;
}

// ---------------------------------------------------------------------------
// Normalise input
// ---------------------------------------------------------------------------

const norm = (s: string) => s.toLowerCase().trim();

const has = (text: string, ...words: string[]) =>
  words.some((w) => text.includes(w));

// ---------------------------------------------------------------------------
// Slot extractors
// ---------------------------------------------------------------------------

/** Extract a stock ticker like TCS, TCS.NS, RELIANCE, etc. */
function extractTicker(text: string): string | undefined {
  // Explicit .NS suffix
  const nsMatch = text.match(/\b([A-Z0-9&-]{2,20}\.NS)\b/i);
  if (nsMatch) return nsMatch[1].toUpperCase();

  // All-caps word 2-15 chars  (likely a ticker)
  const capsMatch = text.match(/\b([A-Z]{2,15})\b/);
  if (capsMatch) return capsMatch[1].toUpperCase();

  return undefined;
}

/** Extract a number (quantity or price) */
function extractNumber(text: string): number | undefined {
  const m = text.match(/[\d,]+(?:\.\d+)?/);
  if (!m) return undefined;
  return parseFloat(m[0].replace(/,/g, ""));
}

/** Extract two numbers (for compare: qty AND price, or two tickers) */
function extractTwoTickers(text: string): [string, string] | undefined {
  const matches = text.toUpperCase().match(/\b([A-Z0-9&-]{2,20}(?:\.NS)?)\b/g);
  if (matches && matches.length >= 2) {
    return [matches[0], matches[1]];
  }
  return undefined;
}

/** Extract a portfolio name — text after "called", "named", "portfolio" */
function extractPortfolioName(text: string): string | undefined {
  const patterns = [
    /(?:called|named|create|portfolio)\s+["']?([a-z0-9 &_-]{2,40})["']?/i,
    /["']([^"']{2,40})["']/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return undefined;
}

/** Sector keywords → canonical sector name */
const SECTOR_MAP: Record<string, string> = {
  it: "Information Technology",
  tech: "Information Technology",
  technology: "Information Technology",
  software: "Information Technology",
  bank: "Financial Services",
  banking: "Financial Services",
  finance: "Financial Services",
  financial: "Financial Services",
  auto: "Automobile and Auto Components",
  automobile: "Automobile and Auto Components",
  automotive: "Automobile and Auto Components",
  pharma: "Healthcare",
  healthcare: "Healthcare",
  health: "Healthcare",
  fmcg: "Fast Moving Consumer Goods",
  consumer: "Fast Moving Consumer Goods",
  realty: "Realty",
  real: "Realty",
  "real estate": "Realty",
  metal: "Metals & Mining",
  mining: "Metals & Mining",
  steel: "Metals & Mining",
  power: "Power",
  energy: "Power",
  oil: "Oil Gas & Consumable Fuels",
  gas: "Oil Gas & Consumable Fuels",
  chemical: "Chemicals",
  chemicals: "Chemicals",
  telecom: "Telecommunication",
  telecommunication: "Telecommunication",
  "capital goods": "Capital Goods",
  construction: "Construction",
  textile: "Textiles",
  textiles: "Textiles",
  media: "Media Entertainment & Publication",
  entertainment: "Media Entertainment & Publication",
  services: "Services",
  diversified: "Diversified",
};

function extractSector(text: string): string | undefined {
  const t = norm(text);
  for (const [kw, canonical] of Object.entries(SECTOR_MAP)) {
    if (t.includes(kw)) return canonical;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Intent rules
// ---------------------------------------------------------------------------

interface Rule {
  intent: Intent;
  match: (t: string) => boolean;
  extract?: (t: string, original: string) => Slots;
}

const RULES: Rule[] = [
  // ── Greeting / Help ──────────────────────────────────────────────────────
  {
    intent: "GREETING",
    match: (t) => has(t, "hello", "hi", "hey", "good morning", "good evening", "howdy", "namaste"),
  },
  {
    intent: "HELP",
    match: (t) => has(t, "help", "what can you do", "commands", "options", "guide", "features"),
  },

  // ── Portfolio CRUD ────────────────────────────────────────────────────────
  {
    intent: "PORTFOLIO_LIST",
    match: (t) =>
      has(t, "show my portfolio", "my portfolio", "list portfolio", "show portfolio", "all portfolio", "my portfolios"),
  },
  {
    intent: "PORTFOLIO_CREATE",
    match: (t) =>
      has(t, "create portfolio", "new portfolio", "make portfolio", "add portfolio", "create a portfolio", "make a portfolio"),
    extract: (t) => ({ portfolioName: extractPortfolioName(t) }),
  },
  {
    intent: "PORTFOLIO_DELETE",
    match: (t) =>
      has(t, "delete portfolio", "remove portfolio", "drop portfolio", "destroy portfolio"),
    extract: (t) => ({ portfolioName: extractPortfolioName(t) }),
  },
  {
    intent: "PORTFOLIO_RENAME",
    match: (t) =>
      has(t, "rename portfolio", "change portfolio name", "update portfolio name"),
    extract: (t) => {
      const m = t.match(/rename.*?(?:portfolio)?\s+["']?([a-z0-9 &_-]{2,30})["']?\s+(?:to|as)\s+["']?([a-z0-9 &_-]{2,30})["']?/i);
      return m ? { portfolioName: m[1].trim(), newName: m[2].trim() } : {};
    },
  },
  {
    intent: "HOLDING_ADD",
    match: (t) =>
      has(t, "add holding", "add stock", "buy stock", "add shares", "add to portfolio", "add tcs", "add reliance", "add infosys", "add wipro", "add hdfc"),
    extract: (t, orig) => ({
      ticker:        extractTicker(orig) || extractTicker(t),
      quantity:      extractNumber(t),
      portfolioName: extractPortfolioName(t),
    }),
  },
  {
    intent: "HOLDING_REMOVE",
    match: (t) =>
      has(t, "remove holding", "remove stock", "delete holding", "remove shares", "sell stock", "delete stock"),
    extract: (t, orig) => ({ ticker: extractTicker(orig) || extractTicker(t) }),
  },
  {
    intent: "HOLDING_LIST",
    match: (t) =>
      has(t, "show holdings", "list holdings", "my holdings", "what stocks do i have", "show stocks in"),
    extract: (t) => ({ portfolioName: extractPortfolioName(t) }),
  },
  {
    intent: "PORTFOLIO_TOTAL",
    match: (t) =>
      has(t, "total investment", "total value", "how much invested", "portfolio worth", "portfolio value", "cost basis", "total cost"),
  },

  // ── Sentiment ─────────────────────────────────────────────────────────────
  {
    intent: "SENTIMENT_OVERVIEW",
    match: (t) =>
      has(t, "market sentiment", "today's sentiment", "overall sentiment", "how is the market", "market mood", "market feeling"),
  },
  {
    intent: "SENTIMENT_BULLISH_SECTORS",
    match: (t) =>
      has(t, "bullish sector", "which sector is bullish", "positive sectors", "top bullish"),
  },
  {
    intent: "SENTIMENT_BEARISH_SECTORS",
    match: (t) =>
      has(t, "bearish sector", "which sector is bearish", "negative sectors", "worst sectors"),
  },
  {
    intent: "SENTIMENT_TOP_SECTOR",
    match: (t) =>
      has(t, "highest sentiment", "best sentiment sector", "top sentiment", "most positive sector"),
  },
  {
    intent: "SENTIMENT_SECTOR",
    match: (t) =>
      has(t, "sentiment for", "sentiment of", "sector sentiment", "news sentiment") && extractSector(t) !== undefined,
    extract: (t) => ({ sector: extractSector(t) }),
  },
  {
    intent: "SENTIMENT_STOCK",
    match: (t) =>
      has(t, "is it bullish", "is it bearish", "bullish or bearish", "sentiment for stock", "stock sentiment") ||
      (has(t, "bullish", "bearish") && extractTicker(t) !== undefined),
    extract: (t, orig) => ({ ticker: extractTicker(orig) || extractTicker(t) }),
  },
  {
    intent: "SECTOR_NEWS",
    match: (t) =>
      has(t, "news for", "latest news", "show news", "sector news", "market news"),
    extract: (t) => ({ sector: extractSector(t) }),
  },
  {
    intent: "SENTIMENT_REFRESH",
    match: (t) =>
      has(t, "refresh sentiment", "update sentiment", "fetch new sentiment", "refresh news"),
  },

  // ── Live Stock Data ────────────────────────────────────────────────────────
  {
    intent: "STOCK_PRICE",
    match: (t) =>
      has(t, "price of", "current price", "stock price", "what is the price", "how much is", "trade at", "trading at"),
    extract: (t, orig) => ({ ticker: extractTicker(orig) || extractTicker(t) }),
  },
  {
    intent: "STOCK_COMPARE",
    match: (t) =>
      has(t, "compare", "vs ", " and ", "difference between"),
    extract: (t, orig) => {
      const pair = extractTwoTickers(orig) || extractTwoTickers(t);
      return pair ? { ticker: pair[0], query: pair[1] } : {};
    },
  },
  {
    intent: "STOCK_PE",
    match: (t) =>
      has(t, "pe ratio", "p/e", "price to earnings", "pe of"),
    extract: (t, orig) => ({ ticker: extractTicker(orig) || extractTicker(t) }),
  },
  {
    intent: "STOCK_52WK",
    match: (t) =>
      has(t, "52 week", "52-week", "52week", "year high", "year low"),
    extract: (t, orig) => ({ ticker: extractTicker(orig) || extractTicker(t) }),
  },
  {
    intent: "STOCK_SECTOR_LOOKUP",
    match: (t) =>
      has(t, "what sector is", "which sector", "sector of", "sector for"),
    extract: (t, orig) => ({ ticker: extractTicker(orig) || extractTicker(t) }),
  },
  {
    intent: "SECTOR_STOCKS",
    match: (t) =>
      has(t, "stocks in", "stocks for sector", "show sector stocks", "list stocks in"),
    extract: (t) => ({ sector: extractSector(t) }),
  },
  {
    intent: "STOCK_SEARCH",
    match: (t) =>
      has(t, "search for", "find stock", "look up", "search stock"),
    extract: (t) => {
      const m = t.match(/(?:search for|find stock|look up|search)\s+(.+)/i);
      return { query: m ? m[1].trim() : t };
    },
  },
  {
    intent: "NIFTY_TOP",
    match: (t) =>
      has(t, "nifty 50", "nifty50", "top stocks", "nifty stocks", "nifty top"),
  },

  // ── Portfolio Analytics ────────────────────────────────────────────────────
  {
    intent: "PORTFOLIO_PNL",
    match: (t) =>
      has(t, "p&l", "profit", "loss", "gain", "unrealised", "unrealized", "pnl", "return on"),
  },
  {
    intent: "PORTFOLIO_OVERVALUED",
    match: (t) =>
      has(t, "overvalued", "undervalued", "which stock to sell", "which stock is expensive"),
  },
  {
    intent: "PORTFOLIO_EXPOSURE",
    match: (t) =>
      has(t, "sector exposure", "which sector am i", "portfolio allocation", "sector breakdown", "diversification"),
  },
  {
    intent: "PORTFOLIO_BEST_STOCK",
    match: (t) =>
      has(t, "best stock", "worst stock", "top performer", "best performing", "worst performing"),
  },
  {
    intent: "STOCK_ADVICE",
    match: (t) =>
      has(t, "should i buy", "should i sell", "should i hold", "buy or sell", "advice on", "recommend"),
    extract: (t, orig) => ({ ticker: extractTicker(orig) || extractTicker(t) }),
  },
  {
    intent: "DIVERSIFIED_SUGGEST",
    match: (t) =>
      has(t, "diversified portfolio", "suggest portfolio", "portfolio suggestion", "recommend portfolio", "build a portfolio"),
  },
  {
    intent: "MARKET_SUMMARY",
    match: (t) =>
      has(t, "market summary", "summarise market", "summarize market", "today's market", "market update", "how is the market doing"),
  },
];

// ---------------------------------------------------------------------------
// Main parse function
// ---------------------------------------------------------------------------

export function parseIntent(message: string): ParsedIntent {
  const t = norm(message);

  for (const rule of RULES) {
    if (rule.match(t)) {
      const slots = rule.extract ? rule.extract(t, message) : {};
      return { intent: rule.intent, slots };
    }
  }

  return { intent: "UNKNOWN", slots: { query: message } };
}
