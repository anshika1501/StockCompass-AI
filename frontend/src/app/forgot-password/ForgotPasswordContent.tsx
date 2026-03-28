"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldQuestion,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { API_BASE } from "@/lib/api-base";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 shadow-inner transition focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/35";

const labelClass = "text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block";

export default function ForgotPasswordContent() {
  const router = useRouter();
  
  // Steps: 1 (Email), 2 (Answer Security Question), 3 (Reset Password), 4 (Success)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Data
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [telegramId, setTelegramId] = useState<string | null>(null);
  
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/recovery-method/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "User not found.");

      if (data.security_question) {
        setSecurityQuestion(data.security_question);
        setStep(2);
      } else if (data.has_telegram) {
        setTelegramId("telegram"); // Simulated for now
        setError("Account is linked to Telegram. Currently only Security Question recovery is fully supported in this demo. Try signing in normally.");
      } else {
        throw new Error("No recovery method attached to this account.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to find account.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/verify-recovery/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, security_answer: securityAnswer })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      
      setRecoveryToken(data.recovery_token);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Incorrect answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recovery_token: recoveryToken, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed.");
      
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page relative min-h-screen flex flex-col items-center justify-center bg-[#070a12] p-6 font-body text-white">
      {/* Background Decor */}
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

      <div className="relative z-10 mb-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 p-px shadow-lg shadow-indigo-500/20">
          <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#070a12]">
            <ShieldQuestion className="h-7 w-7 text-indigo-400" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white mb-2">Account Recovery</h1>
        {step !== 4 && <p className="text-sm text-slate-400">Regain access to your StockCompass account</p>}
      </div>

      <div className="relative z-10 w-full max-w-[420px] rounded-[28px] border border-white/[0.08] bg-[#0c101c]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-rose-500/10 p-3 text-sm font-medium text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleIdentify} className="space-y-5 flex flex-col">
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
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-5 flex flex-col">
            <div className="space-y-3">
              <label className={labelClass}>Security Question</label>
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-200 text-sm font-medium">
                {securityQuestion}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Your Answer</label>
              <input
                type="text"
                placeholder="Answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !securityAnswer}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Answer"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset} className="space-y-5 flex flex-col">
            <div className="space-y-1.5">
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} !pl-10`}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !newPassword}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Password Reset Complete</h2>
              <p className="text-sm text-slate-400">Your password has been successfully updated. You can now sign in with your new credentials.</p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35"
            >
              Sign In Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {step < 4 && (
          <div className="mt-8 text-center">
            <Link href="/login" className="text-xs font-semibold text-slate-500 hover:text-white transition">
              Return to Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
