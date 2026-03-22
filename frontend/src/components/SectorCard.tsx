
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
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-none bg-white">
        <div className="relative h-40 w-full">
          <Image
            src={imageSrc}
            alt={sector.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            data-ai-hint={sector.name.split(' ')[0].toLowerCase()}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-full">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">{sector.name}</h3>
          </div>
        </div>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {sector.description}
          </p>
          <div className="flex items-center text-primary text-xs font-semibold group-hover:gap-2 transition-all">
            Explore Portfolio <ChevronRight className="h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
