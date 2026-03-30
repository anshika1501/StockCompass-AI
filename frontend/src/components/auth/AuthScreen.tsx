"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Mail,
  Lock,
  User,
  ArrowRight,
  Home,
  Loader2,
  CheckCircle2,
  Compass,
  ChevronLeft
} from "lucide-react";
import { API_BASE } from "@/lib/api-base";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-xs text-white placeholder:text-slate-500 shadow-inner transition focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/35";

const labelClass = "text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block";

// The animated digital compass + world map radar background for the left pane
function AuthRadarMap() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-[#070a12]">
      
      {/* ── World Map Background ── */}
      <div 
        className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 via-blue-500/10 to-transparent"
        style={{
          maskImage: "url('/world-map.svg')",
          maskSize: "cover", 
          maskPosition: "center",
          maskRepeat: "no-repeat",
          WebkitMaskImage: "url('/world-map.svg')",
          WebkitMaskSize: "cover",
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
        }}
      />

      <div className="absolute inset-0 z-[1] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:64px_64px] mix-blend-overlay" />

      <div className="absolute h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px]" />

      {/* ── Animated Digital Compass ── */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        className="relative z-[2] flex h-[1200px] w-[1200px] items-center justify-center opacity-60"
      >
        <div className="absolute h-[1000px] w-[1000px] rounded-full border border-dashed border-indigo-400/10" />
        <div className="absolute h-[800px] w-[800px] rounded-full border border-indigo-500/20" />
        <div className="absolute h-[500px] w-[500px] rounded-full border-[1.5px] border-dotted border-indigo-300/30" />

        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />
        <div className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] origin-top-left"
        >
          <div className="h-full w-[2px] bg-gradient-to-b from-indigo-400/80 to-transparent shadow-[0_0_20px_rgba(99,102,241,1)]" />
          <div 
            className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-indigo-500/10 to-transparent" 
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} 
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

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

      const encodedEmail = encodeURIComponent(data.email || regEmail);
      router.push(`/connect-telegram?email=${encodedEmail}`);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#070a12] text-white font-body selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* ── LEFT PANE: 65% Global Intelligence Radar ── */}
      <div className="relative hidden lg:flex lg:w-[65%] border-r border-white/5">
        <AuthRadarMap />
        
        {/* Top Left Branding Overlay */}
        <div className="absolute left-10 top-10 z-10">
          <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 shadow-lg shadow-indigo-500/25">
              <Compass className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white drop-shadow-md">
              StockCompass<span className="text-indigo-400"> AI</span>
            </span>
          </Link>
        </div>

        {/* Bottom Left System Readout Overlay */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="absolute bottom-10 left-10 z-10 flex flex-col gap-1.5 backdrop-blur-md bg-black/40 p-5 rounded-2xl border border-white/5"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-indigo-400">Restricted Gateway</p>
          <h3 className="font-display tracking-tight text-white font-semibold text-xl max-w-[400px] mt-1">
            Engineering Alpha. Built on Trust.
          </h3>
          <p className="text-sm text-slate-400 max-w-[380px] mt-1 leading-relaxed">
            Institutional-grade analytical clarity directly to your browser.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Networks Synchronized</span>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT PANE: 35% Auth Form ── */}
      <div className="relative flex w-full lg:w-[35%] min-w-[360px] lg:max-w-none flex-col overflow-y-auto overflow-x-hidden bg-[#0a0d17]">
        
        {/* Mobile Branding (only shows on mobile) */}
        <div className="lg:hidden w-full p-6 pb-0 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">StockCompass</span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 xl:px-12 py-10 my-auto">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">
              {activeTab === "login" ? "Welcome back" : "Initialize access"}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {activeTab === "login" ? "Securely sign in to your dashboard." : "Create your institutional workspace."}
            </p>
          </motion.div>

          {/* Form Tabs */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6 flex rounded-xl border border-white/[0.05] bg-[#070a12]/50 p-1"
          >
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
                activeTab === "login" 
                ? "bg-white/[0.06] text-white shadow-sm border border-white/5" 
                : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
                activeTab === "register" 
                ? "bg-white/[0.06] text-white shadow-sm border border-white/5" 
                : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Create account
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
          {activeTab === "login" ? (
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {successMsg}
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-rose-500/10 p-3 text-[11px] font-medium text-rose-400 border border-rose-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="name@organization.com"
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
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} !pl-10`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] transition hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Access System <ArrowRight className="h-3.5 w-3.5" /></>}
              </button>

              <button
                type="button"
                onClick={(e) => handleLogin(e, true)}
                disabled={loading}
                className="w-full rounded-xl border border-white/5 bg-transparent py-3.5 text-xs font-bold text-slate-400 transition hover:bg-white/[0.03] hover:text-white"
              >
                Enter as Demo Guest
              </button>

              <div className="mt-2 text-center text-[10px] text-slate-500 font-medium">
                Demo Auth: <span className="text-slate-400 font-bold">demo@example.com</span> / <span className="text-slate-400 font-bold">demo1234</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              {error && (
                <div className="rounded-xl bg-rose-500/10 p-3 text-[11px] font-medium text-rose-400 border border-rose-500/20">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className={labelClass}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input type="text" placeholder="Your name" className={`${inputClass} !pl-10`} value={regName} onChange={e => setRegName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input type="email" placeholder="name@organization.com" className={`${inputClass} !pl-10`} value={regEmail} onChange={e => setRegEmail(e.target.value)} />
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
                <label className={labelClass}>Security Question (Recovery)</label>
                <select className={inputClass} value={regSecurityQuestion} onChange={e => setRegSecurityQuestion(e.target.value)}>
                  <option value="" disabled className="text-black">Select a question...</option>
                  <option value="What was the name of your first pet?" className="text-black">What was the name of your first pet?</option>
                  <option value="In what city were you born?" className="text-black">In what city were you born?</option>
                  <option value="What is your mother's maiden name?" className="text-black">What is your mother's maiden name?</option>
                  <option value="What was the name of your elementary school?" className="text-black">What was the name of your elementary school?</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Security Answer</label>
                <input type="text" placeholder="Your designated answer" className={inputClass} value={regSecurityAnswer} onChange={e => setRegSecurityAnswer(e.target.value)} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] transition hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Initialize Account"}
              </button>
            </form>
          )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10"
          >
            <Link href="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-400 transition text-[11px] font-bold tracking-wider uppercase">
              <ChevronLeft className="h-4 w-4" />
              Return to Homepage
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
