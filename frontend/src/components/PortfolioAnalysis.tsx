"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2, BrainCircuit, AlertCircle,
    PlusCircle, CheckCircle2, GitCompare, Star, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompareStocks } from "@/hooks/use-compare-stocks";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OpportunityBadge from "@/components/OpportunityBadge";
import { fetchPortfolioAnalysis, type PortfolioAnalysisData, type PortfolioAnalysisStock } from "@/lib/stock-data";

// ─── Constants ──────────────────────────────────────────────────────────────

const CLUSTER_COLORS = [
    "#6366F1", "#F59E0B", "#10B981", "#F43F5E",
    "#8B5CF6", "#06B6D4", "#EF4444", "#84CC16",
];
const CLUSTER_NAMES = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"];
const DISC_ENC: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };
const DISC_LABEL: Record<number, string> = { 3: "HIGH", 2: "MED", 1: "LOW", 0: "NONE" };

// ─── Feature pair definitions ─────────────────────────────────────────────

type FKey = "current_price" | "pe_ratio" | "discount_enc" | "opportunity_score";

const FEATURE_PAIRS: { id: string; xKey: FKey; yKey: FKey; xLabel: string; yLabel: string }[] = [
    { id: "price_pe", xKey: "current_price", yKey: "pe_ratio", xLabel: "Current Price", yLabel: "P/E Ratio" },
    { id: "price_disc", xKey: "current_price", yKey: "discount_enc", xLabel: "Current Price", yLabel: "Discount Level" },
    { id: "price_opp", xKey: "current_price", yKey: "opportunity_score", xLabel: "Current Price", yLabel: "Opp. Score" },
    { id: "pe_disc", xKey: "pe_ratio", yKey: "discount_enc", xLabel: "P/E Ratio", yLabel: "Discount Level" },
    { id: "pe_opp", xKey: "pe_ratio", yKey: "opportunity_score", xLabel: "P/E Ratio", yLabel: "Opp. Score" },
    { id: "disc_opp", xKey: "discount_enc", yKey: "opportunity_score", xLabel: "Discount Level", yLabel: "Opp. Score" },
];

// ─── K-Means (K-Means++ init + Lloyd updates) ─────────────────────────────

function simpleKMeans(points: number[][], k: number, maxIter = 150): number[] {
    const n = points.length;
    if (n === 0) return [];
    if (k >= n) return points.map((_, i) => i % k);
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
    let labels = new Array<number>(n).fill(0);
    for (let iter = 0; iter < maxIter; iter++) {
        const newLabels = points.map(p => {
            let best = 0, minD = Infinity;
            centroids.forEach((c, ci) => {
                const d = p.reduce((s, v, j) => s + (v - c[j]) ** 2, 0);
                if (d < minD) { minD = d; best = ci; }
            });
            return best;
        });
        const counts = new Array<number>(k).fill(0);
        const sums = Array.from({ length: k }, () => new Array<number>(points[0].length).fill(0));
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

// ─── Silhouette Score ─────────────────────────────────────────────────────

function computeSilhouette(pts: number[][], lbls: number[]): number {
    const n = pts.length;
    if (n < 4) return 0;
    const numClusters = new Set(lbls).size;
    if (numClusters < 2) return 0;
    const euclidean = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, v, d) => s + (v - b[d]) ** 2, 0));
    let total = 0, valid = 0;
    for (let i = 0; i < n; i++) {
        const myC = lbls[i];
        const myPts = pts.filter((_, j) => j !== i && lbls[j] === myC);
        if (!myPts.length) continue;
        const a = myPts.reduce((s, p) => s + euclidean(pts[i], p), 0) / myPts.length;
        let b = Infinity;
        for (let c = 0; c < numClusters; c++) {
            if (c === myC) continue;
            const cPts = pts.filter((_, j) => lbls[j] === c);
            if (!cPts.length) continue;
            const md = cPts.reduce((s, p) => s + euclidean(pts[i], p), 0) / cPts.length;
            if (md < b) b = md;
        }
        if (!isFinite(b)) continue;
        total += (b - a) / Math.max(a, b);
        valid++;
    }
    return valid > 0 ? total / valid : 0;
}

// ─── Normalize values to [0, 1] ─────────────────────────────────────────

function normalize(vals: number[]): number[] {
    const mn = Math.min(...vals), mx = Math.max(...vals);
    if (mx === mn) return vals.map(() => 0.5);
    return vals.map(v => (v - mn) / (mx - mn));
}

// ─── Get raw feature value from a stock ─────────────────────────────────

function getVal(s: PortfolioAnalysisStock, key: FKey): number | null {
    if (key === "current_price") return s.current_price ?? null;
    if (key === "pe_ratio") return s.pe_ratio;
    if (key === "discount_enc") return DISC_ENC[String(s.discount_level ?? "NONE").toUpperCase()] ?? 0;
    if (key === "opportunity_score") return s.opportunity_score ?? null;
    return null;
}

// ─── Cluster point type ──────────────────────────────────────────────────

interface ClusterPt { symbol: string; x: number; y: number; cluster: number; }

// ─── Scatter dot with ticker label ──────────────────────────────────────

const ClusterDot = (props: unknown) => {
    const { cx = 0, cy = 0, payload, fill } = props as {
        cx?: number; cy?: number; payload?: ClusterPt; fill?: string;
    };
    if (!payload) return null;
    return (
        <g>
            <circle cx={cx} cy={cy} r={5} fill={fill} fillOpacity={0.9} stroke="#fff" strokeWidth={1.5} />
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize={7} fontWeight={700}
                fill="#1e293b" style={{ pointerEvents: "none", userSelect: "none" }}>
                {payload.symbol}
            </text>
        </g>
    );
};

// ─── Axis tick formatters ─────────────────────────────────────────────────

const discTickFmt = (v: number) => DISC_LABEL[Math.round(v)] ?? "";
const priceFmt = (v: number) => `₹${(v / 1000).toFixed(0)}k`;
const numFmt = (v: number) => Number(v).toFixed(0);

function xFmtFor(key: FKey): (v: number) => string {
    if (key === "discount_enc") return discTickFmt;
    if (key === "current_price") return priceFmt;
    return numFmt;
}
function yFmtFor(key: FKey): (v: number) => string {
    if (key === "discount_enc") return discTickFmt;
    return numFmt;
}

// ─── PairScatterChart sub-component ──────────────────────────────────────

function PairScatterChart({
    pair, points, clusterK, silhouette, isBest, compact, hideHeader,
}: {
    pair: typeof FEATURE_PAIRS[0];
    points: ClusterPt[];
    clusterK: number;
    silhouette: number;
    isBest: boolean;
    compact?: boolean;
    hideHeader?: boolean;
}) {
    const chartH = compact ? 200 : 270;
    const byCluster = Array.from({ length: clusterK }, (_, ci) => points.filter(p => p.cluster === ci));
    const isDiscY = pair.yKey === "discount_enc";
    const isDiscX = pair.xKey === "discount_enc";
    const xFmt = xFmtFor(pair.xKey);
    const yFmt = yFmtFor(pair.yKey);

    return (
        <div className={cn(
            "rounded-xl border bg-white transition-all duration-200",
            compact ? "p-2.5" : "p-3",
            isBest ? "ring-2 ring-indigo-400 shadow-md border-indigo-200" : "border-border/60 hover:shadow-sm",
        )}>
            {!hideHeader && (
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                        {isBest && <Star size={11} className="text-amber-500 fill-amber-400 shrink-0" />}
                        <span className="text-xs font-semibold text-foreground leading-tight">
                            {pair.xLabel} vs {pair.yLabel}
                        </span>
                    </div>
                    <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1",
                        silhouette > 0.5 ? "bg-emerald-100 text-emerald-700" :
                            silhouette > 0.25 ? "bg-amber-100 text-amber-700" :
                                "bg-slate-100 text-slate-500"
                    )}>
                        S={silhouette.toFixed(2)}
                    </span>
                </div>
            )}
            <ResponsiveContainer width="100%" height={chartH}>
                <ScatterChart margin={{ top: 14, right: 8, bottom: compact ? 22 : 26, left: compact ? -14 : -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        type="number"
                        dataKey="x"
                        name={pair.xLabel}
                        tick={{ fontSize: compact ? 8 : 10 }}
                        tickFormatter={xFmt}
                        label={{ value: pair.xLabel, position: "insideBottom", offset: -14, fontSize: compact ? 8 : 10 }}
                        {...(isDiscX ? { ticks: [0, 1, 2, 3], domain: [-0.5, 3.5] } : {})}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name={pair.yLabel}
                        tick={{ fontSize: compact ? 8 : 10 }}
                        tickFormatter={yFmt}
                        label={{ value: pair.yLabel, angle: -90, position: "insideLeft", offset: compact ? 14 : 18, fontSize: compact ? 8 : 10 }}
                        {...(isDiscY ? { ticks: [0, 1, 2, 3], domain: [-0.5, 3.5] } : {})}
                    />
                    <RechartsTooltip
                        content={({ active, payload: pl }) => {
                            if (!active || !pl?.length) return null;
                            const d = pl[0]?.payload as ClusterPt;
                            if (!d) return null;
                            const xDisplay = isDiscX
                                ? (DISC_LABEL[Math.round(d.x)] ?? String(d.x))
                                : pair.xKey === "current_price"
                                    ? `₹${d.x.toLocaleString()}`
                                    : d.x.toFixed(1);
                            const yDisplay = isDiscY
                                ? (DISC_LABEL[Math.round(d.y)] ?? String(d.y))
                                : d.y.toFixed(1);
                            return (
                                <div className="bg-white border border-border rounded-lg shadow-lg p-2 text-xs z-50 min-w-[140px]">
                                    <div className="font-bold text-primary mb-0.5">{d.symbol}</div>
                                    <div className="space-y-0.5 text-muted-foreground">
                                        <div className="flex justify-between gap-3">
                                            <span>{pair.xLabel}:</span>
                                            <span className="font-medium text-foreground">{xDisplay}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span>{pair.yLabel}:</span>
                                            <span className="font-medium text-foreground">{yDisplay}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span>Cluster:</span>
                                            <span className="font-bold" style={{ color: CLUSTER_COLORS[d.cluster] }}>
                                                {CLUSTER_NAMES[d.cluster] ?? `#${d.cluster}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }}
                    />
                    {byCluster.map((pts, ci) =>
                        pts.length > 0 ? (
                            <Scatter key={ci} name={CLUSTER_NAMES[ci]} data={pts} fill={CLUSTER_COLORS[ci]} shape={<ClusterDot />} />
                        ) : null
                    )}
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function PortfolioAnalysis({ sectorSlug }: { sectorSlug: string }) {
    const [data, setData] = useState<PortfolioAnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [clusterK, setClusterK] = useState(3);
    const { compareList, addToCompare, removeFromCompare, isInCompare } = useCompareStocks();
    const router = useRouter();

    useEffect(() => {
        let active = true;
        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const result = await fetchPortfolioAnalysis(sectorSlug);
                if (active) setData(result);
            } catch {
                if (active) setError("Failed to load portfolio analysis.");
            } finally {
                if (active) setLoading(false);
            }
        };
        if (sectorSlug) loadData();
        return () => { active = false; };
    }, [sectorSlug]);

    // Compute K-Means clustering + silhouette score for all 6 feature pairs
    const pairResults = useMemo(() => {
        if (!data?.stocks || data.stocks.length < 2) return [];
        return FEATURE_PAIRS.map(pair => {
            const validStocks = data.stocks.filter(s => {
                const x = getVal(s, pair.xKey);
                const y = getVal(s, pair.yKey);
                return x !== null && y !== null && isFinite(x) && isFinite(y);
            });
            if (validStocks.length < 2) return { pair, points: [] as ClusterPt[], silhouette: 0 };
            const rawX = validStocks.map(s => getVal(s, pair.xKey) as number);
            const rawY = validStocks.map(s => getVal(s, pair.yKey) as number);
            const normX = normalize(rawX);
            const normY = normalize(rawY);
            const pts2d = normX.map((x, i) => [x, normY[i]]);
            const k = Math.min(clusterK, validStocks.length - 1);
            const labels = simpleKMeans(pts2d, k);
            const sil = computeSilhouette(pts2d, labels);
            const points: ClusterPt[] = validStocks.map((s, i) => ({
                symbol: s.symbol,
                x: rawX[i],
                y: rawY[i],
                cluster: labels[i],
            }));
            return { pair, points, silhouette: sil };
        });
    }, [data, clusterK]);

    const bestPair = useMemo(
        () => pairResults.length ? [...pairResults].sort((a, b) => b.silhouette - a.silhouette)[0] : null,
        [pairResults]
    );

    if (loading) {
        return (
            <Card className="border-none shadow-sm bg-white">
                <CardContent className="flex flex-col items-center justify-center min-h-[300px] py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
                        <BrainCircuit size={16} /> Running Portfolio Analysis...
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-none shadow-sm bg-rose-50">
                <CardContent className="py-6">
                    <div className="flex items-center gap-3 text-rose-600">
                        <AlertCircle size={20} />
                        <p className="text-sm">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data?.stocks || data.stocks.length === 0) {
        return (
            <Card className="border-none shadow-sm bg-white">
                <CardContent className="py-12 text-center text-muted-foreground">
                    <BrainCircuit size={32} className="mx-auto mb-4 opacity-50" />
                    <p>Not enough stock data to run portfolio analysis.</p>
                </CardContent>
            </Card>
        );
    }

    const { stocks, correlation } = data;
    const corrKeys = Object.keys(correlation || {});

    return (
        <div className="space-y-6">
            {/* ── Stock Metrics Table ──────────────────────────────────── */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BrainCircuit size={18} className="text-primary" />
                                Portfolio Analysis
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">PE Ratio, Discount Level & Opportunity Score for each stock</p>
                        </div>
                        {compareList.length > 0 && (
                            <button
                                onClick={() => router.push('/compare')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                            >
                                <GitCompare size={15} />
                                Compare ({compareList.length})
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead>
                                <tr className="bg-secondary/50">
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest">Symbol</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">Current Price</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">PE Min</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">PE Max</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">Current PE</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">PE Avg</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">Expected Price</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest">Recommendation</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest">Discount Level</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">Opportunity Score</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {stocks.map((stock) => (
                                    <tr key={stock.symbol} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3 text-sm">
                                            <span className="font-bold text-primary">{stock.symbol}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">{stock.company_name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono font-medium">
                                            ₹{stock.current_price?.toLocaleString() ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono">
                                            {stock.pe_min != null ? stock.pe_min.toFixed(2) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono">
                                            {stock.pe_max != null ? stock.pe_max.toFixed(2) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono">
                                            {stock.pe_ratio != null ? stock.pe_ratio.toFixed(2) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono">
                                            {stock.pe_avg != null ? stock.pe_avg.toFixed(2) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono font-medium">
                                            {stock.expected_price != null ? `₹${stock.expected_price.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={[
                                                'inline-block px-2.5 py-1 rounded-full text-xs font-bold tracking-wide',
                                                stock.recommendation === 'BUY' ? 'bg-emerald-100 text-emerald-700' :
                                                    stock.recommendation === 'SELL' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-amber-100 text-amber-700',
                                            ].join(' ')}>
                                                {stock.recommendation}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <OpportunityBadge level={stock.discount_level} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center justify-center min-w-[48px] px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                                                {stock.opportunity_score ?? '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => {
                                                    if (isInCompare(stock.symbol)) {
                                                        removeFromCompare(stock.symbol);
                                                    } else {
                                                        addToCompare({ symbol: stock.symbol, name: stock.company_name });
                                                    }
                                                }}
                                                title={isInCompare(stock.symbol) ? 'Remove from Compare' : 'Add to Compare'}
                                                className={cn(
                                                    'flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors mx-auto',
                                                    isInCompare(stock.symbol)
                                                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                                        : 'text-slate-600 hover:text-primary hover:bg-primary/10'
                                                )}
                                            >
                                                {isInCompare(stock.symbol)
                                                    ? <><CheckCircle2 size={13} /> Added</>
                                                    : <><PlusCircle size={13} /> Compare</>
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* ── Multidimensional K-Means Clustering ──────────────────── */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-indigo-50/60 border-b">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Layers size={18} className="text-indigo-600" />
                                Multidimensional K-Means Clustering
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                All 6 feature-pair combinations — K-Means with Silhouette Score evaluation. Points labelled with ticker.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">Clusters (K):</span>
                            <div className="flex gap-1.5">
                                {[2, 3, 4, 5].map(k => (
                                    <button
                                        key={k}
                                        onClick={() => setClusterK(k)}
                                        className={cn(
                                            "w-9 h-9 rounded-full text-sm font-bold border transition-colors",
                                            clusterK === k
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "border-border text-muted-foreground hover:border-indigo-400 hover:text-indigo-600"
                                        )}
                                    >
                                        {k}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col xl:flex-row gap-6">

                        {/* 6 scatter plot grid */}
                        <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pairResults.map(({ pair, points, silhouette }) => (
                                <PairScatterChart
                                    key={pair.id}
                                    pair={pair}
                                    points={points}
                                    clusterK={clusterK}
                                    silhouette={silhouette}
                                    isBest={bestPair?.pair.id === pair.id}
                                    compact
                                />
                            ))}
                        </div>

                        {/* Best Cluster Representation sidebar */}
                        {bestPair && (
                            <div className="xl:w-80 shrink-0 rounded-2xl border-2 border-indigo-300 bg-gradient-to-b from-indigo-50 to-white p-4 flex flex-col gap-4">
                                {/* Header */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star size={15} className="text-amber-500 fill-amber-400" />
                                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Best Cluster Representation</span>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">{bestPair.pair.xLabel} vs {bestPair.pair.yLabel}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Highest silhouette score among all 6 feature pairs</p>
                                    <div className="flex items-end gap-2 mt-2">
                                        <span className="text-3xl font-bold text-indigo-600">{bestPair.silhouette.toFixed(3)}</span>
                                        <span className="text-xs text-muted-foreground mb-1">silhouette score</span>
                                    </div>
                                    <span className={cn(
                                        "text-xs font-semibold px-2.5 py-1 rounded-full inline-block mt-1",
                                        bestPair.silhouette > 0.5 ? "bg-emerald-100 text-emerald-700" :
                                            bestPair.silhouette > 0.25 ? "bg-amber-100 text-amber-700" :
                                                "bg-slate-100 text-slate-600"
                                    )}>
                                        {bestPair.silhouette > 0.5 ? "Strong separation" :
                                            bestPair.silhouette > 0.25 ? "Moderate separation" :
                                                "Weak separation"}
                                    </span>
                                </div>

                                {/* Enlarged best-pair chart */}
                                <PairScatterChart
                                    pair={bestPair.pair}
                                    points={bestPair.points}
                                    clusterK={clusterK}
                                    silhouette={bestPair.silhouette}
                                    isBest={false}
                                    compact={false}
                                    hideHeader
                                />

                                {/* Cluster membership */}
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cluster Membership</p>
                                    <div className="space-y-2">
                                        {Array.from({ length: clusterK }, (_, ci) => {
                                            const pts = bestPair.points.filter(p => p.cluster === ci);
                                            if (!pts.length) return null;
                                            return (
                                                <div key={ci}>
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CLUSTER_COLORS[ci] }} />
                                                        <span className="text-xs font-semibold">{CLUSTER_NAMES[ci]}</span>
                                                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{pts.length}</Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 pl-4">
                                                        {pts.slice(0, 8).map(p => (
                                                            <span key={p.symbol} className="text-[10px] px-1 py-0.5 rounded bg-secondary/70 font-mono">{p.symbol}</span>
                                                        ))}
                                                        {pts.length > 8 && <span className="text-[10px] text-muted-foreground">+{pts.length - 8}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* All pair silhouette rankings */}
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">All Pair Rankings</p>
                                    <div className="space-y-1">
                                        {[...pairResults]
                                            .sort((a, b) => b.silhouette - a.silhouette)
                                            .map(({ pair, silhouette }, rank) => (
                                                <div
                                                    key={pair.id}
                                                    className={cn(
                                                        "flex items-center justify-between text-xs px-2 py-1 rounded-lg",
                                                        pair.id === bestPair.pair.id ? "bg-indigo-100" : "hover:bg-secondary/50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="text-[10px] text-muted-foreground w-3 shrink-0">{rank + 1}.</span>
                                                        <span className="text-muted-foreground text-[10px] leading-tight truncate">
                                                            {pair.xLabel} × {pair.yLabel}
                                                        </span>
                                                    </div>
                                                    <span className={cn(
                                                        "font-bold tabular-nums ml-2 shrink-0",
                                                        pair.id === bestPair.pair.id ? "text-indigo-700" : "text-foreground"
                                                    )}>
                                                        {silhouette.toFixed(3)}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Correlation Matrix ───────────────────────────────────── */}
            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-md flex items-center gap-2">
                        <BrainCircuit size={16} className="text-primary" />
                        Feature Correlation Matrix
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Heatmap of variable relationships</p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto w-full rounded-lg border">
                        {corrKeys.length > 0 ? (
                            <table className="w-full text-xs text-center border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-2 border bg-secondary/50 text-left font-bold">Features</th>
                                        {corrKeys.map(k => (
                                            <th key={k} className="p-2 border bg-secondary/50 font-bold whitespace-nowrap" title={k}>
                                                {k.length > 12 ? k.substring(0, 12) + '...' : k}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {corrKeys.map(rowKey => (
                                        <tr key={rowKey}>
                                            <td className="p-2 border bg-secondary/50 text-left font-bold whitespace-nowrap" title={rowKey}>
                                                {rowKey.length > 14 ? rowKey.substring(0, 14) + '...' : rowKey}
                                            </td>
                                            {corrKeys.map(colKey => {
                                                const val = correlation[rowKey]?.[colKey] || 0;
                                                const isPos = val > 0;
                                                const absVal = Math.abs(val);
                                                let bgColor = "transparent";
                                                if (absVal > 0.1) {
                                                    const intensity = Math.min(absVal * 0.4 + 0.05, 0.6);
                                                    bgColor = isPos
                                                        ? `rgba(16, 185, 129, ${intensity})`
                                                        : `rgba(244, 63, 94, ${intensity})`;
                                                }
                                                return (
                                                    <td
                                                        key={colKey}
                                                        className="p-2 border text-[10px] font-mono"
                                                        style={{ backgroundColor: bgColor }}
                                                        title={`${rowKey} vs ${colKey}: ${val.toFixed(4)}`}
                                                    >
                                                        {val.toFixed(2)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground text-sm">Correlation data unavailable.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


