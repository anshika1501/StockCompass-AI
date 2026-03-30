"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";

export default function Template({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Reset loading state when the path changes
    setIsLoading(true);

    // 2. Minimum loader display time to ensure the user sees the "Syncing Intelligence" screen smoothly
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 850); // 850ms strikes the perfect balance for a premium feel

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="global-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070a12]"
          >
            {/* ── Miniature Radar Compass Loader ── */}
            <div className="relative flex h-40 w-40 items-center justify-center">
              {/* Central Glow */}
              <div className="absolute h-20 w-20 rounded-full bg-indigo-600/30 blur-2xl" />

              {/* Outer dashed scanner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                className="absolute h-full w-full rounded-full border border-dashed border-indigo-400/20"
              />

              {/* Middle rapid tracker arc */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                className="absolute h-28 w-28 rounded-full border-[2.5px] border-transparent border-t-indigo-500 border-l-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
              />
              
              {/* Inner dotted lock */}
              <div className="absolute h-20 w-20 rounded-full border-[1.5px] border-dotted border-white/20" />

              {/* Center needle/compass icon */}
              <Compass className="relative z-10 h-8 w-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" strokeWidth={2.5} />
            </div>

            {/* Typewriter-style syncing text */}
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2, duration: 0.4 }}
               className="mt-8 flex flex-col items-center gap-2"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-indigo-300">
                Syncing Intelligence...
              </p>
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/5">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="h-full w-1/2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Reveal Animation ── */}
      {/* We wait for isLoading to be absolutely false before animating the page content in */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 25 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        {children}
      </motion.div>
    </>
  );
}
