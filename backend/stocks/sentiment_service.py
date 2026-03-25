"""
Sentiment analysis service for StockCompass.

Strategy (fast, reliable)
--------------------------
1. Fetch Economic Times + MoneyControl RSS feeds ONCE per run (cached).
   Score every article → save as "General Market" articles.

2. For Yahoo Finance: pick up to MAX_PER_SECTOR representative stocks
   per sector (default 2) to keep total HTTP calls at ~42 instead of 500.

3. VADER scores every headline+snippet:
   compound ≥ 0.05  → BULLISH
   compound ≤ -0.05 → BEARISH
   else             → NEUTRAL

4. Rebuild SectorSentimentSnapshot for every touched sector.
"""
from __future__ import annotations

import csv
import logging
import os
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone as tz
from email.utils import parsedate_to_datetime
from typing import Dict, List, Optional

import requests
from django.utils import timezone

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# VADER (lazy import)
# ---------------------------------------------------------------------------

_SIA = None

def _sia():
    global _SIA
    if _SIA is None:
        try:
            from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
            _SIA = SentimentIntensityAnalyzer()
        except ImportError:
            raise RuntimeError("Run: pip install vaderSentiment")
    return _SIA


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CSV_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', 'data', 'ind_nifty500list.csv')
)

RSS_SOURCES = {
    # Working market/stocks RSS feeds (verified 2026-03)
    "economic_times": "https://economictimes.indiatimes.com/rssfeeds/-1466318837.cms",
    "money_control":  "https://www.moneycontrol.com/rss/marketreports.xml",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}

REQUEST_TIMEOUT = 15      # seconds
RATE_SLEEP      = 0.4     # seconds between yfinance calls
MAX_PER_SECTOR  = 2       # how many representative stocks to use per sector


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _label(score: float) -> str:
    if score >= 0.05:
        return "BULLISH"
    if score <= -0.05:
        return "BEARISH"
    return "NEUTRAL"


def _score(text: str) -> float:
    return round(_sia().polarity_scores(text)["compound"], 4)


# ---------------------------------------------------------------------------
# RSS: fetch + parse ALL articles (no per-ticker filtering)
# ---------------------------------------------------------------------------

_rss_cache: Dict[str, List[Dict]] = {}


def _fetch_rss_all(source_key: str) -> List[Dict]:
    """Fetch and parse an entire RSS feed. Cached for the lifetime of the run."""
    if source_key in _rss_cache:
        return _rss_cache[source_key]

    url = RSS_SOURCES[source_key]
    articles: List[Dict] = []

    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        raw_xml = resp.content  # bytes
    except Exception as exc:
        logger.warning("RSS fetch failed (%s): %s", source_key, exc)
        _rss_cache[source_key] = []
        return []

    try:
        root = ET.fromstring(raw_xml)
    except ET.ParseError as exc:
        logger.warning("RSS XML parse error (%s): %s", source_key, exc)
        _rss_cache[source_key] = []
        return []

    for item in root.iter("item"):
        def _t(tag: str) -> str:
            el = item.find(tag)
            return (el.text or "").strip() if el is not None else ""

        title   = _t("title")
        desc    = _t("description")
        link    = _t("link")
        pubraw  = _t("pubDate")

        if not title:
            continue

        pub_dt = None
        if pubraw:
            try:
                pub_dt = parsedate_to_datetime(pubraw)
            except Exception:
                pass

        articles.append({
            "headline":     title,
            "snippet":      desc[:400],
            "url":          link,
            "published_at": pub_dt,
            "source":       source_key,
        })

    logger.info("RSS (%s): fetched %d articles", source_key, len(articles))
    _rss_cache[source_key] = articles
    return articles


# ---------------------------------------------------------------------------
# Yahoo Finance: per-ticker news
# ---------------------------------------------------------------------------

def _parse_dt(raw) -> Optional[datetime]:
    """Parse Unix timestamp, ISO-8601 string, or RFC-2822 string to aware datetime."""
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return datetime.fromtimestamp(raw, tz=tz.utc)
    if isinstance(raw, str):
        raw = raw.strip()
        # ISO 8601 (yfinance ≥1.0)
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            pass
        # RFC 2822 (older yfinance / RSS)
        try:
            return parsedate_to_datetime(raw)
        except Exception:
            pass
    return None


def _fetch_yfinance(ticker: str, company_name: str) -> List[Dict]:
    """Fetch news headlines from Yahoo Finance.  Handles both old and new yfinance dict shapes."""
    articles: List[Dict] = []
    try:
        import yfinance as yf
        news_items = yf.Ticker(ticker).news or []
        for item in news_items[:10]:
            # yfinance ≥1.0 wraps everything under "content"
            content = item.get("content") or item
            title   = content.get("title") or item.get("title", "")
            summary = content.get("summary") or item.get("summary", "")
            # Link — try canonical URL first (new format), then plain link
            canon = content.get("canonicalUrl") or {}
            link  = (canon.get("url") if isinstance(canon, dict) else None) or item.get("link", "")
            pub_dt = _parse_dt(
                item.get("providerPublishTime")
                or content.get("pubDate")
                or content.get("displayTime")
            )
            if title:
                articles.append({
                    "headline":     title,
                    "snippet":      (summary or "")[:400],
                    "url":          link or "",
                    "published_at": pub_dt,
                    "source":       "yahoo_finance",
                })
    except Exception as exc:
        logger.debug("yfinance news failed for %s: %s", ticker, exc)
    return articles


# ---------------------------------------------------------------------------
# CSV reader
# ---------------------------------------------------------------------------

def _load_stocks() -> List[Dict]:
    """Returns {ticker, company_name, sector} for every row in the CSV."""
    stocks: List[Dict] = []
    if not os.path.exists(CSV_PATH):
        logger.error("CSV not found: %s", CSV_PATH)
        return stocks
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            sym  = row.get("Symbol", "").strip()
            name = row.get("Company Name", "").strip()
            sec  = row.get("Industry", "").strip()
            if sym and sec:
                stocks.append({"ticker": sym + ".NS", "company_name": name, "sector": sec})
    return stocks


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def _save_articles(articles: List[Dict]) -> int:
    from .models import SentimentArticle
    objs = [
        SentimentArticle(
            ticker         = a["ticker"],
            company_name   = a.get("company_name", ""),
            sector         = a["sector"],
            headline       = a["headline"],
            snippet        = a.get("snippet", ""),
            source         = a.get("source", "yahoo_finance"),
            url            = a.get("url", ""),
            published_at   = a.get("published_at"),
            compound_score = a["compound_score"],
            label          = a["label"],
        )
        for a in articles
    ]
    if objs:
        SentimentArticle.objects.bulk_create(objs)
    return len(objs)


def _rebuild_snapshot(sector: str) -> None:
    from .models import SentimentArticle, SectorSentimentSnapshot
    from django.db.models import Avg, Count

    today = timezone.now().date()
    qs = SentimentArticle.objects.filter(sector=sector, fetched_at__date=today)
    agg = qs.aggregate(avg=Avg("compound_score"), total=Count("id"))

    avg_score = round(agg["avg"] or 0.0, 4)
    SectorSentimentSnapshot.objects.update_or_create(
        sector=sector, date=today,
        defaults=dict(
            avg_score     = avg_score,
            bullish_count = qs.filter(label="BULLISH").count(),
            neutral_count = qs.filter(label="NEUTRAL").count(),
            bearish_count = qs.filter(label="BEARISH").count(),
            article_count = agg["total"] or 0,
            label         = _label(avg_score),
        ),
    )
    logger.info("Snapshot: %-35s | %-7s | %.3f (%d art.)",
                sector, _label(avg_score), avg_score, agg["total"] or 0)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class SentimentService:

    @staticmethod
    def run(
        sector: Optional[str] = None,
        ticker: Optional[str] = None,
        max_per_sector: int = MAX_PER_SECTOR,
    ) -> Dict:
        """
        Fetch news, score with VADER, persist.

        Parameters
        ----------
        sector        : limit to stocks whose sector contains this string
        ticker        : limit to a single ticker (e.g. 'TCS.NS')
        max_per_sector: how many Yahoo Finance calls per sector (default 2)

        Returns summary dict.
        """
        # Reset RSS cache each run
        _rss_cache.clear()

        # --- 1. RSS articles (fetched once, all articles) ---
        rss_articles: List[Dict] = []
        for src_key in RSS_SOURCES:
            rss_articles.extend(_fetch_rss_all(src_key))

        # --- 2. Load stocks + group by sector ---
        all_stocks = _load_stocks()

        if ticker:
            all_stocks = [s for s in all_stocks if s["ticker"].lower() == ticker.lower()]
        elif sector:
            all_stocks = [s for s in all_stocks if sector.lower() in s["sector"].lower()]

        # Group into sectors
        by_sector: Dict[str, List[Dict]] = {}
        for s in all_stocks:
            by_sector.setdefault(s["sector"], []).append(s)

        if not by_sector:
            return {"status": "no_stocks", "processed": 0, "articles_saved": 0}

        total_saved = 0
        touched_sectors: set = set()

        for sec_name, sec_stocks in by_sector.items():
            sector_articles: List[Dict] = []

            # --- RSS: keep articles that mention ANY stock/company from this sector ---
            sym_keywords = set()
            for s in sec_stocks:
                sym_keywords.add(s["ticker"].split(".")[0].lower())
                if s["company_name"]:
                    sym_keywords.add(s["company_name"].split()[0].lower())

            for art in rss_articles:
                text = (art["headline"] + " " + art["snippet"]).lower()
                matched = any(kw in text for kw in sym_keywords)
                # Also include general market/sector articles
                if matched or sec_name.lower().split()[0] in text:
                    compound = _score(art["headline"] + ". " + art["snippet"])
                    # Use first matched stock as ticker, else sector name
                    matched_ticker = "MARKET"
                    for s in sec_stocks:
                        if s["ticker"].split(".")[0].lower() in text:
                            matched_ticker = s["ticker"]
                            break
                    sector_articles.append({
                        **art,
                        "ticker":        matched_ticker,
                        "company_name":  "",
                        "sector":        sec_name,
                        "compound_score": compound,
                        "label":          _label(compound),
                    })

            # --- Yahoo Finance: top N representative stocks per sector ---
            representatives = sec_stocks[:max_per_sector]
            for stock in representatives:
                yf_arts = _fetch_yfinance(stock["ticker"], stock["company_name"])
                for art in yf_arts:
                    compound = _score(art["headline"] + ". " + art["snippet"])
                    sector_articles.append({
                        **art,
                        "ticker":        stock["ticker"],
                        "company_name":  stock["company_name"],
                        "sector":        sec_name,
                        "compound_score": compound,
                        "label":          _label(compound),
                    })
                if yf_arts:
                    time.sleep(RATE_SLEEP)

            # Deduplicate by URL
            seen: set = set()
            unique_articles: List[Dict] = []
            for art in sector_articles:
                key = art.get("url") or art["headline"][:80]
                if key not in seen:
                    seen.add(key)
                    unique_articles.append(art)

            saved = _save_articles(unique_articles)
            total_saved += saved
            touched_sectors.add(sec_name)
            logger.info("Sector %-35s: %d articles saved", sec_name, saved)

        # Rebuild snapshots
        for sec_name in touched_sectors:
            _rebuild_snapshot(sec_name)

        return {
            "status":         "ok",
            "processed":      sum(len(v) for v in by_sector.values()),
            "articles_saved": total_saved,
            "sectors":        sorted(touched_sectors),
        }
