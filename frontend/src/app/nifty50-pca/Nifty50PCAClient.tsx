"use client";

import { useState, useEffect, useMemo } from "react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { Loader2, AlertCircle, BarChart2, TrendingUp, Activity, Trophy, Star, Zap, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchNifty50PCA, type Nifty50PCAResult, type Nifty50PCAPoint } from "@/lib/stock-data";

// ─── Constants ─────────────────────────────────────────────────────────────

const CLUSTER_COLORS = [
    "#6366F1", // indigo
    "#F59E0B", // amber
    "#10B981", // emerald
    "#F43F5E", // rose
    "#8B5CF6", // violet
    "#06B6D4", // cyan
    "#EF4444", // red
    "#84CC16", // lime
];

const CLUSTER_NAMES = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"];

const DISCOUNT_ENC: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };
const DISCOUNT_LABEL = ["NONE", "LOW", "MEDIUM", "HIGH"];

const FEATURE_LABELS: Record<string, string> = {
    annual_return: "Annual Return (%)",
    volatility: "Volatility (Annualised)",
    momentum_3m: "3-Month Momentum (%)",
    pe_ratio: "P/E Ratio",
    pos_52w: "52-Week Position",
    discount_enc: "Discount Level",
    opp_score: "Opportunity Score",
};

// ─── Custom scatter dot (shows ticker symbol as label) ─────────────────────

const CustomDot = (props: {
    cx?: number; cy?: number; payload?: Nifty50PCAPoint; fill?: string;
}) => {
    const { cx = 0, cy = 0, payload, fill } = props;
    if (!payload) return null;
    return (
        <g>
            <circle cx={cx} cy={cy} r={7} fill={fill} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
            <text
                x={cx}
                y={cy - 11}
                textAnchor="middle"
                fontSize={8}
                fontWeight={600}
                fill="#1e293b"
                style={{ pointerEvents: "none", userSelect: "none" }}
            >
                {payload.symbol}
            </text>
        </g>
    );
};

// ─── Tooltip ───────────────────────────────────────────────────────────────

const CustomTooltip = ({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: Nifty50PCAPoint }>;
}) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    const retColor = d.annual_return >= 0 ? "text-emerald-600" : "text-rose-500";
    const momColor = d.momentum_3m >= 0 ? "text-emerald-600" : "text-rose-500";
    return (
        <div className="bg-white border border-border rounded-xl shadow-lg p-4 text-xs w-52 z-50">
            <div className="font-bold text-sm text-primary mb-0.5">{d.symbol}</div>
            <div className="text-muted-foreground text-xs mb-2 truncate">{d.name}</div>
            <div className="space-y-0.5">
                <Row label="Price" value={`₹${d.current_price?.toLocaleString()}`} />
                <Row label="1Y Return" value={`${d.annual_return?.toFixed(1)}%`} valueClass={retColor} />
                <Row label="3M Momentum" value={`${d.momentum_3m?.toFixed(1)}%`} valueClass={momColor} />
                <Row label="Volatility (daily)" value={`${(d.volatility * 100).toFixed(2)}%`} />
                <Row label="P/E Ratio" value={d.pe_ratio ? d.pe_ratio.toFixed(1) : "—"} />
                <Row label="52W Position" value={`${(d.pos_52w * 100).toFixed(0)}%`} />
                <Row label="Discount" value={d.discount} />
                <Row label="Opp Score" value={d.opportunity_score?.toFixed(1)} />
                <div className="mt-2 pt-1.5 border-t border-border/50 space-y-0.5">
                    <Row label="PC1" value={d.pc1?.toFixed(4)} valueClass="font-mono" />
                    <Row label="PC2" value={d.pc2?.toFixed(4)} valueClass="font-mono" />
                    <Row
                        label="Cluster"
                        value={CLUSTER_NAMES[d.cluster] ?? `#${d.cluster}`}
                        valueClass="font-bold"
                    />
                </div>
            </div>
        </div>
    );
};

const Row = ({
    label,
    value,
    valueClass = "",
}: {
    label: string;
    value: string;
    valueClass?: string;
}) => (
    <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", valueClass)}>{value}</span>
    </div>
);

// ─── Loading bar for a feature loading value ───────────────────────────────

const LoadingBar = ({ value, color }: { value: number; color: string }) => (
    <div className="flex items-center gap-1.5 justify-end">
        <span className={cn("font-mono text-xs", Math.abs(value) > 0.3 ? "font-bold" : "")}>
            {value >= 0 ? "+" : ""}
            {value.toFixed(4)}
        </span>
        <div className="w-16 h-1.5 rounded-full bg-border/50 overflow-hidden">
            <div
                className="h-full rounded-full"
                style={{
                    width: `${Math.min(100, Math.abs(value) * 100)}%`,
                    background: value >= 0 ? color : "#F43F5E",
                    marginLeft: value >= 0 ? 0 : "auto",
                }}
            />
        </div>
    </div>
);

// ─── Simple 2-D K-Means (K-Means++ init, Lloyd's updates) ───────────────────

function simpleKMeans(points: number[][], k: number, maxIter = 150): number[] {
    const n = points.length;
    if (n === 0 || k >= n) return points.map((_, i) => i);
    // K-Means++ init
    const centroids: number[][] = [[...points[0]]];
    const used = new Set<number>([0]);
    for (let c = 1; c < k; c++) {
        let maxD = -1, chosen = 0;
        for (let i = 0; i < n; i++) {
            if (used.has(i)) continue;
            const minD = centroids.reduce(
                (m, ct) => Math.min(m, points[i].reduce((s, v, j) => s + (v - ct[j]) ** 2, 0)),
                Infinity
            );
            if (minD > maxD) { maxD = minD; chosen = i; }
        }
        centroids.push([...points[chosen]]);
        used.add(chosen);
    }
    let labels = new Array(n).fill(0);
    for (let iter = 0; iter < maxIter; iter++) {
        const newLabels = points.map(p => {
            let best = 0, minD = Infinity;
            centroids.forEach((c, ci) => {
                const d = p.reduce((s, v, j) => s + (v - c[j]) ** 2, 0);
                if (d < minD) { minD = d; best = ci; }
            });
            return best;
        });
        const counts = new Array(k).fill(0);
        const sums = Array.from({ length: k }, () => new Array(points[0].length).fill(0));
        newLabels.forEach((l, i) => {
            counts[l]++;
            points[i].forEach((v, j) => { sums[l][j] += v; });
        });
        centroids.forEach((_, ci) => {
            if (counts[ci] > 0) centroids[ci] = sums[ci].map(s => s / counts[ci]);
        });
        if (newLabels.every((l, i) => l === labels[i])) break;
        labels = newLabels;
    }
    return labels;
}

type DrillPoint = Nifty50PCAPoint & { pe_val: number; disc_val: number; subCluster: number };

// ─── Main component ────────────────────────────────────────────────────────

export default function Nifty50PCAClient() {
    const [data, setData] = useState<Nifty50PCAResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeK, setActiveK] = useState(4);
    const [pendingK, setPendingK] = useState(4);
    const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);
    const [sortField, setSortField] = useState<keyof Nifty50PCAPoint>("cluster");
    const [sortAsc, setSortAsc] = useState(true);
    const [drillCluster, setDrillCluster] = useState<number>(0);
    const [drillK, setDrillK] = useState<number>(3);

    const load = (k: number) => {
        setLoading(true);
        setError(null);
        fetchNifty50PCA(k)
            .then((d) => {
                setData(d);
                setActiveK(k);
            })
            .catch((e) => setError(e?.message ?? "Failed to fetch data"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(4);
    }, []);

    // Group points by cluster index for separate <Scatter> series
    const byCluster: Nifty50PCAPoint[][] = data
        ? Array.from({ length: data.n_clusters }, (_, i) =>
            data.points.filter((p) => p.cluster === i)
        )
        : [];

    // Drill-down: PE vs Discount sub-clustering within selected cluster group
    const drillPoints: Nifty50PCAPoint[] = byCluster[drillCluster] ?? [];

    const drillSubLabels = useMemo(() => {
        if (!drillPoints.length) return [] as number[];
        const k = Math.min(drillK, drillPoints.length);
        if (k <= 1) return drillPoints.map(() => 0);
        const peVals = drillPoints.map(p => p.pe_ratio ?? 0);
        const discVals = drillPoints.map(p => DISCOUNT_ENC[p.discount] ?? 0);
        const peMin = Math.min(...peVals), peMax = Math.max(...peVals);
        const dMin = Math.min(...discVals), dMax = Math.max(...discVals);
        const pts2d = drillPoints.map(p => [
            peMax > peMin ? ((p.pe_ratio ?? 0) - peMin) / (peMax - peMin) : 0,
            dMax > dMin ? ((DISCOUNT_ENC[p.discount] ?? 0) - dMin) / (dMax - dMin) : 0,
        ]);
        return simpleKMeans(pts2d, k);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drillCluster, data, drillK]);

    const drillChartPoints: DrillPoint[] = drillPoints.map((p, i) => ({
        ...p,
        pe_val: p.pe_ratio ?? 0,
        disc_val: DISCOUNT_ENC[p.discount] ?? 0,
        subCluster: drillSubLabels[i] ?? 0,
    }));

    // ── Best-picks analysis: score each stock by discount + return + opp score ──
    const bestPicksMap = useMemo(() => {
        if (!data?.points?.length) return new Map<string, { rank: number; score: number; label: string; color: string; icon: 'trophy' | 'star' | 'zap' | null }>();

        const scored = data.points
            .filter(p => p.annual_return != null && p.discount != null)
            .map(p => {
                const discountWeight = DISCOUNT_ENC[p.discount] ?? 0;         // HIGH=3, MED=2, LOW=1
                const returnWeight = Math.max(0, p.annual_return) / 10;       // positive returns scaled
                const oppWeight = (p.opportunity_score ?? 0) / 25;            // normalized 0-4
                const score = (returnWeight * 3) + (discountWeight * 2) + oppWeight; // return matters most
                return { symbol: p.symbol, score, discount: p.discount, ret: p.annual_return };
            })
            .sort((a, b) => b.score - a.score);

        const map = new Map<string, { rank: number; score: number; label: string; color: string; icon: 'trophy' | 'star' | 'zap' | null }>();
        const topReturnThreshold = scored.length > 0 ? scored[Math.min(4, scored.length - 1)].score * 0.7 : 0;

        scored.forEach((s, i) => {
            const isHighDiscount = s.discount === 'HIGH' || s.discount === 'MEDIUM';
            const isPositiveReturn = s.ret > 0;
            const isGoodScore = s.score >= topReturnThreshold && isPositiveReturn;

            if (i === 0 && isPositiveReturn) {
                map.set(s.symbol, { rank: 1, score: s.score, label: 'Best Pick', color: '#F59E0B', icon: 'trophy' });
            } else if (i < 3 && isPositiveReturn) {
                map.set(s.symbol, { rank: i + 1, score: s.score, label: `Top ${i + 1}`, color: '#10B981', icon: 'trophy' });
            } else if (isHighDiscount && isPositiveReturn) {
                map.set(s.symbol, { rank: i + 1, score: s.score, label: 'Strong Buy', color: '#6366F1', icon: 'star' });
            } else if (isGoodScore) {
                map.set(s.symbol, { rank: i + 1, score: s.score, label: 'High Return', color: '#06B6D4', icon: 'zap' });
            } else {
                map.set(s.symbol, { rank: i + 1, score: s.score, label: '', color: '', icon: null });
            }
        });

        return map;
    }, [data]);

    // Top picks (labelled stocks only) for summary card
    const topPicks = useMemo(() => {
        if (!data?.points?.length || !bestPicksMap.size) return [];
        return data.points
            .filter(p => {
                const info = bestPicksMap.get(p.symbol);
                return info && info.label !== '';
            })
            .sort((a, b) => {
                const sa = bestPicksMap.get(a.symbol)?.score ?? 0;
                const sb = bestPicksMap.get(b.symbol)?.score ?? 0;
                return sb - sa;
            })
            .slice(0, 8);
    }, [data, bestPicksMap]);

    // Sorted table
    const sortedPoints = data
        ? [...data.points].sort((a, b) => {
            const va = a[sortField] ?? 0;
            const vb = b[sortField] ?? 0;
            if (va === vb) return 0;
            const cmp = va < vb ? -1 : 1;
            return sortAsc ? cmp : -cmp;
        })
        : [];

    const toggleSort = (field: keyof Nifty50PCAPoint) => {
        if (sortField === field) setSortAsc((x) => !x);
        else { setSortField(field); setSortAsc(true); }
    };

    const SortIcon = ({ field }: { field: keyof Nifty50PCAPoint }) =>
        sortField === field ? (sortAsc ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>) : null;

    return (
        <div className="space-y-6">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Machine Learning
                    </span>
                    <h1 className="text-3xl font-bold font-headline">Nifty 50 — Stock Analysis &amp; Clustering</h1>
                </div>
                <p className="text-muted-foreground text-sm">
                    7 financial features per stock (returns, volatility, momentum, P/E, 52W position, discount, opportunity) →
                    StandardScaler → PCA (2 components) → K-Means clustering. Each point is a Nifty 50 constituent.
                </p>
            </div>

            {/* ── Controls ────────────────────────────────────────────── */}
            <Card>
                <CardContent className="pt-4 pb-4 flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">Clusters (K):</span>
                    <div className="flex gap-1.5">
                        {[2, 3, 4, 5, 6].map((k) => (
                            <button
                                key={k}
                                onClick={() => setPendingK(k)}
                                className={cn(
                                    "w-9 h-9 rounded-full text-sm font-bold border transition-colors",
                                    pendingK === k
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                                )}
                            >
                                {k}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => load(pendingK)}
                        disabled={loading}
                        className="px-5 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
                    >
                        {loading ? <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Running…</span> : "Apply"}
                    </button>

                    {data && !loading && (
                        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>
                                <strong className="text-foreground">{data.points.length}</strong> stocks
                            </span>
                            <span>·</span>
                            <span>
                                PC1: <strong className="text-indigo-600">{(data.explained_variance[0] * 100).toFixed(1)}%</strong>
                            </span>
                            <span>
                                PC2: <strong className="text-indigo-600">{(data.explained_variance[1] * 100).toFixed(1)}%</strong>
                            </span>
                            <span>·</span>
                            <span>
                                Total variance: <strong className="text-indigo-600">
                                    {((data.explained_variance[0] + data.explained_variance[1]) * 100).toFixed(1)}%
                                </strong>
                            </span>
                            <span>·</span>
                            <span><strong className="text-foreground">{data.n_clusters}</strong> clusters</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-36 gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                    <p className="text-muted-foreground text-sm font-medium">Running PCA &amp; K-Means on Nifty 50…</p>
                    <p className="text-muted-foreground text-xs">Fetching 1-year history for 50 stocks. First load takes ~20–40 seconds.</p>
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 text-rose-500 bg-rose-50 border border-rose-200 rounded-xl px-5 py-6">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : data ? (
                <>
                    {/* ── Scatter Plot ──────────────────────────────────────── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-indigo-500" />
                                Stock Analysis Scatter Plot
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                Hover a point for full details. Stocks in the same cluster share similar financial characteristics.
                                Hover a cluster card below to highlight that group.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={580}>
                                <ScatterChart margin={{ top: 24, right: 24, bottom: 32, left: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        type="number"
                                        dataKey="pc1"
                                        name="PC1"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) => v.toFixed(1)}
                                        label={{
                                            value: `PC1 — ${(data.explained_variance[0] * 100).toFixed(1)}% explained variance`,
                                            position: "insideBottom",
                                            offset: -16,
                                            fontSize: 12,
                                            fill: "#6366F1",
                                        }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="pc2"
                                        name="PC2"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) => v.toFixed(1)}
                                        label={{
                                            value: `PC2 — ${(data.explained_variance[1] * 100).toFixed(1)}% explained variance`,
                                            angle: -90,
                                            position: "insideLeft",
                                            offset: 16,
                                            fontSize: 12,
                                            fill: "#8B5CF6",
                                        }}
                                    />
                                    <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="4 2" />
                                    <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 2" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    {byCluster.map((pts, ci) => (
                                        <Scatter
                                            key={ci}
                                            name={CLUSTER_NAMES[ci]}
                                            data={pts}
                                            fill={CLUSTER_COLORS[ci]}
                                            shape={<CustomDot />}
                                            opacity={hoveredCluster === null || hoveredCluster === ci ? 1 : 0.18}
                                            onMouseEnter={() => setHoveredCluster(ci)}
                                            onMouseLeave={() => setHoveredCluster(null)}
                                        />
                                    ))}
                                </ScatterChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* ── Cluster summary cards ─────────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {byCluster.map((pts, ci) => {
                            const n = pts.length;
                            const avgRet = n ? pts.reduce((s, p) => s + p.annual_return, 0) / n : 0;
                            const avgVol = n ? pts.reduce((s, p) => s + p.volatility, 0) / n : 0;
                            const avgMom = n ? pts.reduce((s, p) => s + p.momentum_3m, 0) / n : 0;
                            return (
                                <Card
                                    key={ci}
                                    className={cn(
                                        "border-l-4 cursor-default transition-shadow",
                                        hoveredCluster === ci ? "shadow-lg ring-1 ring-primary/20" : ""
                                    )}
                                    style={{ borderLeftColor: CLUSTER_COLORS[ci] }}
                                    onMouseEnter={() => setHoveredCluster(ci)}
                                    onMouseLeave={() => setHoveredCluster(null)}
                                >
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: CLUSTER_COLORS[ci] }} />
                                            <span className="font-semibold">{CLUSTER_NAMES[ci]}</span>
                                            <Badge variant="secondary" className="ml-auto text-xs">{n} stocks</Badge>
                                        </div>
                                        <div className="text-xs space-y-1 text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Avg 1Y Return</span>
                                                <span className={cn("font-medium", avgRet >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                                    {avgRet.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Avg 3M Momentum</span>
                                                <span className={cn("font-medium", avgMom >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                                    {avgMom.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Avg Daily Vol</span>
                                                <span className="font-medium">{(avgVol * 100).toFixed(2)}%</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {pts.slice(0, 7).map((p) => (
                                                <span
                                                    key={p.symbol}
                                                    className="text-xs bg-secondary/70 rounded px-1.5 py-0.5 font-mono"
                                                >
                                                    {p.symbol}
                                                </span>
                                            ))}
                                            {n > 7 && (
                                                <span className="text-xs text-muted-foreground self-center">+{n - 7} more</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* ── Discount vs P/E Drill-down ────────────────────────── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-amber-500" />
                                Discount vs P/E Ratio — Cluster Drill-down
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                Select a cluster group from the dropdown. K-Means re-clustering is applied
                                within that group using only <strong>P/E Ratio</strong> and <strong>Discount Level</strong> as features.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Controls */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-muted-foreground shrink-0">Cluster Group:</label>
                                    <select
                                        value={drillCluster}
                                        onChange={(e) => setDrillCluster(Number(e.target.value))}
                                        className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        {byCluster.map((pts, ci) => (
                                            <option key={ci} value={ci}>
                                                {CLUSTER_NAMES[ci]} — {pts.length} stocks
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-muted-foreground shrink-0">Sub-clusters (K):</label>
                                    <div className="flex gap-1">
                                        {[2, 3, 4].map((k) => (
                                            <button
                                                key={k}
                                                onClick={() => setDrillK(k)}
                                                className={cn(
                                                    "w-8 h-8 rounded-full text-sm font-bold border transition-colors",
                                                    drillK === k
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                                                )}
                                            >
                                                {k}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="ml-auto flex flex-wrap gap-3">
                                    {Array.from({ length: Math.min(drillK, Math.max(drillPoints.length, 1)) }, (_, si) => (
                                        <span key={si} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CLUSTER_COLORS[si] }} />
                                            Sub-{CLUSTER_NAMES[si]}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {drillPoints.length === 0 ? (
                                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    No stocks in this group.
                                </div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={420}>
                                        <ScatterChart margin={{ top: 24, right: 24, bottom: 52, left: 16 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis
                                                type="number"
                                                dataKey="pe_val"
                                                name="P/E Ratio"
                                                tick={{ fontSize: 11 }}
                                                tickFormatter={(v) => Number(v).toFixed(0)}
                                                label={{ value: "P/E Ratio", position: "insideBottom", offset: -34, fontSize: 12, fill: "#F59E0B" }}
                                                domain={["auto", "auto"]}
                                            />
                                            <YAxis
                                                type="number"
                                                dataKey="disc_val"
                                                name="Discount"
                                                tick={{ fontSize: 11 }}
                                                tickFormatter={(v) => DISCOUNT_LABEL[Math.round(v as number)] ?? String(v)}
                                                ticks={[0, 1, 2, 3]}
                                                domain={[-0.5, 3.5]}
                                                label={{ value: "Discount Level", angle: -90, position: "insideLeft", offset: 18, fontSize: 12, fill: "#8B5CF6" }}
                                            />
                                            <Tooltip
                                                content={({ active, payload: pl }) => {
                                                    if (!active || !pl?.length) return null;
                                                    const d = pl[0]?.payload as DrillPoint;
                                                    if (!d) return null;
                                                    return (
                                                        <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs w-44 z-50">
                                                            <div className="font-bold text-sm text-primary mb-0.5">{d.symbol}</div>
                                                            <div className="text-muted-foreground truncate mb-2">{d.name}</div>
                                                            <div className="space-y-0.5">
                                                                <div className="flex justify-between"><span className="text-muted-foreground">P/E</span><span className="font-medium">{d.pe_ratio?.toFixed(1) ?? "—"}</span></div>
                                                                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-medium">{d.discount}</span></div>
                                                                <div className="flex justify-between"><span className="text-muted-foreground">1Y Return</span><span className={cn("font-medium", d.annual_return >= 0 ? "text-emerald-600" : "text-rose-500")}>{d.annual_return.toFixed(1)}%</span></div>
                                                                <div className="flex justify-between"><span className="text-muted-foreground">Opp Score</span><span className="font-medium">{d.opportunity_score.toFixed(1)}</span></div>
                                                                <div className="flex justify-between"><span className="text-muted-foreground">Sub-Cluster</span>
                                                                    <span className="font-bold" style={{ color: CLUSTER_COLORS[d.subCluster] }}>{CLUSTER_NAMES[d.subCluster]}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Legend />
                                            {Array.from({ length: Math.min(drillK, drillChartPoints.length || 1) }, (_, si) => (
                                                <Scatter
                                                    key={si}
                                                    name={`Sub-${CLUSTER_NAMES[si]}`}
                                                    data={drillChartPoints.filter(p => p.subCluster === si)}
                                                    fill={CLUSTER_COLORS[si]}
                                                    shape={(props: unknown) => {
                                                        const { cx = 0, cy = 0, payload } = props as { cx?: number; cy?: number; payload?: DrillPoint };
                                                        if (!payload) return <g />;
                                                        return (
                                                            <g>
                                                                <circle cx={cx} cy={cy} r={8} fill={CLUSTER_COLORS[si]} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
                                                                <text x={cx} y={cy - 12} textAnchor="middle" fontSize={8} fontWeight={600} fill="#1e293b" style={{ pointerEvents: "none", userSelect: "none" }}>
                                                                    {payload.symbol}
                                                                </text>
                                                            </g>
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </ScatterChart>
                                    </ResponsiveContainer>

                                    {/* Summary table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
                                                    <th className="pb-2 text-left font-medium">Stock</th>
                                                    <th className="pb-2 px-2 text-right font-medium">P/E Ratio</th>
                                                    <th className="pb-2 px-2 text-right font-medium">Discount</th>
                                                    <th className="pb-2 px-2 text-right font-medium">1Y Return</th>
                                                    <th className="pb-2 px-2 text-right font-medium">Opp Score</th>
                                                    <th className="pb-2 px-2 text-right font-medium">Sub-Cluster</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {drillChartPoints.map((p) => (
                                                    <tr key={p.symbol} className="border-b border-border/30 hover:bg-secondary/40 transition-colors">
                                                        <td className="py-1.5 font-mono font-bold text-left">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CLUSTER_COLORS[p.subCluster] }} />
                                                                {p.symbol}
                                                            </div>
                                                        </td>
                                                        <td className="py-1.5 px-2 text-right">{p.pe_ratio?.toFixed(1) ?? "—"}</td>
                                                        <td className="py-1.5 px-2 text-right">{p.discount}</td>
                                                        <td className={cn("py-1.5 px-2 text-right font-medium", p.annual_return >= 0 ? "text-emerald-600" : "text-rose-500")}>{p.annual_return.toFixed(1)}%</td>
                                                        <td className="py-1.5 px-2 text-right">{p.opportunity_score.toFixed(1)}</td>
                                                        <td className="py-1.5 px-2 text-right">
                                                            <span className="inline-block px-1.5 py-0.5 rounded font-medium"
                                                                style={{ background: CLUSTER_COLORS[p.subCluster] + "22", color: CLUSTER_COLORS[p.subCluster] }}>
                                                                {CLUSTER_NAMES[p.subCluster]}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── PCA Loadings table ──────────────────────────────────── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-indigo-500" />
                                PCA Loadings — Feature Contributions to Each Component
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                Loadings show how each financial feature contributes to PC1 and PC2.
                                Large |loading| = that feature strongly defines that axis.
                                Positive = correlated with axis direction; negative = anti-correlated.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left pb-2 pr-4 text-xs text-muted-foreground font-medium">Feature</th>
                                            <th className="text-right pb-2 px-4 text-xs text-indigo-600 font-medium">PC1 Loading</th>
                                            <th className="text-right pb-2 px-4 text-xs text-violet-600 font-medium">PC2 Loading</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.feature_names.map((f) => {
                                            const l = data.loadings[f] ?? { pc1: 0, pc2: 0 };
                                            return (
                                                <tr key={f} className="border-b border-border/40 hover:bg-secondary/30">
                                                    <td className="py-2.5 pr-4 font-medium text-sm">
                                                        {FEATURE_LABELS[f] ?? f}
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <LoadingBar value={l.pc1} color="#6366F1" />
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <LoadingBar value={l.pc2} color="#8B5CF6" />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Best Picks Summary ────────────────────────────────── */}
                    {topPicks.length > 0 && (
                        <Card className="border-l-4 border-l-amber-400">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-amber-500" />
                                    Best Return Picks — High Discount + High Return
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Stocks scored by combining discount level (weight ×2), annual return, and opportunity score.
                                    High discount + positive returns = best investment opportunity.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {topPicks.map((p, idx) => {
                                        const info = bestPicksMap.get(p.symbol);
                                        if (!info) return null;
                                        const isBest = info.label === 'Best Pick';
                                        return (
                                            <div
                                                key={p.symbol}
                                                className={cn(
                                                    "rounded-xl border p-3 transition-shadow hover:shadow-md",
                                                    isBest ? "bg-amber-50/80 border-amber-200 ring-1 ring-amber-200/50" : "bg-white border-border"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        {info.icon === 'trophy' && <Trophy className="h-3.5 w-3.5" style={{ color: info.color }} />}
                                                        {info.icon === 'star' && <Star className="h-3.5 w-3.5" style={{ color: info.color }} />}
                                                        {info.icon === 'zap' && <Zap className="h-3.5 w-3.5" style={{ color: info.color }} />}
                                                        <span className="font-bold text-sm font-mono">{p.symbol}</span>
                                                    </div>
                                                    <span
                                                        className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                                                        style={{ background: info.color + '18', color: info.color }}
                                                    >
                                                        {info.label}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate mb-2">{p.name}</div>
                                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Return</span>
                                                        <span className={cn("font-medium", p.annual_return >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                                            {p.annual_return >= 0 ? '+' : ''}{p.annual_return.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Discount</span>
                                                        <span className={cn("font-medium",
                                                            p.discount === 'HIGH' ? 'text-emerald-600' : p.discount === 'MEDIUM' ? 'text-amber-600' : 'text-rose-400'
                                                        )}>{p.discount}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Price</span>
                                                        <span className="font-medium">₹{p.current_price?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Opp Score</span>
                                                        <span className="font-medium">{p.opportunity_score?.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Full stocks table ─────────────────────────────────── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">All Stocks — PCA Coordinates &amp; Clusters</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Click column headers to sort. Stocks with <Trophy className="h-3 w-3 inline text-amber-500" /> are best return picks (high discount + high return).</p>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b text-muted-foreground">
                                        {(
                                            [
                                                ["symbol", "Stock"],
                                                ["cluster", "Cluster"],
                                                ["discount", "Discount"],
                                                ["annual_return", "1Y Return"],
                                                ["momentum_3m", "3M Mom"],
                                                ["pe_ratio", "P/E"],
                                                ["pos_52w", "52W Pos"],
                                                ["opportunity_score", "Opp Score"],
                                            ] as [keyof Nifty50PCAPoint, string][]
                                        ).map(([field, label]) => (
                                            <th
                                                key={field}
                                                className="pb-2 px-2 text-right first:text-left cursor-pointer hover:text-primary select-none font-medium"
                                                onClick={() => toggleSort(field)}
                                            >
                                                {label}
                                                <SortIcon field={field} />
                                            </th>
                                        ))}
                                        <th className="pb-2 px-2 text-right font-medium">Verdict</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedPoints.map((p) => {
                                        const pickInfo = bestPicksMap.get(p.symbol);
                                        const isBestPick = pickInfo && pickInfo.label !== '';
                                        const isBest = pickInfo?.label === 'Best Pick';
                                        return (
                                            <tr
                                                key={p.symbol}
                                                className={cn(
                                                    "border-b border-border/30 hover:bg-secondary/40 transition-colors",
                                                    hoveredCluster === p.cluster ? "bg-secondary/30" : "",
                                                    isBest ? "bg-amber-50/50" : ""
                                                )}
                                                onMouseEnter={() => setHoveredCluster(p.cluster)}
                                                onMouseLeave={() => setHoveredCluster(null)}
                                            >
                                                <td className="py-1.5 px-2 font-mono font-bold text-left">
                                                    <div className="flex items-center gap-1.5">
                                                        <div
                                                            className="w-2 h-2 rounded-full shrink-0"
                                                            style={{ background: CLUSTER_COLORS[p.cluster] }}
                                                        />
                                                        {p.symbol}
                                                        {isBest && <Trophy className="h-3 w-3 text-amber-500 shrink-0" />}
                                                    </div>
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    <span
                                                        className="inline-block px-1.5 py-0.5 rounded font-medium"
                                                        style={{
                                                            background: CLUSTER_COLORS[p.cluster] + "22",
                                                            color: CLUSTER_COLORS[p.cluster],
                                                        }}
                                                    >
                                                        {CLUSTER_NAMES[p.cluster]}
                                                    </span>
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    <span className={cn("font-medium",
                                                        p.discount === 'HIGH' ? 'text-emerald-600' : p.discount === 'MEDIUM' ? 'text-amber-600' : 'text-rose-400'
                                                    )}>{p.discount}</span>
                                                </td>
                                                <td
                                                    className={cn(
                                                        "py-1.5 px-2 text-right font-medium",
                                                        p.annual_return >= 0 ? "text-emerald-600" : "text-rose-500"
                                                    )}
                                                >
                                                    {p.annual_return >= 0 ? '+' : ''}{p.annual_return.toFixed(1)}%
                                                </td>
                                                <td
                                                    className={cn(
                                                        "py-1.5 px-2 text-right",
                                                        p.momentum_3m >= 0 ? "text-emerald-600" : "text-rose-500"
                                                    )}
                                                >
                                                    {p.momentum_3m.toFixed(1)}%
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    {p.pe_ratio ? p.pe_ratio.toFixed(1) : "—"}
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    {(p.pos_52w * 100).toFixed(0)}%
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    {p.opportunity_score.toFixed(1)}
                                                </td>
                                                <td className="py-1.5 px-2 text-right">
                                                    {isBestPick && pickInfo ? (
                                                        <span
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded whitespace-nowrap"
                                                            style={{ background: pickInfo.color + '18', color: pickInfo.color }}
                                                        >
                                                            {pickInfo.icon === 'trophy' && <Trophy className="h-3 w-3" />}
                                                            {pickInfo.icon === 'star' && <Star className="h-3 w-3" />}
                                                            {pickInfo.icon === 'zap' && <Zap className="h-3 w-3" />}
                                                            {pickInfo.label}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
