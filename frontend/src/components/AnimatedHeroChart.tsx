"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";

const initialData = [
  { name: "Jan", market: 4000, ai: 4100 },
  { name: "Feb", market: 4200, ai: 4400 },
  { name: "Mar", market: 4100, ai: 4600 },
  { name: "Apr", market: 4600, ai: 5200 },
  { name: "May", market: 4500, ai: 5400 },
  { name: "Jun", market: 4800, ai: 6000 },
  { name: "Jul", market: 5000, ai: 6400 },
  { name: "Aug", market: 4900, ai: 6800 },
  { name: "Sep", market: 5200, ai: 7400 },
  { name: "Oct", market: 5100, ai: 7800 },
  { name: "Nov", market: 5400, ai: 8500 },
  { name: "Dec", market: 5600, ai: 9200 },
];

export default function AnimatedHeroChart() {
  const [data, setData] = useState(initialData.map(d => ({ ...d, ai: d.market })));
  
  // Animate the AI performance line diverging from the market
  useEffect(() => {
    const timer = setTimeout(() => {
      setData(initialData);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="w-full h-[400px] p-6 bg-white/60 backdrop-blur-xl border-primary/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-emerald-500/5 z-0" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold font-headline text-primary">AI-Optimized vs Market Trajectory</h3>
            <p className="text-sm text-muted-foreground">Predictive models outperforming standard benchmarks</p>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-emerald-700">StockCompass AI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-slate-600">S&P 500</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} domain={['dataMin - 500', 'dataMax + 500']} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                itemStyle={{ fontWeight: 600 }}
              />
              <Area 
                type="monotone" 
                dataKey="market" 
                name="S&P 500"
                stroke="#94a3b8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorMarket)" 
                animationDuration={1500}
              />
              <Area 
                type="monotone" 
                dataKey="ai" 
                name="StockCompass AI"
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAi)" 
                animationDuration={2500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
