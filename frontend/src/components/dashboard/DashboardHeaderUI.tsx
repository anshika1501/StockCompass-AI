"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, TrendingDown, Loader2, ChevronRight } from "lucide-react";
import { searchStocks } from "@/lib/stock-data";

const TICKERS = [
  { symbol: "ADP", price: "$201.25", change: "-1.59%", isUp: false },
  { symbol: "ADANIPORTS.NS", price: "₹1,337.8", change: "-2.78%", isUp: false },
  { symbol: "AEP", price: "$130.1", change: "+1.14%", isUp: true },
  { symbol: "ADANIPOWER.NS", price: "₹153.92", change: "+0.18%", isUp: true },
  { symbol: "AFL", price: "$106.41", change: "-1.44%", isUp: false },
  { symbol: "ALKEM.NS", price: "₹5,344.5", change: "-0.95%", isUp: false },
  { symbol: "AAPL", price: "$173.50", change: "+1.2%", isUp: true },
  { symbol: "RELIANCE.NS", price: "₹2,950.0", change: "+0.8%", isUp: true },
];

export default function DashboardHeaderUI() {
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
  
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Close dropdown on outside click
  const dropdownRef = useState<any>(null);

  const handleSearchChange = async (val: string) => {
    setQuery(val);
    if (errorMsg) setErrorMsg("");
    
    if (val.trim().length > 0) {
      setIsSearching(true);
      try {
        const results = await searchStocks(val);
        setSearchResults(results.slice(0, 6)); // Show top 6 results
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const selectStock = (stock: any) => {
    router.push(`/stock/${stock.ticker}?from=${stock.sector}`);
    setShowDropdown(false);
    setQuery("");
  };

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const q = query.trim();
      if (!q) return;

      setIsSearching(true);
      setErrorMsg("");

      try {
        const results = await searchStocks(q);
        const match = results.find(r => r.ticker.toLowerCase() === q.toLowerCase()) || results[0];

        if (match) {
          selectStock(match);
        } else {
          setErrorMsg(`Stock '${q}' is not available.`);
          setShowDropdown(false);
        }
      } catch (err) {
        setErrorMsg("Search failed.");
      } finally {
        setIsSearching(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Main Card */}
      <div className="flex flex-col xl:flex-row items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] gap-4">
        {/* Title area */}
        <div className="shrink-0 text-center xl:text-left min-w-[200px]">
          <h1 className="text-2xl font-headline font-extrabold text-slate-900">Dashboard</h1>
          <p className="text-sm font-medium text-slate-500">Tracking Market Trends</p>
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">SRCH</span>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-16 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4F8DF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/20 transition-all font-medium"
            placeholder="Search symbols (e.g. TCS, AAPL)..."
            onFocus={() => query.trim().length > 0 && setShowDropdown(true)}
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <Loader2 className="h-4 w-4 animate-spin text-[#4F8DF7]" />
            </div>
          )}

          {/* Search Suggestions Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-3 max-h-[400px] overflow-auto rounded-3xl border border-slate-200/60 bg-white/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
              {searchResults.length > 0 ? (
                <>
                  <div className="px-4 py-2 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Matched Stocks</p>
                  </div>
                  <div className="space-y-1">
                    {searchResults.map((stock) => (
                      <button
                        key={stock.ticker}
                        type="button"
                        onMouseDown={() => selectStock(stock)}
                        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all hover:bg-[#4F8DF7]/5 group"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#4F8DF7] transition-colors">{stock.ticker}</span>
                          <span className="text-[11px] font-medium text-slate-500 line-clamp-1 group-hover:text-slate-600">{stock.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {stock.sector && (
                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider group-hover:bg-[#4F8DF7]/10 group-hover:text-[#4F8DF7]">
                              {stock.sector}
                            </span>
                          )}
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-[#4F8DF7] group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : !isSearching && query.length > 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-medium text-slate-400">No stocks found for "{query}"</p>
                </div>
              ) : isSearching ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#4F8DF7]" />
                  <p className="text-xs font-medium text-slate-400">Searching markets...</p>
                </div>
              ) : null}
            </div>
          )}

          {errorMsg && (
            <div className="absolute top-full left-0 mt-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-1.5 shadow-sm z-10 w-full animate-in fade-in slide-in-from-top-1">
              {errorMsg}
            </div>
          )}
          
          {/* Backdrop for closing dropdown */}
          {showDropdown && (
             <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowDropdown(false)} />
          )}
        </div>

        {/* Mini stats */}
        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <div className="flex flex-col justify-center rounded-2xl bg-slate-50 border border-slate-100 px-4 py-2 min-w-[100px]">
            <span className="text-[10px] font-semibold text-slate-400">TCS.NS</span>
            <span className="text-sm font-bold text-emerald-500">+0.41%</span>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-slate-50 border border-slate-100 px-4 py-2 min-w-[100px]">
            <span className="text-[10px] font-semibold text-slate-400">S&P 500</span>
            <span className="text-sm font-bold text-emerald-500">+0.84%</span>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-slate-50 border border-slate-100 px-4 py-2 min-w-[100px]">
            <span className="text-[10px] font-semibold text-slate-400">NIFTY 50</span>
            <span className="text-sm font-bold text-rose-500">-0.12%</span>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-slate-900 px-5 py-2 min-w-[140px] shadow-sm">
            <span className="text-[10px] font-medium text-slate-400">Portfolio Value</span>
            <span className="text-sm font-bold text-white">$305,894.4</span>
          </div>
        </div>
      </div>

      {/* Marquee Ticker Row */}
      <div className="relative flex overflow-hidden rounded-2xl border border-slate-200 bg-white py-3 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        <div className="animate-marquee flex whitespace-nowrap px-4">
          {/* Double the list for seamless loop effect */}
          {[...TICKERS, ...TICKERS].map((tick, i) => (
            <div key={i} className="flex items-center gap-2 mx-6">
              <span className="text-xs font-bold text-slate-900">{tick.symbol}</span>
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
          className={`flex-1 rounded-xl py-3 text-xs font-bold tracking-widest uppercase transition-all ${
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
          className={`flex-1 rounded-xl py-3 text-xs font-bold tracking-widest uppercase transition-all ${
            activeTab === "INDIAN"
              ? "bg-[#4F8DF7] text-white shadow-md shadow-blue-500/20"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          Indian Stocks
        </button>
      </div>

      <style jsx>{`
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
