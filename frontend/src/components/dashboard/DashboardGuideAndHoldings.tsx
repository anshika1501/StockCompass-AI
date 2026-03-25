"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPortfolios, getToken, type Portfolio, type Holding } from "@/lib/portfolio-data";
import {
  BriefcaseBusiness,
  Bot,
  LayoutDashboard,
  LineChart,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  Wallet,
} from "lucide-react";

type LoadState = "idle" | "loading" | "ready" | "error";

export default function DashboardGuideAndHoldings() {
  const [state, setState] = useState<LoadState>("idle");
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);

    if (!token) {
      setState("ready");
      setPortfolios([]);
      return;
    }

    let alive = true;
    setState("loading");
    setError(null);

    (async () => {
      try {
        const data = await getPortfolios();
        if (!alive) return;
        setPortfolios(data);
        setState("ready");
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load portfolios");
        setState("error");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const { totalHoldings, totalInvestment, activeBookName, recentHoldings } = useMemo(() => {
    const totalInvestment = portfolios.reduce((sum, p) => {
      return sum + (p.holdings ?? []).reduce((s2, h) => s2 + h.quantity * Number(h.buy_price), 0);
    }, 0);

    const totalHoldings = portfolios.reduce((sum, p) => sum + (p.holdings ?? []).length, 0);

    const activeBookName = portfolios[0]?.name ?? "—";

    const recentHoldings: (Holding & { portfolioName?: string })[] = [];
    for (const p of portfolios) {
      for (const h of p.holdings ?? []) {
        recentHoldings.push({ ...h, portfolioName: p.name });
      }
    }

    recentHoldings.sort((a, b) => {
      const ad = new Date(a.buy_time).getTime();
      const bd = new Date(b.buy_time).getTime();
      return bd - ad;
    });

    return {
      totalHoldings,
      totalInvestment,
      activeBookName,
      recentHoldings: recentHoldings.slice(0, 6),
    };
  }, [portfolios]);

  return (
    <div className="space-y-6 lg:sticky lg:top-[88px]">
      {/* Guide */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-headline font-extrabold text-slate-900">
              <LayoutDashboard className="h-5 w-5 text-[#4F8DF7]" />
              Dashboard Guide
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              A quick view of what’s happening in StockCompass and where to click next.
            </p>
          </div>
        </div>

        <ol className="mt-5 space-y-3">
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#4F8DF7] ring-1 ring-blue-100">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Explore sectors</p>
              <p className="text-sm font-medium text-slate-600">
                Browse sector cards to understand themes, then open a sector to view its stock list and analytics.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#4F8DF7] ring-1 ring-blue-100">
              <PlusCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Build your portfolio</p>
              <p className="text-sm font-medium text-slate-600">
                Create a portfolio in <Link className="font-semibold text-[#4F8DF7] hover:underline" href="/my-portfolio">My Portfolio</Link>, then add holdings from stock pages.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Use AI tools</p>
              <p className="text-sm font-medium text-slate-600">
                PCA, Sentiment, Predictions, and Chatbot are available in the sidebar under AI Tools.
              </p>
            </div>
          </li>
        </ol>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/my-portfolio"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4F8DF7] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            <Wallet className="h-4 w-4" />
            My Portfolio
          </Link>
          <Link
            href="/chatbot"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#4F8DF7] ring-1 ring-slate-200 shadow-sm transition hover:ring-[#4F8DF7]/30"
          >
            <Bot className="h-4 w-4" />
            Product Chat
          </Link>
        </div>
      </div>

      {/* Holdings */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="flex items-center gap-2 text-lg font-headline font-extrabold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-[#4F8DF7]" />
          Your Holdings
        </h3>

        {(state === "idle" || state === "loading" || isLoggedIn === null) && (
          <p className="mt-3 text-sm font-medium text-slate-600">Loading your portfolios…</p>
        )}

        {state === "ready" && isLoggedIn === false && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-600">Sign in to see holdings and cost basis.</p>
            <Link
              href="/login"
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#4F8DF7] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
            >
              Sign in
            </Link>
          </div>
        )}

        {state === "ready" && isLoggedIn === true && portfolios.length === 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-600">No portfolios yet. Create one to start tracking holdings.</p>
            <Link
              href="/my-portfolio"
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#4F8DF7] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
            >
              Create portfolio
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error ?? "Could not load holdings."}
          </div>
        )}

        {state === "ready" && isLoggedIn === true && portfolios.length > 0 && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">POSITIONS</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{totalHoldings}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">COST BASIS (INR)</p>
                <p className="mt-1 text-2xl font-extrabold text-[#4F8DF7]">
                  ₹{totalInvestment.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Recent positions</p>
                <Link href="/my-portfolio" className="text-sm font-semibold text-[#4F8DF7] hover:underline">
                  Manage
                </Link>
              </div>

              {recentHoldings.length === 0 ? (
                <p className="mt-3 text-sm font-medium text-slate-600">No holdings found yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {recentHoldings.map((h) => (
                    <div key={h.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/60">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#4F8DF7]">{h.ticker}</p>
                        <p className="truncate text-xs font-medium text-slate-600">{h.company_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-slate-900 tabular-nums">{h.quantity}</p>
                        <p className="text-xs font-medium text-slate-500 tabular-nums">₹{Number(h.buy_price).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <Link
                  href="/my-portfolio"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#4F8DF7] ring-1 ring-[#4F8DF7]/30 shadow-sm transition hover:bg-blue-50"
                >
                  <LineChart className="h-4 w-4" />
                  View all holdings
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

