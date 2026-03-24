'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown, PlusCircle, CheckCircle2, GitCompare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stock } from '@/lib/stock-data';
import { cn } from '@/lib/utils';
import { useCompareStocks } from '@/hooks/use-compare-stocks';

interface StocksTableProps {
    stocks: Stock[];
    sortable?: boolean;
}

type SortKey = keyof Stock | null;

interface SortConfig {
    key: SortKey;
    direction: 'asc' | 'desc';
}

export default function StocksTable({ stocks, sortable = true }: StocksTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
    const { compareList, addToCompare, removeFromCompare, isInCompare } = useCompareStocks();
    const router = useRouter();

    const sortedStocks = useMemo(() => {
        if (!sortable || !sortConfig.key) return stocks;

        return [...stocks].sort((a, b) => {
            const aVal = a[sortConfig.key as keyof Stock];
            const bVal = b[sortConfig.key as keyof Stock];

            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
            if (bVal == null) return sortConfig.direction === 'asc' ? -1 : 1;

            if (typeof aVal === 'string') {
                const aStr = (aVal as string).toLowerCase();
                const bStr = (bVal as string).toLowerCase();
                if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
            } else if (typeof aVal === 'number') {
                if ((aVal as number) < (bVal as number)) return sortConfig.direction === 'asc' ? -1 : 1;
                if ((aVal as number) > (bVal as number)) return sortConfig.direction === 'asc' ? 1 : -1;
            }

            return 0;
        });
    }, [stocks, sortConfig, sortable]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortConfig.key !== columnKey) {
            return <ArrowUpDown size={14} className="ml-1 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ArrowUp size={14} className="ml-1 text-primary" />
        ) : (
            <ArrowDown size={14} className="ml-1 text-primary" />
        );
    };

    const Th = ({
        children,
        columnKey,
        align = 'left',
    }: {
        children: React.ReactNode;
        columnKey?: SortKey;
        align?: 'left' | 'center' | 'right';
    }) => (
        <th
            className={cn(
                'px-4 py-4 text-[11px] font-black uppercase tracking-[0.1em] sticky top-0 z-20 whitespace-nowrap bg-blue-50/80 backdrop-blur-sm border-b border-gray-200 text-[#1F2937]',
                sortable && columnKey ? 'cursor-pointer group hover:bg-blue-100 transition-colors' : '',
                align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
            )}
            onClick={() => {
                if (sortable && columnKey) {
                    requestSort(columnKey);
                }
            }}
        >
            <div
                className={cn(
                    'flex items-center',
                    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
                )}
            >
                {children}
                {sortable && columnKey && <SortIcon columnKey={columnKey} />}
            </div>
        </th>
    );

    if (stocks.length === 0) {
        return (
            <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
                <CardContent className="pt-8 text-center">
                    <p className="text-[#1F2937] font-medium">No stocks available.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b border-gray-100 mb-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-black text-[#000000]">Market Overview</CardTitle>
                    {compareList.length > 0 && (
                        <button
                            onClick={() => router.push('/compare')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4F8DF7] text-white text-sm font-bold hover:bg-[#2563EB] transition-all shadow-sm active:scale-95"
                        >
                            <GitCompare size={16} />
                            Compare Assets ({compareList.length})
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[700px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <Th columnKey="ticker">Symbol</Th>
                                <Th columnKey="name">Company Name</Th>
                                <Th columnKey="sector">Sector</Th>
                                <Th columnKey="currentPrice" align="right">
                                    Current Price
                                </Th>
                                <Th columnKey="fiftyTwoWeekLow" align="right">
                                    52W Low
                                </Th>
                                <Th columnKey="fiftyTwoWeekHigh" align="right">
                                    52W High
                                </Th>
                                <Th columnKey="peMin" align="right">
                                    PE Min
                                </Th>
                                <Th columnKey="peMax" align="right">
                                    PE Max
                                </Th>
                                <Th columnKey="peRatio" align="right">
                                    Current PE
                                </Th>
                                <Th columnKey="peAvg" align="right">
                                    PE Avg
                                </Th>
                                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-center sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                                    Recommendation
                                </th>
                                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-right sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                                    Market Cap
                                </th>
                                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-center sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                                    Change
                                </th>
                                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-center sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedStocks.map((stock, idx) => (
                                <tr
                                    key={stock.ticker}
                                    className={cn(
                                        "transition-all duration-200 hover:bg-blue-100 group cursor-pointer",
                                        idx % 2 === 0 ? "bg-white" : "bg-blue-50/30"
                                    )}
                                >
                                    <td className="px-4 py-5 text-sm font-black text-[#000000] whitespace-nowrap">
                                        {stock.ticker}
                                    </td>
                                    <td className="px-4 py-5 text-sm text-[#1F2937] font-bold whitespace-nowrap max-w-xs truncate">
                                        {stock.name}
                                    </td>
                                    <td className="px-4 py-5 text-sm text-[#1F2937] whitespace-nowrap">
                                        <Badge variant="outline" className="text-[11px] font-bold border-gray-300 text-[#1F2937] px-2 py-0.5 rounded-md">
                                            {stock.sector}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-5 text-right text-sm font-bold text-[#000000] whitespace-nowrap">
                                        ₹{stock.currentPrice?.toFixed(2) ?? 'N/A'}
                                    </td>
                                    <td className="px-4 py-5 text-right text-[13px] font-medium text-[#1F2937] opacity-80 whitespace-nowrap">
                                        ₹{stock.fiftyTwoWeekLow?.toFixed(2) ?? 'N/A'}
                                    </td>
                                    <td className="px-4 py-5 text-right text-[13px] font-medium text-[#1F2937] opacity-80 whitespace-nowrap">
                                        ₹{stock.fiftyTwoWeekHigh?.toFixed(2) ?? 'N/A'}
                                    </td>
                                    <td className="px-4 py-5 text-right text-[13px] font-medium text-[#1F2937] whitespace-nowrap">
                                        {stock.peMin?.toFixed(2) ?? '-'}
                                    </td>
                                    <td className="px-4 py-5 text-right text-[13px] font-medium text-[#1F2937] whitespace-nowrap">
                                        {stock.peMax?.toFixed(2) ?? '-'}
                                    </td>
                                    <td className="px-4 py-5 text-right text-[13px] font-bold text-[#4F8DF7] whitespace-nowrap">
                                        {stock.peRatio?.toFixed(2) ?? '-'}
                                    </td>
                                    <td className="px-4 py-5 text-right text-[13px] font-medium text-[#1F2937] whitespace-nowrap">
                                        {stock.peAvg?.toFixed(2) ?? '-'}
                                    </td>
                                    <td className="px-4 py-5 text-center whitespace-nowrap">
                                        <span className={cn(
                                            'inline-block px-3 py-1 rounded-lg text-[11px] font-black tracking-wider uppercase border',
                                            stock.recommendation === 'BUY' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                            stock.recommendation === 'SELL' && 'bg-rose-50 text-rose-700 border-rose-200',
                                            stock.recommendation === 'HOLD' && 'bg-amber-50 text-amber-700 border-amber-200',
                                        )}>
                                            {stock.recommendation}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-right text-sm font-bold text-[#1F2937] whitespace-nowrap">
                                        {stock.marketCap ? `₹${(stock.marketCap / 1e7).toFixed(2)} Cr` : '-'}
                                    </td>
                                    <td className={cn(
                                        'px-4 py-5 text-center text-[13px] font-black whitespace-nowrap',
                                        stock.change >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                    )}>
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded",
                                            stock.change >= 0 ? "bg-emerald-50" : "bg-rose-50"
                                        )}>
                                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-3">
                                            <Link href={`/stock/${stock.ticker}`}>
                                                <button className="text-xs font-black text-[#4F8DF7] hover:text-[#2563EB] transition-colors px-3 py-2 rounded-lg bg-[#4F8DF7]/5 hover:bg-[#4F8DF7]/15 border border-[#4F8DF7]/20 uppercase tracking-tighter">
                                                    Details
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    if (isInCompare(stock.ticker)) {
                                                        removeFromCompare(stock.ticker);
                                                    } else {
                                                        addToCompare({ symbol: stock.ticker, name: stock.name });
                                                    }
                                                }}
                                                title={isInCompare(stock.ticker) ? 'Remove from Compare' : 'Add to Compare'}
                                                className={cn(
                                                    'flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-lg transition-all border uppercase tracking-tighter',
                                                    isInCompare(stock.ticker)
                                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-sm'
                                                        : 'text-[#1F2937] border-gray-200 hover:border-[#4F8DF7] hover:text-[#4F8DF7] hover:bg-gray-50'
                                                )}
                                            >
                                                {isInCompare(stock.ticker)
                                                    ? <><CheckCircle2 size={13} /> Active</>
                                                    : <><PlusCircle size={13} /> Compare</>
                                                }
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
