from django.core.management.base import BaseCommand
from stocks.services import StockDataService


class Command(BaseCommand):
    help = 'Initialize stock categories and data'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--update-prices',
            action='store_true',
            help='Also update stock prices after initialization',
        )
        parser.add_argument(
            '--period',
            type=str,
            default='1mo',
            help='Period for price data (default: 1mo)',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Initializing stock categories and data...')
        
        try:
            success = StockDataService.initialize_categories_and_stocks()
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS('Successfully initialized stock categories and data')
                )
                
                if options['update_prices']:
                    self.stdout.write('Updating stock prices...')
                    price_success = StockDataService.update_stock_prices(
                        period=options['period']
                    )
                    
                    if price_success:
                        self.stdout.write(
                            self.style.SUCCESS('Successfully updated stock prices')
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING('Stock prices update completed with some errors')
                        )
            else:
                self.stdout.write(
                    self.style.ERROR('Failed to initialize stock data')
                )
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error initializing stock data: {str(e)}')
            )