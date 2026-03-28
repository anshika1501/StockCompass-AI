'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Trophy, Star, TrendingUp, BadgeCheck, PlusCircle, Loader2,
    BriefcaseBusiness, ChevronRight, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchPortfolioAnalysis, type PortfolioAnalysisStock } from '@/lib/stock-data';
import { getPortfolios, addHolding, type Portfolio } from '@/lib/portfolio-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Scoring ─────────────────────────────────────────────────────────────────

const DISC_WEIGHT: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };

function computeQualityScore(s: PortfolioAnalysisStock): number {
    let score = 0;
    score += (s.opportunity_score ?? 0) * 2;                        // weight ×2
    score += (DISC_WEIGHT[s.discount_level] ?? 0) * 10;            // discount bonus
    if (s.recommendation === 'BUY') score += 20;                    // BUY signal
    if (s.recommendation === 'HOLD') score += 5;
    if ((s.sentiment_score ?? 0) > 0) score += (s.sentiment_score ?? 0) * 15; // sentiment
    if ((s.change_percent ?? 0) > 0) score += Math.min((s.change_percent ?? 0), 5) * 2;
    return Math.round(score * 10) / 10;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const RANK_META = [
    { label: 'BEST PICK', bg: 'bg-blue-50', text: 'text-[#4F8DF7]', border: 'border-blue-200', ring: 'ring-blue-300', icon: <Trophy size={14} className="text-[#4F8DF7]" /> },
    { label: 'TOP 2',     bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200', ring: 'ring-slate-300', icon: <Star size={14} className="text-slate-500" /> },
    { label: 'TOP 3',     bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',ring: 'ring-emerald-300', icon: <BadgeCheck size={14} className="text-emerald-600" /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QualityStocks({ sectorSlug }: { sectorSlug: string }) {
    const router = useRouter();
    const { toast } = useToast();

    const [stocks, setStocks] = useState<PortfolioAnalysisStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [isAdding, setIsAdding] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        fetchPortfolioAnalysis(sectorSlug)
            .then(d => { if (active) setStocks(d.stocks); })
            .catch(() => {})
            .finally(() => { if (active) setLoading(false); });
        getPortfolios().then(setPortfolios).catch(() => {});
        return () => { active = false; };
    }, [sectorSlug]);

    const ranked = useMemo(
        () => [...stocks].sort((a, b) => computeQualityScore(b) - computeQualityScore(a)),
        [stocks]
    );

    const top3  = ranked.slice(0, 3);
    const rest  = ranked.slice(3).filter(s => s.recommendation === 'BUY');

    const handleAdd = async (stock: PortfolioAnalysisStock, pid?: number, pname?: string) => {
        if (portfolios.length === 0) {
            toast({ title: 'No portfolios', description: 'Create a portfolio first.', variant: 'destructive' });
            router.push('/my-portfolio');
            return;
        }
        const targetId   = pid   ?? portfolios[0].id;
        const targetName = pname ?? portfolios[0].name;
        setIsAdding(stock.symbol);
        try {
            await addHolding(Number(targetId), stock.symbol, stock.company_name, 1, stock.current_price || 0);
            toast({ title: 'Added!', description: `${stock.symbol} added to ${targetName}` });
        } catch {
            toast({ title: 'Error', description: 'Failed to add stock.', variant: 'destructive' });
        } finally {
            setIsAdding(null);
        }
    };

    if (loading) {
        return (
            <Card className="border border-gray-100 shadow-sm bg-white rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center min-h-[320px]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#4F8DF7] mb-3" />
                    <p className="text-sm text-gray-400 animate-pulse">Scoring stocks…</p>
                </CardContent>
            </Card>
        );
    }

    if (stocks.length === 0) {
        return (
            <Card className="border border-gray-100 shadow-sm bg-white rounded-3xl">
                <CardContent className="py-12 text-center text-gray-400">
                    <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
                    <p>No stock data available for quality ranking.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            {/* ── Header Card ─────────────────────────────────────────────── */}
            <Card className="border border-blue-100 bg-gradient-to-r from-blue-50/60 to-white shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-blue-100/60">
                    <div className="flex items-start gap-4">
                        <div className="bg-[#4F8DF7]/10 p-3 rounded-2xl border border-blue-200 shadow-inner">
                            <Trophy size={22} className="text-[#4F8DF7]" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-extrabold text-[#000000] tracking-tight">
                                Best Return Picks — High Discount + High Return
                            </CardTitle>
                            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed max-w-2xl">
                                Stocks scored by combining opportunity score (weight ×2), discount level, BUY signal, and positive sentiment.
                                High discount + strong opportunity = best investment pick in this sector.
                            </p>
                        </div>
                    </div>
                </CardHeader>

                {/* ── Top 3 Cards ──────────────────────────────────────────── */}
                <CardContent className="px-8 py-7">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {top3.map((stock, i) => {
                            const meta  = RANK_META[i];
                            const score = computeQualityScore(stock);
                            return (
                                <div
                                    key={stock.symbol}
                                    className={cn(
                                        'relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200',
                                        'hover:shadow-lg hover:-translate-y-0.5 group',
                                        i === 0
                                            ? 'border-[#4F8DF7]/40 bg-blue-50/50 shadow-md shadow-blue-100'
                                            : 'border-gray-100 bg-white shadow-sm',
                                    )}
                                    onClick={() => router.push(`/stock/${stock.symbol}?from=${sectorSlug}`)}
                                >
                                    {/* Rank badge */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5">
                                            {meta.icon}
                                            <span className={cn(
                                                'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border',
                                                meta.bg, meta.text, meta.border
                                            )}>{meta.label}</span>
                                        </div>
                                        <span className={cn(
                                            'text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider',
                                            stock.recommendation === 'BUY'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        )}>{stock.recommendation}</span>
                                    </div>

                                    {/* Symbol & name */}
                                    <div className="mb-4">
                                        <p className="text-[15px] font-black text-[#1F2937] tracking-tight">{stock.symbol.replace('.NS', '')}</p>
                                        <p className="text-[11px] text-gray-400 font-medium truncate">{stock.company_name}</p>
                                    </div>

                                    {/* Metrics grid */}
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                                        <div>
                                            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Price</span>
                                            <p className="text-[13px] font-black text-[#000000]">₹{stock.current_price?.toFixed(1)}</p>
                                        </div>
                                        <div>
                                            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Opp Score</span>
                                            <p className="text-[13px] font-black text-[#4F8DF7]">{stock.opportunity_score}</p>
                                        </div>
                                        <div>
                                            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Change</span>
                                            <p className={cn(
                                                'text-[13px] font-black',
                                                (stock.change_percent ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                            )}>
                                                {(stock.change_percent ?? 0) >= 0 ? '+' : ''}{(stock.change_percent ?? 0).toFixed(1)}%
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Discount</span>
                                            <p className={cn(
                                                'text-[13px] font-black',
                                                stock.discount_level === 'HIGH' ? 'text-rose-600' :
                                                stock.discount_level === 'MEDIUM' ? 'text-amber-600' : 'text-gray-500'
                                            )}>{stock.discount_level}</p>
                                        </div>
                                    </div>

                                    {/* Quality score bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">Quality Score</span>
                                            <span className="text-[11px] font-black text-[#4F8DF7]">{score}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#4F8DF7] to-[#6366F1] rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min((score / 200) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Sentiment */}
                                    {stock.sentiment_label && (
                                        <div className="mb-4">
                                            <span className={cn(
                                                'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                                                stock.sentiment_label === 'BULLISH' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                stock.sentiment_label === 'BEARISH' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                'bg-gray-50 text-gray-500 border-gray-100'
                                            )}>{stock.sentiment_label}
                                            {stock.sentiment_score != null &&
                                                <span className="ml-1 opacity-70">{stock.sentiment_score > 0 ? '+' : ''}{stock.sentiment_score.toFixed(3)}</span>
                                            }
                                            </span>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={e => { e.stopPropagation(); router.push(`/stock/${stock.symbol}?from=${sectorSlug}`); }}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-[#4F8DF7]/5 border border-[#4F8DF7]/20 text-[#4F8DF7] hover:bg-[#4F8DF7]/15 transition-colors"
                                        >
                                            Details <ChevronRight size={12} />
                                        </button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                                <button
                                                    disabled={isAdding === stock.symbol}
                                                    className={cn(
                                                        'flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl transition-all shadow-sm',
                                                        isAdding === stock.symbol
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                                                    )}
                                                >
                                                    {isAdding === stock.symbol
                                                        ? <Loader2 size={12} className="animate-spin" />
                                                        : <PlusCircle size={12} />}
                                                    ADD
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-100 shadow-xl rounded-xl p-1 z-[110]" onClick={e => e.stopPropagation()}>
                                                {portfolios.length > 0 ? portfolios.map(p => (
                                                    <DropdownMenuItem
                                                        key={p.id}
                                                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] rounded-lg cursor-pointer uppercase tracking-wider"
                                                        onSelect={() => handleAdd(stock, p.id, p.name)}
                                                    >
                                                        <BriefcaseBusiness size={13} className="opacity-60" />{p.name}
                                                    </DropdownMenuItem>
                                                )) : (
                                                    <div className="px-3 py-2 text-[11px] text-gray-400 text-center font-semibold">No Portfolios</div>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ── Strong Buys ──────────────────────────────────────────────── */}
            {rest.length > 0 && (
                <Card className="border border-gray-100 bg-white shadow-sm rounded-3xl overflow-hidden">
                    <CardHeader className="px-8 py-5 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                                <TrendingUp size={18} className="text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-extrabold text-[#000000]">Other Strong Buys</CardTitle>
                                <p className="text-[11px] text-gray-400 mt-0.5">BUY-rated stocks ranked by quality score</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {rest.map(stock => {
                                const score = computeQualityScore(stock);
                                return (
                                    <div
                                        key={stock.symbol}
                                        className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 hover:bg-blue-50/30 hover:border-blue-100 transition-all duration-150 cursor-pointer group"
                                        onClick={() => router.push(`/stock/${stock.symbol}?from=${sectorSlug}`)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <Star size={12} className="text-amber-400" />
                                                <span className="text-[12px] font-black text-[#1F2937]">{stock.symbol.replace('.NS', '')}</span>
                                            </div>
                                            <Badge className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0 rounded-md uppercase">STRONG BUY</Badge>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mb-3 truncate">{stock.company_name}</p>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3 text-[11px]">
                                            <span className="text-gray-500">Price <span className="font-bold text-[#000000]">₹{stock.current_price?.toFixed(1)}</span></span>
                                            <span className="text-gray-500">Opp <span className="font-bold text-[#4F8DF7]">{stock.opportunity_score}</span></span>
                                            <span className="text-gray-500">Disc <span className={cn(
                                                'font-bold',
                                                stock.discount_level === 'HIGH' ? 'text-rose-600' :
                                                stock.discount_level === 'MEDIUM' ? 'text-amber-600' : 'text-gray-500'
                                            )}>{stock.discount_level}</span></span>
                                            <span className="text-gray-500">Score <span className="font-bold text-indigo-600">{score}</span></span>
                                        </div>
                                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                                    <button
                                                        disabled={isAdding === stock.symbol}
                                                        className={cn(
                                                            'w-full flex items-center justify-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all',
                                                            isAdding === stock.symbol
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                                                        )}
                                                    >
                                                        {isAdding === stock.symbol ? <Loader2 size={10} className="animate-spin" /> : <PlusCircle size={10} />}
                                                        Add to Portfolio
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44 bg-white border border-gray-100 shadow-xl rounded-xl p-1 z-[110]" onClick={e => e.stopPropagation()}>
                                                    {portfolios.length > 0 ? portfolios.map(p => (
                                                        <DropdownMenuItem
                                                            key={p.id}
                                                            className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] rounded-lg cursor-pointer uppercase tracking-wider"
                                                            onSelect={() => handleAdd(stock, p.id, p.name)}
                                                        >
                                                            <BriefcaseBusiness size={12} className="opacity-60" />{p.name}
                                                        </DropdownMenuItem>
                                                    )) : (
                                                        <div className="px-3 py-2 text-[10px] text-gray-400 text-center font-semibold">No Portfolios</div>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
