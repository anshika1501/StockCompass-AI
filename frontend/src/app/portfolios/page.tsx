import Navigation from "@/components/Navigation";
import SectorCard from "@/components/SectorCard";
import { getSectors } from "@/lib/stock-data";
import { TrendingUp, BarChart3, ShieldCheck, PieChart, ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function Portfolios() {
    const sectors = await getSectors();

    return (
        <div className="min-h-screen pb-20">
            <Navigation />

            <main className="container mx-auto px-4 mt-8">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group"
                >
                    <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>
                <section className="mb-12 max-w-2xl">
                    <h1 className="text-4xl font-bold font-headline text-primary mb-4 leading-tight">
                        Industry Portfolios
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Access curated portfolios, real-time metrics, and AI-powered insights for the world's leading companies.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Portfolios", icon: ShieldCheck, value: `${sectors.length}` },
                            { label: "Active Stocks", icon: TrendingUp, value: `${sectors.reduce((sum, s) => sum + (s.stockCount || 0), 0)}+` },
                            { label: "Data Accuracy", icon: BarChart3, value: "99.9%" },
                            { label: "Analysis", icon: PieChart, value: "AI" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border-none shadow-sm text-center">
                                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                                <p className="text-xl font-bold">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold font-headline">Explore Sectors</h2>
                        <div className="h-px flex-1 mx-6 bg-border hidden md:block" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sectors.map((sector) => (
                            <SectorCard key={sector.id} sector={sector} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
