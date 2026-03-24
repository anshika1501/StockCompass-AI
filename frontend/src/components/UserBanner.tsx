"use client";

import { useEffect, useState } from "react";
import { User, Mail } from "lucide-react";

export default function UserBanner() {
    const [user, setUser] = useState<{name: string, email: string} | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("stock_compass_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, []);

    if (!user) return null;

    return (
        <div className="bg-[#DBEAFE]/30 border border-[#DBEAFE] rounded-3xl p-8 mb-10 flex items-center justify-between shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#4F8DF7] flex items-center justify-center border border-white/20 shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300">
                    <User className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-[#000000] tracking-tight leading-none mb-2">Welcome back, {user.name}!</h2>
                    <div className="flex items-center gap-2 text-[#1F2937] opacity-70 text-[13px] font-bold uppercase tracking-wider">
                        <Mail className="h-4 w-4 text-[#4F8DF7]" />
                        {user.email}
                    </div>
                </div>
            </div>
            <div className="hidden md:block">
                <div className="bg-white/60 px-6 py-4 rounded-2xl border border-white/80 shadow-inner">
                    <p className="text-[11px] font-black text-[#4F8DF7] uppercase tracking-[0.2em] mb-1">Sector Live Data</p>
                    <p className="text-emerald-700 font-black flex items-center gap-2 text-sm uppercase tracking-tighter">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        Fully Synced
                    </p>
                </div>
            </div>
        </div>
    );
}
