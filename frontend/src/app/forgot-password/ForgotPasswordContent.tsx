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
  AlertCircle,
  MessageCircle,
  KeyRound,
  ExternalLink,
  Compass,
  ChevronLeft,
  Home
} from "lucide-react";
import { API_BASE } from "@/lib/api-base";
import { motion } from "framer-motion";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-xs text-white placeholder:text-slate-500 shadow-inner transition focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/35";

const labelClass =
  "text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block";

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

// Steps: 1=Email, 2=ChooseMethod, 3=Verify (question or OTP), 4=NewPassword, 5=Success
type Step = 1 | 2 | 3 | 4 | 5;

export default function ForgotPasswordContent() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [recoveryMethod, setRecoveryMethod] = useState<
    "question" | "telegram" | null
  >(null);

  // User data returned from the server after email lookup
  const [email, setEmail] = useState("");
  const [hasQuestion, setHasQuestion] = useState(false);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [otp, setOtp] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* ─────────────────────── Step 1: Lookup email ─────────────────────── */
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_BASE}/recovery-method/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "User not found.");

      setHasQuestion(!!data.security_question);
      setHasTelegram(!!data.has_telegram);
      if (data.security_question) setSecurityQuestion(data.security_question);

      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to find account.");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── Step 2: User picks method ─────────────── */
  const handleSelectMethod = async (method: "question" | "telegram") => {
    setError("");
    setSuccessMsg("");
    setRecoveryMethod(method);

    if (method === "question") {
      if (!hasQuestion) {
        setError(
          "This account does not have a security question configured."
        );
        return;
      }
      setStep(3);
    } else {
      if (!hasTelegram) {
        setError("telegram_not_linked"); // special sentinel
        return;
      }
      // Dispatch OTP
      await requestOtp(method);
    }
  };

  /* ─────────────────────── Dispatch OTP ─────────────────────── */
  const requestOtp = async (method?: "question" | "telegram") => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_BASE}/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP.");
      setSuccessMsg(data.message || "OTP sent to your Telegram account.");
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────── Step 3: Verify ─────────────────────── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      if (recoveryMethod === "question") {
        if (!securityAnswer) throw new Error("Please enter an answer.");
        const res = await fetch(`${API_BASE}/verify-recovery/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, security_answer: securityAnswer }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed.");
        setRecoveryToken(data.recovery_token);
      } else {
        if (!otp || otp.length < 6) throw new Error("Please enter the 6-digit OTP.");
        const res = await fetch(`${API_BASE}/verify-otp/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed.");
        setRecoveryToken(data.recovery_token);
      }
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────── Step 4: Reset password ─────────────────────── */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recovery_token: recoveryToken,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed.");
      setStep(5);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError("");
    setSuccessMsg("");
    setStep((step - 1) as Step);
  };

  /* ─────────────────────────────── Render ─────────────────────────────── */
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
          <p className="font-mono text-[10px] uppercase tracking-widest text-indigo-400">Recovery Protocol Active</p>
          <h3 className="font-display tracking-tight text-white font-semibold text-xl max-w-[400px] mt-1">
            Engineering Alpha. Built on Trust.
          </h3>
          <p className="text-sm text-slate-400 max-w-[380px] mt-1 leading-relaxed">
             Secure access restoration pathway engaged and monitored.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Identity Verification Live</span>
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
              Account Recovery
            </h2>
            {step !== 5 && (
              <p className="text-xs text-slate-400 font-medium">
                Regain access to your institutional workspace.
              </p>
            )}
          </motion.div>

        {/* Error banner ─ special handling for telegram_not_linked */}
        {error && error !== "telegram_not_linked" && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-rose-500/10 p-3 text-[11px] font-medium text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Success banner */}
        {successMsg && !error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-500/10 p-3 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6, delay: 0.4 }}
        >
        {/* ── Step 1: Email entry ── */}
        {step === 1 && (
          <form onSubmit={handleIdentify} className="space-y-4">
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Enter your registered organization email address to initiate the core system retrieval protocol.
            </p>
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
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] transition hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Engage Retrieval <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
            <div className="mt-4 text-center text-[10px] text-slate-500 font-medium">
              Demo Recovery Account: <span className="text-slate-400 font-bold underline decoration-indigo-500/30 underline-offset-4">demo@example.com</span>
            </div>
          </form>
        )}

        {/* ── Step 2: Choose recovery method ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300 mb-6 text-center">
              Choose how you want to verify your identity.
            </p>

            {/* Security Question option */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSelectMethod("question")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition text-left ${
                hasQuestion
                  ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                  : "border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="bg-indigo-500/20 p-2.5 rounded-lg">
                <ShieldQuestion className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Security Question</h3>
                <p className="text-xs text-slate-400">
                  {hasQuestion
                    ? "Answer your registered question"
                    : "No security question set"}
                </p>
              </div>
            </button>

            {/* Telegram OTP option */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSelectMethod("telegram")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition text-left"
            >
              <div className="bg-[#0088cc]/20 p-2.5 rounded-lg">
                <MessageCircle className="h-5 w-5 text-[#0088cc]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Telegram OTP</h3>
                  {hasTelegram ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Linked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
                      Not linked
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {hasTelegram
                    ? "Receive a 6-digit code via Telegram"
                    : "Link your Telegram account first"}
                </p>
              </div>
            </button>

            {/* Inline Telegram-not-linked error */}
            {error === "telegram_not_linked" && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                  <MessageCircle className="h-5 w-5 shrink-0" />
                  Telegram account not linked
                </div>
                <p className="text-xs text-slate-400">
                  You haven&apos;t connected a Telegram account yet. Link it now to
                  enable OTP-based recovery.
                </p>
                <Link
                  href={`/connect-telegram?email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#0088cc] hover:text-sky-300 transition"
                >
                  Connect Telegram Now
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {loading && (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              </div>
            )}
          </div>
        )}

        {/* ── Step 3A: Security Question ── */}
        {step === 3 && recoveryMethod === "question" && (
          <form onSubmit={handleVerify} className="space-y-5">
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
                placeholder="Enter your answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !securityAnswer}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Verify Answer"
              )}
            </button>
          </form>
        )}

        {/* ── Step 3B: Telegram OTP ── */}
        {step === 3 && recoveryMethod === "telegram" && (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="text-center space-y-2 mb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0088cc]/20">
                <MessageCircle className="h-6 w-6 text-[#0088cc]" />
              </div>
              <p className="text-sm text-slate-300">
                We&apos;ve sent a 6-digit OTP to your Telegram account. It expires in{" "}
                <span className="font-bold text-white">5 minutes</span>.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>6-Digit Neural OTP</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="000 000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className={`${inputClass} !pl-10 tracking-[0.4em] font-mono text-center text-lg`}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] transition hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Verify OTP"
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => requestOtp()}
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* ── Step 4: New Password ── */}
        {step === 4 && (
          <form onSubmit={handleReset} className="space-y-5">
            <p className="text-sm text-slate-300 mb-2">
              Choose a new password for your account.
            </p>
            <div className="space-y-1.5">
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="Min. 6 characters"
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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        {/* ── Step 5: Success ── */}
        {step === 5 && (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                Password Reset Complete
              </h2>
              <p className="text-sm text-slate-400">
                Your password has been updated. You can now sign in with your new
                credentials.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-500/35"
            >
              Sign In Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* ── Navigation footer ── */}
        {step < 5 && (
          <div className="mt-10">
            {step > 1 && (
              <button
                onClick={goBack}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-400 transition text-[11px] font-bold tracking-wider uppercase mb-3 text-left w-full"
              >
                <ChevronLeft className="h-4 w-4" />
                Rewind Protocol
              </button>
            )}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-400 transition text-[11px] font-bold tracking-wider uppercase"
            >
              <Home className="h-3.5 w-3.5" />
              Return to Sign In Hub
            </Link>
          </div>
        )}
        </motion.div>
      </div>
     </div>
    </div>
  );
}
