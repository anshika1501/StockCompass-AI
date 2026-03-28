"use client";

import { useMemo } from "react";
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface Props {
  history: { date: string, price: number, volume?: number }[];
  color?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const price = payload.find((p: any) => p.dataKey === 'price')?.value;
    const ma20 = payload.find((p: any) => p.dataKey === 'ma20')?.value;
    const ma50 = payload.find((p: any) => p.dataKey === 'ma50')?.value;
    const volume = payload.find((p: any) => p.dataKey === 'volume')?.value;

    return (
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700 shadow-2xl space-y-2.5 min-w-[200px] ring-1 ring-black/50">
        <p className="text-slate-200 font-bold text-sm mb-3 border-b border-slate-700/50 pb-2">{label}</p>
        <div className="flex justify-between items-center text-xs">
           <span className="text-slate-400 font-medium">close :</span>
           <span className="text-slate-100 font-mono">{price?.toFixed(1) || '-'}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
           <span className="text-[#f59e0b] font-medium">ma20 :</span>
           <span className="text-slate-100 font-mono">{ma20?.toFixed(1) || '-'}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
           <span className="text-[#10b981] font-medium">ma50 :</span>
           <span className="text-slate-100 font-mono">{ma50?.toFixed(1) || '-'}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
           <span className="text-blue-400 font-medium">volume :</span>
           <span className="text-slate-100 font-mono">{volume ? Math.round(volume).toLocaleString() : '-'}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function StockChart({ history, color = "#6366f1" }: Props) {
  const chartData = useMemo(() => {
    return history.map((d, i) => {
      let ma20 = null;
      if (i >= 19) {
          ma20 = history.slice(i-19, i+1).reduce((sum, item) => sum + item.price, 0) / 20;
      }
      let ma50 = null;
      if (i >= 49) {
          ma50 = history.slice(i-49, i+1).reduce((sum, item) => sum + item.price, 0) / 50;
      }
      return {
          ...d,
          ma20,
          ma50,
          // If no volume is passed, generate a realistic-looking mock volume
          volume: d.volume || Math.floor(Math.random() * 800000 + 400000) 
      }
    });
  }, [history]);

  return (
    <div className="h-full w-full font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={true} horizontal={true} />
          
          <XAxis 
            dataKey="date" 
            stroke="#475569" 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
            tickMargin={12}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          
          <YAxis 
            yAxisId="price"
            domain={['dataMin - 50', 'dataMax + 50']} 
            stroke="#475569"
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => Math.round(val).toLocaleString()}
          />
          
          {/* Scaled invisible Y-Axis to keep volume bars at the very bottom third */}
          <YAxis 
            yAxisId="volume"
            orientation="right"
            domain={[0, 'dataMax * 3.5']} 
            hide
          />
          
          <Tooltip 
             content={<CustomTooltip />} 
             cursor={{ stroke: '#64748b', strokeWidth: 1.5, fill: '#1e293b', fillOpacity: 0.1 }} 
          />
          
          <Bar 
            yAxisId="volume" 
            dataKey="volume" 
            fill="#3b82f6" 
            opacity={0.3} 
            radius={[2, 2, 0, 0]} 
          />
          
          <Line 
             yAxisId="price" 
             type="monotone" 
             dataKey="price" 
             stroke="#8b5cf6" 
             strokeWidth={2.5} 
             dot={false} 
             activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#0b1120', strokeWidth: 2 }} 
          />
          
          <Line 
             yAxisId="price" 
             type="monotone" 
             dataKey="ma20" 
             stroke="#f59e0b" 
             strokeWidth={1.5} 
             strokeDasharray="4 4" 
             dot={false} 
          />
          
          <Line 
             yAxisId="price" 
             type="monotone" 
             dataKey="ma50" 
             stroke="#10b981" 
             strokeWidth={1.5} 
             strokeDasharray="4 4" 
             dot={false} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
