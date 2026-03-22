"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Mail, Lock, ArrowRight, Home, Loader2, CheckCircle2 } from "lucide-react";
import { API_BASE } from "@/lib/api-base";

export function LoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (searchParams.get("registered") === "true") {
            setSuccessMsg("Account successfully created. Please sign in.");
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Email and password are required.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccessMsg("");

        try {
            const res = await fetch(`${API_BASE}/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to sign in");
            }

            // Store basic user token proxy inside localStorage
            if (typeof window !== "undefined") {
                localStorage.setItem("stock_compass_user", JSON.stringify(data.user));
                localStorage.setItem("stock_compass_token", data.token);
                window.dispatchEvent(new Event("auth_change"));
            }

            // Redirect
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
                <Home className="h-4 w-4" />
                Back to Home
            </Link>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md px-6 relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex bg-primary p-3 rounded-2xl mb-4 shadow-lg shadow-primary/20">
                        <Compass className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold font-headline text-primary">Welcome Back</h1>
                    <p className="text-muted-foreground mt-2">Sign in to your StockCompass account</p>
                </div>

                <div className="bg-background/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl p-8">
                    <form className="space-y-5" onSubmit={handleLogin}>

                        {successMsg && (
                            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                                <CheckCircle2 className="h-4 w-4" />
                                {successMsg}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">Password</label>
                                <Link href="#" className="text-sm text-primary hover:underline font-medium">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm font-medium text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                                {error}
                                {error.includes("Account not found") && (
                                    <span className="block mt-1">
                                        <Link href="/register" className="underline font-bold">Register here</Link>
                                    </span>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6 group disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        Don't have an account? <Link href="/register" className="text-primary hover:underline font-semibold">Sign up</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
