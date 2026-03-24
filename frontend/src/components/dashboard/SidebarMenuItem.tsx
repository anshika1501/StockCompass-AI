"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function SidebarMenuItem({
  item,
  compact = false,
  onNavigate,
}: {
  item: SidebarItem;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30"
          : "text-slate-300 hover:bg-slate-800 hover:text-white",
        compact && "px-2"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 transition-transform duration-200 group-hover:scale-105",
          active ? "text-blue-300" : "text-slate-400 group-hover:text-slate-200"
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}

