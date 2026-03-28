"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Loader2, BrainCircuit, AlertCircle,
    PlusCircle, CheckCircle2, GitCompare, Star, Layers, BriefcaseBusiness,
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
import { getPortfolios, addHolding, type Portfolio } from "@/lib/portfolio-data";
import { useToast } from "@/hooks/use-toast";
import { formatInr, formatMoney, getUsdToInrRate, isUsd, toInrFromUsd } from "@/lib/currency";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    const router = useRouter();
    if (!payload) return null;
    return (
        <g
            className="cursor-pointer"
            onClick={() => router.push(`/stock/${payload.symbol}`)}
        >
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
const priceFmt = (v: number, currency?: string, country?: string) => {
    if (isUsd(currency, country)) return `$${(v / 1000).toFixed(0)}k`;
    return `₹${(v / 1000).toFixed(0)}k`;
};
const numFmt = (v: number) => Number(v).toFixed(0);

function xFmtFor(key: FKey, currency?: string, country?: string): (v: number) => string {
    if (key === "discount_enc") return discTickFmt;
    if (key === "current_price") return (v: number) => priceFmt(v, currency, country);
    return numFmt;
}
function yFmtFor(key: FKey, currency?: string, country?: string): (v: number) => string {
    if (key === "discount_enc") return discTickFmt;
    if (key === "current_price") return (v: number) => priceFmt(v, currency, country);
    return numFmt;
}

// ─── PairScatterChart sub-component ──────────────────────────────────────

function PairScatterChart({
    pair, points, clusterK, silhouette, isBest, compact, hideHeader, currency, country,
}: {
    pair: typeof FEATURE_PAIRS[0];
    points: ClusterPt[];
    clusterK: number;
    silhouette: number;
    isBest: boolean;
    compact?: boolean;
    hideHeader?: boolean;
    currency?: string;
    country?: string;
}) {
    const chartH = compact ? 200 : 270;
    const byCluster = Array.from({ length: clusterK }, (_, ci) => points.filter(p => p.cluster === ci));
    const isDiscY = pair.yKey === "discount_enc";
    const isDiscX = pair.xKey === "discount_enc";
    const xFmt = xFmtFor(pair.xKey, currency, country);
    const yFmt = yFmtFor(pair.yKey, currency, country);

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
                                    ? formatMoney(d.x, currency, country)
                                    : d.x.toFixed(1);
                            const yDisplay = isDiscY
                                ? (DISC_LABEL[Math.round(d.y)] ?? String(d.y))
                                : pair.yKey === "current_price"
                                    ? formatMoney(d.y, currency, country)
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

export default function PortfolioAnalysis({
    sectorSlug,
    market,
}: {
    sectorSlug: string;
    market?: string;
}) {
    const [data, setData] = useState<PortfolioAnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [clusterK, setClusterK] = useState(3);
    const { compareList, addToCompare, removeFromCompare, isInCompare } = useCompareStocks();
    const router = useRouter();
    const { toast } = useToast();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [isAdding, setIsAdding] = useState<string | null>(null);
    const [hasMounted, setHasMounted] = useState(false);
    const [usdToInrRate, setUsdToInrRate] = useState<number | null>(null);
    const marketCurrency = data?.stocks?.find((s) => s.currency)?.currency;
    const marketCountry = data?.stocks?.find((s) => s.country)?.country;

    useEffect(() => {
        setHasMounted(true);
        getUsdToInrRate().then(setUsdToInrRate).catch(() => undefined);
        const loadPortfolios = async () => {
            try {
                const list = await getPortfolios();
                setPortfolios(list);
            } catch (err) {
                console.error("Failed to load portfolios", err);
            }
        };
        loadPortfolios();
    }, []);

    const handleQuickAdd = async (stock: PortfolioAnalysisStock, portfolioId?: number, portfolioName?: string) => {
        if (portfolios.length === 0) {
            toast({
                title: "No portfolios found",
                description: "Create a portfolio first to add stocks.",
                variant: "destructive",
            });
            router.push("/my-portfolio");
            return;
        }

        const targetPortfolioId = portfolioId || portfolios[0].id;
        const targetPortfolioName = portfolioName || portfolios[0].name;
        setIsAdding(stock.symbol);

        try {
            await addHolding(
                Number(targetPortfolioId),
                stock.symbol,
                stock.company_name,
                1,
                stock.current_price || 0
            );

            toast({
                title: "Success",
                description: `${stock.symbol} added to ${targetPortfolioName}`,
            });
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to add stock to portfolio.",
                variant: "destructive",
            });
        } finally {
            setIsAdding(null);
        }
    };

    useEffect(() => {
        let active = true;
        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const result = await fetchPortfolioAnalysis(sectorSlug, market);
                if (active) setData(result);
            } catch {
                if (active) setError("Failed to load portfolio analysis.");
            } finally {
                if (active) setLoading(false);
            }
        };
        if (sectorSlug) loadData();
        return () => { active = false; };
    }, [sectorSlug, market]);

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
        <div className="space-y-12">
            {/* ── Stock Metrics Table ──────────────────────────────────── */}
            <Card className="border border-gray-200 shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-headline font-extrabold text-[#000000] tracking-tight flex items-center gap-3">
                                <div className="bg-[#4F8DF7] p-2 rounded-xl shadow-lg shadow-[#4F8DF7]/15">
                                    <BrainCircuit size={20} className="text-white" />
                                </div>
                                Sectors Analytics
                            </CardTitle>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-[0.12em] mt-1.5 ml-11">Quantitative metrics and opportunity evaluation</p>
                        </div>
                        {compareList.length > 0 && (
                            <button
                                onClick={() => router.push('/compare')}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4F8DF7] text-white text-[11px] font-semibold uppercase tracking-[0.12em] hover:bg-[#2563EB] transition-all shadow-lg shadow-[#4F8DF7]/20 active:scale-95"
                            >
                                <GitCompare size={15} />
                                Compare Results ({compareList.length})
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-blue-50/30">
                                    <th className="px-6 py-4 text-left text-[10px] font-semibold text-[#000000] uppercase tracking-[0.12em]">Asset Information</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-semibold text-[#000000] uppercase tracking-[0.12em]">Current Price</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-semibold text-[#000000] uppercase tracking-[0.12em]">52W High/Low</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-semibold text-[#000000] uppercase tracking-[0.12em]">P/E Statistics (Avg/Current)</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-semibold text-[#000000] uppercase tracking-[0.12em]">Expected Value</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-semibold text-[#000000] uppercase tracking-[0.12em]">Signal</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-semibold text-[#000000] uppercase tracking-[0.12em]">Opp. Score</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-semibold text-[#000000] uppercase tracking-[0.12em]">Sentiment AI</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-semibold text-[#000000] uppercase tracking-[0.12em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stocks.map((stock) => (
                                    <tr
                                        key={stock.symbol}
                                        onClick={() =>
                                            router.push(
                                                `/stock/${stock.symbol}?from=${sectorSlug}${market ? `&market=${market}` : ''}`
                                            )
                                        }
                                        className="hover:bg-blue-50/20 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#4F8DF7] text-sm tracking-tight">{stock.symbol}</span>
                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-gray-100 text-gray-400 font-semibold">{stock.sector || 'N/A'}</Badge>
                                                </div>
                                                <span className="text-[11px] font-medium text-gray-500 uppercase truncate max-w-[180px]">{stock.company_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-bold text-[#000000] text-sm tracking-tight">
                                            <div className="flex flex-col items-end">
                                                <span>{formatMoney(stock.current_price, stock.currency, stock.country)}</span>
                                                {isUsd(stock.currency, stock.country) && (
                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                        ≈ {formatInr(toInrFromUsd(stock.current_price, usdToInrRate ?? undefined))}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[11px] font-semibold text-emerald-600 tracking-tight" title="52W High">↑ {formatMoney(stock.max_price, stock.currency, stock.country)}</span>
                                                <span className="text-[11px] font-semibold text-rose-600 tracking-tight" title="52W Low">↓ {formatMoney(stock.min_price, stock.currency, stock.country)}</span>
                                                {isUsd(stock.currency, stock.country) && (
                                                    <span className="text-[9px] font-semibold text-slate-400">
                                                        ≈ {formatInr(toInrFromUsd(stock.max_price, usdToInrRate ?? undefined))} / {formatInr(toInrFromUsd(stock.min_price, usdToInrRate ?? undefined))}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[11px] font-bold text-gray-900 tracking-tight">{stock.pe_ratio != null ? stock.pe_ratio.toFixed(2) : '-'}</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">AVG:</span>
                                                    <span className="text-[10px] font-semibold text-gray-500 tracking-tight">{stock.pe_avg != null ? stock.pe_avg.toFixed(2) : '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-[#000000] text-sm tracking-tight">
                                                    {stock.expected_price != null
                                                        ? formatMoney(stock.expected_price, stock.currency, stock.country)
                                                        : '-'}
                                                </span>
                                                {stock.expected_price != null && isUsd(stock.currency, stock.country) && (
                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                        ≈ {formatInr(toInrFromUsd(stock.expected_price, usdToInrRate ?? undefined))}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={cn(
                                                'inline-block px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-[0.1em] uppercase border shadow-sm',
                                                stock.recommendation === 'BUY' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    stock.recommendation === 'SELL' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                        'bg-amber-50 text-amber-700 border-amber-100',
                                            )}>
                                                {stock.recommendation}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex items-center justify-center min-w-[54px] px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-[#4F8DF7] text-[13px] font-semibold shadow-inner">
                                                {stock.opportunity_score ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {stock.sentiment_score !== undefined && stock.sentiment_score !== null ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <span className={cn(
                                                            "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                                            stock.sentiment_label === 'BULLISH' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                stock.sentiment_label === 'BEARISH' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                                                    "bg-gray-50 text-gray-600 border-gray-100"
                                                        )}>
                                                            {stock.sentiment_label}
                                                        </span>
                                                        {stock.sentiment_is_fallback && (
                                                            <span className="text-[9px] font-medium text-slate-400 cursor-help" title="Sector Average (No stock-specific news today)">
                                                                (S)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-500">
                                                        {stock.sentiment_score > 0 ? '+' : ''}{stock.sentiment_score.toFixed(3)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-medium text-gray-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center whitespace-nowrap cursor-default" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2 relative z-[100]">
                                                {hasMounted ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (isInCompare(stock.symbol)) {
                                                                    removeFromCompare(stock.symbol);
                                                                } else {
                                                                    addToCompare({ symbol: stock.symbol, name: stock.company_name });
                                                                }
                                                            }}
                                                            className={cn(
                                                                'flex items-center gap-2 text-[10px] font-semibold px-4 py-2 rounded-xl transition-all uppercase tracking-[0.12em] border cursor-pointer pointer-events-auto relative z-[101]',
                                                                isInCompare(stock.symbol)
                                                                    ? 'text-white bg-[#4F8DF7] border-[#4F8DF7] shadow-lg shadow-[#4F8DF7]/20'
                                                                    : 'text-gray-400 border-gray-100 bg-white hover:border-[#4F8DF7] hover:text-[#4F8DF7] shadow-sm'
                                                            )}
                                                        >
                                                            {isInCompare(stock.symbol)
                                                                ? <><CheckCircle2 size={13} /> Active</>
                                                                : <><PlusCircle size={13} /> Compare</>
                                                            }
                                                        </button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    disabled={isAdding === stock.symbol}
                                                                    title="Add to Portfolio"
                                                                    className={cn(
                                                                        "flex items-center gap-2 text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase tracking-[0.12em] shadow-sm cursor-pointer pointer-events-auto relative z-[101]",
                                                                        isAdding === stock.symbol
                                                                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                            : "bg-[#2563EB] text-white border-[#2563EB] hover:bg-[#1D4ED8] hover:shadow-md"
                                                                    )}
                                                                >
                                                                    {isAdding === stock.symbol ? (
                                                                        <Loader2 size={13} className="animate-spin" />
                                                                    ) : (
                                                                        <PlusCircle size={13} />
                                                                    )}
                                                                    ADD
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-100 shadow-xl rounded-xl p-1 z-[110]" onClick={(e) => e.stopPropagation()}>
                                                                {portfolios.length > 0 ? (
                                                                    portfolios.map((portfolio) => (
                                                                        <DropdownMenuItem
                                                                            key={portfolio.id}
                                                                            className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] rounded-lg cursor-pointer transition-colors uppercase tracking-wider"
                                                                            onSelect={() => {
                                                                                handleQuickAdd(stock, portfolio.id, portfolio.name);
                                                                            }}
                                                                        >
                                                                            <BriefcaseBusiness size={14} className="opacity-60" />
                                                                            {portfolio.name}
                                                                        </DropdownMenuItem>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                                                                        No Portfolios
                                                                    </div>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-8 bg-gray-50/50 rounded-xl animate-pulse" />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* ── Multidimensional K-Means Clustering ──────────────────── */}
            <Card className="border border-gray-200 shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-blue-50/20 border-b border-blue-100/50 px-8 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div>
                            <CardTitle className="text-2xl font-headline font-extrabold text-[#000000] tracking-tight flex items-center gap-3">
                                <div className="bg-[#4F8DF7] p-2 rounded-xl">
                                    <Layers size={20} className="text-white" />
                                </div>
                                Cluster Topography
                            </CardTitle>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-[0.12em] mt-1.5 ml-11">
                                K-Means algorithm (K={clusterK}) evaluation via multidimensional feature-pair subspace.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-inner">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.12em] px-2">Cluster Count (K)</span>
                            <div className="flex gap-1">
                                {[2, 3, 4, 5].map(k => (
                                    <button
                                        key={k}
                                        onClick={() => setClusterK(k)}
                                        className={cn(
                                            "w-10 h-10 rounded-xl text-xs font-semibold transition-all border",
                                            clusterK === k
                                                ? "bg-[#4F8DF7] text-white border-[#4F8DF7] shadow-md shadow-[#4F8DF7]/20"
                                                : "bg-white border-transparent text-gray-400 hover:text-[#4F8DF7] hover:bg-blue-50"
                                        )}
                                    >
                                        {k}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex flex-col xl:flex-row gap-10">

                        {/* 6 scatter plot grid */}
                        <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pairResults.map(({ pair, points, silhouette }) => (
                                <PairScatterChart
                                    key={pair.id}
                                    pair={pair}
                                    points={points}
                                    clusterK={clusterK}
                                    silhouette={silhouette}
                                    isBest={bestPair?.pair.id === pair.id}
                                    compact
                                    currency={marketCurrency}
                                    country={marketCountry}
                                />
                            ))}
                        </div>

                        {/* Best Cluster Representation sidebar */}
                        {bestPair && (
                            <div className="xl:w-96 shrink-0 rounded-[2rem] border border-blue-100 bg-[#DBEAFE]/10 p-8 flex flex-col gap-8 shadow-inner">
                                {/* Header */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-amber-100 p-1.5 rounded-lg shadow-sm">
                                            <Star size={15} className="text-amber-500 fill-amber-500" />
                                        </div>
                                        <span className="text-[10px] font-semibold text-[#000000] uppercase tracking-[0.14em]">Optimal Partition</span>
                                    </div>
                                    <p className="text-2xl font-headline font-extrabold text-[#000000] tracking-tight leading-tight mb-2">{bestPair.pair.xLabel} vs {bestPair.pair.yLabel}</p>
                                    <div className="flex items-end gap-3 py-4">
                                        <span className="text-5xl font-black text-[#4F8DF7] tracking-tighter leading-none">{bestPair.silhouette.toFixed(3)}</span>
                                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.12em] mb-1.5 leading-none shadow-sm bg-white px-2 py-1 rounded-md">Silhouette Score</span>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-semibold px-3 py-1.5 rounded-lg inline-block shadow-sm border uppercase tracking-[0.12em]",
                                        bestPair.silhouette > 0.5 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                            bestPair.silhouette > 0.25 ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                "bg-gray-50 text-gray-400 border-gray-100"
                                    )}>
                                        {bestPair.silhouette > 0.5 ? "Precision Grade Alpha" :
                                            bestPair.silhouette > 0.25 ? "Operational Grade Beta" :
                                                "Low Stability Model"}
                                    </span>
                                </div>

                                {/* Enlarged best-pair chart */}
                                <div className="bg-white rounded-2xl border border-white p-2 shadow-xl">
                                    <PairScatterChart
                                        pair={bestPair.pair}
                                        points={bestPair.points}
                                        clusterK={clusterK}
                                        silhouette={bestPair.silhouette}
                                        isBest={false}
                                        compact={false}
                                        hideHeader
                                        currency={marketCurrency}
                                        country={marketCountry}
                                    />
                                </div>

                                {/* Cluster membership */}
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.12em] mb-4 px-1">Sub-Group Membership</p>
                                    <div className="space-y-4">
                                        {Array.from({ length: clusterK }, (_, ci) => {
                                            const pts = bestPair.points.filter(p => p.cluster === ci);
                                            if (!pts.length) return null;
                                            return (
                                                <div key={ci} className="bg-white/60 p-4 rounded-2xl border border-white/80 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ background: CLUSTER_COLORS[ci] }} />
                                                        <span className="text-[11px] font-semibold text-[#000000] uppercase tracking-[0.1em]">{CLUSTER_NAMES[ci]} Core</span>
                                                        <Badge variant="secondary" className="ml-auto text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-100 rounded-md py-0">{pts.length} Assets</Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 pl-2">
                                                        {pts.slice(0, 10).map(p => (
                                                            <span key={p.symbol} className="text-[10px] px-2 py-1 rounded-lg bg-white border border-gray-50 font-semibold text-[#4F8DF7] shadow-sm">{p.symbol}</span>
                                                        ))}
                                                        {pts.length > 10 && <span className="text-[9px] font-semibold text-gray-500 py-1 uppercase tracking-[0.12em]">+{pts.length - 10}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Correlation Matrix ───────────────────────────────────── */}
            <Card className="border border-gray-200 shadow-sm bg-white rounded-3xl overflow-hidden mb-12">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-8 py-6">
                    <CardTitle className="text-2xl font-headline font-extrabold text-[#000000] tracking-tight flex items-center gap-3">
                        <div className="bg-[#4F8DF7] p-2 rounded-xl">
                            <BrainCircuit size={20} className="text-white" />
                        </div>
                        Covariance Statistics
                    </CardTitle>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-[0.12em] mt-1.5 ml-11">Real-time feature relationship & heat-dependency matrix</p>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="overflow-x-auto w-full rounded-2xl border border-gray-100 shadow-inner bg-gray-50/20">
                        {corrKeys.length > 0 ? (
                            <table className="w-full text-xs text-center border-collapse">
                                <thead>
                                    <tr className="bg-blue-50/30">
                                        <th className="p-4 border-b border-r border-gray-100 text-left font-semibold text-[#000000] uppercase tracking-[0.12em] bg-white">Feature Subspace</th>
                                        {corrKeys.map(k => (
                                            <th key={k} className="p-4 border-b border-gray-100 font-semibold text-[#000000] uppercase tracking-[0.08em] whitespace-nowrap bg-blue-50/10" title={k}>
                                                {k.length > 12 ? k.substring(0, 12) + '...' : k}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {corrKeys.map(rowKey => (
                                        <tr key={rowKey}>
                                            <td className="p-4 border-r border-gray-100 text-left font-semibold text-gray-500 uppercase tracking-[0.08em] whitespace-nowrap bg-white" title={rowKey}>
                                                {rowKey.length > 14 ? rowKey.substring(0, 14) + '...' : rowKey}
                                            </td>
                                            {corrKeys.map(colKey => {
                                                const val = correlation[rowKey]?.[colKey] || 0;
                                                const isPos = val > 0;
                                                const absVal = Math.abs(val);
                                                let bgColor = "transparent";
                                                let textColor = "#000000";
                                                if (absVal > 0.05) {
                                                    const intensity = Math.min(absVal * 0.5 + 0.1, 0.8);
                                                    bgColor = isPos
                                                        ? `rgba(79, 141, 247, ${intensity})`
                                                        : `rgba(244, 63, 94, ${intensity})`;
                                                    if (intensity > 0.4) textColor = "#ffffff";
                                                }
                                                return (
                                                    <td
                                                        key={colKey}
                                                        className="p-4 border-b border-r border-gray-100 text-[11px] font-semibold tabular-nums transition-colors duration-200"
                                                        style={{ backgroundColor: bgColor, color: textColor }}
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
                            <div className="p-20 text-center text-gray-500 font-semibold uppercase tracking-[0.12em] text-sm">Covariance synchronization data unavailable.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


