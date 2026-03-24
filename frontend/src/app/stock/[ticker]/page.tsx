
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import StockChartWithRanges from "@/components/StockChartWithRanges";
import StockAnalyticsPanel from "./StockAnalyticsPanel";
import AiInsights from "@/components/AiInsights";
import { getStockByTicker } from "@/lib/stock-data";
import { ChevronLeft, Info, TrendingUp, TrendingDown, Globe, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function StockPage({ params, searchParams }: { params: { ticker: string }; searchParams: { from?: string } }) {
  const { ticker } = await params;
  const { from: fromSector } = await searchParams || {};
  const stock = await getStockByTicker(ticker);

  if (!stock) {
    notFound();
  }

  const isPositive = stock.change >= 0;
  const backHref = fromSector ? `/portfolio/${fromSector}` : '/';
  const backLabel = fromSector ? 'Back to Sector' : 'Back to Sectors';

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="container mx-auto px-6 lg:px-12 mt-12 pb-24">
        <Link href={backHref} className="inline-flex items-center text-sm font-black text-[#1F2937] hover:text-[#4F8DF7] mb-12 transition-all group uppercase tracking-widest">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          {backLabel}
        </Link>

        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center min-w-[120px]">
                <span className="text-4xl font-black text-[#4F8DF7] tracking-tighter">{stock.ticker}</span>
              </div>
              <div>
                <h1 className="text-5xl font-black font-headline text-[#000000] tracking-tighter mb-2 leading-none">{stock.name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="bg-blue-50 text-[#4F8DF7] border border-blue-100 font-bold px-3 py-1 rounded-lg uppercase tracking-tighter">{stock.sector}</Badge>
                  <Badge variant="secondary" className="bg-gray-50 text-gray-500 border border-gray-100 font-bold px-3 py-1 rounded-lg uppercase tracking-tighter">{stock.industry}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-2">Market Price</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-[#000000] tracking-tighter">₹{stock.currentPrice.toLocaleString()}</span>
                  <span className={cn(
                    "text-[13px] font-black flex items-center px-1.5 py-0.5 rounded",
                    isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                  )}>
                    {isPositive ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
                    {Math.abs(stock.changePercent)}%
                  </span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-2">Valuation</p>
                <span className="text-3xl font-black text-[#000000] tracking-tighter">₹{(stock.marketCap / 1e7).toFixed(1)} Cr</span>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-2">Price/Earnings</p>
                <span className="text-3xl font-black text-[#000000] tracking-tighter">{stock.peRatio ? stock.peRatio.toFixed(1) : 'NAV'}</span>
              </div>
            </div>

            {/* Live Analytics */}
            <div className="mb-12">
               <StockAnalyticsPanel ticker={stock.ticker} />
            </div>

            <StockChartWithRanges
              ticker={stock.ticker}
              initialHistory={stock.history}
              color="#4F8DF7"
            />

            <Tabs defaultValue="overview" className="w-full mt-12">
              <TabsList className="bg-gray-50 w-full justify-start h-14 p-1.5 border border-gray-100 rounded-2xl mb-8">
                <TabsTrigger value="overview" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:text-[#4F8DF7] data-[state=active]:shadow-sm font-black text-xs uppercase tracking-widest text-gray-400">Overview</TabsTrigger>
                <TabsTrigger value="financials" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:text-[#4F8DF7] data-[state=active]:shadow-sm font-black text-xs uppercase tracking-widest text-gray-400">Financials</TabsTrigger>
                <TabsTrigger value="news" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:text-[#4F8DF7] data-[state=active]:shadow-sm font-black text-xs uppercase tracking-widest text-gray-400">Related News</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <Card className="border border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden px-4">
                  <CardContent className="pt-10 pb-10">
                    <h3 className="font-black text-2xl text-[#000000] tracking-tight mb-6">About the Enterprise</h3>
                    <p className="text-[#1F2937] text-lg font-medium leading-relaxed mb-10 opacity-80">
                      {stock.description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Y-High</p>
                        <p className="font-black text-xl text-emerald-700 tracking-tighter">₹{stock.fiftyTwoWeekHigh}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Y-Low</p>
                        <p className="font-black text-xl text-rose-700 tracking-tighter">₹{stock.fiftyTwoWeekLow}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Domain</p>
                        <p className="font-black text-sm text-[#000000] uppercase tracking-tighter">{stock.sector}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sub-Domain</p>
                        <p className="font-black text-sm text-[#000000] uppercase tracking-tighter">{stock.industry}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-10">
            <AiInsights stock={stock} />

            <Card className="border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-blue-50/50 border-b border-blue-100 py-6">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 text-[#4F8DF7]">
                  <div className="bg-[#4F8DF7] p-2 rounded-lg">
                    <Info className="h-4 w-4 text-white" />
                  </div>
                  System Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 px-8 pb-10 space-y-8">
                <div className="flex items-center gap-5 group">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <Globe className="h-5 w-5 text-gray-400 group-hover:text-[#4F8DF7]" />
                  </div>
                  <div className="text-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Infrastructure</p>
                    {stock.website ? (
                      <a href={stock.website} target="_blank" rel="noopener noreferrer" className="text-sm font-black text-[#000000] hover:text-[#4F8DF7] transition-colors">{stock.website.replace(/^https?:\/\//, '')}</a>
                    ) : (
                      <p className="font-black text-sm">N/A</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-5 group">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <MapPin className="h-5 w-5 text-gray-400 group-hover:text-[#4F8DF7]" />
                  </div>
                  <div className="text-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base of Ops</p>
                    <p className="font-black text-sm text-[#000000]">
                      {stock.city && stock.country ? `${stock.city}, ${stock.country}` : stock.country || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-5 group">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <Users className="h-5 w-5 text-gray-400 group-hover:text-[#4F8DF7]" />
                  </div>
                  <div className="text-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Human Capital</p>
                    <p className="font-black text-sm text-[#000000]">{stock.employees ? stock.employees.toLocaleString() : 'Data Unavailable'}</p>
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
