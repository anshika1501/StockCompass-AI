"use client";

import SidebarNav from "./SidebarNav";
import DashboardTopBar from "./DashboardTopBar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-800 bg-slate-950 md:block">
        <SidebarNav />
      </aside>

      <main className="md:ml-72">
        <DashboardTopBar />
        <div className="min-h-screen bg-[#FFFFFF] p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
