"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Mail,
  Lock,
  User,
  ArrowRight,
  Home,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { API_BASE } from "@/lib/api-base";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 shadow-inner transition focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/35";

type AuthScreenProps = {
  /** When true (e.g. /register), scroll to the registration block */
  emphasizeRegister?: boolean;
};

export function AuthScreen({ emphasizeRegister = false }: AuthScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerRef = useRef<HTMLElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [error, setError] = useState("");
  const [regError, setRegError] = useState("");
  const [loading, setLoading] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMsg("Account created. You can sign in below.");
    }
  }, [searchParams]);

  useEffect(() => {
    const goRegister =
      emphasizeRegister ||
      (typeof window !== "undefined" && window.location.hash === "#register");
    if (!goRegister) return;
    const t = requestAnimationFrame(() => {
      registerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(t);
  }, [emphasizeRegister]);

  const handleLogin = async (e?: React.FormEvent, isDemo = false) => {
    if (e) e.preventDefault();

    const loginEmail = isDemo ? "demo@example.com" : email;
    const loginPassword = isDemo ? "demo1234" : password;

    if (isDemo) {
      setEmail(loginEmail);
      setPassword(loginPassword);
    }

    if (!loginEmail || !loginPassword) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (isDemo) {
        try {
          await fetch(`${API_BASE}/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: loginEmail,
              password: loginPassword,
              name: "Demo User",
            }),
          });
        } catch {
          /* account may already exist */
        }
      }

      const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("stock_compass_user", JSON.stringify(data.user));
        localStorage.setItem("stock_compass_token", data.token);
        window.dispatchEvent(new Event("auth_change"));
      }

      router.push("/portfolios");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword) {
      setRegError("Email and password are required.");
      return;
    }

    setRegLoading(true);
    setRegError("");

    try {
      const res = await fetch(`${API_BASE}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          name: regName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      router.push("/login?registered=true");
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="landing-page relative min-h-screen overflow-x-hidden bg-[#070a12] font-body text-white">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.4]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.22), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(59, 130, 246, 0.12), transparent), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(99, 102, 241, 0.08), transparent)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[length:72px_72px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_30%,#000_40%,transparent_100%)]"
        aria-hidden
      />

      <nav className="relative z-20 border-b border-white/[0.06] bg-[#070a12]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 p-px shadow-lg shadow-indigo-500/15">
              <span className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#070a12]">
                <Activity className="h-[18px] w-[18px] text-indigo-400" strokeWidth={2} />
              </span>
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">StockCompass</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-slate-400 sm:inline">Sign in</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              <Home className="h-3.5 w-3.5" aria-hidden />
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-md px-5 pb-20 pt-10 lg:max-w-lg lg:pt-14">
        {/* Sign in */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Sign in</h1>
          <p className="mt-2 text-sm text-slate-400">
            Access your portfolios, sectors, and AI tools.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0c101c]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form className="space-y-5" onSubmit={(e) => handleLogin(e, false)}>
            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                {successMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <span className="text-xs text-slate-600">Forgot password?</span>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-medium text-rose-200">
                {error}
                {error.toLowerCase().includes("not found") ? (
                  <p className="mt-2 text-xs text-slate-400">
                    New here? Create an account below.
                  </p>
                ) : null}
              </div>
            )}

            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={(e) => handleLogin(e, true)}
                disabled={loading}
                className="w-full rounded-full border border-white/15 bg-white/[0.03] py-3 text-sm font-semibold text-slate-200 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/[0.06] disabled:opacity-50"
              >
                Try demo account
              </button>
            </div>
          </form>
        </div>

        {/* Registration — below sign-in */}
        <section
          ref={registerRef}
          id="register"
          className="mt-12 scroll-mt-24 border-t border-white/[0.06] pt-12"
        >
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">New to StockCompass?</h2>
            <p className="mt-2 text-sm text-slate-400">
              Create a free account. Same email you&apos;ll use to sign in above.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0c101c]/90 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <form className="space-y-5" onSubmit={handleRegister}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Full name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden
                  />
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden
                  />
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {regError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-medium text-rose-200">
                  {regError}
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent py-3 text-sm font-semibold text-white transition hover:border-indigo-400/50 hover:bg-white/[0.05] disabled:opacity-50"
              >
                {regLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            By continuing you agree to follow our acceptable use and data practices.
          </p>
        </section>
      </div>
    </div>
  );
}
