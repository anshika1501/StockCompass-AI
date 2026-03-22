'use client';

import { useState, useEffect, useCallback } from 'react';
import StocksTable from '@/components/StocksTable';
import { Stock, fetchNifty50PCA, type Nifty50PCAResult, type Nifty50PCAPoint } from '@/lib/stock-data';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Loader2, AlertCircle, BarChart2, Table2, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────────────

const CLUSTER_COLORS = [
    '#6366F1', '#F59E0B', '#10B981', '#F43F5E',
    '#8B5CF6', '#06B6D4', '#EF4444', '#84CC16',
];

const CLUSTER_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];

// ─── Custom scatter dot ─────────────────────────────────────────

const CustomDot = (props: { cx?: number; cy?: number; payload?: Nifty50PCAPoint; fill?: string }) => {
    const { cx = 0, cy = 0, payload, fill } = props;
    if (!payload) return null;
    return (
        <g>
            <circle cx={cx} cy={cy} r={7} fill={fill} fillOpacity={0.88} stroke="#fff" strokeWidth={1.5} />
            <text
                x={cx} y={cy - 11}
                textAnchor="middle" fontSize={8} fontWeight={600}
                fill="#1e293b" style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
                {payload.symbol}
            </text>
        </g>
    );
};

// ─── Tooltip ───────────────────────────────────────────────────

const CustomTooltip = ({
    active, payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: Nifty50PCAPoint }>;
}) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    const retColor = d.annual_return >= 0 ? 'text-emerald-600' : 'text-rose-500';
    const momColor = d.momentum_3m >= 0 ? 'text-emerald-600' : 'text-rose-500';
    return (
        <div className="bg-white border border-border rounded-xl shadow-lg p-4 text-xs w-52 z-50">
            <div className="font-bold text-sm text-primary mb-0.5">{d.symbol}</div>
            <div className="text-muted-foreground text-xs mb-2 truncate">{d.name}</div>
            <div className="space-y-0.5">
                <TooltipRow label="Price" value={`₹${d.current_price?.toLocaleString()}`} />
                <TooltipRow label="1Y Return" value={`${d.annual_return?.toFixed(1)}%`} valueClass={retColor} />
                <TooltipRow label="3M Momentum" value={`${d.momentum_3m?.toFixed(1)}%`} valueClass={momColor} />
                <TooltipRow label="Volatility" value={`${(d.volatility * 100).toFixed(2)}%`} />
                <TooltipRow label="P/E Ratio" value={d.pe_ratio ? d.pe_ratio.toFixed(1) : '—'} />
                <TooltipRow label="Discount" value={d.discount} />
                <div className="mt-2 pt-1.5 border-t border-border/50 space-y-0.5">
                    <TooltipRow label="PC1" value={d.pc1?.toFixed(4)} valueClass="font-mono text-indigo-600" />
                    <TooltipRow label="PC2" value={d.pc2?.toFixed(4)} valueClass="font-mono text-violet-600" />
                    <TooltipRow
                        label="Cluster"
                        value={CLUSTER_NAMES[d.cluster] ?? `#${d.cluster}`}
                        valueClass="font-bold"
                    />
                </div>
            </div>
        </div>
    );
};

const TooltipRow = ({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) => (
    <div className="flex justify-between gap-3">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-medium', valueClass)}>{value}</span>
    </div>
);

// ─── PCA Scatter Panel ──────────────────────────────────────────

function PCAPanel() {
    const [data, setData] = useState<Nifty50PCAResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingK, setPendingK] = useState(4);
    const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);

    const load = useCallback((k: number) => {
        setLoading(true);
        setError(null);
        fetchNifty50PCA(k)
            .then(setData)
            .catch((e) => setError(e?.message ?? 'Failed to fetch PCA data'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(4); }, [load]);

    const byCluster: Nifty50PCAPoint[][] = data
        ? Array.from({ length: data.n_clusters }, (_, i) =>
            data.points.filter((p) => p.cluster === i))
        : [];

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card>
                <CardContent className="pt-4 pb-4 flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">Clusters (K):</span>
                    <div className="flex gap-1.5">
                        {[2, 3, 4, 5, 6].map((k) => (
                            <button
                                key={k}
                                onClick={() => setPendingK(k)}
                                className={cn(
                                    'w-9 h-9 rounded-full text-sm font-bold border transition-colors',
                                    pendingK === k
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                                )}
                            >{k}</button>
                        ))}
                    </div>
                    <button
                        onClick={() => load(pendingK)}
                        disabled={loading}
                        className="px-5 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
                    >
                        {loading
                            ? <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Running…</span>
                            : 'Apply'}
                    </button>

                    {data && !loading && (
                        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span><strong className="text-foreground">{data.points.length}</strong> stocks</span>
                            <span>·</span>
                            <span>PC1: <strong className="text-indigo-600">{(data.explained_variance[0] * 100).toFixed(1)}%</strong></span>
                            <span>PC2: <strong className="text-indigo-600">{(data.explained_variance[1] * 100).toFixed(1)}%</strong></span>
                            <span>·</span>
                            <span>Total: <strong className="text-indigo-600">{((data.explained_variance[0] + data.explained_variance[1]) * 100).toFixed(1)}%</strong> variance</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-36 gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                    <p className="text-muted-foreground text-sm font-medium">Running PCA &amp; K-Means on Nifty 50…</p>
                    <p className="text-muted-foreground text-xs">Fetching 1-year history for 50 stocks. First load may take ~20–40 s.</p>
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 text-rose-500 bg-rose-50 border border-rose-200 rounded-xl px-5 py-6">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : data ? (
                <>
                    {/* ── Scatter Plot ─────────────────────────────────── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="h-4 w-4 text-indigo-500" />
                                PCA Scatter Plot — K-Means Clusters
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                7 financial features (returns, volatility, momentum, P/E, 52W position, discount,
                                opportunity score) were standardised and reduced to 2 principal components via PCA.
                                K-Means then groups similar stocks by colour. Hover any point for full details.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={580}>
                                <ScatterChart margin={{ top: 24, right: 24, bottom: 80, left: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        type="number"
                                        dataKey="pc1"
                                        name="PC1"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) => v.toFixed(1)}
                                        label={{
                                            value: `Principal Component 1 (PC1) — ${(data.explained_variance[0] * 100).toFixed(1)}% variance`,
                                            position: 'insideBottom',
                                            offset: -30,
                                            fontSize: 12,
                                            fill: '#6366F1',
                                        }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="pc2"
                                        name="PC2"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) => v.toFixed(1)}
                                        label={{
                                            value: `Principal Component 2 (PC2) — ${(data.explained_variance[1] * 100).toFixed(1)}% variance`,
                                            angle: -90,
                                            position: 'insideLeft',
                                            offset: 16,
                                            fontSize: 12,
                                            fill: '#8B5CF6',
                                        }}
                                    />
                                    <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="4 2" />
                                    <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 2" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        formatter={(value) => <span className="mr-4 text-xs font-medium text-slate-700">{value}</span>}
                                    />
                                    {byCluster.map((pts, ci) => (
                                        <Scatter
                                            key={ci}
                                            name={`Cluster ${CLUSTER_NAMES[ci]} (${pts.length})`}
                                            data={pts}
                                            fill={CLUSTER_COLORS[ci]}
                                            shape={<CustomDot />}
                                            opacity={hoveredCluster === null || hoveredCluster === ci ? 1 : 0.15}
                                            onMouseEnter={() => setHoveredCluster(ci)}
                                            onMouseLeave={() => setHoveredCluster(null)}
                                        />
                                    ))}
                                </ScatterChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* ── Cluster summary cards ─────────────────────────── */}
                    <div className={cn(
                        'grid gap-4',
                        data.n_clusters <= 3 ? 'grid-cols-1 sm:grid-cols-3' :
                            data.n_clusters <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
                                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    )}>
                        {byCluster.map((pts, ci) => {
                            const n = pts.length;
                            const avgRet = n ? pts.reduce((s, p) => s + p.annual_return, 0) / n : 0;
                            const avgVol = n ? pts.reduce((s, p) => s + p.volatility, 0) / n : 0;
                            const avgMom = n ? pts.reduce((s, p) => s + p.momentum_3m, 0) / n : 0;
                            return (
                                <Card
                                    key={ci}
                                    className={cn(
                                        'border-l-4 cursor-default transition-shadow',
                                        hoveredCluster === ci ? 'shadow-lg ring-1 ring-primary/20' : ''
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
                                                <span className={cn('font-medium', avgRet >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
                                                    {avgRet.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Avg 3M Momentum</span>
                                                <span className={cn('font-medium', avgMom >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
                                                    {avgMom.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Avg Daily Vol</span>
                                                <span className="font-medium">{(avgVol * 100).toFixed(2)}%</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {pts.slice(0, 8).map((p) => (
                                                <span key={p.symbol} className="text-xs bg-secondary/70 rounded px-1.5 py-0.5 font-mono">
                                                    {p.symbol}
                                                </span>
                                            ))}
                                            {n > 8 && <span className="text-xs text-muted-foreground self-center">+{n - 8} more</span>}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </>
            ) : null}
        </div>
    );
}

// ─── Root component ─────────────────────────────────────────────

interface StocksTableClientProps {
    stocks: Stock[];
}

type Tab = 'table' | 'pca';

export default function StocksTableClient({ stocks }: StocksTableClientProps) {
    const [tab, setTab] = useState<Tab>('table');

    return (
        <div className="space-y-6">
            {/* Tab bar */}
            <div className="flex gap-1 border-b border-border">
                <TabButton active={tab === 'table'} onClick={() => setTab('table')} icon={<Table2 className="h-4 w-4" />}>
                    Stocks Table
                </TabButton>
                <TabButton active={tab === 'pca'} onClick={() => setTab('pca')} icon={<BarChart2 className="h-4 w-4" />}>
                    PCA &amp; K-Means Clustering
                </TabButton>
            </div>

            {tab === 'table' && <StocksTable stocks={stocks} sortable={true} />}
            {tab === 'pca' && <PCAPanel />}
        </div>
    );
}

function TabButton({
    active, onClick, icon, children,
}: {
    active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
        >
            {icon}
            {children}
        </button>
    );
}

