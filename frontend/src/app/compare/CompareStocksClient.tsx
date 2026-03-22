"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Loader2,
  Search,
  X,
  TrendingUp,
  Activity,
  GitCompare,
  BarChart2,
  PlusCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  fetchCompareAnalysis,
  searchLiveStocks,
  type CompareAnalysisResult,
  type CompareStockDetail,
  type LiveSearchResult,
} from "@/lib/stock-data";
import { useCompareStocks } from "@/hooks/use-compare-stocks";

const PERIOD_OPTIONS = [
  { label: "1 Year", value: "1y" },
  { label: "3 Years", value: "3y" },
  { label: "5 Years", value: "5y" },
];

const TABS = ["Overview", "Linear Regression", "PCA Clustering", "Logistic Regression", "Correlation"] as const;
type Tab = (typeof TABS)[number];

const CLUSTER_COLORS: Record<number, string> = { 0: "#ef4444", 1: "#10b981", 2: "#3b82f6" };
const CLUSTER_LABELS: Record<number, string> = {
  0: "Aggressive / Volatile",
  1: "Stable / Value",
  2: "Growth / Momentum",
};

const STOCK_COLORS = ["#2985CC", "#f97316", "#10b981", "#f43f5e", "#8b5cf6", "#14b8a6", "#d97706", "#0ea5e9"];

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null || !isFinite(v as number)) return "—";
  return (v as number).toFixed(decimals);
}

function corrColor(v: number): string {
  const clamped = Math.max(-1, Math.min(1, v));
  if (clamped >= 0.6) return "#10b981";
  if (clamped >= 0.3) return "#34d399";
  if (clamped >= 0) return "#a7f3d0";
  if (clamped >= -0.3) return "#fca5a5";
  if (clamped >= -0.6) return "#f87171";
  return "#ef4444";
}

function recBadge(rec: string | null | undefined) {
  if (rec === "BUY") return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{rec}</span>;
  if (rec === "SELL") return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">{rec}</span>;
  if (rec === "HOLD") return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{rec}</span>;
  return <span className="text-slate-400 text-xs">—</span>;
}

function StockSearchInput({
  onAdd,
  disabled,
}: {
  onAdd: (result: LiveSearchResult) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LiveSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchLiveStocks(val.trim());
        setSuggestions(results.slice(0, 8));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (r: LiveSearchResult) => {
    onAdd(r);
    setQuery("");
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-white">
        {loading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : <Search size={15} className="text-slate-400" />}
        <input
          className="flex-1 outline-none text-sm placeholder:text-slate-400 bg-transparent"
          placeholder="Search symbol or company..."
          value={query}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.symbol}
              className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between"
              onClick={() => handleSelect(s)}
            >
              <span className="font-bold text-sm text-slate-800">{s.symbol}</span>
              <span className="text-xs text-slate-500 truncate max-w-[200px]">{s.company_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CompareStocksClient() {
  const { compareList, addToCompare, removeFromCompare, clearCompare } = useCompareStocks();
  const [period, setPeriod] = useState("1y");
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [data, setData] = useState<CompareAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const symbols = useMemo(() => compareList.map((s) => s.symbol), [compareList]);

  const runAnalysis = async () => {
    if (symbols.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCompareAnalysis(symbols, period);
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbols.length >= 2) runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const OverviewTab = () => {
    if (!data) return null;
    const details = data.stock_details;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50">
              {["Symbol", "Name", "Sector", "Price", "52W Low", "52W High", "PE", "PE Min", "PE Max", "PE Avg", "Expected", "Discount", "Recommendation"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {details.map((s: CompareStockDetail, i: number) => (
              <tr key={s.symbol} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: STOCK_COLORS[i % STOCK_COLORS.length] }}>{s.symbol}</td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap max-w-[160px] truncate">{s.name}</td>
                <td className="px-4 py-3 whitespace-nowrap"><Badge variant="outline" className="text-xs">{s.sector || "—"}</Badge></td>
                <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">₹{fmt(s.current_price)}</td>
                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">₹{fmt(s.min_price)}</td>
                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">₹{fmt(s.max_price)}</td>
                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{fmt(s.pe_ratio)}</td>
                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{fmt(s.pe_min)}</td>
                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{fmt(s.pe_max)}</td>
                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{fmt(s.pe_avg)}</td>
                <td className="px-4 py-3 font-mono text-emerald-700 whitespace-nowrap">{s.expected_price ? `₹${fmt(s.expected_price)}` : "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs font-semibold text-slate-600">{s.discount_level || "—"}</span></td>
                <td className="px-4 py-3 whitespace-nowrap">{recBadge(s.recommendation)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const LinearRegressionTab = () => {
    if (!data?.linear_regression?.length) return <EmptyState label="Not enough data for linear regression." />;
    return (
      <div className="space-y-8">
        {data.linear_regression.map((pair) => {
          const scatterPoints = (pair.scatter || []).map((pt: { x: number; y: number }) => ({ x: pt.x, y: pt.y }));
          const regressionLine = (pair.scatter || [])
            .map((pt: { x: number; y_fit: number }) => ({ x: pt.x, y_fit: pt.y_fit }))
            .sort((a: { x: number }, b: { x: number }) => a.x - b.x);
          return (
            <Card key={`${pair.symbol_a}-${pair.symbol_b}`} className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" />
                  {pair.symbol_a} vs {pair.symbol_b}
                </CardTitle>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-1">
                  <span><span className="font-semibold">Equation:</span> {pair.equation}</span>
                  <span><span className="font-semibold">R²:</span> {fmt(pair.r_squared)}</span>
                  <span><span className="font-semibold">Pearson:</span> {fmt(pair.pearson)}</span>
                  <span><span className="font-semibold">Slope:</span> {fmt(pair.slope)}</span>
                  <span><span className="font-semibold">Intercept:</span> {fmt(pair.intercept)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="x" type="number" domain={["auto", "auto"]} tickFormatter={(v) => `$${Number(v).toFixed(0)}`} label={{ value: pair.symbol_a, position: "insideBottom", offset: -5, fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${Number(v).toFixed(0)}`} label={{ value: pair.symbol_b, angle: -90, position: "insideLeft", fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => `$${Number(v).toFixed(2)}`} />
                    <Scatter name="Actual" data={scatterPoints} fill="#94a3b8" opacity={0.5} />
                    <Line data={regressionLine} dataKey="y_fit" stroke="#2985CC" strokeWidth={2} dot={false} type="linear" name="Regression" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const PCAClusteringTab = () => {
    if (!data?.pca_clustering?.stocks?.length) return <EmptyState label="Not enough data for PCA clustering." />;
    const { stocks: points, explained_variance } = data.pca_clustering;
    const features_used = Object.keys(points[0]?.features ?? {});
    const byCluster: Record<number, typeof points> = { 0: [], 1: [], 2: [] };
    points.forEach((p) => { if (p.cluster in byCluster) byCluster[p.cluster].push(p); });
    return (
      <div className="space-y-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              PCA Clustering — PC1 vs PC2
            </CardTitle>
            {explained_variance && (
              <p className="text-sm text-slate-500">
                Explained variance: PC1 = {fmt(explained_variance[0] * 100)}%, PC2 = {fmt(explained_variance[1] * 100)}%
              </p>
            )}
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="pc1" name="PC1" label={{ value: "PC1", position: "insideBottom", offset: -5, fontSize: 12 }} />
                <YAxis dataKey="pc2" name="PC2" label={{ value: "PC2", angle: -90, position: "insideLeft", fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
                        <p className="font-bold text-slate-800 mb-1">{d.symbol}</p>
                        <p>PC1: {fmt(d.pc1)}</p>
                        <p>PC2: {fmt(d.pc2)}</p>
                        <p className="mt-1 font-semibold" style={{ color: CLUSTER_COLORS[d.cluster] }}>{CLUSTER_LABELS[d.cluster]}</p>
                      </div>
                    );
                  }}
                />
                <Legend payload={[0, 1, 2].map((c) => ({ value: CLUSTER_LABELS[c], type: "circle" as const, color: CLUSTER_COLORS[c] }))} />
                {[0, 1, 2].map((cluster) => (
                  <Scatter key={cluster} name={CLUSTER_LABELS[cluster]} data={byCluster[cluster]} fill={CLUSTER_COLORS[cluster]} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm text-slate-700">Stock — Cluster Assignments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-left text-slate-600">Symbol</th>
                  {features_used && features_used.map((f: string) => (
                    <th key={f} className="px-4 py-3 text-xs font-bold text-right text-slate-600 capitalize">{f.replace(/_/g, " ")}</th>
                  ))}
                  <th className="px-4 py-3 text-xs font-bold text-left text-slate-600">Cluster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {points.map((p: { symbol: string; cluster: number; features?: Record<string, number> }) => (
                  <tr key={p.symbol} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{p.symbol}</td>
                    {features_used && features_used.map((f: string) => (
                      <td key={f} className="px-4 py-2.5 text-right font-mono text-slate-600">{fmt(p.features?.[f])}</td>
                    ))}
                    <td className="px-4 py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: `${CLUSTER_COLORS[p.cluster]}20`, color: CLUSTER_COLORS[p.cluster] }}>
                        {CLUSTER_LABELS[p.cluster]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const LogisticRegressionTab = () => {
    if (!data?.logistic_regression?.length) return <EmptyState label="Not enough data for logistic regression." />;
    return (
      <div className="space-y-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Direction Predictions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Symbol", "Overall Direction", "Prob. UP", "Accuracy"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-left text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.logistic_regression.map((s) => (
                  <tr key={s.symbol} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">{s.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block px-2.5 py-1 rounded-full text-xs font-bold", s.overall_direction === "UP" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                        {s.overall_direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{fmt(s.base_probability_up * 100)}%</td>
                    <td className="px-4 py-3 font-mono">{s.accuracy != null ? `${fmt(s.accuracy * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {data.logistic_regression.map((stock, i) => {
          const chartData = (stock.forecast || []).map((f: { date: string; probability_up: number; predicted_direction: string }) => ({
            date: f.date,
            probability_up: +(f.probability_up * 100).toFixed(1),
            direction: f.predicted_direction,
          }));
          return (
            <Card key={stock.symbol} className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 size={16} style={{ color: STOCK_COLORS[i % STOCK_COLORS.length] }} />
                  {stock.symbol} — 14-day Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="4 4" />
                    <Tooltip formatter={(v: number) => [`${v}%`, "Prob. UP"]} />
                    <Bar dataKey="probability_up" radius={[4, 4, 0, 0]}>
                      {chartData.map((d: { direction: string }, idx: number) => (
                        <Cell key={idx} fill={d.direction === "UP" ? "#10b981" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const CorrelationTab = () => {
    if (!data?.correlation_matrix) return <EmptyState label="Not enough data for correlation." />;
    const matrix = data.correlation_matrix;
    const syms = Object.keys(matrix);
    return (
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Price Correlation Matrix</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Green = positive correlation, Red = negative correlation</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2"></th>
                {syms.map((s) => <th key={s} className="px-4 py-2 font-bold text-slate-700 text-center whitespace-nowrap">{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {syms.map((rowSym) => (
                <tr key={rowSym}>
                  <td className="px-4 py-2 font-bold text-slate-700 whitespace-nowrap">{rowSym}</td>
                  {syms.map((colSym) => {
                    const val = matrix[rowSym]?.[colSym] ?? null;
                    const isDiag = rowSym === colSym;
                    return (
                      <td
                        key={colSym}
                        className="px-4 py-2 text-center font-mono text-xs whitespace-nowrap rounded"
                        style={{ backgroundColor: isDiag ? "#e2e8f0" : val != null ? `${corrColor(val)}55` : "transparent", fontWeight: isDiag ? "bold" : "normal" }}
                        title={val != null ? `${rowSym} x ${colSym}: ${val.toFixed(4)}` : ""}
                      >
                        {val != null ? fmt(val) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ label }: { label: string }) => (
    <div className="py-16 text-center text-slate-400 text-sm">{label}</div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <GitCompare size={22} className="text-primary" />
              Stock Comparison
            </h1>
            <p className="text-sm text-slate-500 mt-1">ML-powered multi-stock analysis dashboard</p>
          </div>
          {compareList.length > 0 && (
            <button onClick={() => { clearCompare(); setData(null); }} className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-md hover:bg-rose-50 transition-colors">
              Clear All
            </button>
          )}
        </div>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm text-slate-700">Selected Stocks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {compareList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {compareList.map((s) => (
                  <span key={s.symbol} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700">
                    {s.symbol}
                    <button onClick={() => removeFromCompare(s.symbol)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={13} /></button>
                  </span>
                ))}
              </div>
            )}
            {compareList.length >= 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-xs">
                  <StockSearchInput onAdd={(r) => addToCompare({ symbol: r.symbol, name: r.company_name })} />
                </div>
                <span className="text-xs text-slate-400">{compareList.length} stocks selected</span>
              </div>
            )}
            {compareList.length === 0 && (
              <p className="text-sm text-slate-400 py-2">
                No stocks selected. Add stocks from the{" "}
                <button onClick={() => router.push("/stocks")} className="text-primary font-semibold hover:underline">Stocks table</button>
                {" "}or search above.
              </p>
            )}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Period:</span>
              {PERIOD_OPTIONS.map((p) => (
                <button key={p.value} onClick={() => setPeriod(p.value)} className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors", period === p.value ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100")}>
                  {p.label}
                </button>
              ))}
              <div className="flex-1" />
              <button onClick={runAnalysis} disabled={symbols.length < 2 || loading} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <PlusCircle size={15} />}
                {loading ? "Analysing…" : "Run Analysis"}
              </button>
            </div>
          </CardContent>
        </Card>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-sm text-slate-500">Running ML analysis — fetching data from DB & yfinance…</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 min-w-max px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap", activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-600 hover:bg-slate-50")}>
                  {tab}
                </button>
              ))}
            </div>
            <div>
              {activeTab === "Overview" && <OverviewTab />}
              {activeTab === "Linear Regression" && <LinearRegressionTab />}
              {activeTab === "PCA Clustering" && <PCAClusteringTab />}
              {activeTab === "Logistic Regression" && <LogisticRegressionTab />}
              {activeTab === "Correlation" && <CorrelationTab />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
