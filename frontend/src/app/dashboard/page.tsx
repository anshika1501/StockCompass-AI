import { getSectors } from "@/lib/stock-data";
import DashboardGuideAndHoldings from "@/components/dashboard/DashboardGuideAndHoldings";
import { BarChart3, PieChart, ShieldCheck, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sectors = await getSectors();
  const listedSecurities = sectors.reduce((sum, s) => sum + (s.stockCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight text-slate-900">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            System guide + a snapshot of your portfolios and recent holdings.
          </p>
        </div>
      </div>

      {/* System stats (no sector list) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Coverage sectors", icon: ShieldCheck, value: `${sectors.length}` },
          { label: "Listed securities", icon: TrendingUp, value: `${listedSecurities}+` },
          { label: "Target availability", icon: BarChart3, value: "99.9%" },
          { label: "Research layer", icon: PieChart, value: "AI-assisted" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <stat.icon className="h-5 w-5 text-[#4F8DF7]" />
            </div>
            <p className="text-2xl font-bold tabular-nums text-slate-900 tracking-tight">{stat.value}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <DashboardGuideAndHoldings />
    </div>
  );
}

