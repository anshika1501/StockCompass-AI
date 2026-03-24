import Navigation from "@/components/Navigation";
import SectorCard from "@/components/SectorCard";
import { getSectors } from "@/lib/stock-data";
import { TrendingUp, BarChart3, ShieldCheck, PieChart } from "lucide-react";
import UserBanner from "@/components/UserBanner";

export const dynamic = 'force-dynamic';

export default async function Portfolios() {
    const sectors = await getSectors();

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            <main className="container mx-auto px-0 sm:px-2 lg:px-4 pb-24">
                <UserBanner />

                <section className="mb-20 max-w-3xl">
                    <h1 className="text-5xl font-black font-headline text-[#000000] mb-6 leading-[1.1] tracking-tighter">
                        Market <span className="text-[#4F8DF7]">Sectors</span>
                    </h1>
                    <p className="text-xl text-[#374151] font-normal mb-12 max-w-2xl leading-relaxed">
                        Browse sector portfolios and holdings with consistent fundamentals, technical context, and AI-assisted commentary—so you move from theme to thesis without losing rigor.
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Coverage sectors", icon: ShieldCheck, value: `${sectors.length}` },
                            { label: "Listed securities", icon: TrendingUp, value: `${sectors.reduce((sum, s) => sum + (s.stockCount || 0), 0)}+` },
                            { label: "Target availability", icon: BarChart3, value: "99.9%" },
                            { label: "Research layer", icon: PieChart, value: "AI-assisted" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,141,247,0.1)] transition-all group">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 transition-colors group-hover:bg-[#4F8DF7]">
                                    <stat.icon className="h-5 w-5 text-[#4F8DF7] group-hover:text-white" />
                                </div>
                                <p className="text-2xl font-bold tabular-nums text-[#000000] tracking-tight mb-1">{stat.value}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-3xl font-bold font-headline text-[#000000] tracking-tight">Sector universe</h2>
                        <div className="h-[2px] flex-1 mx-8 bg-gray-100 hidden md:block" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {sectors.map((sector) => (
                            <SectorCard key={sector.id} sector={sector} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
