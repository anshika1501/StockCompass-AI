"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import { ArrowUpRight, BarChart2, TrendingUp, AlertTriangle } from "lucide-react";

const getMockData = () => {
  const data = [];
  let value = 10000;
  for (let i = 0; i < 30; i++) {
    value += Math.random() * 500 - 200;
    data.push({
      time: i.toString(),
      value: Number(value.toFixed(2))
    });
  }
  return data;
};

const mockData = getMockData();

export default function LivePreview() {
  const [activeTab, setActiveTab] = useState("1M");

  return (
    <section id="demo" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl font-bold text-white mb-4"
          >
            Insights in Real-Time
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 max-w-xl mx-auto"
          >
            Visualize your assets dynamically. AI adjusts forecasts continuously as macros shift, letting you visualize potential realities before they happen.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-[#0b0e17] border border-white/10 rounded-3xl p-6 lg:p-10 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
            <div>
              <div className="text-slate-400 text-sm font-medium mb-1">Total Equity</div>
              <div className="text-4xl lg:text-5xl font-bold text-white tracking-tight flex items-baseline gap-3">
                $1,204,500.89
                <span className="text-emerald-400 text-lg font-medium flex items-center bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4 mr-1" /> +14.2%
                </span>
              </div>
            </div>

            <div className="flex bg-[#121827] p-1 rounded-xl border border-white/5">
              {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab 
                      ? "bg-indigo-600/20 text-indigo-400" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Chart */}
            <div className="lg:col-span-3 h-[400px] w-full relative group">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f1423', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sidebar Stats */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#121827] p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-slate-400 text-sm">24h Profit</div>
                </div>
                <div className="text-2xl font-bold text-white">+$12,450</div>
              </div>

              <div className="bg-[#121827] p-5 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-slate-400 text-sm">Portfolio Risk</div>
                </div>
                <div className="text-2xl font-bold text-white mb-2">Moderate</div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "45%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400"
                  />
                </div>
              </div>

              <div className="bg-[#121827] p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors">
                 <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-slate-400 text-sm">Win Rate (30d)</div>
                </div>
                <div className="text-2xl font-bold text-white">68.4%</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
