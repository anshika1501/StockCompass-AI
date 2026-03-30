import logging
import os
import re
from typing import List, Dict, Any, Optional, Sequence

import requests

from .models import Stock

logger = logging.getLogger(__name__)

DEFAULT_OLLAMA_BASE = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_CHAT_MODEL = os.environ.get("OLLAMA_CHAT_MODEL", "tinyllama")
# Allow embeddings to be optional; empty env disables embedding lookups
DEFAULT_EMBED_MODEL = (os.environ.get("OLLAMA_EMBED_MODEL") or "").strip() or None
SYMBOL_PATTERN = re.compile(r"\b[A-Z][A-Z0-9.-]{1,14}\b")
QUERY_STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "for",
    "from",
    "how",
    "i",
    "if",
    "in",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "or",
    "the",
    "this",
    "to",
    "vs",
    "what",
    "which",
    "who",
    "why",
    "with",
    "you",
}
STOCK_INTENT_WORDS = {
    "buy",
    "compare",
    "diversify",
    "diversified",
    "forecast",
    "hold",
    "invest",
    "investment",
    "pe",
    "portfolio",
    "predict",
    "prediction",
    "price",
    "recommend",
    "recommendation",
    "return",
    "risk",
    "sector",
    "sell",
    "share",
    "shares",
    "stock",
    "stocks",
    "ticker",
    "tickers",
    "undervalued",
    "overvalued",
    "valuation",
}
INTRO_PATTERNS = (
    "introduce yourself",
    "who are you",
    "what are you",
    "what can you do",
    "tell me about yourself",
    "your name",
)


class OllamaClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or DEFAULT_OLLAMA_BASE).rstrip("/")

    def _post(self, url: str, payload: Dict[str, Any], timeout: int) -> Dict[str, Any]:
        resp = requests.post(url, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json()

    def embed_text(self, text: str, model: str = DEFAULT_EMBED_MODEL) -> List[float]:
        api_url = f"{self.base_url}/api/embeddings"
        payload = {"model": model, "prompt": text}
        try:
            data = self._post(api_url, payload, timeout=60)
        except requests.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 404:
                openai_url = f"{self.base_url}/v1/embeddings"
                openai_payload = {"model": model, "input": text}
                data = self._post(openai_url, openai_payload, timeout=60)
            else:
                raise

        embedding = data.get("embedding")
        if embedding:
            return embedding

        data_items = data.get("data") or []
        if data_items and isinstance(data_items, list):
            embedding = data_items[0].get("embedding")
        if not embedding:
            raise ValueError("Ollama embedding response was empty.")
        return embedding

    def list_models(self) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/api/tags"
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        return data.get("models", [])

    def generate(self, prompt: str, context: str, question: str, model: str = DEFAULT_CHAT_MODEL) -> str:
        url = f"{self.base_url}/api/chat"
        full_prompt = f"{prompt}\n\nContext:\n{context}\n\nUser question:\n{question}\n\nRespond clearly and concisely."
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are Stocky, the StockCompass AI assistant."},
                {"role": "user", "content": full_prompt},
            ],
            "stream": False,
        }
        resp = requests.post(url, json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        message = data.get("message") or {}
        content = message.get("content", "").strip()
        if not content:
            raise ValueError("Ollama returned an empty message.")
        return content


def _compute_risk(stock: Stock) -> str:
    """Lightweight risk heuristic based on 52w range and PE."""
    try:
        range_ratio = float(stock.fifty_two_week_high - stock.fifty_two_week_low) / max(float(stock.current_price or 1), 1)
    except Exception:
        range_ratio = 0.0
    pe = float(stock.pe_ratio or 0)
    if range_ratio > 0.8 or pe > 35:
        return "High"
    if range_ratio > 0.4 or pe > 22:
        return "Medium"
    return "Low"


class ChatAdvisorService:
    """
    Provides a DB-grounded chatbot that uses stock metadata from PostgreSQL
    and Ollama for generation.
    """

    def __init__(self, base_url: Optional[str] = None):
        self.ollama = OllamaClient(base_url)

    def _extract_symbols(self, question: str) -> set[str]:
        return {match.group(0).upper() for match in SYMBOL_PATTERN.finditer(question.upper())}

    def _extract_keywords(self, question: str) -> List[str]:
        tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9]{2,}", question.lower())
        return [tok for tok in tokens if tok not in QUERY_STOP_WORDS]

    def _is_intro_query(self, question: str) -> bool:
        question_lower = question.lower()
        return any(pattern in question_lower for pattern in INTRO_PATTERNS)

    def _is_stock_intent(self, symbols: set[str], keywords: Sequence[str]) -> bool:
        return bool(symbols) or any(keyword in STOCK_INTENT_WORDS for keyword in keywords)

    def _match_stocks(
        self,
        question: str,
        top_k: int = 6,
        symbols: Optional[set[str]] = None,
        keywords: Optional[Sequence[str]] = None,
    ) -> List[Dict[str, Any]]:
        symbols = symbols if symbols is not None else self._extract_symbols(question)
        keywords = list(keywords) if keywords is not None else self._extract_keywords(question)
        stocks = list(
            Stock.objects.filter(is_active=True)
            .only(
                "id",
                "symbol",
                "name",
                "sector",
                "industry",
                "description",
                "current_price",
                "fifty_two_week_low",
                "fifty_two_week_high",
                "pe_ratio",
                "market_cap",
                "is_active",
            )
            .order_by("symbol")
        )
        if not stocks:
            return []

        scored: List[Dict[str, Any]] = []
        for stock in stocks:
            symbol = (stock.symbol or "").upper()
            name = (stock.name or "").lower()
            sector = (stock.sector or "").lower()
            industry = (stock.industry or "").lower()
            description = (stock.description or "").lower()

            score = 0.0
            if symbol in symbols:
                score += 10.0
            elif symbols and any(sym in symbol for sym in symbols):
                score += 4.0

            for kw in keywords:
                if kw in name:
                    score += 2.2
                if kw in sector:
                    score += 1.7
                if kw in industry:
                    score += 1.5
                if kw in description:
                    score += 0.25

            if score > 0:
                scored.append({"stock": stock, "score": score})

        if not scored:
            if symbols:
                return []
            fallback = sorted(
                stocks,
                key=lambda s: (
                    float(s.market_cap or 0),
                    float(s.current_price or 0),
                    s.symbol or "",
                ),
                reverse=True,
            )
            return [{"stock": stock, "score": float(top_k - idx)} for idx, stock in enumerate(fallback[:top_k])]

        scored.sort(
            key=lambda item: (
                item["score"],
                float(item["stock"].market_cap or 0),
                item["stock"].symbol or "",
            ),
            reverse=True,
        )
        return scored[:top_k]

    def _stock_notes(self, stock: Stock) -> str:
        try:
            vector = stock.vector
        except Exception:
            vector = None

        if vector and vector.context:
            return vector.context[:400]

        description = (stock.description or "").strip()
        return description[:400] if description else "No summary available."

    def _build_context(self, matches: Sequence[Dict[str, Any]]) -> str:
        lines = []
        for match in matches:
            stock = match["stock"]
            risk = _compute_risk(stock)
            lines.append(
                f"{stock.symbol} ({stock.name}) | sector={stock.sector} | price={stock.current_price} | "
                f"52w range={stock.fifty_two_week_low}-{stock.fifty_two_week_high} | "
                f"PE={stock.pe_ratio} | risk={risk} | notes={self._stock_notes(stock)}"
            )
        return "\n".join(lines)

    def _build_sources(self, matches: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not matches:
            return []

        max_score = max(float(match["score"]) for match in matches) or 1.0
        sources: List[Dict[str, Any]] = []
        for match in matches:
            stock = match["stock"]
            similarity = float(match["score"]) / max_score
            distance = max(0.0, min(1.0, 1.0 - similarity))
            sources.append(
                {
                    "symbol": stock.symbol,
                    "name": stock.name,
                    "sector": stock.sector,
                    "distance": round(distance, 4),
                }
            )
        return sources

    def answer(self, question: str, chat_model: Optional[str] = None, embed_model: Optional[str] = None, base_url: Optional[str] = None) -> Dict[str, Any]:
        if not question or not question.strip():
            raise ValueError("Query cannot be empty.")

        if base_url:
            self.ollama = OllamaClient(base_url)

        chat_model_use = chat_model or DEFAULT_CHAT_MODEL
        _ = embed_model  # Backward compatibility: accept but ignore embed_model.
        question_clean = question.strip()
        symbols = self._extract_symbols(question_clean)
        keywords = self._extract_keywords(question_clean)

        if self._is_intro_query(question_clean):
            return {
                "answer": (
                    "I'm **Stocky** - your StockCompass market assistant. I can compare stocks, assess risk levels, "
                    "suggest portfolio mixes, and give buy/hold/sell style guidance using your database context. "
                    "Try: `Compare TCS.NS vs INFY` or `Is RELIANCE.NS overvalued?`"
                ),
                "sources": [],
            }

        if not self._is_stock_intent(symbols, keywords):
            general_prompt = (
                "You are Stocky, the StockCompass AI assistant. "
                "The user asked a non-stock-specific question. Respond naturally and clearly in under 120 words. "
                "If they want stock analysis, invite them to mention tickers or sectors."
            )
            general_context = "Mode: general assistant response (no ticker-level retrieval needed)."
            answer_text = self.ollama.generate(general_prompt, general_context, question_clean, model=chat_model_use)
            return {"answer": answer_text, "sources": []}

        matches = self._match_stocks(question_clean, top_k=6, symbols=symbols, keywords=keywords)
        if not matches:
            suggestions = list(
                Stock.objects.filter(is_active=True)
                .order_by("-market_cap")
                .values_list("symbol", flat=True)[:5]
            )
            suggestion_text = ", ".join(suggestions) if suggestions else "No symbols found in database yet"
            return {
                "answer": (
                    "I couldn't find matching stocks for your request in the current database. "
                    f"Try one of these symbols: {suggestion_text}."
                ),
                "sources": [],
            }

        context = self._build_context(matches)
        prompt = (
            "You are Stocky, the StockCompass AI assistant. Using the provided stock context, answer the user with:\n"
            "1) Risk level (Low/Medium/High) per relevant stock with a short reason.\n"
            "2) Suggestions: diversification or sector angles tied to the context.\n"
            "3) Short-term prediction (1-4 weeks) in plain language with confidence.\n"
            "4) Compare the top 2-3 closest stocks (strengths/weaknesses).\n"
            "5) Recommendation (Buy/Hold/Sell) with a one-line rationale.\n"
            "Keep it concise (<= 180 words) and include a brief disclaimer."
        )

        answer_text = self.ollama.generate(prompt, context, question, model=chat_model_use)
        sources = self._build_sources(matches)
        return {"answer": answer_text, "sources": sources}
