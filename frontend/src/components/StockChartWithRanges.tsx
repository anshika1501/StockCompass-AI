"use client";

import { useState, useCallback, useMemo } from "react";
import StockChart from "@/components/StockChart";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api-base";

const RANGES = [
  { label: '1 Month', period: '1mo' },
  { label: '3 Months', period: '3mo' },
  { label: '6 Months', period: '6mo' },
  { label: '1 Year', period: '1y' },
];

interface Props {
  ticker: string;
  initialHistory: { date: string; price: number }[];
  color?: string;
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

  const rangeLabel = useMemo(() => RANGES.find(r => r.period === activeRange)?.label || '1 Month', [activeRange]);

  return (
    <div className="bg-[#0f172a] rounded-3xl border border-slate-800 p-6 sm:p-8 font-sans shadow-xl shadow-blue-900/10 mb-8 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-6 w-1 bg-[#0ea5e9] rounded-full" />
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
          {ticker} - Price History ({rangeLabel})
        </h2>
      </div>
      <p className="text-slate-400 text-sm font-medium mb-8">Premium technical view with overlays</p>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#1e293b]/50 p-1.5 rounded-xl border border-slate-800/60 w-max mb-6">
        {RANGES.map((range) => (
          <button
            key={range.period}
            onClick={() => fetchChart(range.period)}
            disabled={loading}
            className={cn(
              "text-xs font-bold px-4 py-2.5 rounded-lg transition-all tracking-wider",
              activeRange === range.period
                ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="bg-[#0b1120] rounded-2xl border border-slate-800/80 p-2 sm:p-6 pb-2 relative">
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#0ea5e9]" />
          </div>
        ) : history.length > 0 ? (
          <div className="h-[400px]">
            <StockChart history={history} />
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">
            Chart history unavailable
          </div>
        )}
      </div>

      {/* Candlestick Toggle (Visual only for matching UI) */}
      <div className="mt-8 flex items-center gap-3">
        <div className="h-5 w-1 bg-[#0ea5e9] rounded-full" />
        <h3 className="text-slate-200 font-bold text-lg">{ticker} - Candlestick Chart</h3>
      </div>
    </div>
  );
}
