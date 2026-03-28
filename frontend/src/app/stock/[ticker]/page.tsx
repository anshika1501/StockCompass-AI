
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import StockChartWithRanges from "@/components/StockChartWithRanges";
import StockAnalyticsPanel from "./StockAnalyticsPanel";
import AiInsights from "@/components/AiInsights";
import { getStockByTicker } from "@/lib/stock-data";
import { ChevronLeft, Info, TrendingUp, TrendingDown, Globe, MapPin, Users, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatInr, formatMoney, getUsdToInrRate, isUsd, toInrFromUsd } from "@/lib/currency";

export const dynamic = 'force-dynamic';

export default async function StockPage({ params, searchParams }: { params: { ticker: string }; searchParams: { from?: string } }) {
  const { ticker } = await params;
  const { from: fromSector } = await searchParams || {};
  const stock = await getStockByTicker(ticker);

  if (!stock) {
    notFound();
  }

  const isPositive = stock.change >= 0;
  const usdToInrRate = await getUsdToInrRate();
  const isUsdStock = isUsd(stock.currency, stock.country);
  const formatInrIfUsd = (value: number) =>
    isUsdStock ? formatInr(toInrFromUsd(value, usdToInrRate)) : null;
  const backHref = fromSector ? `/portfolio/${fromSector}` : '/';
  const backLabel = fromSector ? 'Back to Sector' : 'Back to Sectors';

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-5 pb-20">
        <Link href={backHref} className="inline-flex items-center text-[10px] font-bold text-slate-500 hover:text-[#4F8DF7] mb-6 transition-all group uppercase tracking-widest bg-white pr-3 pl-2 py-1.5 rounded-full shadow-sm border border-slate-200 w-max">
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          {backLabel}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex gap-4 items-center">
                <div className="bg-white h-16 w-16 sm:h-20 sm:w-20 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                  <span className="text-xl sm:text-2xl font-bold text-[#4F8DF7] tracking-tighter">
                    {stock.ticker.substring(0, 3)}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-headline font-extrabold text-slate-900 tracking-tight leading-tight">
                    {stock.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-slate-500">
                    <span className="font-bold text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">{stock.ticker}</span>
                    <span className="text-xs px-1 text-slate-300">•</span>
                    <span className="font-medium text-xs">{stock.sector}</span>
                    <span className="text-xs px-1 text-slate-300">•</span>
                    <span className="font-medium text-xs">{stock.industry}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row (Dark Theme as requested) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-md">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 leading-none">Price</p>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-amber-500 tracking-tight">
                    {formatMoney(stock.currentPrice, stock.currency, stock.country, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                  {isUsdStock && (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      ≈ {formatInrIfUsd(stock.currentPrice)}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-md">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 leading-none">Change</p>
                <span className={cn("text-lg font-bold tracking-tight", isPositive ? "text-[#0ea5e9]" : "text-rose-500")}>
                  {isPositive ? '+' : ''}{stock.change.toFixed(1)}
                </span>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-md">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 leading-none">Percent</p>
                <span className={cn("text-lg font-bold tracking-tight", isPositive ? "text-[#0ea5e9]" : "text-rose-500")}>
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-md">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 leading-none">Volume</p>
                <span className="text-lg font-bold text-[#0ea5e9] tracking-tight truncate block">
                  {(() => {
                    const proxyVolume = stock.marketCap && stock.currentPrice ? ((stock.marketCap * 1e7 * 0.002) / stock.currentPrice) : 3700000;
                    return proxyVolume > 1e6 ? (proxyVolume / 1e6).toFixed(1) + 'M' : (proxyVolume / 1e3).toFixed(1) + 'K';
                  })()}
                </span>
              </div>
            </div>

            {/* Chart Area */}
            <StockChartWithRanges
              ticker={stock.ticker}
              initialHistory={stock.history}
              color="#0ea5e9"
            />

            {/* Analytics Panel */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
              <StockAnalyticsPanel ticker={stock.ticker} />
            </div>

            {/* Tabs & Overview */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-white border border-slate-200 w-full justify-start h-14 p-1 rounded-2xl mb-6 shadow-sm">
                <TabsTrigger value="overview" className="rounded-xl px-8 h-full data-[state=active]:bg-[#4F8DF7] data-[state=active]:text-white font-bold text-xs uppercase tracking-widest text-slate-500 transition-all">Overview</TabsTrigger>
                <TabsTrigger value="financials" className="rounded-xl px-8 h-full data-[state=active]:bg-[#4F8DF7] data-[state=active]:text-white font-bold text-xs uppercase tracking-widest text-slate-500 transition-all">Financials</TabsTrigger>
                <TabsTrigger value="news" className="rounded-xl px-8 h-full data-[state=active]:bg-[#4F8DF7] data-[state=active]:text-white font-bold text-xs uppercase tracking-widest text-slate-500 transition-all">News</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card className="border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden px-2 sm:px-6">
                  <CardContent className="pt-8 pb-10">
                    <h3 className="font-headline font-extrabold text-xl text-slate-900 tracking-tight mb-4 text-[#4F8DF7]">About the Enterprise</h3>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed mb-10">
                      {stock.description || "No company description available at this time."}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">52W High</p>
                        <p className="font-extrabold text-lg text-emerald-600 tracking-tight">
                          {formatMoney(stock.fiftyTwoWeekHigh, stock.currency, stock.country)}
                        </p>
                        {isUsdStock && (
                          <p className="text-[10px] text-slate-400 font-semibold">
                            ≈ {formatInrIfUsd(stock.fiftyTwoWeekHigh)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">52W Low</p>
                        <p className="font-extrabold text-lg text-rose-600 tracking-tight">
                          {formatMoney(stock.fiftyTwoWeekLow, stock.currency, stock.country)}
                        </p>
                        {isUsdStock && (
                          <p className="text-[10px] text-slate-400 font-semibold">
                            ≈ {formatInrIfUsd(stock.fiftyTwoWeekLow)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Domain</p>
                        <p className="font-bold text-sm text-slate-900 truncate">{stock.sector}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sub-Domain</p>
                        <p className="font-bold text-sm text-slate-900 truncate">{stock.industry}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar (Right Column) */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 h-max">
            {/* Price & Action Card */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200">
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 leading-none">Market Price</p>
              <div className="flex items-end gap-3 mb-4">
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tighter">
                    {formatMoney(stock.currentPrice, stock.currency, stock.country, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                  {isUsdStock && (
                    <span className="text-[11px] font-semibold text-slate-400">
                      ≈ {formatInrIfUsd(stock.currentPrice)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <span className={cn(
                  "text-[10px] font-bold flex items-center px-2 py-0.5 rounded-md",
                  isPositive ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-rose-700 bg-rose-50 border border-rose-100"
                )}>
                  {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {stock.changePercent.toFixed(1)}%
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Today</span>
              </div>

              <Link
                href={`/my-portfolio?addTicker=${encodeURIComponent(stock.ticker)}`}
                className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4F8DF7] px-5 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-600 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Add to portfolio
              </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">Valuation</p>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  {isUsdStock
                    ? formatMoney(stock.marketCap, stock.currency, stock.country)
                    : `₹${(stock.marketCap / 1e7).toFixed(1)} `}
                  {!isUsdStock && <span className="text-xs text-slate-500 font-medium">Cr</span>}
                </span>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">P/E Ratio</p>
                <span className="text-xl font-bold text-slate-900 tracking-tight">{stock.peRatio ? stock.peRatio.toFixed(1) : 'NAV'}</span>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-violet-50 to-white border border-violet-100 shadow-sm">
              <AiInsights stock={stock} />
            </div>

            {/* System Snapshot */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-5">
                <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2.5 text-slate-700">
                  <div className="bg-slate-200/60 p-1.5 rounded-md">
                    <Info className="h-4 w-4 text-slate-600" />
                  </div>
                  System Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 px-6 pb-6 space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <Globe className="h-4 w-4 text-slate-400 group-hover:text-[#4F8DF7]" />
                  </div>
                  <div className="text-sm min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Website</p>
                    {stock.website ? (
                      <a href={stock.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-900 hover:text-[#4F8DF7] transition-colors truncate block">{stock.website.replace(/^https?:\/\//, '')}</a>
                    ) : (
                      <p className="font-bold text-sm text-slate-900">N/A</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <MapPin className="h-4 w-4 text-slate-400 group-hover:text-[#4F8DF7]" />
                  </div>
                  <div className="text-sm min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Headquarters</p>
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {stock.city && stock.country ? `${stock.city}, ${stock.country}` : stock.country || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <Users className="h-4 w-4 text-slate-400 group-hover:text-[#4F8DF7]" />
                  </div>
                  <div className="text-sm min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Employees</p>
                    <p className="font-bold text-sm text-slate-900">{stock.employees ? stock.employees.toLocaleString() : 'Data Unavailable'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
