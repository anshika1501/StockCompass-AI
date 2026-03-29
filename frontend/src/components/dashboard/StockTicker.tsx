"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isUp: boolean;
}

const TICKERS: TickerItem[] = [
  { symbol: "ADP", price: "$201.25", change: "-1.59%", isUp: false },
  { symbol: "ADANIPORTS.NS", price: "₹1,337.8", change: "-2.78%", isUp: false },
  { symbol: "AEP", price: "$130.1", change: "+1.14%", isUp: true },
  { symbol: "ADANIPOWER.NS", price: "₹153.92", change: "+0.18%", isUp: true },
  { symbol: "AFL", price: "$106.41", change: "-1.44%", isUp: false },
  { symbol: "ALKEM.NS", price: "₹5,344.5", change: "-0.95%", isUp: false },
  { symbol: "AAPL", price: "$173.50", change: "+1.2%", isUp: true },
  { symbol: "RELIANCE.NS", price: "₹2,950.0", change: "+0.8%", isUp: true },
];

export default function StockTicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const market = searchParams.get("market")?.toLowerCase();
  
  const [activeTab, setActiveTab] = useState<"INTERNATIONAL" | "INDIAN">(
    market === "usa" ? "INTERNATIONAL" : "INDIAN"
  );

  useEffect(() => {
    if (market === "usa") {
      setActiveTab("INTERNATIONAL");
    } else {
      setActiveTab("INDIAN");
    }
  }, [market]);

  return (
    <div className="space-y-4 mb-6">
      {/* Marquee Ticker Row */}
      <div className="relative flex overflow-hidden rounded-2xl border border-slate-200 bg-white py-3 shadow-[0_2px_10px_rgb(0,0,0,0.02)] select-none">
        <div className="animate-marquee flex whitespace-nowrap px-4">
          {/* Double the list for seamless loop effect */}
          {[...TICKERS, ...TICKERS].map((tick, i) => (
            <div key={i} className="flex items-center gap-2 mx-6">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">{tick.symbol}</span>
              <span className="text-xs font-medium text-slate-500">{tick.price}</span>
              <span className={`flex items-center text-xs font-bold gap-0.5 ${tick.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {tick.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {tick.change}
              </span>
              <div className="h-3 w-[1px] bg-slate-200 ml-6" /> {/* Divider */}
            </div>
          ))}
        </div>
        {/* Gradient overlays to smooth edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
      </div>

      {/* Tabs Row */}
      <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        <button
          onClick={() => {
            setActiveTab("INTERNATIONAL");
            router.push("/portfolios?market=usa");
          }}
          className={`flex-1 rounded-xl py-3 text-[10px] font-bold tracking-widest uppercase transition-all ${
            activeTab === "INTERNATIONAL"
              ? "bg-[#4F8DF7] text-white shadow-md shadow-blue-500/20"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          International Stocks
        </button>
        <button
          onClick={() => {
            setActiveTab("INDIAN");
            router.push("/portfolios?market=india");
          }}
          className={`flex-1 rounded-xl py-3 text-[10px] font-bold tracking-widest uppercase transition-all ${
            activeTab === "INDIAN"
              ? "bg-[#4F8DF7] text-white shadow-md shadow-blue-500/20"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          Indian Stocks
        </button>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
