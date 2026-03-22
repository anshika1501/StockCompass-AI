
"use client";

import { useState } from "react";
import { Sparkles, Loader2, BrainCircuit, CheckCircle2 } from "lucide-react";
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
    <Card className="border-none bg-primary/5 shadow-none overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <BrainCircuit size={120} />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 relative z-10">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5 fill-primary" />
            AI Market Insights
          </CardTitle>
          {!insights && !loading && (
            <Button size="sm" onClick={fetchInsights} className="shadow-lg">
              Generate Summary
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Analyzing market trends and financials...</p>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Sentiment</span>
              <Badge variant={insights.sentiment === 'positive' ? 'default' : insights.sentiment === 'negative' ? 'destructive' : 'secondary'} className="capitalize px-4">
                {insights.sentiment}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold">Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{insights.summary}"
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold">Key Observations</h4>
              <ul className="space-y-2">
                {insights.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-muted-foreground items-start">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Get an instant AI-powered analysis of {stock.ticker}'s performance and potential.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
