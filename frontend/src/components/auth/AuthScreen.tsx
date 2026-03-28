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
  HelpCircle,
} from "lucide-react";
import { API_BASE } from "@/lib/api-base";

const indigoAccent = "#6366F1";
const blueAccent = "#3B82F6";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 shadow-inner transition focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/35";

const labelClass = "text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block";

export function AuthScreen({ emphasizeRegister = false }: { emphasizeRegister?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMpin, setRegMpin] = useState("");
  const [regSecurityQuestion, setRegSecurityQuestion] = useState("");
  const [regSecurityAnswer, setRegSecurityAnswer] = useState("");
  
  // UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (emphasizeRegister) setActiveTab("register");
    if (searchParams.get("registered") === "true") {
      setSuccessMsg("Account created. You can sign in below.");
      setActiveTab("login");
    }
  }, [emphasizeRegister, searchParams]);

  const handleLogin = async (e?: React.FormEvent, isDemo = false) => {
    if (e) e.preventDefault();
    const loginEmail = isDemo ? "demo@example.com" : email;
    const loginPassword = isDemo ? "demo1234" : password;

    if (!loginEmail || !loginPassword) {
      setError("Credentials required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign in");

      if (typeof window !== "undefined") {
        localStorage.setItem("stock_compass_user", JSON.stringify(data.user));
        localStorage.setItem("stock_compass_token", data.token);
        window.dispatchEvent(new Event("auth_change"));
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regMpin) {
      setError("Email, password, and MPIN are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          name: regName || regEmail.split("@")[0],
          mpin: regMpin,
          security_question: regSecurityQuestion,
          security_answer: regSecurityAnswer,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page relative min-h-screen flex flex-col items-center justify-center bg-[#070a12] p-6 font-body text-white">
      {/* Grid Pattern & Background Effects */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.3]"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.2), transparent), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(99, 102, 241, 0.05), transparent)",
        }}
      />
      <div 
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[length:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] opacity-40" 
      />
      
      {/* Logo Section */}
      <div className="relative z-10 mb-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 p-px shadow-lg shadow-indigo-500/20">
          <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#070a12]">
            <Activity className="h-8 w-8 text-indigo-400" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">StockCompass</h1>
        <p className="mt-2 text-sm text-slate-400 font-medium">Access your portfolios, sectors, and AI tools.</p>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-[28px] border border-white/[0.08] bg-[#0c101c]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        
        {/* Main Tabs */}
        <div className="mb-8 flex rounded-xl border border-white/[0.05] bg-[#070a12]/50 p-1">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
              activeTab === "login" 
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/20" 
              : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
              activeTab === "register" 
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/20" 
              : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Create account
          </button>
        </div>

        {activeTab === "login" ? (
          <form onSubmit={(e) => handleLogin(e)} className="space-y-5">
            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-rose-500/10 p-3 text-xs font-medium text-rose-400 border border-rose-500/20">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} !pl-10`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Password</label>
                <Link href="/forgot-password" type="button" className="text-[10px] font-bold text-indigo-400 hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} !pl-10`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>

            <button
              type="button"
              onClick={(e) => handleLogin(e, true)}
              disabled={loading}
              className="w-full rounded-xl border border-white/5 bg-white/[0.03] py-3 text-xs font-bold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              Try demo account
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-500/10 p-3 text-xs font-medium text-rose-400 border border-rose-500/20">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input type="text" placeholder="Your name" className={`${inputClass} !pl-10`} value={regName} onChange={e => setRegName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input type="email" placeholder="name@example.com" className={`${inputClass} !pl-10`} value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Password</label>
                <input type="password" placeholder="••••••••" className={inputClass} value={regPassword} onChange={e => setRegPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>4-digit MPIN</label>
                <input type="password" maxLength={4} placeholder="1234" className={inputClass} value={regMpin} onChange={e => setRegMpin(e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Security Question (For Recovery)</label>
              <select className={inputClass} value={regSecurityQuestion} onChange={e => setRegSecurityQuestion(e.target.value)}>
                <option value="" disabled>Select a question...</option>
                <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                <option value="In what city were you born?">In what city were you born?</option>
                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                <option value="What was the name of your elementary school?">What was the name of your elementary school?</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Security Answer</label>
              <input type="text" placeholder="Your answer" className={inputClass} value={regSecurityAnswer} onChange={e => setRegSecurityAnswer(e.target.value)} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Create free account"}
            </button>
          </form>
        )}
      </div>

      <Link href="/" className="mt-8 inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition text-xs font-bold tracking-wide">
        <Home className="h-3 w-3" />
        Back to Dashboard
      </Link>
    </div>
  );
}
