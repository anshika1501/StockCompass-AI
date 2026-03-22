
import { API_BASE } from "@/lib/api-base";

export interface Stock {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio: number | null;
  peMin: number | null;
  peMax: number | null;
  peAvg: number | null;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  sector: string;
  industry: string;
  description: string;
  website?: string;
  city?: string;
  country?: string;
  employees?: number | null;
  history: { date: string; price: number }[];
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  stockCount?: number;
}

export interface ChatSource {
  symbol: string;
  name: string;
  sector: string;
  distance: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface LlmModel {
  name: string;
  modified_at?: string;
  size?: number;
}

export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
}

// ─── Live Analytics Types ─────────────────────────────────────────

export interface LiveSearchResult {
  symbol: string;
  company_name: string;
  current_price: number;
  min_price: number;
  max_price: number;
  pe_ratio: number | null;
  currency: string;
  discount_level: string;
}

export interface LiveStockDetail {
  symbol: string;
  company_name: string;
  currency: string;
  current_price: number;
  min_price: number;
  max_price: number;
  today_price: number;
  analytics: {
    pe_ratio: number | null;
    discount_level: string;
    opportunity_score: number;
    graph_data: {
      dates: string[];
      price: number[];
      moving_avg: number[];
      period: string;
      interval: string;
    };
    last_updated: string;
  };
}

export interface ComparisonStockInfo {
  symbol: string;
  company_name: string;
  currency: string;
  current_price: number;
  min_price: number;
  max_price: number;
  today_price: number;
  pe_ratio: number | null;
}

export interface ComparisonData {
  period: string;
  interval: string;
  stock_a: ComparisonStockInfo;
  stock_b: ComparisonStockInfo;
  historical: { date: string; price_a: number; price_b: number }[];
  scatter: { date: string; x: number; y: number; y_fit: number }[];
  pearson_correlation: number;
  regression: {
    slope: number;
    intercept: number;
    equation: string;
  };
}

export interface PortfolioAnalysisStock {
  symbol: string;
  company_name: string;
  current_price: number;
  min_price: number;
  max_price: number;
  pe_ratio: number | null;
  pe_min: number | null;
  pe_max: number | null;
  pe_avg: number | null;
  expected_price: number | null;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  discount_level: string;
  opportunity_score: number;
  sector: string;
}

export interface PortfolioAnalysisData {
  stocks: PortfolioAnalysisStock[];
  correlation: Record<string, Record<string, number>>;
}

// ─── Advanced Analysis Types ─────────────────────────────────────

export interface LinearRegressionResult {
  symbol_a: string;
  symbol_b: string;
  slope: number;
  intercept: number;
  r_squared: number;
  equation: string;
}

export interface PCAClusteringResult {
  stocks: Array<{
    symbol: string;
    company_name: string;
    pc1: number;
    pc2: number;
    cluster: number;
    features: {
      rsi: number;
      price: number;
      volatility: number;
      momentum: number;
      trend: number;
    };
  }>;
  explained_variance: number[];
  clusters_count: number;
}

export interface PredictionResult {
  symbol: string;
  model_type: 'lstm' | 'logistic_regression';
  predictions: Array<{
    date: string;
    predicted_value: number;
    actual_value?: number;
    confidence?: number;
  }>;
  accuracy?: number;
  rmse?: number;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/** Fetch all sectors (categories) */
export async function getSectors(): Promise<Sector[]> {
  try {
    return await apiFetch<Sector[]>('/sectors/');
  } catch {
    return [];
  }
}

/** Fetch all active stocks */
export async function getAllStocks(): Promise<Stock[]> {
  return apiFetch<Stock[]>('/stocks/');
}

export async function getNifty50Stocks(): Promise<Stock[]> {
  try {
    return await apiFetch<Stock[]>('/nifty50/');
  } catch {
    return [];
  }
}

/** Fetch stocks for a sector + sector meta */
export async function getStocksBySector(sectorSlug: string): Promise<{ sector: Sector; stocks: Stock[] }> {
  return apiFetch<{ sector: Sector; stocks: Stock[] }>(`/sectors/${sectorSlug}/stocks/`);
}

/** Fetch full stock detail (with history) */
export async function getStockByTicker(ticker: string, period: string = '1mo'): Promise<Stock | null> {
  try {
    return await apiFetch<Stock>(`/stocks/${ticker}/?period=${period}`);
  } catch {
    return null;
  }
}

/** Fetch only chart data for a ticker with a given period */
export async function getStockChart(ticker: string, period: string = '1mo'): Promise<{ date: string; price: number }[]> {
  try {
    return await apiFetch<{ date: string; price: number }[]>(`/stocks/${ticker}/chart/?period=${period}`);
  } catch {
    return [];
  }
}

/** Search for stocks */
export async function searchStocks(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return [];
  try {
    return await apiFetch<SearchResult[]>(`/search/?q=${encodeURIComponent(query)}`);
  } catch {
    return [];
  }
}

// ─── Live Analytics API Functions ─────────────────────────────────

/** Search live stocks from Yahoo Finance */
export async function searchLiveStocks(query: string, limit: number = 10): Promise<LiveSearchResult[]> {
  if (!query || query.trim().length < 1) return [];
  try {
    return await apiFetch<LiveSearchResult[]>(
      `/stocks/live-search/?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  } catch {
    return [];
  }
}

/** Fetch live stock detail with analytics */
export async function fetchLiveStockDetail(
  symbol: string,
  options?: { period?: string; interval?: string }
): Promise<LiveStockDetail | null> {
  try {
    const params = new URLSearchParams({ symbol });
    if (options?.period) params.set('period', options.period);
    if (options?.interval) params.set('interval', options.interval);
    return await apiFetch<LiveStockDetail>(`/stocks/live-detail/?${params.toString()}`);
  } catch {
    return null;
  }
}

/** Compare two live stocks with correlation analysis */
export async function fetchLiveStockComparison(
  symbolA: string,
  symbolB: string,
  options?: { period?: string; interval?: string }
): Promise<ComparisonData> {
  const params = new URLSearchParams({ symbol_a: symbolA, symbol_b: symbolB });
  if (options?.period) params.set('period', options.period);
  if (options?.interval) params.set('interval', options.interval);
  return apiFetch<ComparisonData>(`/stocks/live-compare/?${params.toString()}`);
}

/** Fetch portfolio analysis for a sector */
export async function fetchPortfolioAnalysis(sectorSlug: string): Promise<PortfolioAnalysisData> {
  return apiFetch<PortfolioAnalysisData>(`/sectors/${sectorSlug}/analysis/`);
}

/** Linear regression analysis for two stocks */
export async function fetchLinearRegression(symbolA: string, symbolB: string, period: string = '5y'): Promise<LinearRegressionResult> {
  const params = new URLSearchParams({ symbol_a: symbolA, symbol_b: symbolB, period });
  return apiFetch<LinearRegressionResult>(`/stocks/linear-regression/?${params.toString()}`);
}

/** PCA clustering analysis for up to 10 stocks */
export async function fetchPCAClustering(symbols: string[], period: string = '5y'): Promise<PCAClusteringResult> {
  const params = new URLSearchParams({ period, symbols: symbols.slice(0, 10).join(',') });
  return apiFetch<PCAClusteringResult>(`/stocks/pca-clustering/?${params.toString()}`);
}

/** LSTM prediction for a stock */
export async function fetchLSTMPrediction(symbol: string, period: string = '5y'): Promise<PredictionResult> {
  const params = new URLSearchParams({ symbol, period });
  return apiFetch<PredictionResult>(`/stocks/lstm-prediction/?${params.toString()}`);
}

/** Logistic regression for price direction prediction */
export async function fetchLogisticRegression(symbol: string, period: string = '5y'): Promise<PredictionResult> {
  const params = new URLSearchParams({ symbol, period });
  return apiFetch<PredictionResult>(`/stocks/logistic-regression/?${params.toString()}`);
}

// ─── Compare Analysis (DB-first) ─────────────────────────────────

export interface CompareStockDetail {
  symbol: string;
  name: string;
  currency: string;
  current_price: number;
  min_price: number;
  max_price: number;
  pe_ratio: number | null;
  pe_min: number | null;
  pe_max: number | null;
  pe_avg: number | null;
  expected_price: number | null;
  discount_level: string;
  opportunity_score: number;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  sector: string;
  industry: string;
}

export interface LRPair {
  symbol_a: string;
  symbol_b: string;
  slope: number;
  intercept: number;
  r_squared: number;
  pearson: number;
  equation: string;
  scatter: { x: number; y: number; y_fit: number }[];
}

export interface LogisticStockResult {
  symbol: string;
  base_probability_up: number;
  overall_direction: 'UP' | 'DOWN';
  accuracy: number;
  history: { date: string; price: number; change_pct: number; direction: string; probability_up: number }[];
  forecast: { date: string; probability_up: number; predicted_direction: string; confidence: number }[];
}

export interface CompareAnalysisResult {
  symbols: string[];
  period: string;
  stock_details: CompareStockDetail[];
  linear_regression: LRPair[];
  pca_clustering: PCAClusteringResult | null;
  logistic_regression: LogisticStockResult[];
  correlation_matrix: Record<string, Record<string, number>>;
}

/** Fetch full DB-first compare analysis for a list of symbols */
export async function fetchCompareAnalysis(
  symbols: string[],
  period: string = '5y'
): Promise<CompareAnalysisResult> {
  const params = new URLSearchParams({ symbols: symbols.join(','), period });
  return apiFetch<CompareAnalysisResult>(`/stocks/compare-analysis/?${params.toString()}`);
}

// ─── Gold & Silver Analysis Types ──────────────────────────────

export interface GoldSilverPricePoint {
  date: string;
  price: number;
}

export interface GoldSilverAsset {
  current: number;
  change: number;
  change_percent: number;
  currency: string;
  history: {
    '1d': GoldSilverPricePoint[];
    '1mo': GoldSilverPricePoint[];
    '1y': GoldSilverPricePoint[];
    '5y': GoldSilverPricePoint[];
  };
}

export interface ShapSampleValue {
  lag_1: number;
  lag_5: number;
  lag_10: number;
  momentum_5: number;
  volatility_10: number;
}

export interface GoldSilverAnalysis {
  prices: {
    gold: GoldSilverAsset;
    silver: GoldSilverAsset;
  };
  correlation: {
    coefficient: number;
    interpretation: string;
  };
  linear_regression:
  | {
    r_squared: number;
    intercept: number;
    rmse: number;
    coefficients: Record<string, number>;
  }
  | { error: string };
  shap:
  | {
    feature_names: string[];
    mean_abs_shap: Record<string, number>;
    sample_values: Record<string, number>[];
  }
  | { error: string };
  lime:
  | {
    feature_names: string[];
    weights: Record<string, number>;
    prediction: number;
    intercept: number;
  }
  | { error: string };
  trajectory:
  | {
    historical: GoldSilverPricePoint[];
    forecast: (GoldSilverPricePoint & { lower: number; upper: number })[];
    rmse: number;
  }
  | { error: string };
}

export async function fetchGoldSilver(): Promise<GoldSilverAnalysis> {
  return apiFetch<GoldSilverAnalysis>('/gold-silver/');
}

export interface AssetForecast {
  ticker: string;
  model?: string;
  rmse: number;
  historical: { date: string; price: number }[];
  forecast: { date: string; price: number; lower: number; upper: number }[];
  error?: string;
}

export async function fetchAssetForecast(ticker: string, model: string, horizon: string = '30d'): Promise<AssetForecast> {
  return apiFetch<AssetForecast>(`/forecast/?ticker=${encodeURIComponent(ticker)}&model=${encodeURIComponent(model)}&horizon=${encodeURIComponent(horizon)}`);
}

export async function chatWithStocks(query: string, model?: string, embedModel?: string, baseUrl?: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chatbot/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, model, embed_model: embedModel, base_url: baseUrl }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function fetchLlmModels(baseUrl?: string): Promise<{ base_url: string; models: LlmModel[] }> {
  const url = baseUrl ? `${API_BASE}/llm/models/?base_url=${encodeURIComponent(baseUrl)}` : `${API_BASE}/llm/models/`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load models (${res.status})`);
  }
  return res.json();
}

// ─── Nifty 50 PCA + K-Means Types ─────────────────────────────

export interface Nifty50PCAPoint {
  symbol: string;
  full_symbol: string;
  name: string;
  current_price: number;
  annual_return: number;
  volatility: number;
  momentum_3m: number;
  pe_ratio: number | null;
  discount: string;
  opportunity_score: number;
  pos_52w: number;
  pc1: number;
  pc2: number;
  cluster: number;
}

export interface Nifty50PCAResult {
  points: Nifty50PCAPoint[];
  n_clusters: number;
  explained_variance: number[];
  feature_names: string[];
  loadings: Record<string, { pc1: number; pc2: number }>;
}

export async function fetchNifty50PCA(nClusters: number = 4): Promise<Nifty50PCAResult> {
  return apiFetch<Nifty50PCAResult>(`/nifty50-pca/?n_clusters=${nClusters}`);
}

/** Format money with currency */
export function formatMoney(value: number | null | undefined, currency: string = 'USD'): string {
  if (value == null || isNaN(value)) return '-';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `₹${value.toFixed(2)}`;
  }
}
