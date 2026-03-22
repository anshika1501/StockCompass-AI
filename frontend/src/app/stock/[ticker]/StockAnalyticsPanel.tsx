"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, Activity } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OpportunityBadge from "@/components/OpportunityBadge";
import { fetchLiveStockDetail, formatMoney, type LiveStockDetail } from "@/lib/stock-data";

export default function StockAnalyticsPanel({ ticker }: { ticker: string }) {
    const [data, setData] = useState<LiveStockDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            try {
                const result = await fetchLiveStockDetail(ticker, { period: "1y", interval: "1d" });
                if (active) setData(result);
            } catch {
                // silently fail - the analytics panel is optional
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [ticker]);

    const chartData = useMemo(() => {
        const graph = data?.analytics?.graph_data;
        if (!graph) return [];
        const dates = graph.dates || [];
        const prices = graph.price || [];
        const movingAvg = graph.moving_avg || [];
        return dates.map((date, i) => ({
            date,
            price: prices[i],
            moving_avg: movingAvg[i],
        }));
    }, [data]);

    if (loading) {
        return (
            <Card className="border-none shadow-sm bg-white mb-8">
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Loading live analytics...</span>
                </CardContent>
            </Card>
        );
    }

    if (!data?.analytics) return null;

    const { analytics, currency } = data;

    return (
        <div className="space-y-4 mb-8">
            {/* Analytics Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="pt-5 pb-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Discount Level</p>
                        <OpportunityBadge level={analytics.discount_level} />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-primary/5 relative overflow-hidden">
                    <CardContent className="pt-5 pb-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Opportunity Score</p>
                        <span className="text-3xl font-bold text-primary">{analytics.opportunity_score ?? '-'}</span>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="pt-5 pb-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">PE Ratio (Live)</p>
                        <span className="text-2xl font-bold font-mono">
                            {analytics.pe_ratio != null ? analytics.pe_ratio.toFixed(2) : 'N/A'}
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Moving Average Chart */}
            {chartData.length > 0 && (
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity size={16} className="text-primary" />
                            1Y Performance with Moving Average
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "rgba(0,0,0,0.1)" }} tickLine={false} />
                                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "rgba(0,0,0,0.1)" }} tickLine={false} domain={["auto", "auto"]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#fff", borderColor: "rgba(0,0,0,0.1)", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: "12px" }} />
                                    <Line type="monotone" dataKey="price" stroke="#2985CC" strokeWidth={2.5} dot={false} name="Actual Price" activeDot={{ r: 5 }} />
                                    <Line type="monotone" dataKey="moving_avg" stroke="#10b981" strokeWidth={2} dot={false} name="Moving Average" strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
