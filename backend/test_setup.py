#!/usr/bin/env python
"""
Quick test script to verify the Django setup
"""
import os
import sys
import django

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stock_api.settings')
django.setup()

# Now we can import Django models
from stocks.models import StockCategory, Stock
from stocks.services import StockDataService

def test_setup():
    print("Testing Django setup...")
    
    try:
        # Test database connection
        print(f"Categories in database: {StockCategory.objects.count()}")
        print(f"Stocks in database: {Stock.objects.count()}")
        
        # Test yfinance import
        import yfinance as yf
        print("yfinance imported successfully")
        
        # Test fetching a single stock (quick test)
        try:
            ticker = yf.Ticker("AAPL")
            info = ticker.info
            print(f"Test fetch AAPL: {info.get('longName', 'Apple Inc.')}")
        except Exception as e:
            print(f"Warning: Could not fetch test stock data: {e}")
        
        print("\n✅ Setup verification completed successfully!")
        print("\nTo start the server:")
        print("1. Activate virtual environment: venv\\Scripts\\activate")
        print("2. Run migrations: python manage.py migrate")
        print("3. Initialize stocks: python manage.py init_stocks")
        print("4. Start server: python manage.py runserver")
        
    except Exception as e:
        print(f"❌ Setup verification failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_setup()