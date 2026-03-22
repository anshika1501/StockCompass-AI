"""
Management command: migrate_to_indian
Clears all existing US stock data and populates the DB with
Nifty 50 Indian stocks grouped by sector.

Usage:
    python manage.py migrate_to_indian
    python manage.py migrate_to_indian --keep-existing   # skip deletion step
"""
from django.core.management.base import BaseCommand
from stocks.models import Stock, StockCategory
from stocks.services import StockDataService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Replace US stocks with Indian Nifty 50 stocks in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--keep-existing',
            action='store_true',
            help='Skip deletion of existing stocks/categories before populating',
        )

    def handle(self, *args, **options):
        if not options['keep_existing']:
            self.stdout.write('Deleting existing stocks and categories...')
            deleted_stocks, _ = Stock.objects.all().delete()
            deleted_cats, _ = StockCategory.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(
                    f'  Removed {deleted_stocks} stocks and {deleted_cats} categories.'
                )
            )

        self.stdout.write('Populating Indian Nifty 50 stocks from yfinance...')
        self.stdout.write('  (This may take 3-5 minutes — fetching 50 stocks in parallel)\n')

        success = StockDataService.initialize_categories_and_stocks()

        if success:
            total_stocks = Stock.objects.count()
            total_cats = StockCategory.objects.count()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Done! Populated {total_stocks} stocks across {total_cats} categories.'
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR('Migration completed with errors. Check logs for details.')
            )
