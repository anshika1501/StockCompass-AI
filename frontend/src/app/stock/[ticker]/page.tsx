
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
  const backLabel = fromSector ? 'Back to Portfolio' : 'Back to Portfolios';

  return (
    <div className="min-h-screen pb-20">
      <Navigation />

      <main className="container mx-auto px-4 mt-8">
        <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group">
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          {backLabel}
        </Link>

        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border-none">
                <span className="text-3xl font-black text-primary font-mono tracking-tighter">{stock.ticker}</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold font-headline mb-1">{stock.name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="bg-white border-none">{stock.sector}</Badge>
                  <Badge variant="secondary" className="bg-white border-none">{stock.industry}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border-none">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Current Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">₹{stock.currentPrice.toLocaleString()}</span>
                  <span className={cn(
                    "text-sm font-bold flex items-center",
                    isPositive ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(stock.changePercent)}%
                  </span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-none">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Market Cap</p>
                <span className="text-2xl font-bold">₹{(stock.marketCap / 1e7).toFixed(1)} Cr</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-none">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">P/E Ratio</p>
                <span className="text-2xl font-bold">{stock.peRatio ? stock.peRatio.toFixed(1) : 'N/A'}</span>
              </div>
            </div>

            {/* Live Analytics: Discount Level, Opportunity Score, Moving Average Chart */}
            <StockAnalyticsPanel ticker={stock.ticker} />

            <StockChartWithRanges
              ticker={stock.ticker}
              initialHistory={stock.history}
              color={isPositive ? "#2985CC" : "#ef4444"}
            />

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-white w-full justify-start h-12 p-1 border-none shadow-sm rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
                <TabsTrigger value="financials" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Financials</TabsTrigger>
                <TabsTrigger value="news" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Related News</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-6">
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-lg mb-4">About {stock.name}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {stock.description}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">52-Week High</p>
                        <p className="font-bold text-emerald-600">₹{stock.fiftyTwoWeekHigh}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">52-Week Low</p>
                        <p className="font-bold text-rose-600">₹{stock.fiftyTwoWeekLow}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sector</p>
                        <p className="font-bold">{stock.sector}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Industry</p>
                        <p className="font-bold">{stock.industry}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <AiInsights stock={stock} />

            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-md flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Company Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary p-2 rounded-lg">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Website</p>
                    {stock.website ? (
                      <a href={stock.website} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary transition-colors">{stock.website.replace(/^https?:\/\//, '')}</a>
                    ) : (
                      <p className="font-medium">N/A</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-secondary p-2 rounded-lg">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Headquarters</p>
                    <p className="font-medium">
                      {stock.city && stock.country ? `${stock.city}, ${stock.country}` : stock.country || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-secondary p-2 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Employees</p>
                    <p className="font-medium">{stock.employees ? stock.employees.toLocaleString() : 'N/A'}</p>
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
