"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Target,
  Leaf,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  Trash2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  LogIn,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  getPortfolioDetail,
  deleteHolding,
  getToken,
  type PortfolioDetail,
  type EnrichedHolding,
} from "@/lib/portfolio-data";

// ─── Helpers ────────────────────────────────────────────────────────────────

const INR = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const pct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

const RISK_COLORS: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Medium: "bg-amber-100 text-amber-800 border-amber-200",
  High: "bg-rose-100 text-rose-800 border-rose-200",
  Unknown: "bg-slate-100 text-slate-600 border-slate-200",
};

const PIE_COLORS = [
  "#4F8DF7",
  "#6C63FF",
  "#34D399",
  "#F59E0B",
  "#F87171",
  "#60A5FA",
  "#A78BFA",
  "#FCD34D",
];

type SortKey = keyof EnrichedHolding;
type SortDir = "asc" | "desc";
type Tab = "performance" | "weight" | "allocation" | "dividends";

function SentimentBadge({
  score,
}: {
  score: number | null | undefined;
}) {
  if (score === null || typeof score === "undefined") {
    return <span className="text-xs text-slate-400">N/A</span>;
  }
  const rounded = Math.round(score * 100);
  let color = "bg-slate-200 text-slate-600";
  let text = `${rounded}`;
  if (score > 0.3) {
    color = "bg-emerald-100 text-emerald-700";
    text = `+${rounded}`;
  } else if (score < -0.3) {
    color = "bg-rose-100 text-rose-700";
  }
  return (
    <span className={`inline-block min-w-[36px] rounded-full px-2 py-0.5 text-center text-xs font-semibold ${color}`}>
      {text}
    </span>
  );
}

// ─── Summary Card ───────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  positive,
  neutral,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  neutral?: boolean;
}) {
  const valueColor = neutral
    ? "text-slate-900"
    : positive
    ? "text-emerald-600"
    : positive === false
    ? "text-rose-600"
    : "text-slate-900";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/80 text-[#4F8DF7]">
          {icon}
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [data, setData] = useState<PortfolioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("performance");
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await getPortfolioDetail(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn === true && id) load();
    else if (isLoggedIn === false) setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, id]);

  const handleDelete = async (holdingId: number) => {
    if (!confirm("Remove this holding from the portfolio?")) return;
    setDeletingId(holdingId);
    try {
      // Optimistically remove from UI
      setData((prev) =>
        prev
          ? { ...prev, holdings: prev.holdings.filter((h) => h.id !== holdingId) }
          : prev
      );
      
      await deleteHolding(holdingId);
      
      // Reload in background (silent) to update summary cards and allocations
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      // Restore state on failure
      await load(true);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredHoldings = useMemo(() => {
    if (!data) return [];
    return data.holdings
      .filter(
        (h) =>
          h.ticker.toLowerCase().includes(search.toLowerCase()) ||
          h.company_name.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => {
        const av = a[sortKey] as string | number;
        const bv = b[sortKey] as string | number;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [data, search, sortKey, sortDir]);

  // ── Chart data ──────────────────────────────────────────────────────────
  const performanceData = useMemo(
    () =>
      (data?.holdings ?? []).map((h) => ({
        name: h.ticker.replace(".NS", ""),
        Invested: h.invested,
        Current: h.current_value,
      })),
    [data],
  );

  const allocationData = useMemo(
    () =>
      (data?.summary.sector_allocation ?? []).map((s) => ({
        name: s.sector,
        value: s.weight_pct,
      })),
    [data],
  );

  const weightData = useMemo(
    () =>
      (data?.holdings ?? []).map((h) => ({
        name: h.ticker.replace(".NS", ""),
        value: data
          ? Math.round((h.current_value / data.summary.current_value) * 1000) /
            10
          : 0,
      })),
    [data],
  );

  const dividendData = useMemo(
    () =>
      (data?.holdings ?? []).map((h) => ({
        name: h.ticker.replace(".NS", ""),
        "Est. Annual Div.": h.estimated_annual_dividend,
      })),
    [data],
  );

  // ─── Auth gate ──────────────────────────────────────────────────────────
  if (isLoggedIn === null) return null;
  if (isLoggedIn === false) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <LogIn className="mx-auto mb-4 h-12 w-12 text-[#4F8DF7]" />
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">
            Sign in required
          </h2>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 w-full rounded-xl bg-[#4F8DF7] py-3 text-sm font-semibold text-white"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#4F8DF7]" />
        <p className="text-sm text-slate-500">
          Fetching live prices for your holdings…
        </p>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <p className="text-sm text-slate-700">
          {error ?? "Portfolio not found."}
        </p>
        <button
          onClick={() => router.back()}
          className="text-sm font-semibold text-[#4F8DF7] hover:underline"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const s = data.summary;
  const pnlPositive = s.total_pnl >= 0;

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/my-portfolio"
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:text-[#4F8DF7]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Portfolios
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {data.name}
            </h1>
            {data.description && (
              <p className="mt-1 text-sm text-slate-600">{data.description}</p>
            )}
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-[#4F8DF7]/50 hover:text-[#4F8DF7]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<Wallet className="h-4 w-4" />}
            label="Total Invested"
            value={INR(s.total_invested)}
            neutral
          />
          <SummaryCard
            icon={<Target className="h-4 w-4" />}
            label="Current Value"
            value={INR(s.current_value)}
            neutral
          />
          <SummaryCard
            icon={
              pnlPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )
            }
            label="Total P&L"
            value={(pnlPositive ? "+" : "-") + INR(s.total_pnl)}
            sub={pct(s.total_return_pct)}
            positive={pnlPositive}
          />
          <SummaryCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Day's P&L"
            value={(s.days_pnl >= 0 ? "+" : "-") + INR(s.days_pnl)}
            positive={s.days_pnl >= 0}
          />
          <SummaryCard
            icon={<Layers className="h-4 w-4" />}
            label="Diversification"
            value={s.diversification_score.toFixed(1) + " / 100"}
            sub="Herfindahl-based score"
            neutral
          />
          <SummaryCard
            icon={<Leaf className="h-4 w-4" />}
            label="Est. Annual Dividends"
            value={INR(s.estimated_annual_dividends)}
            neutral
          />
          <SummaryCard
            icon={<Calendar className="h-4 w-4" />}
            label="Holdings"
            value={String(s.num_holdings)}
            neutral
          />
          <SummaryCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Return %"
            value={pct(s.total_return_pct)}
            positive={s.total_return_pct >= 0}
          />
        </div>

        {/* ── Holdings Table ── */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-slate-900">Holdings</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker or company…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4F8DF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/20 sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {([
                    ["ticker", "Symbol"],
                    ["company_name", "Company"],
                    ["sector", "Sector"],
                    ["quantity", "Qty"],
                    ["buy_price", "Buy Price"],
                    ["current_price", "CMP"],
                    ["invested", "Invested"],
                    ["current_value", "Cur. Value"],
                    ["pnl", "P&L"],
                    ["pnl_pct", "P&L %"],
                    ["risk_tag", "Risk"],
                    ["sentiment_score", "Sentiment"],
                    [null, "Action"],
                  ] as [SortKey | null, string][]).map(([key, label]) => (
                    <th
                      key={label}
                      className={`px-4 py-3 ${key ? "cursor-pointer select-none hover:text-slate-900" : ""}`}
                      onClick={() => key && toggleSort(key)}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {key &&
                          (sortKey === key ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3 text-[#4F8DF7]" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-[#4F8DF7]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-30" />
                          ))}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-5 py-12 text-center text-slate-500">
                      {search ? "No holdings match your search." : "No holdings in this portfolio."}
                    </td>
                  </tr>
                ) : (
                  filteredHoldings.map((h) => {
                    const gain = h.pnl >= 0;
                    return (
                      <tr key={h.id} className="transition hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900">{h.ticker}</span>
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-slate-600">{h.company_name}</td>
                        <td className="max-w-[120px] truncate px-4 py-3 text-slate-600">{h.sector}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{h.quantity}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{INR(h.buy_price)}</td>
                        <td className="px-4 py-3 tabular-nums font-medium text-slate-900">{INR(h.current_price)}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{INR(h.invested)}</td>
                        <td className="px-4 py-3 tabular-nums font-medium text-slate-900">{INR(h.current_value)}</td>
                        <td className={`px-4 py-3 tabular-nums font-semibold ${gain ? "text-emerald-600" : "text-rose-600"}`}>
                          {(gain ? "+" : "-") + INR(h.pnl)}
                        </td>
                        <td className={`px-4 py-3 tabular-nums font-semibold ${gain ? "text-emerald-600" : "text-rose-600"}`}>
                          {pct(h.pnl_pct)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${RISK_COLORS[h.risk_tag] ?? RISK_COLORS.Unknown}`}
                          >
                            {h.risk_tag}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <SentimentBadge score={h.sentiment_score} />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(h.id)}
                            disabled={deletingId === h.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-40"
                          >
                            {deletingId === h.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Analytics ── */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-slate-100 px-5 py-3">
            {(['performance', 'weight', 'allocation', 'dividends'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition ${
                  tab === t
                    ? 'bg-[#4F8DF7] text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'performance' && (
              <div>
                <p className="mb-4 text-sm font-semibold text-slate-600">
                  Invested vs Current Value per Stock
                </p>
                {performanceData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No holdings data.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={performanceData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v) => '₹' + (v / 1000).toFixed(0) + 'k'}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        labelStyle={{ color: '#1e293b', fontWeight: 700 }}
                        formatter={(v: number) => INR(v)}
                      />
                      <Legend wrapperStyle={{ color: '#64748b', fontSize: 12 }} />
                      <Bar dataKey="Invested" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Current" fill="#4F8DF7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {(tab === 'weight' || tab === 'allocation') && (
              <div className="flex flex-col items-center gap-6 lg:flex-row">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tab === 'weight' ? weightData : allocationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={({ name, value }) => `${name} ${value}%`}
                      labelLine={{ stroke: '#cbd5e1' }}
                    >
                      {(tab === 'weight' ? weightData : allocationData).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      formatter={(v: number) => `${v}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="min-w-[200px] space-y-2">
                  {(tab === 'weight' ? weightData : allocationData).map((d, i) => (
                    <li
                      key={`${d.name}-${i}`}
                      className="flex items-center gap-2 text-xs text-slate-700"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="flex-1 truncate">{d.name}</span>
                      <span className="font-semibold text-slate-900">{d.value}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 'dividends' && (
              <div>
                <p className="mb-4 text-sm font-semibold text-slate-600">
                  Estimated Annual Dividends per Stock
                </p>
                {dividendData.every((d) => d['Est. Annual Div.'] === 0) ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No dividend data available for these holdings.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dividendData} barCategoryGap="35%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v) => '₹' + v.toFixed(0)}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        formatter={(v: number) => INR(v)}
                      />
                      <Bar dataKey="Est. Annual Div." fill="#34d399" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
