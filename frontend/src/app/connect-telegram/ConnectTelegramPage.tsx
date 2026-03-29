"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  Activity,
  Home,
  RefreshCw,
} from "lucide-react";
import { API_BASE } from "@/lib/api-base";

const POLL_INTERVAL = 3000; // poll every 3 seconds

export default function ConnectTelegramPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [linked, setLinked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const botUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "StockCompassBot";
  const linkCommand = `/start ${email}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(linkCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: silently fail
    }
  };

  const startPolling = () => {
    if (!email || polling) return;
    setPolling(true);
    setPollCount(0);

    intervalRef.current = setInterval(async () => {
      setPollCount((c) => c + 1);
      try {
        const res = await fetch(`${API_BASE}/check-telegram-link/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.linked) {
          clearInterval(intervalRef.current!);
          setLinked(true);
          setPolling(false);
          setTimeout(() => router.push("/dashboard"), 2000);
        }
      } catch {
        // ignore network errors
      }
    }, POLL_INTERVAL);
  };

  // Auto-start polling if email is provided
  useEffect(() => {
    if (email) startPolling();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return (
    <div className="landing-page relative min-h-screen flex flex-col items-center justify-center bg-[#070a12] p-6 font-body text-white">
      {/* Decorative background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,136,204,0.25), transparent), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(99,102,241,0.08), transparent)",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[length:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)] opacity-40" />

      {/* Header */}
      <div className="relative z-10 mb-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0088cc] to-indigo-500 p-px shadow-lg shadow-[#0088cc]/20">
          <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#070a12]">
            <Activity className="h-7 w-7 text-[#0088cc]" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white mb-2">
          Connect Telegram
        </h1>
        <p className="text-sm text-slate-400">
          Link your account for faster OTP-based recovery
        </p>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[480px] rounded-[28px] border border-white/[0.08] bg-[#0c101c]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        {linked ? (
          /* ── Success state ── */
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Telegram Linked!</h2>
              <p className="text-sm text-slate-400">
                Your account is now connected. Redirecting to dashboard…
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting…
            </div>
          </div>
        ) : (
          /* ── Instructions state ── */
          <div className="space-y-6">
            {/* Optional badge */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-[#0088cc]/25 bg-[#0088cc]/10">
              <div className="shrink-0 bg-[#0088cc]/20 p-2.5 rounded-lg">
                <MessageCircle className="h-5 w-5 text-[#0088cc]" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Optional Step</p>
                <p className="text-xs text-slate-400">
                  You can skip this and connect later from Settings → Telegram
                </p>
              </div>
            </div>

            {/* Step-by-step */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Follow these 3 steps
              </p>

              {[
                {
                  n: 1,
                  title: "Open Telegram",
                  desc: "Launch Telegram on your phone or desktop.",
                },
                {
                  n: 2,
                  title: `Search for @${botUsername}`,
                  desc: "Find the StockCompass bot in Telegram search.",
                },
                {
                  n: 3,
                  title: "Send the command below",
                  desc: "Copy and paste the message into the chat.",
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 items-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-bold">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{s.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Command to copy */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Message to send
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <code className="flex-1 text-sm font-mono text-indigo-300 break-all">
                  {linkCommand || "/start your@email.com"}
                </code>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/30 transition"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Live polling indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {polling ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Monitoring for confirmation…</span>
                  {pollCount > 0 && (
                    <span className="text-slate-700">
                      ({pollCount * 3}s elapsed)
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-slate-700" />
                  <span>Not monitoring</span>
                  <button
                    type="button"
                    onClick={startPolling}
                    className="ml-1 flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Start
                  </button>
                </>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 pt-1">
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0088cc] to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0088cc]/25 transition hover:shadow-[#0088cc]/40 active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                Open @{botUsername} in Telegram
                <ArrowRight className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full rounded-xl border border-white/5 bg-white/[0.03] py-3 text-xs font-bold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                Skip for Now — Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <Link
        href="/"
        className="mt-8 relative z-10 inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition text-xs font-bold tracking-wide"
      >
        <Home className="h-3 w-3" />
        Back to home
      </Link>
    </div>
  );
}
