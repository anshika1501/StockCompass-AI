"""
Generate/refresh pgvector embeddings for stocks using Ollama embeddings.

Usage:
    python manage.py build_stock_embeddings
    python manage.py build_stock_embeddings --limit 50 --force
"""

import logging
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from stocks.chatbot import OllamaClient, DEFAULT_EMBED_MODEL
from stocks.models import Stock, StockEmbedding

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


class Command(BaseCommand):
    help = "Create or refresh stock embeddings for the chatbot (uses Ollama)."

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, help='Limit number of stocks to embed')
        parser.add_argument('--force', action='store_true', help='Rebuild even if embedding exists')
        parser.add_argument(
            '--max-failures',
            type=int,
            default=10,
            help='Stop after N failures (0 disables the limit)',
        )

    def handle(self, *args, **options):
        client = OllamaClient()

        qs = Stock.objects.order_by('id')
        if options.get('limit'):
            qs = qs[: options['limit']]

        total = qs.count()
        if total == 0:
            raise CommandError("No stocks found. Populate stocks first.")

        self.stdout.write(f"Building embeddings for {total} stocks...")
        success = 0
        failures = 0
        expected_dim = None
        for stock in qs:
            if not options['force'] and hasattr(stock, "vector") and stock.vector.embedding:
                continue
            try:
                context = _stock_context(stock)
                embedding = client.embed_text(context, model=DEFAULT_EMBED_MODEL)
                expected_dim = expected_dim or len(embedding)
                if len(embedding) != expected_dim:
                    raise ValueError(f"Embedding dimension changed mid-run ({len(embedding)} vs {expected_dim})")
                if expected_dim != 1024:
                    self.stdout.write(self.style.WARNING(f"Embedding dimension is {expected_dim}; ensure model matches DB field (1024)."))
                with transaction.atomic():
                    StockEmbedding.objects.update_or_create(
                        stock=stock,
                        defaults={
                            "context": context,
                            "embedding": embedding,
                        },
                    )
                success += 1
            except Exception as exc:
                failures += 1
                self.stderr.write(f"Failed embedding for {stock.symbol}: {exc}")
                logger.exception("Failed embedding for %s: %s", stock.symbol, exc)
                max_failures = options.get('max_failures') or 0
                if max_failures and failures >= max_failures:
                    raise CommandError(
                        f"Aborting after {failures} failures. Check OLLAMA_BASE_URL/OLLAMA_EMBED_MODEL and that Ollama is running."
                    )
                continue

        self.stdout.write(self.style.SUCCESS(f"Embeddings built for {success} stocks (out of {total})."))
