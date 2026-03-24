
import Link from "next/link";
import Image from "next/image";
import { Landmark, Cpu, Car, Zap, Stethoscope, ChevronRight, ShoppingCart, DollarSign, Factory, Phone, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Sector } from "@/lib/stock-data";

const iconMap: Record<string, any> = {
  landmark: Landmark,
  cpu: Cpu,
  car: Car,
  zap: Zap,
  stethoscope: Stethoscope,
  'shopping-cart': ShoppingCart,
  'dollar-sign': DollarSign,
  factory: Factory,
  phone: Phone,
  'trending-up': TrendingUp,
};

export default function SectorCard({ sector }: { sector: Sector }) {
  const Icon = iconMap[sector.icon] || Landmark;
  const imageSrc = sector.image && sector.image.trim().length > 0 ? sector.image : "/sector-placeholder.svg";

  return (
    <Link href={`/portfolio/${sector.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white rounded-2xl">
        <div className="relative h-44 w-full overflow-hidden">
          <Image
            src={imageSrc}
            alt={sector.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100"
            data-ai-hint={sector.name.split(' ')[0].toLowerCase()}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/80 via-[#000000]/20 to-transparent" />
          <div className="absolute bottom-5 left-5 flex items-center gap-3 text-white">
            <div className="bg-white/20 backdrop-blur-lg p-2.5 rounded-xl border border-white/20 shadow-lg">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">{sector.name}</h3>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd] bg-white/10 px-2 py-0.5 rounded-md border border-white/15 backdrop-blur-sm">Research & coverage</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <p className="text-sm font-normal text-slate-700 line-clamp-2 mb-6 h-10 leading-relaxed">
            {sector.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-[#4F8DF7] text-[13px] font-semibold group-hover:gap-2 transition-all tracking-wide">
              View sector <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden />
            </div>
            <div className="h-2 w-2 rounded-full bg-gray-200 group-hover:bg-[#4F8DF7] transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
