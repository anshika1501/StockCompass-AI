import Link from "next/link";
import { Activity, Twitter, Github, Disc as Discord } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#070a12] pb-12 pt-16 lg:pt-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-14 grid gap-12 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 lg:gap-16">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="mb-6 inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 p-px">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#070a12]">
                  <Activity className="h-[18px] w-[18px] text-indigo-400" strokeWidth={2} />
                </div>
              </div>
              <span className="font-display text-lg font-semibold tracking-tight text-white">StockCompass</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              Institutional-grade market context and portfolio intelligence—designed for individuals who prefer clarity
              over hype.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-slate-400 transition hover:border-white/20 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-slate-400 transition hover:border-white/20 hover:text-white"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-slate-400 transition hover:border-white/20 hover:text-white"
                aria-label="Discord"
              >
                <Discord className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold tracking-tight text-white">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="#features" className="text-slate-400 transition hover:text-white">
                  Platform
                </Link>
              </li>
              <li>
                <Link href="#demo" className="text-slate-400 transition hover:text-white">
                  Live view
                </Link>
              </li>
              <li>
                <Link href="/my-portfolio" className="text-slate-400 transition hover:text-white">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="#cta" className="text-slate-400 transition hover:text-white">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold tracking-tight text-white">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="cursor-default text-slate-500">About</span>
              </li>
              <li>
                <span className="cursor-default text-slate-500">Careers</span>
              </li>
              <li>
                <span className="cursor-default text-slate-500">Blog</span>
              </li>
              <li>
                <span className="cursor-default text-slate-500">Contact</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold tracking-tight text-white">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="cursor-default text-slate-500">Privacy</span>
              </li>
              <li>
                <span className="cursor-default text-slate-500">Terms</span>
              </li>
              <li>
                <span className="cursor-default text-slate-500">Cookies</span>
              </li>
              <li>
                <span className="cursor-default text-slate-500">Disclaimer</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} StockCompass AI. All rights reserved.
          </p>
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            Systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
