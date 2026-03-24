
"use client";

import { useMemo } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function StockChart({ history, color = "#2985CC" }: { history: { date: string, price: number }[], color?: string }) {
  const chartData = useMemo(() => history, [history]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F8DF7" stopOpacity={0.25}/>
              <stop offset="100%" stopColor="#4F8DF7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            hide 
          />
          <YAxis 
            hide 
            domain={['dataMin - 5', 'dataMax + 5']} 
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white px-4 py-3 border border-gray-100 shadow-[0_10px_25px_rgba(0,0,0,0.1)] rounded-xl flex flex-col gap-1 ring-1 ring-[#4F8DF7]/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{payload[0].payload.date}</p>
                    <p className="text-xl font-black text-[#000000] leading-none tracking-tighter">₹{Number(payload[0].value).toLocaleString()}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#4F8DF7" 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            animationDuration={1500}
            strokeLinecap="round"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
