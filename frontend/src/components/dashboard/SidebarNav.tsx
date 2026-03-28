"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  LineChart,
  CandlestickChart,
  Bitcoin,
  Scale,
  BrainCircuit,
  Orbit,
  MessageCircle,
  Bot,
  BarChart3,
  Wallet,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SidebarMenuItem, type SidebarItem } from "./SidebarMenuItem";

const mainItems: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Portfolio", href: "/my-portfolio", icon: Wallet },
];

const marketItems: SidebarItem[] = [
  { label: "Nifty 50", href: "/stocks", icon: LineChart },
  { label: "Bitcoin, Gold & Silver", href: "/gold-silver", icon: Bitcoin },
  { label: "Compare Assets", href: "/compare", icon: Scale },
];

const aiToolItems: SidebarItem[] = [
  { label: "PCA & K-Means Clustering", href: "/stocks/pca-clustering", icon: Orbit },
  { label: "Sentiment AI", href: "/sentiment", icon: MessageCircle },
  { label: "Model Predictions", href: "/stocks/predictions", icon: BarChart3 },
  { label: "Finance Assistant", href: "/chatbot", icon: Bot },
];

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <aside className="flex h-full w-full flex-col bg-slate-950 text-slate-100 animate-pulse">
        <div className="h-full w-full bg-slate-900/50" />
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-full flex-col bg-slate-950 text-slate-100 pointer-events-auto">
      <div className="border-b border-slate-800 px-5 py-5">
        <Link href="/dashboard" onClick={onNavigate} className="group flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/20 p-2 ring-1 ring-blue-400/30 transition-colors group-hover:bg-blue-500/30">
            <CandlestickChart className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-200">StockCompass</p>
            <p className="text-xs text-slate-400">Financial Dashboard</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="space-y-1">
          {mainItems.map((item) => (
            <SidebarMenuItem key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>

        <Accordion type="multiple" defaultValue={["markets", "ai-tools"]} className="space-y-2">
          <AccordionItem value="markets" className="rounded-lg border border-slate-800 bg-slate-900/40 px-3">
            <AccordionTrigger className="py-3 text-sm font-semibold text-slate-200 hover:no-underline">
              <span className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-blue-300" />
                Markets
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-1 pb-2">
              <div className="space-y-1">
                <SidebarMenuItem
                  item={{ label: "Sectors", href: "/portfolios", icon: BriefcaseBusiness }}
                  compact
                  onNavigate={onNavigate}
                />
                <div className="ml-6 space-y-1">
                  <Link
                    href="/portfolios?market=india"
                    onClick={onNavigate}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    India
                  </Link>
                  <Link
                    href="/portfolios?market=usa"
                    onClick={onNavigate}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    USA
                  </Link>
                </div>
              </div>
              {marketItems.map((item) => (
                <SidebarMenuItem key={item.href} item={item} compact onNavigate={onNavigate} />
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ai-tools" className="rounded-lg border border-slate-800 bg-slate-900/40 px-3">
            <AccordionTrigger className="py-3 text-sm font-semibold text-slate-200 hover:no-underline">
              <span className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-violet-300" />
                AI Tools
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-1 pb-2">
              {aiToolItems.map((item) => (
                <SidebarMenuItem key={item.href} item={item} compact onNavigate={onNavigate} />
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </nav>
    </aside>
  );
}

