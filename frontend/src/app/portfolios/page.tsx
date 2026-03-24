import Navigation from "@/components/Navigation";
import SectorCard from "@/components/SectorCard";
import { getSectors } from "@/lib/stock-data";
import { TrendingUp, BarChart3, ShieldCheck, PieChart, ChevronLeft } from "lucide-react";
import Link from "next/link";
import UserBanner from "@/components/UserBanner";

export const dynamic = 'force-dynamic';

export default async function Portfolios() {
    const sectors = await getSectors();

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            <main className="container mx-auto px-6 lg:px-12 mt-12 pb-24">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-black text-[#1F2937] hover:text-[#4F8DF7] mb-8 transition-all group uppercase tracking-widest"
                >
                    <ChevronLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Terminal
                </Link>

                <UserBanner />

                <section className="mb-20 max-w-3xl">
                    <h1 className="text-5xl font-black font-headline text-[#000000] mb-6 leading-[1.1] tracking-tighter">
                        Market <span className="text-[#4F8DF7]">Sectors</span>
                    </h1>
                    <p className="text-xl text-[#1F2937] font-medium opacity-80 mb-12 leading-relaxed">
                        Navigate global markets with curated portfolios, high-precision metrics, and expert AI-driven technical analysis.
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Sectors", icon: ShieldCheck, value: `${sectors.length}` },
                            { label: "Active Assets", icon: TrendingUp, value: `${sectors.reduce((sum, s) => sum + (s.stockCount || 0), 0)}+` },
                            { label: "Platform Uptime", icon: BarChart3, value: "99.9%" },
                            { label: "System Core", icon: PieChart, value: "AI" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,141,247,0.1)] transition-all group">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 transition-colors group-hover:bg-[#4F8DF7]">
                                    <stat.icon className="h-5 w-5 text-[#4F8DF7] group-hover:text-white" />
                                </div>
                                <p className="text-2xl font-black text-[#000000] tracking-tighter mb-1">{stat.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-3xl font-black font-headline text-[#000000] tracking-tight">Explore Opportunities</h2>
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
