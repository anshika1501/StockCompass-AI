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
        <Card className="border-none shadow-sm bg-white mb-8">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">Performance ({RANGE_TITLES[activeRange] || activeRange})</CardTitle>
                <div className="flex gap-2">
                    {RANGES.map((range) => (
                        <button
                            key={range.period}
                            onClick={() => fetchChart(range.period)}
                            disabled={loading}
                            className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded transition-colors",
                                activeRange === range.period
                                    ? "bg-primary text-white"
                                    : "bg-secondary text-muted-foreground hover:bg-primary/10"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : history.length > 0 ? (
                    <StockChart history={history} color={color} />
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No chart data available for this period.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
