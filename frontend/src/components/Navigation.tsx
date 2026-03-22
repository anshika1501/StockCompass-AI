
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Search, Loader2, User as UserIcon, LogOut, ChevronDown, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { SearchResult } from "@/lib/stock-data";
import { API_BASE } from "@/lib/api-base";

export default function Navigation() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState<{ name: string, email: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }

    // Check auth
    const checkAuth = () => {
      const storedUser = localStorage.getItem("stock_compass_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("stock_compass_user");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkAuth();
    window.addEventListener("auth_change", checkAuth);

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("auth_change", checkAuth);
    };
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/search/?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data: SearchResult[] = await res.json();
          setResults(data);
          setShowDropdown(true);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (ticker: string) => {
    setShowDropdown(false);
    setQuery("");
    router.push(`/stock/${ticker}`);
  };

  const handleSignOut = () => {
    localStorage.removeItem("stock_compass_user");
    localStorage.removeItem("stock_compass_token");
    setUser(null);
    setShowUserMenu(false);
    window.dispatchEvent(new Event("auth_change"));
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Compass className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-headline font-bold text-primary tracking-tight">StockCompass</span>
        </Link>

        {user && (
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative" ref={wrapperRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
            <Input
              placeholder="Search stocks, tickers..."
              className="pl-10 bg-secondary/50 border-none focus-visible:ring-primary"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
            />
            {showDropdown && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border max-h-80 overflow-y-auto z-50">
                {results.map((r) => (
                  <button
                    key={r.ticker}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    onClick={() => handleSelect(r.ticker)}
                  >
                    <div>
                      <span className="font-bold text-primary mr-2">{r.ticker}</span>
                      <span className="text-sm text-muted-foreground">{r.name}</span>
                    </div>
                    {r.exchange && <span className="text-xs text-muted-foreground">{r.exchange}</span>}
                  </button>
                ))}
              </div>
            )}
            {showDropdown && results.length === 0 && !loading && query.length >= 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border z-50">
                <div className="px-4 py-3 text-sm text-muted-foreground">No results found</div>
              </div>
            )}
          </div>
        )}

        <nav className="flex items-center gap-6">
          {user && (
            <>
              <Link href="/portfolios" className="text-sm font-medium hover:text-primary transition-colors">Portfolios</Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors outline-none cursor-pointer">
                  Markets <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link href="/stocks" className="w-full cursor-pointer">Nifty 50</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/gold-silver" className="w-full cursor-pointer">Bitcoin, Gold &amp; Silver</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/compare" className="w-full cursor-pointer">Compare Assets</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors outline-none cursor-pointer">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Tools <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link href="/nifty50-pca" className="w-full cursor-pointer">Stock Analysis (PCA)</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sentiment" className="w-full cursor-pointer">Sentiment Analysis</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/stock-prediction" className="w-full cursor-pointer">Stock Prediction</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/chatbot" className="w-full cursor-pointer">Chatbot</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-4 w-px bg-border mx-2 hidden sm:block"></div>
            </>
          )}

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-sm font-medium bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-lg transition-colors border border-border/50"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
                {user.name}
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border z-50 py-1 overflow-hidden">
                  <div className="px-4 py-2 border-b border-border/50 mb-1 bg-muted/20">
                    <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
