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
                'px-4 py-3.5 text-xs font-bold uppercase tracking-widest sticky top-0 z-20 whitespace-nowrap bg-slate-50 border-b border-slate-200',
                sortable && columnKey ? 'cursor-pointer group hover:bg-slate-100 transition-colors' : '',
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
            <Card className="border-none shadow-sm">
                <CardContent className="pt-8 text-center">
                    <p className="text-muted-foreground">No stocks available.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Stocks</CardTitle>
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
                <div className="overflow-x-auto max-h-[700px]">
                    <table className="w-full divide-y divide-slate-200">
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
                        <tbody className="divide-y divide-slate-200">
                            {sortedStocks.map((stock) => (
                                <tr
                                    key={stock.ticker}
                                    className="transition-colors hover:bg-slate-50 group cursor-pointer"
                                >
                                    <td className="px-4 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">
                                        {stock.ticker}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-700 font-medium whitespace-nowrap max-w-xs truncate">
                                        {stock.name}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                                        <Badge variant="outline" className="text-xs">
                                            {stock.sector}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-mono text-slate-700 whitespace-nowrap">
                                        ₹{stock.currentPrice?.toFixed(2) ?? 'N/A'}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-mono text-slate-600 whitespace-nowrap">
                                        ₹{stock.fiftyTwoWeekLow?.toFixed(2) ?? 'N/A'}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-mono text-slate-600 whitespace-nowrap">
                                        ₹{stock.fiftyTwoWeekHigh?.toFixed(2) ?? 'N/A'}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-mono text-slate-600 whitespace-nowrap">
                                        {stock.peMin?.toFixed(2) ?? '-'}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-mono text-slate-600 whitespace-nowrap">
                                        {stock.peMax?.toFixed(2) ?? '-'}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-mono text-slate-600 whitespace-nowrap">
                                        {stock.peRatio?.toFixed(2) ?? '-'}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-mono text-slate-600 whitespace-nowrap">
                                        {stock.peAvg?.toFixed(2) ?? '-'}
                                    </td>
                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                        <span className={cn(
                                            'inline-block px-2.5 py-1 rounded-full text-xs font-bold tracking-wide',
                                            stock.recommendation === 'BUY' && 'bg-emerald-100 text-emerald-700',
                                            stock.recommendation === 'SELL' && 'bg-rose-100 text-rose-700',
                                            stock.recommendation === 'HOLD' && 'bg-amber-100 text-amber-700',
                                        )}>
                                            {stock.recommendation}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-mono text-slate-600 whitespace-nowrap">
                                        {stock.marketCap ? `₹${(stock.marketCap / 1e7).toFixed(2)} Cr` : '-'}
                                    </td>
                                    <td className={cn(
                                        'px-4 py-4 text-center text-sm font-semibold whitespace-nowrap',
                                        stock.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                    )}>
                                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                                    </td>
                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/stock/${stock.ticker}`}>
                                                <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md hover:bg-primary/10">
                                                    View
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
                                                    'flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors',
                                                    isInCompare(stock.ticker)
                                                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                                        : 'text-slate-600 hover:text-primary hover:bg-primary/10'
                                                )}
                                            >
                                                {isInCompare(stock.ticker)
                                                    ? <><CheckCircle2 size={13} /> Added</>
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
