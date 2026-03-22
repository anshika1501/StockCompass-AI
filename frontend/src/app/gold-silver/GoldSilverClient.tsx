"use client";

import { useEffect, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Activity, BarChart2, TrendingUp, Zap, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchGoldSilver, type GoldSilverAnalysis, fetchAssetForecast, type AssetForecast } from "@/lib/stock-data";

// ─── Constants ────────────────────────────────────────────────────

const TABS = ["Overview", "SHAP Analysis", "LIME Analysis", "Predictive Trajectory"] as const;
type Tab = (typeof TABS)[number];

const RANGE_OPTIONS = [
    { label: "1 Day", value: "1d" },
    { label: "1 Month", value: "1mo" },
    { label: "1 Year", value: "1y" },
    { label: "5 Years", value: "5y" },
] as const;
type Range = "1d" | "1mo" | "1y" | "5y";

const GOLD_COLOR = "#F59E0B";   // amber-500
const SILVER_COLOR = "#94A3B8";   // slate-400
const FORECAST_COLOR = "#6366F1"; // indigo-500

// ─── Sub-components ───────────────────────────────────────────────

function PriceCard({
    label,
    current,
    change,
    changePct,
    currency,
    color,
}: {
    label: string;
    current: number;
    change: number;
    changePct: number;
    currency: string;
    color: string;
}) {
    const positive = change >= 0;
    return (
        <Card className="flex-1">
            <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                </div>
                <div className="text-3xl font-bold font-headline">
                    {current > 0 ? `${currency} ${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                </div>
                {current > 0 && (
                    <div className={cn("mt-1 text-sm font-medium", positive ? "text-emerald-500" : "text-rose-500")}>
                        {positive ? "+" : ""}{change.toFixed(2)} ({positive ? "+" : ""}{changePct.toFixed(2)}%)
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function CorrBadge({ coefficient, interpretation }: { coefficient: number; interpretation: string }) {
    const abs = Math.abs(coefficient);
    const variant =
        abs >= 0.8 ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
            abs >= 0.5 ? "bg-amber-100 text-amber-800 border-amber-300" :
                "bg-slate-100 text-slate-700 border-slate-300";
    return (
        <Card>
            <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Gold–Silver Correlation (1Y)</p>
                    <span className={cn("inline-block px-3 py-1 rounded-full text-sm font-bold border", variant)}>
                        r = {coefficient.toFixed(4)}
                    </span>
                </div>
                <div className="text-sm text-muted-foreground">{interpretation}</div>
                <div className="ml-auto hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-20 h-2 rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400" />
                    <span>−1 to +1</span>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Overview tab ─────────────────────────────────────────────────

function OverviewTab({ data }: { data: GoldSilverAnalysis }) {
    const [range, setRange] = useState<Range>("1y");

    const goldPoints = data.prices.gold.history[range] ?? [];
    const silverPoints = data.prices.silver.history[range] ?? [];

    // Align gold & silver by date index (both series usually have same length)
    const combined = goldPoints.map((g, i) => ({
        date: g.date,
        gold: g.price,
        silver: silverPoints[i]?.price ?? null,
    }));

    // Down-sample if too large (>300 pts)
    const step = Math.max(1, Math.floor(combined.length / 300));
    const chart = combined.filter((_, i) => i % step === 0);

    const tickFormatter = (v: string) => {
        const d = new Date(v);
        if (range === "1d") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (range === "5y") return d.getFullYear().toString();
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    return (
        <div className="space-y-4">
            {/* Range selector */}
            <div className="flex gap-2 flex-wrap">
                {RANGE_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setRange(opt.value)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                            range === opt.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {chart.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
                    <AlertCircle className="h-4 w-4" />
                    No data available for this range.
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Gold &amp; Silver — Price Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={380}>
                            <ComposedChart data={chart} margin={{ top: 8, right: 30, bottom: 0, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fontSize: 11 }} minTickGap={40} />
                                <YAxis
                                    yAxisId="gold"
                                    orientation="left"
                                    tickFormatter={(v) => `₹${v.toLocaleString()}`}
                                    tick={{ fontSize: 11 }}
                                    width={72}
                                    label={{ value: "Gold (INR/1g)", angle: -90, position: "insideLeft", offset: -2, fontSize: 11 }}
                                />
                                <YAxis
                                    yAxisId="silver"
                                    orientation="right"
                                    tickFormatter={(v) => `₹${v.toFixed(1)}`}
                                    tick={{ fontSize: 11 }}
                                    width={60}
                                    label={{ value: "Silver (INR/1g)", angle: 90, position: "insideRight", offset: 2, fontSize: 11 }}
                                />
                                <Tooltip
                                    formatter={(val: number, name: string) => [
                                        `₹${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                        name === "gold" ? "Gold" : "Silver",
                                    ]}
                                    labelFormatter={(l: string) => new Date(l).toLocaleDateString()}
                                />
                                <Legend />
                                <Line yAxisId="gold" type="monotone" dataKey="gold" stroke={GOLD_COLOR} strokeWidth={2} dot={false} name="gold" connectNulls />
                                <Line yAxisId="silver" type="monotone" dataKey="silver" stroke={SILVER_COLOR} strokeWidth={2} dot={false} name="silver" connectNulls />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ─── SHAP tab ─────────────────────────────────────────────────────

const FEATURE_LABELS: Record<string, string> = {
    lag_1: "Lag 1 Day",
    lag_5: "Lag 5 Days",
    lag_10: "Lag 10 Days",
    momentum_5: "Momentum (5D)",
    volatility_10: "Volatility (10D)",
};

function ShapTab({ data }: { data: GoldSilverAnalysis }) {
    const shap = data.shap;
    if ("error" in shap) {
        return <ErrBox msg={shap.error} />;
    }

    const meanAbsData = shap.feature_names.map((f) => ({
        feature: FEATURE_LABELS[f] ?? f,
        value: shap.mean_abs_shap[f] ?? 0,
    })).sort((a, b) => b.value - a.value);

    // Waterfall-style sample SHAP values (last sample)
    const lastSample = shap.sample_values[shap.sample_values.length - 1] ?? {};
    const waterfallData = shap.feature_names.map((f) => ({
        feature: FEATURE_LABELS[f] ?? f,
        value: lastSample[f] ?? 0,
    })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    const lr = data.linear_regression;
    const lrOk = !("error" in lr);

    return (
        <div className="space-y-6">
            {lrOk && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "R²", value: (lr as any).r_squared?.toFixed(4) ?? "—" },
                        { label: "RMSE", value: (lr as any).rmse?.toFixed(2) ?? "—" },
                        { label: "Intercept", value: (lr as any).intercept?.toFixed(2) ?? "—" },
                        { label: "Features", value: "5 lag-based" },
                    ].map((s) => (
                        <Card key={s.label}>
                            <CardContent className="pt-4 pb-3">
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className="text-lg font-bold">{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Mean |SHAP| by Feature</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        SHAP values for a linear model are exact: φᵢ = wᵢ · (xᵢ − E[xᵢ]). Averaged over all training samples.
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={meanAbsData} layout="vertical" margin={{ left: 120, right: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => v.toFixed(1)} />
                            <YAxis type="category" dataKey="feature" tick={{ fontSize: 12 }} width={118} />
                            <Tooltip formatter={(v: number) => v.toFixed(4)} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {meanAbsData.map((_, i) => (
                                    <Cell key={i} fill={GOLD_COLOR} fillOpacity={1 - i * 0.12} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">SHAP Waterfall — Latest Prediction</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        Positive (amber) = pushes price prediction up. Negative (rose) = pushes it down.
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={waterfallData} layout="vertical" margin={{ left: 120, right: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => v.toFixed(2)} />
                            <YAxis type="category" dataKey="feature" tick={{ fontSize: 12 }} width={118} />
                            <Tooltip formatter={(v: number) => v.toFixed(4)} />
                            <ReferenceLine x={0} stroke="#94a3b8" />
                            <Bar dataKey="value" radius={4}>
                                {waterfallData.map((d, i) => (
                                    <Cell key={i} fill={d.value >= 0 ? GOLD_COLOR : "#F43F5E"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── LIME tab ─────────────────────────────────────────────────────

function LimeTab({ data }: { data: GoldSilverAnalysis }) {
    const lime = data.lime;
    if ("error" in lime) return <ErrBox msg={lime.error} />;

    const chartData = lime.feature_names.map((f) => ({
        feature: FEATURE_LABELS[f] ?? f,
        weight: lime.weights[f] ?? 0,
    })).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-muted-foreground">LIME Prediction</p>
                        <p className="text-lg font-bold">₹{lime.prediction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-muted-foreground">Local Intercept</p>
                        <p className="text-lg font-bold">{lime.intercept.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-2 sm:col-span-1">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-muted-foreground">Method</p>
                        <p className="text-sm font-semibold">Kernel-weighted local LR</p>
                        <p className="text-xs text-muted-foreground">500 perturbed samples, RBF kernel</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">LIME Feature Weights — Latest Sample</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        Local linear approximation around the most recent gold price data point.
                        Positive = feature increases predicted price locally, negative = decreases it.
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => v.toFixed(2)} />
                            <YAxis type="category" dataKey="feature" tick={{ fontSize: 12 }} width={118} />
                            <Tooltip formatter={(v: number) => v.toFixed(4)} />
                            <ReferenceLine x={0} stroke="#94a3b8" />
                            <Bar dataKey="weight" radius={4}>
                                {chartData.map((d, i) => (
                                    <Cell key={i} fill={d.weight >= 0 ? "#10B981" : "#F43F5E"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">SHAP vs LIME Comparison</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        Both explain the same linear regression model. SHAP gives global attribution; LIME gives local attribution near the latest price.
                    </p>
                </CardHeader>
                <CardContent>
                    {!("error" in data.shap) && (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={lime.feature_names.map((f) => ({
                                    feature: FEATURE_LABELS[f] ?? f,
                                    lime: Math.abs(lime.weights[f] ?? 0),
                                    shap: (data.shap as any).mean_abs_shap[f] ?? 0,
                                }))}
                                margin={{ left: 120, right: 24 }}
                                layout="vertical"
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="feature" tick={{ fontSize: 12 }} width={118} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="shap" name="SHAP (global)" fill={GOLD_COLOR} radius={[0, 4, 4, 0]} />
                                <Bar dataKey="lime" name="LIME (local)" fill={FORECAST_COLOR} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Trajectory tab ───────────────────────────────────────────────

const FORECAST_ASSETS = [
    { label: "BTC-INR (Bitcoin)", value: "BTC-INR", name: "Bitcoin" },
    { label: "Gold (per 1g)", value: "GC=F", name: "Gold (per 1g)" },
    { label: "Silver (per 1g)", value: "SI=F", name: "Silver (per 1g)" },
];

const FORECAST_MODELS = [
    { label: "Logistic Regression", value: "logistic", desc: "Directional prediction (up/down) scaling average returns." },
    { label: "LSTM", value: "lstm", desc: "Long Short-Term Memory deep learning model for time series forecasting." },
    { label: "RNN", value: "rnn", desc: "Simple Recurrent Neural Network for sequential data." },
];

const FORECAST_HORIZONS = [
    { label: "Next 1 Hour (15m intervals)", value: "1h" },
    { label: "Next 1 Day (1h intervals)", value: "1d" },
    { label: "Next 3 Days (1h intervals)", value: "3d" },
    { label: "Next 30 Days (1d intervals)", value: "30d" },
];

function TrajectoryTab({ data }: { data: GoldSilverAnalysis }) {
    const [asset, setAsset] = useState(FORECAST_ASSETS[0].value);
    const [model, setModel] = useState(FORECAST_MODELS[0].value);
    const [horizon, setHorizon] = useState(FORECAST_HORIZONS[3].value);
    const [trajData, setTrajData] = useState<AssetForecast | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        fetchAssetForecast(asset, model, horizon).then(res => {
            if (!active) return;
            if (res.error) {
                setError(res.error);
            } else {
                setTrajData(res);
            }
        }).catch(err => {
            if (active) setError(err.message || "Failed to load forecast");
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [asset, model, horizon]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error || !trajData) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Select Asset:</span>
                        <select
                            value={asset}
                            onChange={(e) => setAsset(e.target.value)}
                            className="border border-border rounded-md px-3 py-1.5 text-sm bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                            {FORECAST_ASSETS.map((a) => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <ErrBox msg={error || "Failed to load trajectory"} />
            </div>
        );
    }

    const histPoints = (trajData.historical ?? []).map((p) => ({
        date: p.date,
        historical: p.price,
        forecast: null as number | null,
        lower: null as number | null,
        upper: null as number | null,
    }));

    // Bridge: last historical point → first forecast point
    const lastHistPrice = histPoints[histPoints.length - 1]?.historical ?? 0;
    const forecastPoints = (trajData.forecast ?? []).map((p, i) => ({
        date: p.date,
        historical: i === 0 ? lastHistPrice : null,
        forecast: Math.max(0, p.price),
        lower: Math.max(0, p.lower),
        upper: Math.max(0, p.upper),
    }));

    const combined = [...histPoints, ...forecastPoints];
    const assetName = FORECAST_ASSETS.find(a => a.value === asset)?.name ?? "Asset";
    const selectedModelInfo = FORECAST_MODELS.find(m => m.value === model) ?? FORECAST_MODELS[0];
    const selectedHorizonInfo = FORECAST_HORIZONS.find(h => h.value === horizon) ?? FORECAST_HORIZONS[3];

    const tickFmt = (v: string) => {
        const d = new Date(v);
        if (horizon === '1h' || horizon === '1d' || horizon === '3d') {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-4 bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Forecast Asset</span>
                    <select
                        value={asset}
                        onChange={(e) => setAsset(e.target.value)}
                        className="border border-border rounded-md px-3 py-1.5 text-sm bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        {FORECAST_ASSETS.map((a) => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                    </select>
                </div>
                <div className="hidden sm:block w-px h-10 bg-border"></div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prediction Model</span>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="border border-border rounded-md px-3 py-1.5 text-sm bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        {FORECAST_MODELS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
                <div className="hidden sm:block w-px h-10 bg-border"></div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horizon</span>
                    <select
                        value={horizon}
                        onChange={(e) => setHorizon(e.target.value)}
                        className="border border-border rounded-md px-3 py-1.5 text-sm bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        {FORECAST_HORIZONS.map((h) => (
                            <option key={h.value} value={h.value}>{h.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-muted-foreground">Historical Days</p>
                        <p className="text-lg font-bold">{trajData.historical?.length ?? 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-muted-foreground">Forecast Days</p>
                        <p className="text-lg font-bold">{trajData.forecast?.length ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-2 sm:col-span-1">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-muted-foreground">RMSE</p>
                        <p className="text-lg font-bold">₹{trajData.rmse?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">95% CI = ±1.96 × RMSE</p>
                    </CardContent>
                </Card>
            </div>

            {trajData.forecast && trajData.forecast.length > 0 && (
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <p className="text-xs text-muted-foreground mb-1">Forecast Range ({selectedHorizonInfo.label})</p>
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-xs text-muted-foreground">Lower bound: </span>
                                <span className="font-bold text-rose-500">₹{trajData.forecast[trajData.forecast.length - 1].lower.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Point forecast: </span>
                                <span className="font-bold text-indigo-600">₹{trajData.forecast[trajData.forecast.length - 1].price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Upper bound: </span>
                                <span className="font-bold text-emerald-600">₹{trajData.forecast[trajData.forecast.length - 1].upper.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{assetName} Predictive Trajectory — {selectedHorizonInfo.label}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 text-primary/80 font-medium">
                        Model: {selectedModelInfo.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedModelInfo.desc} Shaded band = 95% confidence interval.
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={combined} margin={{ top: 10, right: 30, bottom: 0, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" tickFormatter={tickFmt} tick={{ fontSize: 11 }} minTickGap={30} />
                            <YAxis
                                tickFormatter={(v) => `₹${Number(v).toLocaleString()}`}
                                tick={{ fontSize: 11 }}
                                width={82}
                                domain={[0, 'auto']}
                            />
                            <Tooltip
                                formatter={(val: number, name: string) => {
                                    if (val == null) return [null, name];
                                    const labels: Record<string, string> = {
                                        historical: "Historical",
                                        forecast: "Forecast",
                                        upper: "Upper CI (95%)",
                                        lower: "Lower CI (95%)",
                                    };
                                    return [`₹${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, labels[name] ?? name];
                                }}
                                labelFormatter={(l: string) => {
                                    const d = new Date(l);
                                    if (horizon === '1h' || horizon === '1d' || horizon === '3d') {
                                        return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                                    }
                                    return d.toLocaleDateString();
                                }}
                            />
                            <Legend />

                            {/* CI band */}
                            <Area
                                type="monotone"
                                dataKey="upper"
                                stroke="none"
                                fill={FORECAST_COLOR}
                                fillOpacity={0.12}
                                legendType="none"
                                name="upper"
                                connectNulls
                            />
                            <Area
                                type="monotone"
                                dataKey="lower"
                                stroke="none"
                                fill="#ffffff"
                                fillOpacity={1}
                                legendType="none"
                                name="lower"
                                connectNulls
                            />

                            {/* Historical line */}
                            <Line
                                type="monotone"
                                dataKey="historical"
                                stroke={asset === "BTC-INR" ? "#F7931A" : asset === "GC=F" ? GOLD_COLOR : SILVER_COLOR}
                                strokeWidth={2}
                                dot={false}
                                name="historical"
                                connectNulls
                            />

                            {/* Forecast line (dashed) */}
                            <Line
                                type="monotone"
                                dataKey="forecast"
                                stroke={FORECAST_COLOR}
                                strokeWidth={2}
                                strokeDasharray="6 3"
                                dot={false}
                                name="forecast"
                                connectNulls
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Error box ────────────────────────────────────────────────────

function ErrBox({ msg }: { msg: string }) {
    return (
        <div className="flex items-center gap-2 text-rose-500 bg-rose-50 border border-rose-200 rounded-xl px-4 py-6">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{msg}</span>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────

export default function GoldSilverClient() {
    const [data, setData] = useState<GoldSilverAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>("Overview");

    useEffect(() => {
        setLoading(true);
        fetchGoldSilver()
            .then(setData)
            .catch((e) => setError(e?.message ?? "Failed to load data"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                <p className="text-muted-foreground text-sm">Fetching live gold &amp; silver data…</p>
            </div>
        );
    }

    if (error || !data) {
        return <ErrBox msg={error ?? "Unknown error"} />;
    }

    const tabIcons: Record<Tab, React.ReactNode> = {
        "Overview": <TrendingUp className="h-4 w-4" />,
        "SHAP Analysis": <BarChart2 className="h-4 w-4" />,
        "LIME Analysis": <Zap className="h-4 w-4" />,
        "Predictive Trajectory": <Activity className="h-4 w-4" />,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Alternative Assets
                    </span>
                    <h1 className="text-3xl font-bold font-headline">Bitcoin, Gold &amp; Silver</h1>
                </div>
                <p className="text-muted-foreground text-sm">
                    Live prices · Correlation · Linear Regression · SHAP · LIME · Predictive Trajectory
                </p>
            </div>

            {/* Price cards */}
            <div className="flex gap-4 flex-col sm:flex-row">
                <PriceCard
                    label="Gold (GC=F) / 1g"
                    current={data.prices.gold.current}
                    change={data.prices.gold.change}
                    changePct={data.prices.gold.change_percent}
                    currency={data.prices.gold.currency}
                    color={GOLD_COLOR}
                />
                <PriceCard
                    label="Silver (SI=F) / 1g"
                    current={data.prices.silver.current}
                    change={data.prices.silver.change}
                    changePct={data.prices.silver.change_percent}
                    currency={data.prices.silver.currency}
                    color={SILVER_COLOR}
                />
            </div>

            {/* Correlation */}
            <CorrBadge
                coefficient={data.correlation.coefficient}
                interpretation={data.correlation.interpretation}
            />

            {/* Tabs */}
            <div className="flex gap-1 border-b overflow-x-auto">
                {TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                            tab === t
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        {tabIcons[t]}
                        {t}
                    </button>
                ))}
            </div>

            {/* Tab panels */}
            <div>
                {tab === "Overview" && <OverviewTab data={data} />}
                {tab === "SHAP Analysis" && <ShapTab data={data} />}
                {tab === "LIME Analysis" && <LimeTab data={data} />}
                {tab === "Predictive Trajectory" && <TrajectoryTab data={data} />}
            </div>
        </div>
    );
}
