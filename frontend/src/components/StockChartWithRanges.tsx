"use client";

import { useState, useEffect, useCallback } from "react";
import StockChart from "@/components/StockChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api-base";

const RANGES = [
    { label: '1D', period: '1d' },
    { label: '5D', period: '5d' },
    { label: '1M', period: '1mo' },
    { label: '6M', period: '6mo' },
    { label: 'YTD', period: 'ytd' },
    { label: '1Y', period: '1y' },
];

const RANGE_TITLES: Record<string, string> = {
    '1d': '1 Day',
    '5d': '5 Days',
    '1mo': '30 Days',
    '6mo': '6 Months',
    'ytd': 'Year to Date',
    '1y': '1 Year',
};

interface Props {
    ticker: string;
    initialHistory: { date: string; price: number }[];
    color: string;
}

export default function StockChartWithRanges({ ticker, initialHistory, color }: Props) {
    const [activeRange, setActiveRange] = useState('1mo');
    const [history, setHistory] = useState(initialHistory);
    const [loading, setLoading] = useState(false);

    const fetchChart = useCallback(async (period: string) => {
        if (period === '1mo' && initialHistory.length > 0) {
            setHistory(initialHistory);
            setActiveRange(period);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/stocks/${ticker}/chart/?period=${period}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error('Failed to fetch chart data:', e);
        } finally {
            setLoading(false);
            setActiveRange(period);
        }
    }, [ticker, initialHistory]);

    return (
        <Card className="border border-gray-200 shadow-sm bg-white mb-10 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-8 py-6 border-b border-gray-50">
                <CardTitle className="text-xl font-black text-[#000000] tracking-tight">Performance History</CardTitle>
                <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-inner">
                    {RANGES.map((range) => (
                        <button
                            key={range.period}
                            onClick={() => fetchChart(range.period)}
                            disabled={loading}
                            className={cn(
                                "text-[11px] font-black px-4 py-2 rounded-lg transition-all uppercase tracking-tighter",
                                activeRange === range.period
                                    ? "bg-[#4F8DF7] text-white shadow-md shadow-[#4F8DF7]/20 scale-105"
                                    : "text-gray-500 hover:text-[#4F8DF7] hover:bg-white"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-6">
                {loading ? (
                    <div className="h-[350px] flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-[#4F8DF7]" />
                    </div>
                ) : history.length > 0 ? (
                    <div className="h-[350px]">
                        <StockChart history={history} color={color} />
                    </div>
                ) : (
                    <div className="h-[350px] flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                        Chart history unavailable
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
