import Navigation from "@/components/Navigation";
import SectorCard from "@/components/SectorCard";
import { getSectors } from "@/lib/stock-data";
import { TrendingUp, BarChart3, ShieldCheck, PieChart, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function Portfolios() {
    const sectors = await getSectors();

    return (
        <div className="min-h-screen bg-slate-50/30">
            <Navigation />

            <main className="container mx-auto px-4 lg:px-8 pt-8 pb-20">
                {/* Compact Hero Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-3">
                           <div className="h-5 w-1 bg-[#4F8DF7] rounded-full" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Market Intelligence</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-headline font-extrabold text-slate-900 mb-3 tracking-tight">
                            Sector <span className="text-[#4F8DF7]">Portfolios</span>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium max-w-xl leading-relaxed">
                            Professional-grade sector analysis and thematic portfolios with real-time fundamentals and AI-assisted insights.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm min-w-[140px]">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Coverage</p>
                            <p className="text-lg font-extrabold text-slate-900 tracking-tight">{sectors.length} Sectors</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm min-w-[140px]">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Securities</p>
                            <p className="text-lg font-extrabold text-slate-900 tracking-tight">48+ Active</p>
                        </div>
                    </div>
                </div>

                {/* Sector Grid */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 min-w-max">
                           Sector Universe
                           <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{sectors.length}</span>
                        </h2>
                        <div className="h-[1px] w-full bg-slate-200" />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        {/* List Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <div className="col-span-1">Icon</div>
                            <div className="col-span-5 sm:col-span-7">Sector Name</div>
                            <div className="col-span-3 sm:col-span-2 text-right">Coverage</div>
                            <div className="col-span-3 sm:col-span-2 text-right">Action</div>
                        </div>

                        {/* List Rows */}
                        <div className="divide-y divide-slate-100">
                            {sectors.map((sector) => {
                                // Simplified icon selection for the list
                                return (
                                    <Link 
                                        key={sector.id} 
                                        href={`/portfolio/${sector.id}`}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group cursor-pointer"
                                    >
                                        <div className="col-span-1">
                                            <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#4F8DF7] group-hover:bg-[#4F8DF7] group-hover:text-white transition-all">
                                                <PieChart size={16} />
                                            </div>
                                        </div>
                                        <div className="col-span-5 sm:col-span-7">
                                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#4F8DF7] transition-colors">{sector.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-medium">Strategic market coverage segment</p>
                                        </div>
                                        <div className="col-span-3 sm:col-span-2 text-right">
                                            <span className="text-xs font-bold text-slate-700">{sector.stockCount || 0} Stocks</span>
                                        </div>
                                        <div className="col-span-3 sm:col-span-2 flex justify-end">
                                            <div className="flex items-center gap-1.5 text-[#4F8DF7] text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                Analyze <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
                
                {/* Horizontal Quick List (Interactive UI) */}
                <section className="mt-16 bg-[#0f172a] rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
                            Quick Sector Navigation
                        </h3>
                        <div className="flex flex-wrap gap-2">
                           {sectors.map((s) => (
                               <Link 
                                 key={s.id} 
                                 href={`/portfolio/${s.id}`}
                                 className="px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-[#4F8DF7] border border-slate-700 hover:border-[#4F8DF7] text-slate-300 hover:text-white text-[11px] font-bold transition-all flex items-center gap-2 shadow-sm"
                               >
                                  {s.name}
                                  <ChevronRight size={12} className="opacity-50" />
                               </Link>
                           ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
