"use client";

import ChatFab from "./ChatFab";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatFab />
    </>
  );
}
