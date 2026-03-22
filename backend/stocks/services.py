import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from django.utils import timezone
from .models import Stock, StockPrice, StockCategory
import logging

logger = logging.getLogger(__name__)


# Map category names to icon names and images used by the frontend
CATEGORY_META = {
    'Banking & Finance': {
        'icon': 'landmark',
        'image': 'https://picsum.photos/seed/bank/800/600',
        'description': 'Major Indian banks and NBFC companies listed on NSE.',
    },
    'Information Technology': {
        'icon': 'cpu',
        'image': 'https://picsum.photos/seed/tech/800/600',
        'description': "India's leading IT services, software and consulting companies.",
    },
    'Energy & Utilities': {
        'icon': 'zap',
        'image': 'https://picsum.photos/seed/energy/800/600',
        'description': 'Oil, gas, power generation and utility companies on NSE.',
    },
    'Automotive': {
        'icon': 'car',
        'image': 'https://picsum.photos/seed/car/800/600',
        'description': 'Two-wheelers, passenger vehicles and commercial vehicle manufacturers.',
    },
    'Consumer Goods': {
        'icon': 'shopping-cart',
        'image': 'https://picsum.photos/seed/consumer/800/600',
        'description': 'FMCG, food & beverages and household consumer brands.',
    },
    'Metals & Materials': {
        'icon': 'factory',
        'image': 'https://picsum.photos/seed/metals/800/600',
        'description': 'Steel, aluminium, cement and construction material producers.',
    },
    'Healthcare & Pharma': {
        'icon': 'stethoscope',
        'image': 'https://picsum.photos/seed/health/800/600',
        'description': 'Pharmaceutical companies, hospitals and healthcare providers.',
    },
    'Telecom & Infrastructure': {
        'icon': 'phone',
        'image': 'https://picsum.photos/seed/telecom/800/600',
        'description': 'Telecom operators, ports, logistics and infrastructure groups.',
    },
    'Insurance': {
        'icon': 'shield',
        'image': 'https://picsum.photos/seed/insurance/800/600',
        'description': 'Life and general insurance companies.',
    },
    'Chemicals & Others': {
        'icon': 'flask-conical',
        'image': 'https://picsum.photos/seed/chem/800/600',
        'description': 'Agrochemicals, paints and diversified conglomerates.',
    },
}


class StockDataService:
    """Service class to handle stock data fetching using yfinance."""

    # Predefined stock categories with Nifty 50 Indian stocks (NSE symbols)
    STOCK_CATEGORIES = {
        'Banking & Finance': [
            'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS',
            'BAJFINANCE.NS', 'BAJAJFINSV.NS', 'INDUSINDBK.NS', 'SHRIRAMFIN.NS',
        ],
        'Information Technology': [
            'TCS.NS', 'INFOSYS.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS',
        ],
        'Energy & Utilities': [
            'RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'BPCL.NS', 'COALINDIA.NS',
        ],
        'Automotive': [
            'MARUTI.NS', 'TATAMOTORS.NS', 'EICHERMOT.NS', 'HEROMOTOCO.NS', 'BAJAJ-AUTO.NS', 'M&M.NS',
        ],
        'Consumer Goods': [
            'HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'TATACONSUM.NS',
        ],
        'Metals & Materials': [
            'JSWSTEEL.NS', 'TATASTEEL.NS', 'HINDALCO.NS', 'GRASIM.NS', 'ULTRACEMCO.NS', 'ADANIENT.NS',
        ],
        'Healthcare & Pharma': [
            'SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'APOLLOHOSP.NS',
        ],
        'Telecom & Infrastructure': [
            'BHARTIARTL.NS', 'ADANIPORTS.NS', 'LT.NS', 'TITAN.NS',
        ],
        'Insurance': [
            'HDFCLIFE.NS', 'SBILIFE.NS',
        ],
        'Chemicals & Others': [
            'UPL.NS', 'ASIANPAINT.NS',
        ],
    }

    @classmethod
    def initialize_categories_and_stocks(cls):
        """Initialize stock categories and stocks in the database."""
        try:
            for category_name, stock_symbols in cls.STOCK_CATEGORIES.items():
                meta = CATEGORY_META.get(category_name, {})
                category, created = StockCategory.objects.get_or_create(
                    name=category_name,
                    defaults={
                        'description': meta.get('description', f'{category_name} sector stocks'),
                        'icon': meta.get('icon', 'trending-up'),
                        'image': meta.get('image', ''),
                    }
                )
                if not created:
                    category.description = meta.get('description', category.description)
                    category.icon = meta.get('icon', category.icon)
                    category.image = meta.get('image', category.image)
                    category.save()
                else:
                    logger.info(f"Created category: {category_name}")

                for symbol in stock_symbols:
                    try:
                        stock_data = cls.fetch_stock_info(symbol)
                        if stock_data:
                            stock, stock_created = Stock.objects.get_or_create(
                                symbol=symbol,
                                defaults={
                                    'name': stock_data.get('name', symbol),
                                    'category': category,
                                    'exchange': stock_data.get('exchange', ''),
                                    'currency': stock_data.get('currency', 'USD'),
                                    'sector': stock_data.get('sector', ''),
                                    'industry': stock_data.get('industry', ''),
                                    'market_cap': stock_data.get('market_cap'),
                                    'current_price': stock_data.get('current_price', 0),
                                    'previous_close': stock_data.get('previous_close', 0),
                                    'fifty_two_week_high': stock_data.get('fifty_two_week_high', 0),
                                    'fifty_two_week_low': stock_data.get('fifty_two_week_low', 0),
                                    'pe_ratio': stock_data.get('pe_ratio'),
                                    'description': stock_data.get('description', ''),
                                    'website': stock_data.get('website', ''),
                                    'city': stock_data.get('city', ''),
                                    'country': stock_data.get('country', ''),
                                    'employees': stock_data.get('employees'),
                                }
                            )
                            if stock_created:
                                logger.info(f"Created stock: {symbol}")
                            else:
                                for key in ('name', 'exchange', 'sector', 'industry',
                                            'market_cap', 'current_price', 'previous_close',
                                            'fifty_two_week_high', 'fifty_two_week_low',
                                            'pe_ratio', 'description', 'website', 'city',
                                            'country', 'employees'):
                                    val = stock_data.get(key)
                                    if val is not None:
                                        setattr(stock, key, val)
                                stock.save()
                    except Exception as e:
                        logger.error(f"Error processing stock {symbol}: {str(e)}")
                        continue

            return True
        except Exception as e:
            logger.error(f"Error initializing categories and stocks: {str(e)}")
            return False

    @staticmethod
    def fetch_stock_info(symbol):
        """Fetch comprehensive stock information using yfinance."""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            current_price = info.get('currentPrice') or info.get('regularMarketPrice', 0) or 0
            previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose', 0) or 0
            return {
                'name': info.get('longName', info.get('shortName', symbol)),
                'exchange': info.get('exchange', ''),
                'currency': info.get('currency', 'USD'),
                'sector': info.get('sector', ''),
                'industry': info.get('industry', ''),
                'market_cap': info.get('marketCap'),
                'current_price': current_price,
                'previous_close': previous_close,
                'fifty_two_week_high': info.get('fiftyTwoWeekHigh', 0) or 0,
                'fifty_two_week_low': info.get('fiftyTwoWeekLow', 0) or 0,
                'pe_ratio': info.get('trailingPE') or info.get('forwardPE'),
                'description': info.get('longBusinessSummary', ''),
                'website': info.get('website', ''),
                'city': info.get('city', ''),
                'country': info.get('country', ''),
                'employees': info.get('fullTimeEmployees'),
            }
        except Exception as e:
            logger.error(f"Error fetching info for {symbol}: {str(e)}")
            return None

    @staticmethod
    def fetch_stock_history(symbol, period='1mo', interval=None):
        """Fetch stock price history. Returns list of {date, price} dicts."""
        try:
            if interval is None:
                interval_map = {
                    '1d': '5m', '5d': '15m', '1mo': '1d',
                    '3mo': '1d', '6mo': '1d', '1y': '1wk',
                    '2y': '1wk', '5y': '1mo', 'ytd': '1d', 'max': '1mo',
                }
                interval = interval_map.get(period, '1d')

            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)
            if hist is None or hist.empty:
                return []

            data = []
            for date, row in hist.iterrows():
                fmt = '%Y-%m-%d %H:%M' if interval in ('5m', '15m', '30m', '1h') else '%Y-%m-%d'
                data.append({
                    'date': date.strftime(fmt),
                    'price': round(float(row['Close']), 2),
                })
            return data
        except Exception as e:
            logger.error(f"Error fetching history for {symbol}: {str(e)}")
            return []

    @staticmethod
    def get_stock_as_frontend_shape(stock_obj):
        """Convert a Stock model instance to the frontend Stock interface shape."""
        current_price = float(stock_obj.current_price or 0)
        previous_close = float(stock_obj.previous_close or 0)
        change = round(current_price - previous_close, 2) if current_price and previous_close else 0
        change_percent = round((change / previous_close) * 100, 2) if previous_close else 0

        pe_ratio = float(stock_obj.pe_ratio) if stock_obj.pe_ratio else None
        fifty_two_week_high = float(stock_obj.fifty_two_week_high or 0)
        fifty_two_week_low = float(stock_obj.fifty_two_week_low or 0)

        # Derive PE min/max/avg using the 52-week price range.
        # EPS = current_price / pe_ratio  →  pe_at_price = price / EPS = pe_ratio * (price / current_price)
        if pe_ratio and current_price > 0:
            pe_min = round(pe_ratio * fifty_two_week_low / current_price, 2)
            pe_max = round(pe_ratio * fifty_two_week_high / current_price, 2)
            pe_avg = round((pe_min + pe_max) / 2, 2)
        else:
            pe_min = pe_max = pe_avg = None

        # Recommendation: based on where current price sits in the 52-week range
        if fifty_two_week_high > fifty_two_week_low and current_price > 0:
            price_position = (current_price - fifty_two_week_low) / (fifty_two_week_high - fifty_two_week_low)
            if price_position <= 0.33:
                recommendation = 'BUY'
            elif price_position <= 0.66:
                recommendation = 'HOLD'
            else:
                recommendation = 'SELL'
        else:
            recommendation = 'HOLD'

        return {
            'ticker': stock_obj.symbol,
            'name': stock_obj.name,
            'currentPrice': current_price,
            'change': change,
            'changePercent': change_percent,
            'marketCap': stock_obj.market_cap or 0,
            'peRatio': pe_ratio,
            'peMin': pe_min,
            'peMax': pe_max,
            'peAvg': pe_avg,
            'recommendation': recommendation,
            'fiftyTwoWeekHigh': fifty_two_week_high,
            'fiftyTwoWeekLow': fifty_two_week_low,
            'sector': stock_obj.sector or '',
            'industry': stock_obj.industry or '',
            'description': stock_obj.description or '',
        }

    @staticmethod
    def fetch_live_stock_detail(symbol, period='1mo'):
        """Fetch full live stock detail for any ticker via yfinance."""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            current_price = info.get('currentPrice') or info.get('regularMarketPrice', 0) or 0
            previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose', 0) or 0
            change = round(current_price - previous_close, 2) if current_price and previous_close else 0
            change_percent = round((change / previous_close) * 100, 2) if previous_close else 0

            history = StockDataService.fetch_stock_history(symbol, period)

            return {
                'ticker': symbol.upper(),
                'name': info.get('longName', info.get('shortName', symbol)),
                'currentPrice': current_price,
                'change': change,
                'changePercent': change_percent,
                'marketCap': info.get('marketCap', 0) or 0,
                'peRatio': info.get('trailingPE') or info.get('forwardPE'),
                'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', 0) or 0,
                'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', 0) or 0,
                'sector': info.get('sector', ''),
                'industry': info.get('industry', ''),
                'description': info.get('longBusinessSummary', ''),
                'website': info.get('website', ''),
                'city': info.get('city', ''),
                'country': info.get('country', ''),
                'employees': info.get('fullTimeEmployees'),
                'history': history,
            }
        except Exception as e:
            logger.error(f"Error fetching live detail for {symbol}: {str(e)}")
            return None

    @staticmethod
    def search_stocks(query, limit=10):
        """Search stocks using yfinance Search API."""
        try:
            search = yf.Search(query, max_results=limit)
            results = []
            quotes = getattr(search, 'quotes', []) or []
            for item in quotes:
                quote_type = item.get('quoteType', '')
                if quote_type and quote_type.upper() not in ('EQUITY', 'ETF'):
                    continue
                symbol = item.get('symbol', '')
                if not symbol:
                    continue
                results.append({
                    'ticker': symbol,
                    'name': item.get('longname') or item.get('shortname') or symbol,
                    'exchange': item.get('exchange', ''),
                    'sector': item.get('sector', ''),
                    'industry': item.get('industry', ''),
                })
            return results[:limit]
        except Exception as e:
            logger.error(f"Error searching stocks for '{query}': {str(e)}")
            return []