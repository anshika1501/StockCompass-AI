
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import StockCard from "@/components/StockCard";
import PortfolioAnalysis from "@/components/PortfolioAnalysis";
import { getStocksBySector } from "@/lib/stock-data";
import { ChevronLeft, Filter, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

  const { sector, stocks } = sectorData;

  return (
    <div className="min-h-screen pb-20">
      <Navigation />

      <main className="container mx-auto px-4 mt-8">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group">
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Portfolios
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Portfolio</span>
              <h1 className="text-4xl font-bold font-headline">{sector.name}</h1>
            </div>
            <p className="text-muted-foreground">{sector.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-white">
              <Filter className="h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-white">
              <LayoutGrid className="h-4 w-4" /> View
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stocks.map((stock) => (
            <StockCard key={stock.ticker} stock={stock} sectorSlug={sectorId} />
          ))}
        </div>

        {stocks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl">
            <p className="text-muted-foreground">No stocks found in this portfolio.</p>
          </div>
        )}

        {/* Portfolio Analysis Section */}
        <PortfolioAnalysis sectorSlug={sectorId} />
      </main>
    </div>
  );
}
