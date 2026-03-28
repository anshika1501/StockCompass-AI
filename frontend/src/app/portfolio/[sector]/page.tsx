
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import PortfolioAnalysis from "@/components/PortfolioAnalysis";
import QualityStocks from "@/components/QualityStocks";
import { getStocksBySector } from "@/lib/stock-data";
import { ChevronLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Nifty50PCAClient from "@/app/nifty50-pca/Nifty50PCAClient";
import StockTicker from "@/components/dashboard/StockTicker";

export const dynamic = 'force-dynamic';

export default async function SectorPage({ params }: { params: { sector: string } }) {
  const { sector: sectorId } = await params;

  let sectorData;
  try {
    sectorData = await getStocksBySector(sectorId);
  } catch {
    notFound();
  }

  if (!sectorData) {
    notFound();
  }

  const { sector } = sectorData;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <StockTicker />

      <main className="container mx-auto px-6 lg:px-12 mt-12 pb-24">
        <Link href="/portfolios" className="inline-flex items-center text-sm font-semibold text-[#1F2937] hover:text-[#4F8DF7] mb-10 transition-all group uppercase tracking-[0.12em]">
          <ChevronLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Market Sectors
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-10">
          <div className="max-w-2xl">
            <div className="flex flex-col gap-3 mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4F8DF7] bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg w-fit shadow-sm">Industry Analysis</span>
              <h1 className="text-5xl font-headline font-extrabold text-[#000000] tracking-tight leading-none">{sector.name}</h1>
            </div>
            <p className="text-xl text-[#1F2937] font-normal opacity-85 leading-relaxed">{sector.description}</p>
          </div>
        </div>

        {/* Sectors Analytics Tabs Section */}
        <div className="mt-8">
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="mb-8 w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-8">
              <TabsTrigger 
                value="table" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none pb-3 border-b-2 border-transparent text-muted-foreground font-medium text-sm transition-all flex items-center gap-2"
              >
                <div className="h-4 w-4 flex items-center justify-center border rounded-[3px]">
                  <div className="h-2 w-2 border-t border-l" />
                </div>
                Stocks Table
              </TabsTrigger>
              <TabsTrigger 
                value="quality" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none pb-3 border-b-2 border-transparent text-muted-foreground font-medium text-sm transition-all flex items-center gap-2"
              >
                <Trophy size={15} className="text-[#4F8DF7]" />
                Quality Stocks
              </TabsTrigger>
              <TabsTrigger 
                value="pca" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none pb-3 border-b-2 border-transparent text-muted-foreground font-medium text-sm transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                PCA &amp; K-Means Clustering
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="table" className="mt-0 outline-none">
               <PortfolioAnalysis sectorSlug={sectorId} />
            </TabsContent>

            <TabsContent value="quality" className="mt-0 outline-none">
              <QualityStocks sectorSlug={sectorId} />
            </TabsContent>
            
            <TabsContent value="pca" className="mt-0 outline-none">
              <Nifty50PCAClient sectorSlug={sectorId} sectorName={sector.name} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
