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
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-primary font-headline">Welcome back, {user.name}!</h2>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm font-medium">
                        <Mail className="h-4 w-4" />
                        {user.email}
                    </div>
                </div>
            </div>
            <div className="hidden sm:block">
                <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                    <p className="text-emerald-500 font-bold flex items-center justify-end gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                    </p>
                </div>
            </div>
        </div>
    );
}
