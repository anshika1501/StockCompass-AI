"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[100]">
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative group w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] border border-white/20 transition-all duration-300 z-50 overflow-hidden"
        >
          {/* Animated Glow outline */}
          <div className="absolute inset-0 bg-white/20 rounded-full blur animate-ping opacity-30 pointer-events-none" />
          
          <div className="relative z-10">
            {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-28 right-8 z-[100] w-[350px] lg:w-[400px] h-[550px] bg-[#0F1423]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden isolate"
          >
            {/* Header */}
            <div className="relative p-5 border-b border-white/10 bg-[#121827]/80 flex items-center gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center relative p-[1px]">
                  <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#121827]" />
                  <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-lg leading-tight">StockCompass AI</h3>
                <p className="text-emerald-400 text-xs font-medium border border-emerald-400/20 bg-emerald-400/10 inline-block px-1.5 py-0.5 rounded mt-1">Online</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
               <div className="space-y-4">
                  {/* Assistant Msg */}
                  <div className="flex gap-3 max-w-[85%]">
                     <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center border border-indigo-400/20">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                     </div>
                     <div className="bg-[#1e263c] border border-white/10 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-300 leading-relaxed shadow-sm">
                        Hello! I'm your AI quantitative assistant. How can I help you optimize your portfolio today?
                     </div>
                  </div>

                  {/* User Msg */}
                  <div className="flex gap-3 max-w-[85%] ml-auto justify-end">
                     <div className="bg-indigo-600 border border-indigo-500/50 p-3 rounded-2xl rounded-tr-sm text-sm text-white leading-relaxed shadow-sm">
                        What's the current sentiment on TSLA options?
                     </div>
                  </div>

                  {/* Assistant Msg with rich content */}
                  <div className="flex gap-3 max-w-[90%]">
                     <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center border border-indigo-400/20">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                     </div>
                     <div className="bg-[#1e263c] border border-white/10 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-300 leading-relaxed shadow-sm">
                        Based on real-time NLP scans of 4,200 articles over the last 24 hours:
                        <div className="mt-3 p-3 bg-[#0F1423] border border-white/5 rounded-xl text-xs space-y-2">
                            <div className="flex justify-between items-center text-slate-400"><span className="text-rose-400">Put/Call Ratio</span> <span>1.2 (Bearish)</span></div>
                            <div className="flex justify-between items-center text-slate-400"><span className="text-emerald-400">Implied Vol</span> <span>54% (Elevated)</span></div>
                            <div className="flex justify-between items-center text-slate-400 font-medium"><span className="text-indigo-400">AI Signal</span> <span>Hold</span></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-white/10 bg-[#121827]/80">
              <div className="relative flex items-center">
                 <input 
                   type="text" 
                   placeholder="Ask me anything..." 
                   className="w-full bg-[#0F1423] border border-white/10 text-white text-sm rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-inter"
                 />
                 <button className="absolute right-2 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-colors shadow-lg">
                    <Send className="w-4 h-4 ml-[2px]" />
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
