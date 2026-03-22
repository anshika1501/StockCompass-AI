"use client";

import { Badge } from "@/components/ui/badge";

interface OpportunityBadgeProps {
    level?: string | null;
}

export default function OpportunityBadge({ level }: OpportunityBadgeProps) {
    const value = (level || "").toUpperCase();

    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; className: string }> = {
        HIGH: { variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
        MEDIUM: { variant: "secondary", className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100" },
        LOW: { variant: "destructive", className: "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100" },
    };

    const config = variants[value] || { variant: "secondary" as const, className: "bg-gray-100 text-gray-500 border-gray-200" };

    return (
        <Badge variant={config.variant} className={`${config.className} text-xs font-semibold tracking-wide px-3 py-1`}>
            {value || "N/A"}
        </Badge>
    );
}
