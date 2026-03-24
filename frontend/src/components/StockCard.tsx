
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/stock-data";

export default function StockCard({ stock, sectorSlug }: { stock: Stock; sectorSlug?: string }) {
  const isPositive = stock.change >= 0;

  return (
    <Link href={`/stock/${stock.ticker}${sectorSlug ? `?from=${sectorSlug}` : ''}`}>
      <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white group rounded-xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-extrabold text-[#000000] text-xl leading-tight group-hover:text-[#4F8DF7] transition-colors tracking-tight">
                {stock.ticker}
              </h3>
              <p className="text-sm text-[#1F2937] font-medium truncate max-w-[160px]">
                {stock.name}
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 text-[13px] font-bold px-3 py-1 rounded-full shadow-sm",
              isPositive ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-rose-700 bg-rose-50 border border-rose-100"
            )}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(stock.changePercent)}%
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-[#1F2937] uppercase tracking-[0.05em] font-bold opacity-60">Last Price</p>
              <p className="text-2xl font-black text-[#000000] tracking-tighter">₹{stock.currentPrice.toLocaleString()}</p>
            </div>
            <div className="bg-[#4F8DF7] p-2 rounded-lg text-white shadow-sm transform translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
