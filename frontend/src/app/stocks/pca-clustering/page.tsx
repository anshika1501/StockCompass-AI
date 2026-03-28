import Navigation from "@/components/Navigation";
import Nifty50PCAClient from "@/app/nifty50-pca/Nifty50PCAClient";
import { ChevronLeft, Orbit } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SectorAnalysisPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navigation />

      <main className="container mx-auto px-4 mt-8 lg:px-8 max-w-7xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 mb-8 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
              <Orbit className="h-3 w-3" />
              Machine Learning
            </span>
            <h1 className="text-4xl font-extrabold font-headline tracking-tight text-slate-900">
              PCA & K-Means Clustering
            </h1>
          </div>
          <p className="text-slate-500 max-w-3xl">
            Multi-factor quantitative clustering across the Nifty 50. This tool uses Principal Component Analysis (PCA) and K-Means to identify stocks with similar risk-return profiles, value discounts, and momentum characteristics.
          </p>
        </div>

        <Nifty50PCAClient />
      </main>
    </div>
  );
}
