"""
Analytics services for stock comparison, portfolio analysis, and opportunity scoring.
Adapted from the Equity Lens reference project for the StockCompass backend.
"""
import yfinance as yf
import pandas as pd
import numpy as np
from math import sqrt
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

ALLOWED_PERIODS = {"1mo", "3mo", "6mo", "1y", "2y", "3y", "5y", "10y", "max"}
ALLOWED_INTERVALS = {"1d", "1wk", "1mo"}


# ─── Utility helpers ───────────────────────────────────────────────

def _normalize_period(period):
    value = (period or "1y").strip().lower()
    return value if value in ALLOWED_PERIODS else "1y"


def _normalize_interval(interval):
    value = (interval or "1d").strip().lower()
    return value if value in ALLOWED_INTERVALS else "1d"


def _infer_currency(symbol, reported_currency=None):
    if reported_currency:
        return str(reported_currency).upper()
    symbol_upper = str(symbol or "").upper()
    if symbol_upper.endswith(".NS") or symbol_upper.endswith(".BO"):
        return "INR"
    return "USD"


def _discount_level(min_price, max_price, current_price):
    if max_price <= min_price:
        return "MEDIUM"
    price_position = (current_price - min_price) / (max_price - min_price)
    if price_position <= 0.33:
        return "HIGH"
    if price_position <= 0.66:
        return "MEDIUM"
    return "LOW"


def _opportunity_score(pe_ratio, discount_level):
    """Simple opportunity scoring: lower PE + higher discount = better score."""
    pe = pe_ratio if pe_ratio and pe_ratio > 0 else 50.0
    discount_map = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
    discount_val = discount_map.get(str(discount_level).upper(), 1)

    # Normalize PE: lower is better (capped at 0-100 range)
    pe_score = max(0, min(100, 100 - pe))
    # Discount contributes 0-30 points
    discount_score = discount_val * 10

    return round(min(100, (pe_score * 0.7) + (discount_score * 0.3)), 1)


def _extract_prices(history):
    if "Adj Close" in history.columns:
        series = history["Adj Close"].dropna()
        if not series.empty:
            return series
    if "Close" in history.columns:
        return history["Close"].dropna()
    return history.iloc[:, 0].dropna()


def _compute_regression(points):
    n = len(points)
    if n < 2:
        return {"slope": 0.0, "intercept": 0.0, "correlation": 0.0}

    sum_x = sum(p["x"] for p in points)
    sum_y = sum(p["y"] for p in points)
    sum_xy = sum(p["x"] * p["y"] for p in points)
    sum_x2 = sum(p["x"] ** 2 for p in points)
    sum_y2 = sum(p["y"] ** 2 for p in points)

    denom = (n * sum_x2) - (sum_x ** 2)
    slope = 0.0 if denom == 0 else ((n * sum_xy) - (sum_x * sum_y)) / denom
    intercept = (sum_y - (slope * sum_x)) / n

    corr_num = (n * sum_xy) - (sum_x * sum_y)
    corr_denom = sqrt(((n * sum_x2) - (sum_x ** 2)) * ((n * sum_y2) - (sum_y ** 2)))
    correlation = 0.0 if corr_denom == 0 else corr_num / corr_denom

    return {"slope": slope, "intercept": intercept, "correlation": correlation}


def _fetch_ticker_payload(symbol, period, interval):
    ticker = yf.Ticker(symbol)
    history = ticker.history(period=period, interval=interval)
    if history.empty:
        raise ValueError(f"No data found for ticker: {symbol}")

    closes = _extract_prices(history)
    if closes.empty:
        raise ValueError(f"No price data available for ticker: {symbol}")

    dates = [idx.strftime("%Y-%m-%d") for idx in closes.index]
    prices = [round(float(v), 4) for v in closes.tolist()]
    current_price = prices[-1]
    min_price = min(prices)
    max_price = max(prices)
    moving_avg = [
        round(float(closes.iloc[max(0, i - 4): i + 1].mean()), 4)
        for i in range(len(closes))
    ]

    info = {}
    try:
        info = ticker.info or {}
    except Exception:
        pass

    pe_ratio = info.get("trailingPE") or info.get("forwardPE")
    company_name = info.get("shortName") or info.get("longName") or symbol
    currency = _infer_currency(symbol, info.get("currency"))

    return {
        "symbol": symbol,
        "company_name": company_name,
        "currency": currency,
        "pe_ratio": round(float(pe_ratio), 2) if pe_ratio is not None else None,
        "current_price": round(current_price, 2),
        "min_price": round(min_price, 2),
        "max_price": round(max_price, 2),
        "today_price": round(current_price, 2),
        "dates": dates,
        "prices": prices,
        "moving_avg": moving_avg,
        "price_map": {dates[i]: prices[i] for i in range(len(dates))},
    }


# ─── Live Search ───────────────────────────────────────────────────

def search_live_stocks(query, limit=10):
    """Search stocks from Yahoo Finance."""
    if not query.strip():
        return []

    candidates = []
    try:
        search = yf.Search(query, max_results=limit)
        quotes = getattr(search, "quotes", []) or []
        for quote in quotes:
            symbol = quote.get("symbol")
            if not symbol:
                continue
            quote_type = quote.get("quoteType")
            if quote_type and str(quote_type).upper() not in ("EQUITY", "ETF"):
                continue
            company_name = (
                quote.get("shortname") or quote.get("longname")
                or quote.get("displayName") or symbol
            )
            candidates.append({"symbol": symbol, "company_name": company_name})
            if len(candidates) >= limit:
                break
    except Exception:
        candidates = []

    if not candidates:
        candidates = [{"symbol": query.upper(), "company_name": query.upper()}]

    results = []
    for cand in candidates[:limit]:
        sym = cand["symbol"]
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period="1y", interval="1d")
            if hist.empty:
                continue
            closes = hist["Close"].dropna()
            if closes.empty:
                continue

            min_p = round(float(closes.min()), 2)
            max_p = round(float(closes.max()), 2)
            closing = round(float(closes.iloc[-1]), 2)
            pe = None
            name = cand["company_name"]
            currency = None
            try:
                info = ticker.info or {}
                pe = info.get("trailingPE") or info.get("forwardPE")
                name = info.get("shortName") or info.get("longName") or name
                currency = info.get("currency")
            except Exception:
                pass

            discount = _discount_level(min_p, max_p, closing)
            results.append({
                "symbol": sym,
                "company_name": name,
                "current_price": closing,
                "min_price": min_p,
                "max_price": max_p,
                "pe_ratio": round(float(pe), 2) if pe else None,
                "currency": _infer_currency(sym, currency),
                "discount_level": discount,
            })
        except Exception:
            continue

    return results


# ─── Live Stock Detail (with analytics) ───────────────────────────

def fetch_live_stock_detail(symbol, period="1y", interval="1d"):
    """Fetch one live stock with analytics from Yahoo Finance."""
    ticker_symbol = symbol.strip().upper()
    if not ticker_symbol:
        return None

    norm_period = _normalize_period(period)
    norm_interval = _normalize_interval(interval)

    try:
        payload = _fetch_ticker_payload(ticker_symbol, norm_period, norm_interval)
        current_price = payload["current_price"]
        min_price = payload["min_price"]
        max_price = payload["max_price"]
        discount = _discount_level(min_price, max_price, current_price)
        pe = payload["pe_ratio"]
        score = _opportunity_score(pe if pe else 0, discount)

        return {
            "symbol": ticker_symbol,
            "company_name": payload["company_name"],
            "currency": payload["currency"],
            "current_price": current_price,
            "min_price": min_price,
            "max_price": max_price,
            "today_price": current_price,
            "analytics": {
                "pe_ratio": pe,
                "discount_level": discount,
                "opportunity_score": score,
                "graph_data": {
                    "dates": payload["dates"],
                    "price": payload["prices"],
                    "moving_avg": payload["moving_avg"],
                    "period": norm_period,
                    "interval": norm_interval,
                },
                "last_updated": datetime.now(timezone.utc).isoformat(),
            },
        }
    except Exception as e:
        logger.error(f"Error fetching live detail for {symbol}: {e}")
        return None


# ─── Live Comparison ───────────────────────────────────────────────

def fetch_live_stock_comparison(symbol_a, symbol_b, period="5y", interval="1d"):
    """Compare two live stocks with correlation + regression analysis."""
    ticker_a = symbol_a.strip().upper()
    ticker_b = symbol_b.strip().upper()
    if not ticker_a or not ticker_b:
        raise ValueError("Both stock symbols are required.")
    if ticker_a == ticker_b:
        raise ValueError("Please select two different stocks.")

    norm_period = _normalize_period(period or "5y")
    norm_interval = _normalize_interval(interval)

    stock_a = _fetch_ticker_payload(ticker_a, norm_period, norm_interval)
    stock_b = _fetch_ticker_payload(ticker_b, norm_period, norm_interval)

    aligned_dates = sorted(
        set(stock_a["price_map"].keys()) & set(stock_b["price_map"].keys())
    )

    historical = []
    for d in aligned_dates:
        pa = stock_a["price_map"].get(d)
        pb = stock_b["price_map"].get(d)
        if pa is None or pb is None:
            continue
        historical.append({
            "date": d,
            "price_a": round(float(pa), 4),
            "price_b": round(float(pb), 4),
        })

    if len(historical) < 2:
        raise ValueError("Not enough overlapping data to compare selected stocks.")

    points = [{"x": r["price_a"], "y": r["price_b"], "date": r["date"]} for r in historical]
    regression = _compute_regression(points)
    scatter = [
        {
            "date": p["date"],
            "x": p["x"],
            "y": p["y"],
            "y_fit": round((regression["slope"] * p["x"]) + regression["intercept"], 6),
        }
        for p in sorted(points, key=lambda item: item["x"])
    ]

    slope = regression["slope"]
    intercept = regression["intercept"]
    equation = f"{ticker_b} = {slope:.6f} * {ticker_a} + {intercept:.6f}"

    return {
        "period": norm_period,
        "interval": norm_interval,
        "stock_a": {
            "symbol": stock_a["symbol"],
            "company_name": stock_a["company_name"],
            "currency": stock_a["currency"],
            "current_price": stock_a["current_price"],
            "min_price": stock_a["min_price"],
            "max_price": stock_a["max_price"],
            "today_price": stock_a["today_price"],
            "pe_ratio": stock_a["pe_ratio"],
        },
        "stock_b": {
            "symbol": stock_b["symbol"],
            "company_name": stock_b["company_name"],
            "currency": stock_b["currency"],
            "current_price": stock_b["current_price"],
            "min_price": stock_b["min_price"],
            "max_price": stock_b["max_price"],
            "today_price": stock_b["today_price"],
            "pe_ratio": stock_b["pe_ratio"],
        },
        "historical": historical,
        "scatter": scatter,
        "pearson_correlation": round(regression["correlation"], 6),
        "regression": {
            "slope": round(slope, 6),
            "intercept": round(intercept, 6),
            "equation": equation,
        },
    }


# ─── Portfolio Analysis ───────────────────────────────────────────

def run_portfolio_analysis(sector_slug):
    """
    Run analysis on all stocks in a sector/portfolio.
    Returns PE ratio, discount level, opportunity score, and correlation data.
    """
    from .models import Stock, StockCategory

    try:
        category = StockCategory.objects.get(slug=sector_slug)
    except StockCategory.DoesNotExist:
        category = StockCategory.objects.filter(
            name__iexact=sector_slug.replace('-', ' ')
        ).first()
        if not category:
            return {"stocks": [], "correlation": {}}

    stocks = Stock.objects.filter(category=category, is_active=True)
    if not stocks.exists():
        return {"stocks": [], "correlation": {}}

    stocks_data = []
    for s in stocks:
        current_price = float(s.current_price or 0)
        min_price = float(s.fifty_two_week_low or 0)
        max_price = float(s.fifty_two_week_high or 0)
        pe = float(s.pe_ratio) if s.pe_ratio else None

        discount = _discount_level(min_price, max_price, current_price)
        score = _opportunity_score(pe if pe else 0, discount)

        # Derive PE min/max/avg using 52-week price range
        if pe and current_price > 0:
            pe_min = round(pe * min_price / current_price, 2)
            pe_max = round(pe * max_price / current_price, 2)
            pe_avg = round((pe_min + pe_max) / 2, 2)
            # Expected price: fair value at average PE (EPS * pe_avg)
            eps = current_price / pe
            expected_price = round(pe_avg * eps, 2)
        else:
            pe_min = pe_max = pe_avg = expected_price = None

        # Recommendation based on price position in 52-week range
        if max_price > min_price and current_price > 0:
            price_position = (current_price - min_price) / (max_price - min_price)
            if price_position <= 0.33:
                recommendation = 'BUY'
            elif price_position <= 0.66:
                recommendation = 'HOLD'
            else:
                recommendation = 'SELL'
        else:
            recommendation = 'HOLD'

        stocks_data.append({
            "symbol": s.symbol,
            "company_name": s.name,
            "current_price": current_price,
            "min_price": min_price,
            "max_price": max_price,
            "pe_ratio": pe,
            "pe_min": pe_min,
            "pe_max": pe_max,
            "pe_avg": pe_avg,
            "expected_price": expected_price,
            "recommendation": recommendation,
            "discount_level": discount,
            "opportunity_score": score,
            "sector": s.sector or '',
        })

    # Build correlation matrix from numeric fields
    if len(stocks_data) >= 2:
        df = pd.DataFrame(stocks_data)
        numeric_cols = ['current_price', 'min_price', 'max_price', 'pe_ratio', 'opportunity_score']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Add discount numeric
        df['discount_numeric'] = df['discount_level'].apply(
            lambda x: 1.0 if str(x).upper() == "HIGH" else (0.5 if str(x).upper() == "MEDIUM" else 0.0)
        )
        df['price_range'] = df['max_price'] - df['min_price']

        corr_cols = [c for c in ['current_price', 'pe_ratio', 'discount_numeric',
                                  'opportunity_score', 'price_range'] if c in df.columns]
        try:
            corr_matrix = df[corr_cols].corr().fillna(0).round(4).to_dict()
        except Exception:
            corr_matrix = {}
    else:
        corr_matrix = {}

    return {
        "stocks": stocks_data,
        "correlation": corr_matrix,
    }
