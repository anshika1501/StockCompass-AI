"use client";

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
  { label: "Dashboard", href: "/portfolios", icon: LayoutDashboard },
  { label: "My Portfolio", href: "/my-portfolio", icon: Wallet },
];

const marketItems: SidebarItem[] = [
  { label: "Sectors", href: "/portfolios", icon: BriefcaseBusiness },
  { label: "Nifty 50", href: "/stocks", icon: LineChart },
  { label: "Bitcoin, Gold & Silver", href: "/gold-silver", icon: Bitcoin },
  { label: "Compare Assets", href: "/compare", icon: Scale },
];

const aiToolItems: SidebarItem[] = [
  { label: "Stock Analysis (PCA)", href: "/nifty50-pca", icon: Orbit },
  { label: "Sentiment Analysis", href: "/sentiment", icon: MessageCircle },
  { label: "Stock Prediction", href: "/stock-prediction", icon: BarChart3 },
  { label: "Chatbot", href: "/chatbot", icon: Bot },
];

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-full flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-5 py-5">
        <Link href="/portfolios" onClick={onNavigate} className="group flex items-center gap-3">
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

