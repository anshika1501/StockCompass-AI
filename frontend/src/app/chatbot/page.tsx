"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Settings2,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  LineChart,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { chatWithStocks, ChatResponse, fetchLlmModels, LlmModel } from "@/lib/stock-data";
import { getHelpResponse } from "@/lib/help-assistant";
import { HELP_SUGGESTED_PROMPTS } from "@/lib/system-help-knowledge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const stockStarterPrompts = [
  "What is the risk level for TCS vs INFY this month?",
  "Give me a diversified portfolio suggestion across 3 sectors.",
  "Is RELIANCE.NS overvalued? Should I buy or wait?",
];

const crudStarterPrompts = [
  "Create a new portfolio named Retirement",
  "Show my portfolios",
  "Add 10 shares of RELIANCE.NS at 2950 to my Retirement portfolio",
  "Rename portfolio Retirement to My Future",
];

export default function ChatbotPage() {
  const [helpQuery, setHelpQuery] = useState("");
  const [helpAnswer, setHelpAnswer] = useState<string | null>(null);

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load models");
    } finally {
      setModelLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const askHelp = () => {
    if (!helpQuery.trim()) {
      setHelpAnswer("Type a question, or click a suggestion below.");
      return;
    }
    setHelpAnswer(getHelpResponse(helpQuery.trim()));
  };

  const askStock = async () => {
    if (!query.trim()) {
      setError("Ask a question about one or more stocks.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await chatWithStocks(query.trim(), model || undefined, embedModel || undefined, baseUrl || undefined);
      setAnswer(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-xl">Finance Assistant</CardTitle>
            </div>
            <p className="text-sm text-slate-500">
              <strong>Product help</strong> answers how to use the app. <strong>Stock research</strong> uses your
              backend (pgvector + LLM) for market-style questions.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="help" className="w-full">
              <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-2 bg-slate-100/80 p-1 sm:w-auto sm:inline-flex">
                <TabsTrigger value="help" className="gap-2 py-2.5">
                  <LifeBuoy className="h-4 w-4" />
                  Product help
                </TabsTrigger>
                <TabsTrigger value="stocks" className="gap-2 py-2.5">
                  <LineChart className="h-4 w-4" />
                  Stock research
                </TabsTrigger>
              </TabsList>

              <TabsContent value="help" className="mt-0 space-y-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-700">
                  Ask anything about <strong>sign-in</strong>, <strong>My Portfolio</strong>,{" "}
                  <strong>sectors</strong>, <strong>settings</strong>, or <strong>navigation</strong>. Answers come
                  from built-in product documentation (no LLM required).
                </div>
                <Textarea
                  value={helpQuery}
                  onChange={(e) => setHelpQuery(e.target.value)}
                  placeholder="e.g. How do I add a holding to my portfolio?"
                  rows={4}
                />
                <div className="flex flex-wrap gap-2">
                  {HELP_SUGGESTED_PROMPTS.map((p) => (
                    <Button key={p} variant="secondary" size="sm" className="text-left" onClick={() => setHelpQuery(p)}>
                      <Sparkles className="mr-1 h-4 w-4 text-amber-500" />
                      {p}
                    </Button>
                  ))}
                </div>
                <Button onClick={askHelp} type="button">
                  Get answer
                </Button>
                {helpAnswer && (
                  <div className="rounded-lg border bg-white p-4 prose prose-slate max-w-none prose-p:my-2 prose-headings:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{helpAnswer}</ReactMarkdown>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stocks" className="mt-0 space-y-4">
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
                    type="button"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="flex w-fit items-center gap-2 text-slate-600"
                  >
                    <Settings2 className="h-4 w-4" />
                    Advanced Settings
                    {showAdvancedSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {showAdvancedSettings && (
                    <div className="grid gap-3 rounded-lg border bg-slate-50/50 p-4 md:grid-cols-3">
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
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-700">Market Research Examples:</h4>
                      <div className="flex flex-wrap gap-2">
                        {stockStarterPrompts.map((p) => (
                          <Button key={p} variant="secondary" size="sm" className="text-left" onClick={() => setQuery(p)}>
                            <Sparkles className="mr-1 h-4 w-4 text-amber-500" />
                            {p}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-700">Portfolio Management Examples:</h4>
                      <div className="flex flex-wrap gap-2">
                        {crudStarterPrompts.map((p) => (
                          <Button key={p} variant="secondary" size="sm" className="text-left" onClick={() => setQuery(p)}>
                            <Settings2 className="mr-1 h-4 w-4 text-emerald-500" />
                            {p}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <Button onClick={askStock} disabled={loading} type="button">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
                    </Button>
                    {error && <span className="text-sm text-red-600">{error}</span>}
                  </div>
                  {answer && (
                    <div className="mt-6 space-y-3">
                      <div className="rounded-lg border bg-white p-4 prose prose-slate max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer.answer}</ReactMarkdown>
                      </div>
                      {answer.sources && answer.sources.length > 0 && (
                        <div className="rounded-lg border bg-slate-900 p-3 text-slate-50 mt-4">
                          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300">
                            <ShieldAlert className="h-4 w-4 text-amber-300" />
                            Sources (nearest stocks)
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {answer.sources.map((s) => (
                              <div key={s.symbol} className="rounded-md bg-slate-800/60 p-3 text-sm">
                                <div className="font-semibold">
                                  {s.symbol} — {s.name}
                                </div>
                                <div className="text-xs text-slate-300">Sector: {s.sector}</div>
                                <div className="text-xs text-slate-400">Similarity: {(1 - s.distance).toFixed(3)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
