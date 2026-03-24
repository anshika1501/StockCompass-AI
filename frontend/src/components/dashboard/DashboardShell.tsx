"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import SidebarNav from "./SidebarNav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-800 md:block">
        <SidebarNav />
      </aside>

      <div className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-200 hover:bg-slate-800 hover:text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] border-slate-800 bg-slate-950 p-0 text-slate-100">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <p className="ml-3 text-sm font-semibold tracking-wide text-slate-200">StockCompass</p>
      </div>

      <main className="md:ml-72">
        <div className="min-h-screen bg-slate-900/50">{children}</div>
      </main>
    </div>
  );
}

