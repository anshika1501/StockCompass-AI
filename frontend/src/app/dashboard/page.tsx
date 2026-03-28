import { getSectors } from "@/lib/stock-data";
import DashboardGuideAndHoldings from "@/components/dashboard/DashboardGuideAndHoldings";
import DashboardHeaderUI from "@/components/dashboard/DashboardHeaderUI";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sectors = await getSectors();
  const listedSecurities = sectors.reduce((sum, s) => sum + (s.stockCount || 0), 0);

  return (
    <div className="space-y-6">
      <DashboardHeaderUI />

      <DashboardGuideAndHoldings />
    </div>
  );
}

