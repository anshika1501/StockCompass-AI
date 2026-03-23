import Link from "next/link";
import { Activity, Twitter, Github, Linkedin, Disc as Discord } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0B0F19] border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-400 p-[1px]">
                <div className="w-full h-full bg-[#0B0F19] rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">StockCompass</span>
            </Link>
            <p className="text-slate-400 max-w-sm mb-6 text-sm leading-relaxed">
              Institutional-grade market intelligence, predictive modeling, and intelligent portfolio automation for the modern private investor.
            </p>
            <div className="flex items-center gap-4">
               <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <Twitter className="w-4 h-4" />
               </a>
               <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <Github className="w-4 h-4" />
               </a>
               <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <Discord className="w-4 h-4" />
               </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-5 tracking-tight">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Features</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Integrations</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Pricing</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-5 tracking-tight">Company</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">About Us</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Careers</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Blog</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-5 tracking-tight">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Cookie Policy</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} StockCompass AI. All rights reserved.
          </p>
          <div className="flex gap-6">
             <span className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All systems operational
             </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
