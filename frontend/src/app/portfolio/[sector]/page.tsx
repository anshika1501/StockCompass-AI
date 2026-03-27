
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import PortfolioAnalysis from "@/components/PortfolioAnalysis";
import { getStocksBySector } from "@/lib/stock-data";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

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

        {/* Sectors Analytics Table Section */}
        <div className="mt-8">
           <PortfolioAnalysis sectorSlug={sectorId} />
        </div>
      </main>
    </div>
  );
}
