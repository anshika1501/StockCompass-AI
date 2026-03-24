"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, TrendingUp, AlertCircle, BriefcaseBusiness,
  Search, LogIn, Pencil, Check, X, Loader2, Sparkles
} from "lucide-react";
import {
  getPortfolios, createPortfolio, addHolding, deleteHolding,
  deletePortfolio, renamePortfolio, getToken, Portfolio,
  searchLiveStocks, LiveSearchStock
} from "@/lib/portfolio-data";

export default function MyPortfolioPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Create portfolio form
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [isCreatingPortfolio, setIsCreatingPortfolio] = useState(false);

  // Add holding form
  const [newHolding, setNewHolding] = useState({ ticker: "", company_name: "", quantity: 1, buy_price: 0 });
  const [isAddingHolding, setIsAddingHolding] = useState(false);
  const [deletingHoldingId, setDeletingHoldingId] = useState<number | null>(null);

  // Auto-complete state
  const [tickerSuggestions, setTickerSuggestions] = useState<LiveSearchStock[]>([]);
  const [isSearchingTicker, setIsSearchingTicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  // Rename inline state
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Check auth on mount
  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (isLoggedIn === true) fetchPortfolios();
    else if (isLoggedIn === false) setLoading(false);
  }, [isLoggedIn]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ticker search debounce
  useEffect(() => {
    if (newHolding.ticker.length < 2) {
      setTickerSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingTicker(true);
      try {
        const results = await searchLiveStocks(newHolding.ticker);
        setTickerSuggestions(results);
        if (results.length > 0) setShowSuggestions(true);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearchingTicker(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [newHolding.ticker]);

  const fetchPortfolios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPortfolios();
      setPortfolios(data);
      if (data.length > 0) setSelectedPortfolioId(prev => prev ?? data[0].id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPortfolioName.trim()) return;
    setIsCreatingPortfolio(true);
    setError(null);
    try {
      const created = await createPortfolio(newPortfolioName.trim());
      setPortfolios(prev => [...prev, created]);
      setSelectedPortfolioId(created.id);
      setNewPortfolioName("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreatingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (id: number) => {
    if (!confirm("Delete this portfolio and all its holdings?")) return;
    setError(null);
    try {
      await deletePortfolio(id);
      const remaining = portfolios.filter(p => p.id !== id);
      setPortfolios(remaining);
      if (selectedPortfolioId === id) setSelectedPortfolioId(remaining[0]?.id ?? null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRenamePortfolio = async (id: number) => {
    if (!renameValue.trim()) return;
    setError(null);
    try {
      const updated = await renamePortfolio(id, renameValue.trim());
      setPortfolios(prev => prev.map(p => p.id === id ? { ...p, name: updated.name } : p));
      setRenamingId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectSuggestion = (stock: LiveSearchStock) => {
    setNewHolding({
      ticker: stock.symbol,
      company_name: stock.company_name,
      quantity: newHolding.quantity,
      buy_price: stock.current_price
    });
    setTickerSuggestions([]);
    setShowSuggestions(false);
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolioId) return;
    setIsAddingHolding(true);
    setError(null);
    try {
      const added = await addHolding(
        selectedPortfolioId,
        newHolding.ticker,
        newHolding.company_name,
        newHolding.quantity,
        newHolding.buy_price
      );
      setPortfolios(prev =>
        prev.map(p => p.id === selectedPortfolioId ? { ...p, holdings: [...p.holdings, added] } : p)
      );
      setNewHolding({ ticker: "", company_name: "", quantity: 1, buy_price: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAddingHolding(false);
    }
  };

  const handleDeleteHolding = async (holdingId: number) => {
    setDeletingHoldingId(holdingId);
    setError(null);
    try {
      await deleteHolding(holdingId);
      setPortfolios(prev =>
        prev.map(p => ({
          ...p,
          holdings: p.holdings.filter(h => Number(h.id) !== Number(holdingId))
        }))
      );
      setSuccessMessage("Stock deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Delete holding failed", err);
      setError(err.message);
    } finally {
      setDeletingHoldingId(null);
    }
  };

  const focusCreate = () => {
    createInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoggedIn === null) return null;

  if (!isLoggedIn) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm max-w-md w-full">
          <LogIn className="w-12 h-12 text-[#4F8DF7] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in to continue</h2>
          <p className="text-slate-500 mb-6">You need to be logged in to manage your investment portfolio.</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 bg-[#4F8DF7] hover:bg-blue-600 text-white font-semibold rounded-xl transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F8DF7]"></div>
      </div>
    );
  }

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);
  const filteredHoldings = selectedPortfolio?.holdings.filter(h =>
    h.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const totalInvestment = selectedPortfolio?.holdings.reduce((sum, h) => sum + h.quantity * h.buy_price, 0) ?? 0;
  const totalHoldings = selectedPortfolio?.holdings.length ?? 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <span className="p-2 bg-blue-100 rounded-xl text-[#4F8DF7]">
              <BriefcaseBusiness className="w-7 h-7" />
            </span>
            My Portfolios
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Create portfolios and track your stock holdings</p>
        </div>

        <form onSubmit={handleCreatePortfolio} className="flex gap-2 w-full md:w-auto">
          <input
            ref={createInputRef}
            type="text" placeholder="New Portfolio Name"
            value={newPortfolioName}
            onChange={e => setNewPortfolioName(e.target.value)}
            className="flex-1 md:w-56 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/40 shadow-sm"
          />
          <button
            type="submit"
            disabled={isCreatingPortfolio || !newPortfolioName.trim()}
            className="px-5 py-2.5 bg-[#4F8DF7] hover:bg-[#2563EB] text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {isCreatingPortfolio ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      {/* ---- Error Banner ---- */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xl leading-none">&times;</button>
        </div>
      )}

      {/* ---- Success Banner ---- */}
      {successMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-[#4F8DF7] animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Action Confirmed</p>
            <p className="text-sm">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-blue-400 hover:text-[#4F8DF7] text-xl leading-none">&times;</button>
        </div>
      )}

      {/* ---- Empty State ---- */}
      {portfolios.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-md max-w-2xl mx-auto border-dashed border-2">
          <div className="p-4 bg-blue-50 rounded-2xl w-fit mx-auto mb-6 transform transition-transform hover:scale-110">
            <Sparkles className="w-12 h-12 text-[#4F8DF7]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Welcome to Your Portfolio Hub</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 font-medium">
            Start organizing your investments by creating your first custom portfolio.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
             <input
              type="text" placeholder="e.g. Long Term Savings"
              value={newPortfolioName}
              onChange={e => setNewPortfolioName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePortfolio(); }}
              className="w-full sm:w-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/40 transition-all font-medium"
            />
            <button
              onClick={() => handleCreatePortfolio()}
              disabled={isCreatingPortfolio || !newPortfolioName.trim()}
              className="w-full sm:w-auto px-8 py-3 bg-[#4F8DF7] hover:bg-[#2563EB] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              Get Started
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ---- Portfolio Sidebar ---- */}
          <div className="lg:col-span-1 space-y-2">
            <div className="flex justify-between items-center px-1 mb-3">
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Your Portfolios ({portfolios.length})</p>
              <button 
                onClick={focusCreate}
                className="p-1 text-slate-400 hover:text-[#4F8DF7] hover:bg-blue-50 rounded-lg transition-all"
                title="Create New"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {portfolios.map(p => (
              <div key={p.id} className={`rounded-2xl border transition-all ${selectedPortfolioId === p.id ? "bg-[#4F8DF7] border-[#4F8DF7] shadow-md scale-[1.02]" : "bg-white border-slate-100 hover:border-[#4F8DF7]/40"}`}>
                {renamingId === p.id ? (
                  <div className="flex items-center gap-1 px-3 py-2">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleRenamePortfolio(p.id); if (e.key === "Escape") setRenamingId(null); }}
                      className="flex-1 bg-white/20 text-white placeholder-white/60 text-sm border border-white/30 rounded-lg px-2 py-1 focus:outline-none"
                    />
                    <button onClick={() => handleRenamePortfolio(p.id)} className="p-1 text-white/80 hover:text-white"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setRenamingId(null)} className="p-1 text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1">
                    <button
                      onClick={() => setSelectedPortfolioId(p.id)}
                      className="flex-1 text-left py-2.5 font-medium text-sm group"
                    >
                      <div className={`truncate max-w-[120px] ${selectedPortfolioId === p.id ? "text-white" : "text-slate-700 font-semibold"}`}>{p.name}</div>
                      <div className={`text-[11px] mt-0.5 ${selectedPortfolioId === p.id ? "text-blue-100" : "text-slate-400"}`}>
                        {p.holdings.length} stock{p.holdings.length !== 1 ? "s" : ""}
                      </div>
                    </button>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => { setRenamingId(p.id); setRenameValue(p.name); }}
                        className={`p-1.5 rounded-lg transition-colors ${selectedPortfolioId === p.id ? "text-white/70 hover:text-white hover:bg-white/20" : "text-slate-400 hover:text-[#4F8DF7] hover:bg-blue-50"}`}
                        title="Rename"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePortfolio(p.id)}
                        className={`p-1.5 rounded-lg transition-colors ${selectedPortfolioId === p.id ? "text-white/70 hover:text-red-200 hover:bg-white/20" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ---- Main Panel ---- */}
          <div className="lg:col-span-3 space-y-5">
            {selectedPortfolio && (
              <>
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-1">Total Investment</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      ₹{totalInvestment.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-1">Holdings</p>
                    <p className="text-2xl font-extrabold text-slate-900">{totalHoldings}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#4F8DF7]/10 to-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-[11px] font-bold tracking-widest text-[#4F8DF7] uppercase mb-1">Selected Portfolio</p>
                    <p className="text-lg font-bold text-slate-900 truncate">{selectedPortfolio.name}</p>
                  </div>
                </div>

                {/* Add Holding Form */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#4F8DF7]" />
                    Add Stock to &quot;{selectedPortfolio.name}&quot;
                  </h3>
                  <form onSubmit={handleAddHolding} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Ticker Input with Suggestion */}
                    <div className="relative" ref={suggestionsRef}>
                      <div className="relative">
                        <input
                          type="text" placeholder="Ticker (e.g. RELIANCE)" required
                          value={newHolding.ticker}
                          autoComplete="off"
                          onChange={e => {
                            setNewHolding({ ...newHolding, ticker: e.target.value.toUpperCase() });
                            setShowSuggestions(true);
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/40 focus:bg-white transition-all pr-8"
                        />
                        {isSearchingTicker && (
                          <div className="absolute right-2.5 top-2.5">
                            <Loader2 className="w-4 h-4 animate-spin text-[#4F8DF7]" />
                          </div>
                        )}
                      </div>
                      
                      {showSuggestions && tickerSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto overflow-x-hidden">
                          {tickerSuggestions.map((stk, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectSuggestion(stk)}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 flex flex-col transition-colors border-b border-slate-50 last:border-0"
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="font-bold text-slate-900 text-[13px]">{stk.symbol}</span>
                                <span className="text-[12px] font-semibold text-[#4F8DF7]">₹{stk.current_price}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 truncate w-full">{stk.company_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="text" placeholder="Company Name" required
                      value={newHolding.company_name}
                      onChange={e => setNewHolding({ ...newHolding, company_name: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/40 focus:bg-white transition-all"
                    />
                    <input
                      type="number" placeholder="Qty" min="1" required
                      value={newHolding.quantity || ""}
                      onChange={e => setNewHolding({ ...newHolding, quantity: parseInt(e.target.value) })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/40 focus:bg-white transition-all"
                    />
                    <input
                      type="number" placeholder="Buy Price (₹)" min="0" step="0.01" required
                      value={newHolding.buy_price || ""}
                      onChange={e => setNewHolding({ ...newHolding, buy_price: parseFloat(e.target.value) })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/40 focus:bg-white transition-all"
                    />
                    <button
                      type="submit" disabled={isAddingHolding}
                      className="col-span-2 md:col-span-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
                    >
                      {isAddingHolding
                        ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Adding...</>
                        : <><Plus className="w-4 h-4" /> Add to Portfolio</>
                      }
                    </button>
                  </form>
                </div>

                {/* Holdings Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-900">Current Holdings</h3>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text" placeholder="Search stocks..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/30 focus:bg-white w-40"
                      />
                    </div>
                  </div>

                  {filteredHoldings.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm">
                      {searchTerm ? "No stocks match your search." : "No stocks yet. Use the form above to add your first holding."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/60">
                            <th className="px-5 py-3">Asset</th>
                            <th className="px-5 py-3 text-right">Qty</th>
                            <th className="px-5 py-3 text-right">Buy Price</th>
                            <th className="px-5 py-3 text-right">Total Value</th>
                            <th className="px-5 py-3 text-right">Bought On</th>
                            <th className="px-5 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredHoldings.map(h => (
                            <tr key={h.id} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-slate-900 text-sm">{h.ticker}</div>
                                <div className="text-[12px] text-slate-500 truncate max-w-[160px]">{h.company_name}</div>
                              </td>
                              <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-700">{h.quantity}</td>
                              <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-700">
                                ₹{Number(h.buy_price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-3.5 text-right text-sm font-bold text-slate-900">
                                ₹{(h.quantity * Number(h.buy_price)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-3.5 text-right text-xs text-slate-400">
                                {new Date(h.buy_time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                <button
                                  onClick={() => handleDeleteHolding(h.id)}
                                  disabled={deletingHoldingId === h.id}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Remove holding"
                                >
                                  {deletingHoldingId === h.id 
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Trash2 className="w-4 h-4" />
                                  }
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {filteredHoldings.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-50 border-t border-slate-100">
                              <td colSpan={3} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</td>
                              <td className="px-5 py-3 text-right text-sm font-extrabold text-[#4F8DF7]">
                                ₹{filteredHoldings.reduce((s, h) => s + h.quantity * Number(h.buy_price), 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                              </td>
                              <td colSpan={2} />
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
