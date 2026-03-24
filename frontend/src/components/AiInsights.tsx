
"use client";

import { useState } from "react";
import { Sparkles, Loader2, BrainCircuit, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAiStockInsightSummary, type AiStockInsightSummaryOutput, type AiStockInsightSummaryInput } from "@/ai/flows/ai-stock-insight-summary";
import { Badge } from "@/components/ui/badge";

export default function AiInsights({ stock }: { stock: any }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AiStockInsightSummaryOutput | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const result = await getAiStockInsightSummary({
        ticker: stock.ticker,
        companyName: stock.name,
        currentPrice: stock.currentPrice,
        marketCap: stock.marketCap,
        peRatio: stock.peRatio,
        fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: stock.fiftyTwoWeekLow,
        sector: stock.sector,
        industry: stock.industry,
        description: stock.description,
      });
      setInsights(result);
    } catch (error) {
      console.error("Failed to fetch insights", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-[#DBEAFE] bg-[#DBEAFE]/30 shadow-sm overflow-hidden relative rounded-3xl backdrop-blur-sm">
      <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
        <BrainCircuit size={240} className="text-[#4F8DF7]" />
      </div>
      <CardHeader className="px-8 pt-8 pb-4 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-[#000000] font-black tracking-tight text-xl">
            <div className="bg-[#4F8DF7] p-2 rounded-xl shadow-lg shadow-[#4F8DF7]/20">
              <Sparkles className="h-5 w-5 fill-white text-white" />
            </div>
            AI Quantitative Intel
          </CardTitle>
          {!insights && !loading && (
            <Button size="lg" onClick={fetchInsights} className="bg-[#4F8DF7] hover:bg-[#2563EB] text-white font-black text-[11px] uppercase tracking-widest px-6 h-12 rounded-xl shadow-xl shadow-[#4F8DF7]/20 transition-all active:scale-95">
              Execute Analysis
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-6 bg-white/40 rounded-2xl border border-white/60 shadow-inner">
            <div className="relative">
              <div className="absolute inset-0 bg-[#4F8DF7] blur-xl opacity-20 animate-pulse" />
              <Loader2 className="h-12 w-12 animate-spin text-[#4F8DF7] relative" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-[#000000] uppercase tracking-widest mb-1">Synthesizing Data</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Aggregating market trends & indicators...</p>
            </div>
          </div>
        ) : insights ? (
          <div className="space-y-8">
            <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-white/80">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Market Signal</span>
              <Badge variant="secondary" className={cn(
                "capitalize px-4 py-1.5 rounded-lg font-black text-[11px] uppercase tracking-widest border",
                insights.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                insights.sentiment === 'negative' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                'bg-gray-50 text-gray-500 border-gray-100'
              )}>
                {insights.sentiment}
              </Badge>
            </div>
            
            <div className="space-y-4 bg-white/40 p-6 rounded-2xl border border-white/60 shadow-inner">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Strategic Abstract</h4>
              <p className="text-lg text-[#1F2937] leading-relaxed font-black tracking-tight italic opacity-90">
                "{insights.summary}"
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Core Indicators</h4>
              <ul className="space-y-3">
                {insights.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex gap-4 p-4 bg-white/60 rounded-2xl border border-white/80 group hover:bg-white transition-colors duration-300">
                    <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-[#4F8DF7] transition-colors">
                       <CheckCircle2 className="h-3.5 w-3.5 text-[#4F8DF7] group-hover:text-white" />
                    </div>
                    <span className="text-sm font-bold text-[#1F2937] leading-snug">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-white/40 rounded-2xl border border-white/60 shadow-inner">
            <p className="text-sm font-bold text-[#1F2937] opacity-60 tracking-tight px-6 leading-relaxed">
              Initialize the AI engine to generate detailed performance analytics and strategic market insights for {stock.ticker}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
