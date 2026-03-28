
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
    <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden relative rounded-2xl">
      <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] pointer-events-none">
        <BrainCircuit size={180} className="text-[#4F8DF7]" />
      </div>
      <CardHeader className="px-5 pt-6 pb-4 relative z-10">
        <div className="flex flex-col gap-4">
          <CardTitle className="flex items-center gap-2.5 text-slate-900 font-headline font-extrabold tracking-tight text-lg">
            <div className="bg-[#4F8DF7] p-1.5 rounded-lg shadow-md shadow-[#4F8DF7]/15">
              <Sparkles className="h-4 w-4 fill-white text-white" />
            </div>
            AI Quantitative Intel
          </CardTitle>
          {!insights && !loading && (
            <Button size="sm" onClick={fetchInsights} className="w-full bg-[#4F8DF7] hover:bg-[#2563EB] text-white font-bold text-[10px] uppercase tracking-wider h-10 rounded-lg shadow-md shadow-[#4F8DF7]/10 transition-all active:scale-95">
              Execute Analysis
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-6 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4 bg-slate-50/50 rounded-xl border border-slate-100 shadow-inner">
            <div className="relative">
              <div className="absolute inset-0 bg-[#4F8DF7] blur-lg opacity-10 animate-pulse" />
              <Loader2 className="h-8 w-8 animate-spin text-[#4F8DF7] relative" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-0.5">Synthesizing Data</p>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Generating indicators...</p>
            </div>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50/80 p-3 rounded-xl border border-slate-100/50">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Market Signal</span>
              <Badge variant="secondary" className={cn(
                "capitalize px-3 py-1 rounded-md font-bold text-[9px] uppercase tracking-widest border",
                insights.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                insights.sentiment === 'negative' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                'bg-gray-50 text-gray-500 border-gray-100'
              )}>
                {insights.sentiment}
              </Badge>
            </div>
            
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-inner">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Strategic Abstract</h4>
              <p className="text-sm text-slate-700 leading-relaxed font-semibold italic opacity-90">
                "{insights.summary}"
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Core Indicators</h4>
              <ul className="space-y-2">
                {insights.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex gap-3 p-3 bg-white border border-slate-100 rounded-xl group hover:border-[#4F8DF7]/30 transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-[#4F8DF7]/15">
                       <CheckCircle2 className="h-3 w-3 text-[#4F8DF7]" />
                    </div>
                    <span className="text-xs font-medium text-slate-600 leading-snug">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-slate-100 shadow-inner px-4">
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
              Initialize the AI engine to generate detailed performance analytics and strategic market insights for {stock.ticker}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
