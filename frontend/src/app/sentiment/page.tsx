"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Minus, Search, Loader2,
  RefreshCw, LayoutGrid, ChevronRight, ExternalLink,
  Newspaper, BarChart2, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api-base";
import Navigation from "@/components/Navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SentimentLabel = "BULLISH" | "NEUTRAL" | "BEARISH";

type SectorSnapshot = {
  sector: string;
  slug: string;
  date: string;
  label: SentimentLabel;
  avg_score: number;
  bullish_count: number;
  neutral_count: number;
  bearish_count: number;
  article_count: number;
  updated_at: string;
};

type Article = {
  id: number;
  ticker: string;
  company_name?: string;
  headline: string;
  snippet: string;
  source: string;
  url: string;
  published_at: string | null;
  compound_score: number;
  label: SentimentLabel;
};

type StockRow = {
  ticker: string;
  company_name: string;
  avg_score: number;
  article_count: number;
  label: SentimentLabel;
};

type SectorDetail = {
  sector: string;
  snapshot: {
    date: string;
    label: SentimentLabel;
    avg_score: number;
    bullish_count: number;
    neutral_count: number;
    bearish_count: number;
    article_count: number;
    updated_at: string;
  };
  stocks: StockRow[];
  articles: Article[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LABEL_CONFIG: Record<SentimentLabel, { color: string; bg: string; ring: string; icon: React.ElementType }> = {
  BULLISH: { color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", icon: TrendingUp },
  NEUTRAL: { color: "text-amber-600",   bg: "bg-amber-50",   ring: "ring-amber-200",   icon: Minus },
  BEARISH: { color: "text-rose-600",    bg: "bg-rose-50",    ring: "ring-rose-200",    icon: TrendingDown },
};

const SOURCE_LABEL: Record<string, string> = {
  yahoo_finance:  "Yahoo Finance",
  economic_times: "Economic Times",
  money_control:  "MoneyControl",
};

function LabelBadge({ label, size = "sm" }: { label: SentimentLabel; size?: "sm" | "lg" }) {
  const cfg = LABEL_CONFIG[label];
  const Icon = cfg.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-semibold ring-1",
      cfg.bg, cfg.color, cfg.ring,
      size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs",
    )}>
      <Icon className={size === "lg" ? "h-4 w-4" : "h-3 w-3"} />
      {label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  // score is in [-1, +1]; center at 0
  const pct = Math.round(((score + 1) / 2) * 100);
  const color = score >= 0.05 ? "bg-emerald-500" : score <= -0.05 ? "bg-rose-500" : "bg-amber-400";
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn("absolute left-0 top-0 h-full rounded-full transition-all", color)}
        style={{ width: `${pct}%` }}
      />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-px bg-slate-300" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Article card
// ---------------------------------------------------------------------------

function ArticleCard({ a }: { a: Article }) {
  const cfg = LABEL_CONFIG[a.label];
  return (
    <div className={cn(
      "rounded-2xl border p-4 transition-all hover:shadow-sm",
      "bg-white border-slate-200/80",
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#4F8DF7]">{a.ticker}</span>
            {a.company_name && (
              <span className="text-xs text-slate-500">{a.company_name}</span>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {SOURCE_LABEL[a.source] ?? a.source}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
            {a.headline}
          </p>
          {a.snippet && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{a.snippet}</p>
          )}
          {a.published_at && (
            <p className="mt-1 text-[10px] text-slate-400">
              {new Date(a.published_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <LabelBadge label={a.label} />
          <span className={cn("text-sm font-extrabold tabular-nums", cfg.color)}>
            {a.compound_score >= 0 ? "+" : ""}{a.compound_score.toFixed(3)}
          </span>
          {a.url && (
            <a href={a.url} target="_blank" rel="noopener noreferrer"
              className="text-slate-400 hover:text-[#4F8DF7] transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sector card (in the overview grid)
// ---------------------------------------------------------------------------

function SectorCard({
  snapshot,
  onClick,
}: {
  snapshot: SectorSnapshot;
  onClick: () => void;
}) {
  const cfg = LABEL_CONFIG[snapshot.label];
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col gap-3 rounded-3xl border p-5 text-left shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all",
        "bg-white border-slate-200/80 hover:border-[#4F8DF7]/30 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", cfg.bg, cfg.ring)}>
          <Icon className={cn("h-5 w-5", cfg.color)} />
        </div>
        <LabelBadge label={snapshot.label} />
      </div>

      <div>
        <p className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">{snapshot.sector}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          {snapshot.article_count} article{snapshot.article_count !== 1 ? "s" : ""} · {snapshot.date}
        </p>
      </div>

      <ScoreBar score={snapshot.avg_score} />

      <div className="flex items-center justify-between text-xs font-semibold">
        <span className={cfg.color}>{snapshot.avg_score >= 0 ? "+" : ""}{snapshot.avg_score.toFixed(3)}</span>
        <div className="flex gap-3 text-slate-400">
          <span className="text-emerald-500">▲{snapshot.bullish_count}</span>
          <span className="text-amber-500">–{snapshot.neutral_count}</span>
          <span className="text-rose-500">▼{snapshot.bearish_count}</span>
        </div>
      </div>

      <ChevronRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#4F8DF7]" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sector detail panel
// ---------------------------------------------------------------------------

function SectorDetailPanel({
  detail,
  onBack,
}: {
  detail: SectorDetail;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"stocks" | "articles">("articles");
  const snap = detail.snapshot;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[#4F8DF7]/30 hover:text-[#4F8DF7]">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{detail.sector}</h2>
          <p className="text-sm text-slate-500">Sentiment · {snap.date}</p>
        </div>
        <div className="ml-auto">
          <LabelBadge label={snap.label} size="lg" />
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Avg Score", value: (snap.avg_score >= 0 ? "+" : "") + snap.avg_score.toFixed(3), color: LABEL_CONFIG[snap.label].color },
          { label: "Articles", value: snap.article_count, color: "text-slate-900" },
          { label: "Bullish", value: snap.bullish_count, color: "text-emerald-600" },
          { label: "Bearish", value: snap.bearish_count, color: "text-rose-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-extrabold tabular-nums", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(["articles", "stocks"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-2 text-sm font-semibold capitalize transition-colors",
              activeTab === tab
                ? "border-b-2 border-[#4F8DF7] text-[#4F8DF7]"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {tab === "articles" ? `News (${detail.articles.length})` : `Stocks (${detail.stocks.length})`}
          </button>
        ))}
      </div>

      {/* Articles tab */}
      {activeTab === "articles" && (
        <div className="space-y-3">
          {detail.articles.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No articles yet. Run <code className="rounded bg-slate-100 px-1">python manage.py refresh_sentiment</code> to fetch data.
            </p>
          ) : (
            detail.articles.map((a) => <ArticleCard key={a.id} a={a} />)
          )}
        </div>
      )}

      {/* Stocks tab */}
      {activeTab === "stocks" && (
        <div className="space-y-2">
          {detail.stocks.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No stock-level data yet.</p>
          ) : (
            detail.stocks.map((s) => (
              <div key={s.ticker}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-[#4F8DF7]">{s.ticker}</p>
                  <p className="text-xs text-slate-500">{s.company_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{s.article_count} art.</span>
                  <span className={cn(
                    "text-sm font-extrabold tabular-nums",
                    LABEL_CONFIG[s.label].color,
                  )}>
                    {s.avg_score >= 0 ? "+" : ""}{s.avg_score.toFixed(3)}
                  </span>
                  <LabelBadge label={s.label} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stock search panel
// ---------------------------------------------------------------------------

function StockSearchPanel() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    ticker: string; avg_score: number; label: SentimentLabel; article_count: number; articles: Article[];
  } | null>(null);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/sentiment/stock/${ticker.trim().toUpperCase()}/`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "No data found for this ticker.");
      }
      setResult(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)]">
        <div className="h-1 -mx-6 -mt-6 mb-5 rounded-t-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <form onSubmit={search} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Enter ticker (e.g. TCS.NS, RELIANCE.NS)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#4F8DF7] focus:bg-white focus:ring-2 focus:ring-[#4F8DF7]/10"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-[#4F8DF7] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{result.ticker}</p>
                <p className="text-sm text-slate-500">{result.article_count} articles analysed</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <LabelBadge label={result.label} size="lg" />
                <span className={cn("text-2xl font-extrabold tabular-nums", LABEL_CONFIG[result.label].color)}>
                  {result.avg_score >= 0 ? "+" : ""}{result.avg_score.toFixed(3)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <ScoreBar score={result.avg_score} />
            </div>
          </div>

          <div className="space-y-3">
            {result.articles.map((a) => <ArticleCard key={a.id} a={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SentimentAnalysisPage() {
  const [tab, setTab] = useState<"sectors" | "stock">("sectors");
  const [sectors, setSectors] = useState<SectorSnapshot[]>([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const [sectorsError, setSectorsError] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<SectorDetail | null>(null);
  const [sectorDetailLoading, setSectorDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const fetchSectors = useCallback(async () => {
    setSectorsLoading(true);
    setSectorsError(null);
    try {
      const res = await fetch(`${API_BASE}/sentiment/sectors/`);
      if (!res.ok) throw new Error("Failed to load sectors");
      setSectors(await res.json());
    } catch (err: unknown) {
      setSectorsError(err instanceof Error ? err.message : "Error loading sentiment data");
    } finally {
      setSectorsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSectors(); }, [fetchSectors]);

  const openSector = async (slug: string) => {
    setSectorDetailLoading(true);
    setSelectedSector(null);
    try {
      const res = await fetch(`${API_BASE}/sentiment/sector/${slug}/`);
      if (!res.ok) throw new Error("Failed to load sector detail");
      setSelectedSector(await res.json());
    } catch (err: unknown) {
      setSectorsError(err instanceof Error ? err.message : "Error loading sector detail");
    } finally {
      setSectorDetailLoading(false);
    }
  };

  const triggerRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch(`${API_BASE}/sentiment/refresh/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const d = await res.json();
      setRefreshMsg(
        d.status === "ok"
          ? `Refreshed — ${d.articles_saved} articles from ${d.processed} stocks`
          : d.error || "Refresh triggered"
      );
      fetchSectors();
    } catch {
      setRefreshMsg("Refresh failed. Check backend logs.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 lg:px-8">

        {/* Page header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Sentiment AI
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Daily news sentiment scored by VADER across all Nifty 500 sectors.
            </p>
          </div>
          <button
            onClick={triggerRefresh}
            disabled={refreshing}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#4F8DF7]/40 hover:text-[#4F8DF7] disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? "Refreshing…" : "Refresh Now"}
          </button>
        </div>

        {refreshMsg && (
          <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {refreshMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
          <button
            onClick={() => { setTab("sectors"); setSelectedSector(null); }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === "sectors"
                ? "bg-[#4F8DF7] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Sectors
          </button>
          <button
            onClick={() => { setTab("stock"); setSelectedSector(null); }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === "stock"
                ? "bg-[#4F8DF7] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            <BarChart2 className="h-4 w-4" />
            Stock Search
          </button>
        </div>

        {/* Sectors tab */}
        {tab === "sectors" && (
          <>
            {sectorDetailLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#4F8DF7]" />
              </div>
            )}

            {!sectorDetailLoading && selectedSector && (
              <SectorDetailPanel
                detail={selectedSector}
                onBack={() => setSelectedSector(null)}
              />
            )}

            {!sectorDetailLoading && !selectedSector && (
              <>
                {sectorsLoading && (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[#4F8DF7]" />
                  </div>
                )}

                {sectorsError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {sectorsError}
                  </div>
                )}

                {!sectorsLoading && !sectorsError && sectors.length === 0 && (
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
                    <Newspaper className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-base font-semibold text-slate-700">No sentiment data yet.</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Run the backend command to fetch and score today&apos;s news:
                    </p>
                    <code className="mt-3 inline-block rounded-xl bg-slate-100 px-4 py-2 text-sm font-mono text-slate-700">
                      python manage.py refresh_sentiment
                    </code>
                    <p className="mt-3 text-sm text-slate-500">
                      Or click <strong>Refresh Now</strong> above to trigger it via the API.
                    </p>
                  </div>
                )}

                {!sectorsLoading && sectors.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sectors.map((s) => (
                      <SectorCard
                        key={s.slug}
                        snapshot={s}
                        onClick={() => openSector(s.slug)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Stock search tab */}
        {tab === "stock" && <StockSearchPanel />}
      </main>
    </div>
  );
}
