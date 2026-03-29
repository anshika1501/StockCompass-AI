"use client";

import React, { useEffect, useState, useRef } from "react";
import { fetchStockSentiment, StockSentimentResponse } from "@/lib/stock-data";
import { Loader2, TrendingUp, TrendingDown, Minus, ExternalLink, Clock, Newspaper, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface MarketHeadlinesProps {
  ticker: string;
}

export default function MarketHeadlines({ ticker }: MarketHeadlinesProps) {
  const [data, setData] = useState<StockSentimentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPolling = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    try {
      const res = await fetchStockSentiment(ticker);
      
      if (res.error) {
        setError(res.error);
        isPolling.current = false;
        return;
      }
      
      setData(res);
      
      if (res.fetching) {
        if (!isPolling.current) {
          isPolling.current = true;
        }
        timeoutRef.current = setTimeout(loadData, 3000);
      } else {
        isPolling.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    } catch (err) {
      setError("Failed to fetch market headlines.");
      isPolling.current = false;
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      isPolling.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [ticker]);

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 overflow-hidden">
        <div className="flex items-center gap-2 text-rose-600 mb-2 font-bold">
          <Activity className="h-4 w-4" /> Market Headlines
        </div>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (!data || data.fetching) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4F8DF7]/5 rounded-bl-[100px] -z-10" />
        <Loader2 className="h-8 w-8 text-[#4F8DF7] animate-spin mb-4" />
        <h3 className="text-sm font-bold text-slate-900 mb-1 uppercase tracking-widest text-center">Analyzing Recent News</h3>
        <p className="text-xs text-slate-500 font-medium text-center">
          {data?.message || "Aggregating Yahoo Finance articles... This may take a few moments."}
        </p>
      </div>
    );
  }

  if (!data.news || data.news.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 text-slate-900 mb-2 font-bold">
          <Newspaper className="h-4 w-4 text-[#4F8DF7]" /> Market Headlines
        </div>
        <p className="text-sm text-slate-500 italic">No recent news articles found for this stock.</p>
      </div>
    );
  }

  const isBullish = data.sentiment_label === 'BULLISH';
  const isBearish = data.sentiment_label === 'BEARISH';
  
  const headerGradient = isBullish 
    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
    : isBearish 
      ? 'bg-gradient-to-br from-rose-500 to-rose-600'
      : 'bg-gradient-to-br from-amber-500 to-amber-600';

  const lightBgColor = isBullish ? 'bg-emerald-50' : isBearish ? 'bg-rose-50' : 'bg-amber-50';
  const lightBorderColor = isBullish ? 'border-emerald-100' : isBearish ? 'border-rose-100' : 'border-amber-100';
  const textColor = isBullish ? 'text-emerald-700' : isBearish ? 'text-rose-700' : 'text-amber-700';

  // Function to determine individual article colors softly
  const getArticleTagClass = (label?: string) => {
    switch (label) {
      case 'BULLISH': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'BEARISH': return 'text-rose-700 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Title Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
           <Newspaper className="h-4 w-4 text-[#4F8DF7]" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            News & Sentiment AI
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">NLP VADER Analysis</p>
        </div>
      </div>

      {/* Prominent Sentiment Score Block */}
      {data.sentiment_label && (
        <div className="p-4 sm:px-5">
          <div className={cn("rounded-2xl flex flex-col items-center justify-center p-5 shadow-sm border overflow-hidden relative", lightBgColor, lightBorderColor)}>
            {/* Decorative background circle */}
            <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10", headerGradient)} />
            
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 z-10">Overall Sentiment</p>
            <div className="flex items-center gap-3 z-10">
              <div className={cn("p-2 rounded-xl shadow-inner text-white", headerGradient)}>
                {isBullish ? <TrendingUp className="h-5 w-5" /> : isBearish ? <TrendingDown className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
              </div>
              <div className="flex flex-col">
                <span className={cn("text-lg font-black tracking-tight leading-none uppercase", textColor)}>
                  {data.sentiment_label}
                </span>
                <span className="text-xs font-bold text-slate-500 mt-1">
                  Score: <span className="text-slate-900">{data.sentiment_score?.toFixed(3)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Feed - Vertical Stack */}
      <div className="p-4 sm:p-5 pt-0 flex flex-col gap-3">
        {data.news.slice(0, 4).map((article, idx) => (
          <a 
            key={idx}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white hover:bg-slate-50 transition-colors rounded-2xl border border-slate-100 hover:border-slate-300 p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {article.source}
              </span>
              <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border flex items-center", getArticleTagClass(article.sentiment_label))}>
                {article.sentiment_label}
              </span>
            </div>
            
            <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#4F8DF7] transition-colors leading-snug mb-1.5 line-clamp-2">
              {article.headline}
            </h4>
            
            <p className="text-[11px] font-medium text-slate-400 line-clamp-2 mb-3 leading-relaxed">
              {article.snippet}
            </p>
            
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Clock className="w-3 h-3 mr-1" />
                {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#4F8DF7] transition-colors" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
