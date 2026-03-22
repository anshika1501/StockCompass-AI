"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { API_BASE } from "@/lib/api-base";

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
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground">Stock Predictions with ML</h1>
                    <p className="text-muted-foreground mt-2">Generate and evaluate price predictions using ARIMA, LSTM, and CNN models.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                <div className="lg:col-span-1 border rounded-2xl bg-card p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                            <RefreshCw className="w-5 h-5 text-primary" />
                            New Prediction
                        </h2>
                        <form onSubmit={handlePredict} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Stock Symbol</label>
                                <input
                                    type="text"
                                    placeholder="e.g. AAPL, TSLA"
                                    value={symbol}
                                    onChange={e => setSymbol(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Target Time (Within 72h)</label>
                                <input
                                    type="datetime-local"
                                    value={targetTime}
                                    onChange={e => setTargetTime(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>

                            {errorCode && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-lg p-3 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p>{errorCode}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || !symbol || !targetTime}
                                className="w-full mt-2 bg-primary text-primary-foreground font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {submitting ? "Training Models..." : "Generate Prediction"}
                            </button>
                        </form>
                    </div>
                    <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
                        <p>Will fetch last 30 days of data and use ARIMA, LSTM, and CNN to forecast the price at the chosen time.</p>
                    </div>
                </div>

                <div className="lg:col-span-3 border rounded-2xl bg-card overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b flex items-center justify-between bg-muted/20">
                        <h2 className="font-semibold text-lg text-foreground">Prediction Dashboard</h2>
                        <button
                            onClick={handleEvaluate}
                            disabled={evaluating}
                            className="text-sm font-medium bg-secondary text-foreground px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 border"
                        >
                            {evaluating ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
                            {evaluating ? "Evaluating..." : "Evaluate Past Predictions"}
                        </button>
                    </div>

                    <div className="overflow-x-auto flex-1 p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : predictions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <p>No predictions generated yet.</p>
                                <p className="text-sm mt-1">Use the form to create your first prediction.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/30 text-muted-foreground border-b border-border/50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">Symbol</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">Current Price</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">Min (30d)</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">Max (30d)</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap text-blue-600/80">ARIMA Pred</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap text-purple-600/80">LSTM Pred</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap text-amber-600/80">CNN Pred</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">Target Time</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">Actual Price</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">ARIMA Err</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">LSTM Err</th>
                                        <th className="px-4 py-3 font-medium whitespace-nowrap">CNN Err</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {predictions.map(p => (
                                        <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-4 py-3 font-bold text-foreground">{p.symbol}</td>
                                            <td className="px-4 py-3">₹{parseFloat(p.current_price).toFixed(2)}</td>
                                            <td className="px-4 py-3">₹{parseFloat(p.min_price_30d).toFixed(2)}</td>
                                            <td className="px-4 py-3">₹{parseFloat(p.max_price_30d).toFixed(2)}</td>
                                            <td className="px-4 py-3 font-medium text-blue-600">{p.arima_prediction ? '₹' + parseFloat(p.arima_prediction).toFixed(2) : '-'}</td>
                                            <td className="px-4 py-3 font-medium text-purple-600">{p.lstm_prediction ? '₹' + parseFloat(p.lstm_prediction).toFixed(2) : '-'}</td>
                                            <td className="px-4 py-3 font-medium text-amber-600">{p.cnn_prediction ? '₹' + parseFloat(p.cnn_prediction).toFixed(2) : '-'}</td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{new Date(p.target_time).toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium">
                                                {p.actual_price ? (
                                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">₹{parseFloat(p.actual_price).toFixed(2)}</span>
                                                ) : (
                                                    <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 text-xs">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs">{p.arima_error ? '₹' + parseFloat(p.arima_error).toFixed(2) : '-'}</td>
                                            <td className="px-4 py-3 text-xs">{p.lstm_error ? '₹' + parseFloat(p.lstm_error).toFixed(2) : '-'}</td>
                                            <td className="px-4 py-3 text-xs">{p.cnn_error ? '₹' + parseFloat(p.cnn_error).toFixed(2) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
