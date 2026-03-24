import logging
import os
from typing import Optional

from django.db import transaction

from .chatbot import OllamaClient, DEFAULT_EMBED_MODEL
from .models import Stock, StockEmbedding
from .services import StockDataService

logger = logging.getLogger(__name__)


def _stock_context(stock: Stock) -> str:
    return (
        f"{stock.symbol} {stock.name}. Sector: {stock.sector}. "
        f"Industry: {stock.industry}. "
        f"Current price: {stock.current_price}. "
        f"52w high/low: {stock.fifty_two_week_high}/{stock.fifty_two_week_low}. "
        f"PE: {stock.pe_ratio}. "
        f"Summary: {stock.description[:400]}"
    )


def _env_flag(name: str, default: str = "") -> bool:
    value = os.getenv(name, default)
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def bootstrap_stock_data(
    *,
    force_init: bool = False,
    update_prices: bool = True,
    price_period: str = "1mo",
    embed: bool = False,
    embed_force: bool = False,
    embed_limit: Optional[int] = None,
    max_failures: int = 10,
) -> None:
    """
    Initialize stock master data, price history, and optional embeddings.

    Intended for post-migrate bootstrapping or one-shot setup commands.
    """
    has_stocks = Stock.objects.exists()

    if not has_stocks or force_init:
        logger.info("Bootstrapping stocks: initializing categories and stocks")
        success = StockDataService.initialize_categories_and_stocks()
        if not success:
            logger.warning("Bootstrapping stocks: initialization failed")
            return
    else:
        logger.info("Bootstrapping stocks: existing stocks detected, skipping init")

    if update_prices:
        logger.info("Bootstrapping stocks: updating prices (period=%s)", price_period)
        StockDataService.update_stock_prices(period=price_period)

    if not embed:
        return

    if not DEFAULT_EMBED_MODEL:
        logger.info("Bootstrapping embeddings skipped: no OLLAMA_EMBED_MODEL configured.")
        return

    logger.info("Bootstrapping stocks: building embeddings")
    client = OllamaClient()

    qs = Stock.objects.order_by("id")
    if embed_limit:
        qs = qs[:embed_limit]

    failures = 0
    expected_dim = None
    for stock in qs:
        if not embed_force and hasattr(stock, "vector") and stock.vector.embedding:
            continue
        try:
            context = _stock_context(stock)
            embedding = client.embed_text(context, model=DEFAULT_EMBED_MODEL)
            expected_dim = expected_dim or len(embedding)
            if len(embedding) != expected_dim:
                raise ValueError(
                    f"Embedding dimension changed mid-run ({len(embedding)} vs {expected_dim})"
                )
            with transaction.atomic():
                StockEmbedding.objects.update_or_create(
                    stock=stock,
                    defaults={"context": context, "embedding": embedding},
                )
        except Exception as exc:
            failures += 1
            logger.exception("Bootstrapping embeddings failed for %s: %s", stock.symbol, exc)
            if max_failures and failures >= max_failures:
                raise


def bootstrap_from_env() -> None:
    """Run bootstrap using environment flags for post-migrate hooks."""
    bootstrap_stock_data(
        force_init=_env_flag("STOCK_BOOTSTRAP_FORCE_INIT"),
        update_prices=_env_flag("STOCK_BOOTSTRAP_UPDATE_PRICES", "1"),
        price_period=os.getenv("STOCK_BOOTSTRAP_PRICE_PERIOD", "1mo"),
        embed=_env_flag("STOCK_BOOTSTRAP_EMBED"),
        embed_force=_env_flag("STOCK_BOOTSTRAP_EMBED_FORCE"),
        embed_limit=int(os.getenv("STOCK_BOOTSTRAP_EMBED_LIMIT", "0")) or None,
        max_failures=int(os.getenv("STOCK_BOOTSTRAP_EMBED_MAX_FAILURES", "10")),
    )
