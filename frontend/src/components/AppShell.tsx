"use client";

import { usePathname } from "next/navigation";
import ChatFab from "./ChatFab";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show the old ChatFab on the home page since we have the new premium one
  const isHomePage = pathname === "/";

  return (
    <>
      {children}
      {!isHomePage && <ChatFab />}
    </>
  );
}
