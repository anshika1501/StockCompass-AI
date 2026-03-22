"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, ShieldAlert, Sparkles, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { chatWithStocks, ChatResponse, fetchLlmModels, LlmModel } from "@/lib/stock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const starterPrompts = [
  "What is the risk level for TCS vs INFY this month?",
  "Compare HDFCBANK.NS and ICICIBANK.NS and tell me which is better to buy now.",
  "Give me a diversified portfolio suggestion across 3 sectors.",
  "Is RELIANCE.NS overvalued? Should I buy or wait?",
];

export default function ChatbotPage() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<LlmModel[]>([]);
  const [model, setModel] = useState<string>("");
  const [embedModel, setEmbedModel] = useState<string>("qwen3-embedding:0.6b");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [modelLoading, setModelLoading] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const loadModels = async (url?: string) => {
    setModelLoading(true);
    try {
      const data = await fetchLlmModels(url);
      setModels(data.models || []);
      const preferred = data.models?.find((m) => m.name?.includes("tinyllama")) || data.models?.[0];
      setModel(preferred?.name || "");
      setBaseUrl(data.base_url || url || "");
    } catch (e: any) {
      setError(e.message || "Failed to load models");
    } finally {
      setModelLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const ask = async () => {
    if (!query.trim()) {
      setError("Ask a question about one or more stocks.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await chatWithStocks(query.trim(), model || undefined, embedModel || undefined, baseUrl || undefined);
      setAnswer(res);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 pb-20 pt-10">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-xl">StockCompass Chatbot</CardTitle>
            </div>
            <p className="text-sm text-slate-500">
              Powered by pgvector + Gemini. Ask about risk, predictions, comparisons, and buy/hold/sell ideas.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Compare RELIANCE.NS and TCS.NS for the next month and suggest buy/hold/sell."
              rows={4}
            />
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="w-fit flex items-center gap-2 text-slate-600"
              >
                <Settings2 className="h-4 w-4" />
                Advanced Settings
                {showAdvancedSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showAdvancedSettings && (
                <div className="grid gap-3 md:grid-cols-3 p-4 border rounded-lg bg-slate-50/50">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">Chat model (Ollama)</label>
                    <Select value={model} onValueChange={setModel} disabled={modelLoading || models.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder={modelLoading ? "Loading..." : "Select model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m.name} value={m.name || ""}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">Embed model</label>
                    <Input
                      value={embedModel}
                      onChange={(e) => setEmbedModel(e.target.value)}
                      placeholder="nomic-embed-text"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-600">Ollama base URL</label>
                    <div className="flex gap-2">
                      <Input
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                      />
                      <Button type="button" variant="secondary" onClick={() => loadModels(baseUrl)} disabled={modelLoading}>
                        {modelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((p) => (
                <Button
                  key={p}
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuery(p)}
                  className="text-left"
                >
                  <Sparkles className="h-4 w-4 mr-1 text-amber-500" />
                  {p}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={ask} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
              </Button>
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
            {answer && (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border bg-white p-4 prose prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {answer.answer}
                  </ReactMarkdown>
                </div>
                <div className="rounded-lg border bg-slate-900 text-slate-50 p-3">
                  <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wide text-slate-300">
                    <ShieldAlert className="h-4 w-4 text-amber-300" />
                    Sources (nearest stocks)
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {answer.sources.map((s) => (
                      <div key={s.symbol} className="rounded-md bg-slate-800/60 p-3 text-sm">
                        <div className="font-semibold">{s.symbol} — {s.name}</div>
                        <div className="text-slate-300 text-xs">Sector: {s.sector}</div>
                        <div className="text-slate-400 text-xs">Similarity: {(1 - s.distance).toFixed(3)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
