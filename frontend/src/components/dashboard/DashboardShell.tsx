"use client";

import SidebarNav from "./SidebarNav";
import DashboardTopBar from "./DashboardTopBar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-slate-800 bg-slate-950 md:block">
        <SidebarNav />
      </aside>

      <main className="md:ml-72 flex flex-col min-h-screen">
        <DashboardTopBar />
        <div className="flex-1 bg-[#FFFFFF] p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
