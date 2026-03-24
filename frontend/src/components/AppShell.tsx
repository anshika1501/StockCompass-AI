"use client";

import { usePathname } from "next/navigation";
import ChatFab from "./ChatFab";
import DashboardShell from "./dashboard/DashboardShell";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");
  const isDashboardRoute = !isHomePage && !isAuthPage;

  return (
    <>
      {isDashboardRoute ? <DashboardShell>{children}</DashboardShell> : children}
      {!isHomePage && <ChatFab />}
    </>
  );
}
