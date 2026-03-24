from django.core.management.base import BaseCommand
from stocks.services import StockDataService
from stocks.bootstrap import bootstrap_stock_data


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
        parser.add_argument(
            '--embed',
            action='store_true',
            help='Also build stock embeddings after initialization',
        )
        parser.add_argument(
            '--embed-force',
            action='store_true',
            help='Rebuild embeddings even if they already exist',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Initializing stock categories and data...')
        
        try:
            success = StockDataService.initialize_categories_and_stocks()
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS('Successfully initialized stock categories and data')
                )
                
                if options['update_prices'] or options['embed']:
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

                if options['embed']:
                    self.stdout.write('Building stock embeddings...')
                    bootstrap_stock_data(
                        force_init=False,
                        update_prices=False,
                        embed=True,
                        embed_force=options['embed_force'],
                    )
                    self.stdout.write(
                        self.style.SUCCESS('Embeddings build completed')
                    )
            else:
                self.stdout.write(
                    self.style.ERROR('Failed to initialize stock data')
                )
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error initializing stock data: {str(e)}')
            )