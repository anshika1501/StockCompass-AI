"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Menu, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import SidebarNav from "./SidebarNav";
import { DashboardUserMenu } from "./DashboardUserMenu";

export default function DashboardTopBar() {
  const [user, setUser] = useState<{ name: string; email?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function readUser() {
      const raw = localStorage.getItem("stock_compass_user");
      if (!raw) {
        setUser(null);
        return;
      }
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
    readUser();
    window.addEventListener("storage", readUser);
    window.addEventListener("focus", readUser);
    window.addEventListener("auth_change", readUser);
    return () => {
      window.removeEventListener("storage", readUser);
      window.removeEventListener("focus", readUser);
      window.removeEventListener("auth_change", readUser);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-slate-900 hover:bg-slate-100">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] border-slate-800 bg-slate-950 p-0 text-slate-100">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-[#4F8DF7]/50 hover:text-[#4F8DF7]"
        >
          <Home className="h-3.5 w-3.5" aria-hidden />
          Home
        </Link>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-bold tracking-tight text-slate-900">
          StockCompass
        </p>
        {user ? (
          <div
            className="flex max-w-[6.5rem] shrink-0 items-center gap-1 rounded-lg bg-slate-50 py-1 pl-1.5 pr-2 ring-1 ring-slate-200/90 sm:max-w-[9rem]"
            title={user.email ?? user.name}
          >
            <User className="h-3.5 w-3.5 shrink-0 text-[#4F8DF7]" aria-hidden />
            <span className="truncate text-xs font-semibold text-slate-800">{user.name}</span>
          </div>
        ) : (
          <Link
            href="/login"
            className="shrink-0 text-xs font-semibold text-[#4F8DF7] hover:text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        )}
      </header>

      <header className="sticky top-0 z-20 hidden items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:flex lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#4F8DF7]/50 hover:text-[#4F8DF7]"
        >
          <Home className="h-4 w-4" aria-hidden />
          Home
        </Link>
        {user ? (
          <DashboardUserMenu variant="desktop" />
        ) : (
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[#4F8DF7] transition hover:bg-blue-50"
          >
            Sign in
          </Link>
        )}
      </header>
    </>
  );
}
