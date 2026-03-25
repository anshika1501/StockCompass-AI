"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Trash2,
  BriefcaseBusiness,
  Search,
  LogIn,
  Pencil,
  Check,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  getPortfolios,
  createPortfolio,
  addHolding,
  deleteHolding,
  deletePortfolio,
  updatePortfolio,
  getToken,
  Portfolio,
  searchLiveStocks,
  LiveSearchStock,
} from "@/lib/portfolio-data";

const PORTFOLIO_SUGGESTIONS = [
  "NIFTY 50",
  "Bank Nifty",
  "IT Index",
  "Top Dividend Yielders",
];

/** Inputs aligned with dashboard light pane (portfolios / sector pages) */
function inputClass() {
  return "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#4F8DF7] focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/25";
}

export default function MyPortfolioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addTickerParam = searchParams.get("addTicker");

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioDescription, setNewPortfolioDescription] = useState("");
  const [isCreatingPortfolio, setIsCreatingPortfolio] = useState(false);

  const [newHolding, setNewHolding] = useState({
    ticker: "",
    company_name: "",
    quantity: 1,
    buy_price: 0,
  });
  const [isAddingHolding, setIsAddingHolding] = useState(false);
  const [deletingHoldingId, setDeletingHoldingId] = useState<number | null>(null);

  const [tickerSuggestions, setTickerSuggestions] = useState<LiveSearchStock[]>([]);
  const [isSearchingTicker, setIsSearchingTicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const createNameRef = useRef<HTMLInputElement>(null);
  const addTickerInputRef = useRef<HTMLInputElement>(null);
  const addHoldingSectionRef = useRef<HTMLDivElement>(null);
  const didPrefillRef = useRef(false);
  const suppressSuggestionsRef = useRef(false);

  const [editingPortfolioId, setEditingPortfolioId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingPortfolioMeta, setIsSavingPortfolioMeta] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  useEffect(() => {
    if (isLoggedIn === true) fetchPortfolios();
    else if (isLoggedIn === false) setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        if (!suppressSuggestionsRef.current && results.length > 0) setShowSuggestions(true);
        else setShowSuggestions(false);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearchingTicker(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [newHolding.ticker]);

  // If user clicked a stock -> open My Portfolio and prefill Add Holding.
  useEffect(() => {
    if (!addTickerParam) return;
    if (isLoggedIn !== true) return;
    if (didPrefillRef.current) return;
    // Wait until portfolio list is loaded so we can safely select one.
    if (portfolios.length === 0) return;

    didPrefillRef.current = true;

    const run = async () => {
      const ticker = addTickerParam.trim().toUpperCase();
      suppressSuggestionsRef.current = true;
      try {
        const results = await searchLiveStocks(ticker);
        const match = results.find((r) => r.symbol.toUpperCase() === ticker) || results[0];

        setNewHolding((prev) => ({
          ...prev,
          ticker: match?.symbol ?? ticker,
          company_name: match?.company_name ?? "",
          buy_price: match?.current_price ?? 0,
          quantity: prev.quantity || 1,
        }));

        setSelectedPortfolioId((prev) => prev ?? portfolios[0]?.id ?? null);

        setShowSuggestions(false);
        setTickerSuggestions([]);

        addHoldingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        requestAnimationFrame(() => addTickerInputRef.current?.focus());
      } finally {
        // allow the user to use the dropdown after the prefill completes
        setTimeout(() => {
          suppressSuggestionsRef.current = false;
        }, 600);
      }
    };

    void run();
  }, [addTickerParam, isLoggedIn, portfolios]);

  const fetchPortfolios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPortfolios();
      setPortfolios(data);
      if (data.length > 0) setSelectedPortfolioId((prev) => prev ?? data[0].id);
      else setSelectedPortfolioId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load portfolios");
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
      const created = await createPortfolio(
        newPortfolioName.trim(),
        newPortfolioDescription.trim()
      );
      // Optimistically show it immediately...
      setPortfolios((prev) => [...prev, created]);
      setSelectedPortfolioId(created.id);
      // ...and also refresh from backend to guarantee correctness.
      await fetchPortfolios();
      setSuccessMessage("Portfolio created.");
      setTimeout(() => setSuccessMessage(null), 3000);
      setNewPortfolioName("");
      setNewPortfolioDescription("");
      setEditingPortfolioId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setIsCreatingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this portfolio and all its holdings?")) return;
    setError(null);
    try {
      await deletePortfolio(id);
      const remaining = portfolios.filter((p) => p.id !== id);
      setPortfolios(remaining);
      if (selectedPortfolioId === id) setSelectedPortfolioId(remaining[0]?.id ?? null);
      if (editingPortfolioId === id) setEditingPortfolioId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const startEditPortfolio = (p: Portfolio, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPortfolioId(p.id);
    setEditName(p.name);
    setEditDescription(p.description ?? "");
  };

  const cancelEditPortfolio = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingPortfolioId(null);
  };

  const saveEditPortfolio = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editName.trim()) return;
    setIsSavingPortfolioMeta(true);
    setError(null);
    try {
      const updated = await updatePortfolio(id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setPortfolios((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingPortfolioId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSavingPortfolioMeta(false);
    }
  };

  const handleSelectSuggestion = (stock: LiveSearchStock) => {
    setNewHolding({
      ticker: stock.symbol,
      company_name: stock.company_name,
      quantity: newHolding.quantity,
      buy_price: stock.current_price,
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
      setPortfolios((prev) =>
        prev.map((p) =>
          p.id === selectedPortfolioId ? { ...p, holdings: [...p.holdings, added] } : p
        )
      );
      setNewHolding({ ticker: "", company_name: "", quantity: 1, buy_price: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Add holding failed");
    } finally {
      setIsAddingHolding(false);
    }
  };

  const handleDeleteHolding = async (holdingId: number) => {
    setDeletingHoldingId(holdingId);
    setError(null);
    try {
      await deleteHolding(holdingId);
      setPortfolios((prev) =>
        prev.map((p) => ({
          ...p,
          holdings: p.holdings.filter((h) => Number(h.id) !== Number(holdingId)),
        }))
      );
      setSuccessMessage("Holding removed.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error("Delete holding failed", err);
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingHoldingId(null);
    }
  };

  const focusCreate = () => {
    createNameRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoggedIn === null) return null;

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <LogIn className="mx-auto mb-4 h-12 w-12 text-[#4F8DF7]" />
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">Sign in required</h2>
          <p className="mb-6 text-sm text-slate-600">
            Log in to create portfolios and track holdings.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full rounded-xl bg-[#4F8DF7] py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-[#4F8DF7]" />
      </div>
    );
  }

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId);
  const filteredHoldings =
    selectedPortfolio?.holdings.filter(
      (h) =>
        h.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

  const totalInvestment =
    selectedPortfolio?.holdings.reduce((sum, h) => sum + h.quantity * Number(h.buy_price), 0) ?? 0;
  const totalHoldings = selectedPortfolio?.holdings.length ?? 0;

  return (
        <div className="mx-auto max-w-6xl space-y-8 text-slate-900">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-headline font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#4F8DF7] ring-1 ring-blue-100">
                <BriefcaseBusiness className="h-6 w-6" />
              </span>
              Portfolios
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Create books, edit metadata, and manage positions in one place.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <span className="mt-0.5 font-semibold">Error</span>
            <p className="flex-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="flex-1 text-sm">{successMessage}</p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Create portfolio */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-7">
          <h2 className="text-lg font-headline font-extrabold text-slate-900">Create portfolio</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Name your book and add an optional note. You can edit both later.
          </p>

          <form onSubmit={handleCreatePortfolio} className="mt-5 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Portfolio name
                </label>
                <input
                  ref={createNameRef}
                  type="text"
                  placeholder="e.g. Long-term quality"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className={inputClass()}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="Thesis, horizon, or rules for this sleeve"
                  value={newPortfolioDescription}
                  onChange={(e) => setNewPortfolioDescription(e.target.value)}
                  className={inputClass()}
                />
              </div>
              <button
                type="submit"
                disabled={isCreatingPortfolio || !newPortfolioName.trim()}
                className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4F8DF7] px-6 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Plus className="h-4 w-4" />
                {isCreatingPortfolio ? "Creating…" : "Create portfolio"}
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {PORTFOLIO_SUGGESTIONS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setNewPortfolioName(label)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#4F8DF7]/40 hover:bg-blue-50 hover:text-[#4F8DF7]"
                  >
                    + {label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </section>

        {portfolios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-16 text-center">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-[#4F8DF7]" />
            <p className="text-lg font-semibold text-slate-900">No portfolios yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Use the form above to create your first portfolio, then add tickers and quantities below.
            </p>
          </div>
        ) : (
          <>
            <section>
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Your portfolios</h2>
                  <p className="text-sm text-slate-600">
                    Select a card to view holdings, add positions, or remove lines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={focusCreate}
                  className="text-sm font-semibold text-[#4F8DF7] hover:text-blue-600"
                >
                  + New portfolio
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {portfolios.map((p) => {
                  const isSelected = selectedPortfolioId === p.id;
                  const isEditing = editingPortfolioId === p.id;
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedPortfolioId(p.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedPortfolioId(p.id);
                        }
                      }}
                      className={`relative rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#4F8DF7]/40 ${
                        isSelected
                          ? "border-[#4F8DF7] ring-2 ring-[#4F8DF7]/20 shadow-[0_8px_30px_rgb(79,141,247,0.12)]"
                          : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#4F8DF7] ring-1 ring-blue-100">
                          <BriefcaseBusiness className="h-5 w-5" />
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => startEditPortfolio(p, e)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                            title="Edit portfolio"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePortfolio(p.id, e)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete portfolio"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className={inputClass()}
                            placeholder="Name"
                          />
                          <input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className={inputClass()}
                            placeholder="Description"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isSavingPortfolioMeta || !editName.trim()}
                              onClick={(e) => saveEditPortfolio(p.id, e)}
                              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#4F8DF7] py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                            >
                              {isSavingPortfolioMeta ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditPortfolio}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-slate-900">{p.name}</h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                            {(p.description ?? "").trim() || "No description provided."}
                          </p>
                          <p className="mt-3 text-xs font-medium text-slate-500">
                            {p.holdings.length} position{p.holdings.length !== 1 ? "s" : ""}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {selectedPortfolio && (
              <section className="space-y-5 border-t border-slate-200 pt-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Cost basis (INR)
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                      ₹
                      {totalInvestment.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Positions
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{totalHoldings}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-[#4F8DF7]/8 to-blue-50/80 p-5 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4F8DF7]">
                      Active book
                    </p>
                    <p className="mt-1 truncate text-lg font-semibold text-slate-900">{selectedPortfolio.name}</p>
                  </div>
                </div>

                <div
                  ref={addHoldingSectionRef}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6"
                >
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Plus className="h-4 w-4 text-[#4F8DF7]" />
                    Add holding — {selectedPortfolio.name}
                  </h3>
                  <form onSubmit={handleAddHolding} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative sm:col-span-1" ref={suggestionsRef}>
                      <input
                        ref={addTickerInputRef}
                        type="text"
                        placeholder="Ticker (e.g. RELIANCE)"
                        required
                        value={newHolding.ticker}
                        autoComplete="off"
                        onChange={(e) => {
                          setNewHolding({ ...newHolding, ticker: e.target.value.toUpperCase() });
                          setShowSuggestions(true);
                        }}
                        className={inputClass()}
                      />
                      {isSearchingTicker && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-[#4F8DF7]" />
                      )}
                      {showSuggestions && tickerSuggestions.length > 0 && (
                        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                          {tickerSuggestions.map((stk, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectSuggestion(stk)}
                              className="flex w-full flex-col border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-blue-50/80"
                            >
                              <span className="text-sm font-semibold text-slate-900">{stk.symbol}</span>
                              <span className="truncate text-xs text-slate-500">{stk.company_name}</span>
                              <span className="text-xs font-medium text-[#4F8DF7]">
                                ₹{stk.current_price}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Company name"
                      required
                      value={newHolding.company_name}
                      onChange={(e) =>
                        setNewHolding({ ...newHolding, company_name: e.target.value })
                      }
                      className={inputClass()}
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      min={1}
                      required
                      value={newHolding.quantity || ""}
                      onChange={(e) =>
                        setNewHolding({
                          ...newHolding,
                          quantity: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className={inputClass()}
                    />
                    <input
                      type="number"
                      placeholder="Buy price (₹)"
                      min={0}
                      step="0.01"
                      required
                      value={newHolding.buy_price || ""}
                      onChange={(e) =>
                        setNewHolding({
                          ...newHolding,
                          buy_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={inputClass()}
                    />
                    <button
                      type="submit"
                      disabled={isAddingHolding}
                      className="sm:col-span-2 lg:col-span-4 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isAddingHolding ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Adding…
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add to portfolio
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Holdings</h3>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4F8DF7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F8DF7]/20 sm:w-52"
                      />
                    </div>
                  </div>

                  {filteredHoldings.length === 0 ? (
                    <div className="px-5 py-14 text-center text-sm text-slate-600">
                      {searchTerm
                        ? "No rows match your search."
                        : "No positions yet. Add a ticker above."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            <th className="px-5 py-3">Asset</th>
                            <th className="px-5 py-3 text-right">Qty</th>
                            <th className="px-5 py-3 text-right">Buy</th>
                            <th className="px-5 py-3 text-right">Cost</th>
                            <th className="px-5 py-3 text-right">As of</th>
                            <th className="px-5 py-3 text-center"> </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredHoldings.map((h) => (
                            <tr key={h.id} className="hover:bg-slate-50/80">
                              <td className="px-5 py-3">
                                <div className="font-semibold text-slate-900">{h.ticker}</div>
                                <div className="max-w-[200px] truncate text-xs text-slate-500">
                                  {h.company_name}
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                                {h.quantity}
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                                ₹
                                {Number(h.buy_price).toLocaleString("en-IN", {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                                ₹
                                {(h.quantity * Number(h.buy_price)).toLocaleString("en-IN", {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-5 py-3 text-right text-xs text-slate-500">
                                {new Date(h.buy_time).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHolding(h.id)}
                                  disabled={deletingHoldingId === h.id}
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-40"
                                >
                                  {deletingHoldingId === h.id ? "…" : "Remove"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-100 bg-slate-50/60">
                            <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-slate-500">
                              Total cost
                            </td>
                            <td className="px-5 py-3 text-right text-sm font-bold tabular-nums text-[#4F8DF7]">
                              ₹
                              {filteredHoldings
                                .reduce((s, h) => s + h.quantity * Number(h.buy_price), 0)
                                .toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
    </div>
  );
}
