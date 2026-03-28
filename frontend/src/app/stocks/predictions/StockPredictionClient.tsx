"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, BarChart3 } from "lucide-react";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface Prediction {
    id: number;
    symbol: string;
    target_time: string;
    current_price: string;
    min_price_30d: string;
    max_price_30d: string;
    arima_prediction: string | null;
    lstm_prediction: string | null;
    cnn_prediction: string | null;
    actual_price: string | null;
    arima_error: string | null;
    lstm_error: string | null;
    cnn_error: string | null;
    created_at: string;
}

export default function StockPredictionClient() {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);

    const [symbol, setSymbol] = useState("");
    const [targetTime, setTargetTime] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [evaluating, setEvaluating] = useState(false);
    const [errorCode, setErrorCode] = useState("");

    const fetchPredictions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/predictions/`);
            if (res.ok) {
                const data = await res.json();
                setPredictions(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPredictions();

        // Set default target time to 24 hours from now
        const now = new Date();
        now.setHours(now.getHours() + 24);
        // Format to YYYY-MM-DDThh:mm string for datetime-local input
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setTargetTime(now.toISOString().slice(0, 16));
    }, []);

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!symbol || !targetTime) return;

        setSubmitting(true);
        setErrorCode("");

        try {
            const res = await fetch(`${API_BASE}/predictions/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    symbol: symbol.toUpperCase(),
                    target_time: targetTime
                }),
            });

            if (res.ok) {
                const newPred = await res.json();
                setPredictions(prev => [newPred, ...prev]);
                setSymbol("");
            } else {
                const err = await res.json();
                setErrorCode(err.error || "Failed to generate prediction");
            }
        } catch (err) {
            console.error(err);
            setErrorCode("Connection error.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEvaluate = async () => {
        setEvaluating(true);
        try {
            const res = await fetch(`${API_BASE}/predictions/evaluate/`, {
                method: "POST",
            });
            if (res.ok) {
                // Refresh the list
                await fetchPredictions();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setEvaluating(false);
        }
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-extrabold text-slate-900 tracking-tight">Model <span className="text-[#4F8DF7]">Predictions</span></h1>
          <p className="text-sm font-medium text-slate-500">Institutional-grade ARIMA, LSTM, and CNN ensemble forecasting.</p>
        </div>
        <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
            {evaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4F8DF7]" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#4F8DF7]" />}
            {evaluating ? "Evaluating Models..." : "Evaluate Past Forecasts"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Terminal */}
        <div className="lg:col-span-3">
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] pointer-events-none" />
             
             <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <RefreshCw size={14} className="text-[#4F8DF7]" />
                Forecast Config
             </h2>

             <form onSubmit={handlePredict} className="space-y-4 relative z-10">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ticker Symbol</label>
                    <input
                        type="text"
                        placeholder="e.g. RELIANCE.NS"
                        value={symbol}
                        onChange={e => setSymbol(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4F8DF7] uppercase placeholder:text-slate-600 transition-all"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 text-nowrap">Target Time Window</label>
                    <input
                        type="datetime-local"
                        value={targetTime}
                        onChange={e => setTargetTime(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4F8DF7] transition-all"
                        required
                    />
                </div>

                {errorCode && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3 text-[11px] font-medium flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <p>{errorCode}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting || !symbol || !targetTime}
                    className="w-full mt-4 bg-[#4F8DF7] hover:bg-[#2563EB] text-white font-bold text-[11px] uppercase tracking-wider rounded-xl py-3 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send size={14} />}
                    {submitting ? "Analyzing..." : "Generate Forecast"}
                </button>
             </form>

             <div className="mt-8 pt-6 border-t border-slate-800/50">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                   <div className="h-1 w-1 rounded-full bg-emerald-500" />
                   Model Ensemble
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Ensemble analysis utilizing historical price action (30D), technical indicators, and neural networks to project future valuation.
                </p>
             </div>
          </div>
        </div>

        {/* Forecast Dashboard */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
              {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#4F8DF7] blur-xl opacity-10 animate-pulse" />
                        <Loader2 className="w-10 h-10 animate-spin text-[#4F8DF7]" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Synchronizing Data...</p>
                  </div>
              ) : predictions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-10">
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                         <BarChart3 className="text-slate-300" size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">System Ready</h3>
                      <p className="text-sm text-slate-500 max-w-sm font-medium">Configure the forecast parameters in the sidebar to initiate a new predictive model analysis.</p>
                  </div>
              ) : (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-slate-50/80 border-b border-slate-100">
                                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Symbol</th>
                                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-nowrap">Current Value</th>
                                  <th className="px-4 py-4 text-[10px] font-bold text-blue-500 uppercase tracking-widest">ARIMA</th>
                                  <th className="px-4 py-4 text-[10px] font-bold text-purple-500 uppercase tracking-widest">LSTM</th>
                                  <th className="px-4 py-4 text-[10px] font-bold text-amber-500 uppercase tracking-widest">CNN</th>
                                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Forecast Result</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {predictions.map(p => (
                                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                      <td className="px-6 py-5">
                                          <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 leading-none mb-1">{p.symbol}</span>
                                            <span className="text-[10px] font-bold text-slate-400 tracking-tight">{new Date(p.target_time).toLocaleDateString()}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-5">
                                          <span className="text-sm font-bold text-slate-700 tabular-nums">₹{parseFloat(p.current_price).toLocaleString()}</span>
                                      </td>
                                      <td className="px-4 py-5 font-bold text-xs text-blue-600 tabular-nums">
                                        {p.arima_prediction ? '₹' + parseFloat(p.arima_prediction).toLocaleString() : '—'}
                                      </td>
                                      <td className="px-4 py-5 font-bold text-xs text-purple-600 tabular-nums">
                                        {p.lstm_prediction ? '₹' + parseFloat(p.lstm_prediction).toLocaleString() : '—'}
                                      </td>
                                      <td className="px-4 py-5 font-bold text-xs text-amber-600 tabular-nums">
                                        {p.cnn_prediction ? '₹' + parseFloat(p.cnn_prediction).toLocaleString() : '—'}
                                      </td>
                                      <td className="px-6 py-5 text-right">
                                          {p.actual_price ? (
                                              <div className="inline-flex flex-col items-end">
                                                  <span className="text-xs font-black text-emerald-600">₹{parseFloat(p.actual_price).toLocaleString()}</span>
                                                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Verified Target</span>
                                              </div>
                                          ) : (
                                              <div className="inline-flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                                  <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                                                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending Verification</span>
                                              </div>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
    );
}
