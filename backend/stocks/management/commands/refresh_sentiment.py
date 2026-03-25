"""
Django management command to fetch fresh news and compute sentiment scores.

Usage examples
--------------
# Refresh all 500 stocks (takes a few minutes)
python manage.py refresh_sentiment

# Refresh only one sector
python manage.py refresh_sentiment --sector "Information Technology"

# Refresh only one ticker
python manage.py refresh_sentiment --ticker TCS.NS

# Dry-run: only show what would be fetched (no DB writes)
python manage.py refresh_sentiment --dry-run
"""

import time
from django.core.management.base import BaseCommand, CommandError
from stocks.sentiment_service import SentimentService


class Command(BaseCommand):
    help = "Fetch latest financial news and compute VADER sentiment scores."

    def add_arguments(self, parser):
        parser.add_argument(
            "--sector",
            type=str,
            default=None,
            help="Limit refresh to a specific sector name (partial match, case-insensitive).",
        )
        parser.add_argument(
            "--ticker",
            type=str,
            default=None,
            help="Limit refresh to a single ticker symbol, e.g. TCS.NS",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Print what would be done without writing to the database.",
        )

    def handle(self, *args, **options):
        sector   = options.get("sector")
        ticker   = options.get("ticker")
        dry_run  = options.get("dry_run")

        self.stdout.write(self.style.MIGRATE_HEADING(
            "StockCompass — Sentiment Refresh"
        ))

        if dry_run:
            from stocks.sentiment_service import _load_csv_stocks
            all_stocks = _load_csv_stocks()
            if ticker:
                all_stocks = [s for s in all_stocks if s["ticker"].lower() == ticker.lower()]
            elif sector:
                all_stocks = [s for s in all_stocks if sector.lower() in s["sector"].lower()]
            self.stdout.write(f"[DRY RUN] Would process {len(all_stocks)} stocks.")
            for s in all_stocks[:20]:
                self.stdout.write(f"  {s['ticker']:20s}  {s['sector']}")
            if len(all_stocks) > 20:
                self.stdout.write(f"  ... and {len(all_stocks) - 20} more")
            return

        t0 = time.time()
        self.stdout.write(f"Starting fetch — sector={sector!r}, ticker={ticker!r}")

        try:
            result = SentimentService.run(sector=sector, ticker=ticker)
        except Exception as exc:
            raise CommandError(f"Sentiment refresh failed: {exc}") from exc

        elapsed = round(time.time() - t0, 1)

        self.stdout.write(self.style.SUCCESS(
            f"\nDone in {elapsed}s — "
            f"{result['processed']} stocks processed, "
            f"{result['articles_saved']} articles saved."
        ))
        if result.get("sectors"):
            self.stdout.write("Sectors updated: " + ", ".join(result["sectors"]))
