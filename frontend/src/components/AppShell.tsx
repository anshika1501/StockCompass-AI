"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import ChatFab from "./ChatFab";
import DashboardShell from "./dashboard/DashboardShell";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isHomePage = pathname === "/";
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");
  const isDashboardRoute = !isHomePage && !isAuthPage;

  if (!hasMounted) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <>
      {isDashboardRoute ? <DashboardShell>{children}</DashboardShell> : children}
      {!isHomePage && <ChatFab />}
    </>
  );
}
