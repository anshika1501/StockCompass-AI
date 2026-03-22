import logging
import os
from typing import List, Dict, Any, Optional

import requests
from pgvector.django import CosineDistance

from .models import StockEmbedding, Stock

logger = logging.getLogger(__name__)

DEFAULT_OLLAMA_BASE = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_CHAT_MODEL = os.environ.get("OLLAMA_CHAT_MODEL", "tinyllama")
DEFAULT_EMBED_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "qwen3-embedding:0.6b")


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
                {"role": "system", "content": "You are StockCompass AI."},
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
    Provides a RAG-style chatbot that uses pgvector for similarity search
    and Ollama for generation.
    """

    def __init__(self, base_url: Optional[str] = None):
        self.ollama = OllamaClient(base_url)

    def _nearest_stocks(self, query_embedding: List[float], top_k: int = 5):
        return (
            StockEmbedding.objects.exclude(embedding=None)
            .annotate(distance=CosineDistance("embedding", query_embedding))
            .order_by("distance")[:top_k]
        )

    def _build_context(self, embeddings) -> str:
        lines = []
        for emb in embeddings:
            stock = emb.stock
            risk = _compute_risk(stock)
            lines.append(
                f"{stock.symbol} ({stock.name}) | sector={stock.sector} | price={stock.current_price} | "
                f"52w range={stock.fifty_two_week_low}-{stock.fifty_two_week_high} | "
                f"PE={stock.pe_ratio} | risk={risk} | notes={emb.context[:400]}"
            )
        return "\n".join(lines)

    def answer(self, question: str, chat_model: Optional[str] = None, embed_model: Optional[str] = None, base_url: Optional[str] = None) -> Dict[str, Any]:
        if not question or not question.strip():
            raise ValueError("Query cannot be empty.")

        if base_url:
            self.ollama = OllamaClient(base_url)

        embed_model_use = embed_model or DEFAULT_EMBED_MODEL
        chat_model_use = chat_model or DEFAULT_CHAT_MODEL

        query_vec = self.ollama.embed_text(question.strip(), model=embed_model_use)
        matches = list(self._nearest_stocks(query_vec, top_k=6))
        if not matches:
            raise ValueError("No embeddings available. Run build_stock_embeddings first.")

        context = self._build_context(matches)
        prompt = (
            "You are StockCompass AI. Using the provided stock context, answer the user with:\n"
            "1) Risk level (Low/Medium/High) per relevant stock with a short reason.\n"
            "2) Suggestions: diversification or sector angles tied to the context.\n"
            "3) Short-term prediction (1-4 weeks) in plain language with confidence.\n"
            "4) Compare the top 2-3 closest stocks (strengths/weaknesses).\n"
            "5) Recommendation (Buy/Hold/Sell) with a one-line rationale.\n"
            "Keep it concise (<= 180 words) and include a brief disclaimer."
        )

        answer_text = self.ollama.generate(prompt, context, question, model=chat_model_use)
        sources = [
            {
                "symbol": emb.stock.symbol,
                "name": emb.stock.name,
                "sector": emb.stock.sector,
                "distance": float(emb.distance),
            }
            for emb in matches
        ]
        return {"answer": answer_text, "sources": sources}
