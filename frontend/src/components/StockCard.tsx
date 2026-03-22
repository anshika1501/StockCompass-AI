
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/stock-data";

export default function StockCard({ stock, sectorSlug }: { stock: Stock; sectorSlug?: string }) {
  const isPositive = stock.change >= 0;

  return (
    <Link href={`/stock/${stock.ticker}${sectorSlug ? `?from=${sectorSlug}` : ''}`}>
      <Card className="hover:shadow-md transition-shadow duration-200 border-none bg-white group">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                {stock.ticker}
              </h3>
              <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                {stock.name}
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full",
              isPositive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
            )}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(stock.changePercent)}%
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Price</p>
              <p className="text-2xl font-bold font-mono tracking-tighter">₹{stock.currentPrice.toLocaleString()}</p>
            </div>
            <div className="bg-primary/5 p-2 rounded-full text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
