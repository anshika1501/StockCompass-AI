import logging
import math
import os
from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf
from django.utils import timezone

from .models import Stock, StockPrice, StockCategory

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
    'USA Market': {
        'icon': 'globe',
        'image': 'https://picsum.photos/seed/usa/800/600',
        'description': 'Large-cap US equities from the USA 200 list.',
    },
}

NIFTY500_CSV_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "ind_nifty500list.csv")
)
USA200_CSV_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "USA _200.csv")
)


def _normalize_symbol(symbol: str, country: str = "") -> str:
    value = (symbol or "").strip().upper()
    if not value:
        return ""
    country_value = (country or "").strip().lower()
    if country_value in {"india", "in"} and not value.endswith(".NS"):
        value = f"{value}.NS"
    return value


def _map_industry_to_category(industry: str) -> str:
    value = (industry or "").strip().lower()
    if not value:
        return "Miscellaneous"
    if "financial" in value or "bank" in value or "insurance" in value:
        return "Banking & Finance"
    if "information technology" in value or "technology" in value:
        return "Information Technology"
    if "telecommunication" in value or "telecom" in value:
        return "Telecom & Infrastructure"
    if "power" in value or "oil" in value or "gas" in value or "energy" in value:
        return "Energy & Utilities"
    if "automobile" in value or "auto" in value:
        return "Automotive"
    if "health" in value or "pharma" in value:
        return "Healthcare & Pharma"
    if "metal" in value or "mining" in value or "construction materials" in value:
        return "Metals & Materials"
    if "consumer" in value or "fmcg" in value:
        return "Consumer Goods"
    return industry.strip() or "Miscellaneous"


def _finite_or_none(value):
    try:
        num = float(value)
    except (TypeError, ValueError):
        return None
    return num if math.isfinite(num) else None


class StockDataService:
    """Service class to handle stock data fetching using yfinance."""

    # Predefined stock categories with Nifty 50 Indian stocks (NSE symbols)
    STOCK_CATEGORIES = {
    'Banking & Finance': [
        'HDFCBANK.NS','ICICIBANK.NS','SBIN.NS','KOTAKBANK.NS','AXISBANK.NS',
        'BAJFINANCE.NS','BAJAJFINSV.NS','INDUSINDBK.NS','SHRIRAMFIN.NS','BANDHANBNK.NS',
        'PNB.NS','BANKBARODA.NS','CANBK.NS','IDFCFIRSTB.NS','FEDERALBNK.NS',
    ],
    'Insurance': [
        'HDFCLIFE.NS','SBILIFE.NS','ICICIPRULI.NS','ICICIGI.NS','LICHSGFIN.NS',
    ],
    'Information Technology': [
        'TCS.NS','INFY.NS','HCLTECH.NS','WIPRO.NS','TECHM.NS',
        'LTIM.NS','LIT.NS','MINDTREE.NS','PERSISTENT.NS','COFORGE.NS','MPHASIS.NS','KPITTECH.NS',
    ],
    'Energy & Utilities': [
        'RELIANCE.NS','ONGC.NS','BPCL.NS','GAIL.NS','IOC.NS',
        'NTPC.NS','POWERGRID.NS','TATAPOWER.NS','ADANIGREEN.NS','ADANIENERGY.NS','COALINDIA.NS','ADANIPOWER.NS',
    ],
    'Automotive': [
        'MARUTI.NS','TATAMOTORS.NS','EICHERMOT.NS','HEROMOTOCO.NS','BAJAJ-AUTO.NS',
        'M&M.NS','TVSMOTOR.NS','ASHOKLEY.NS','BALKRISIND.NS','MRF.NS','BOSCHLTD.NS','ENDURANCE.NS','EXIDEIND.NS',
    ],
    'Consumer Goods': [
        'HINDUNILVR.NS','ITC.NS','NESTLEIND.NS','BRITANNIA.NS','TATACONSUM.NS',
        'VBL.NS','GODREJCP.NS','DABUR.NS','MARICO.NS','COLPAL.NS','VSTIND.NS','UBL.NS',
    ],
    'Consumer Durables': [
        'TITAN.NS',
    ],
    'Healthcare & Pharma': [
        'SUNPHARMA.NS','DRREDDY.NS','CIPLA.NS','DIVISLAB.NS','LUPIN.NS',
        'AUROPHARMA.NS','MANKIND.NS','ZYDUSLIFE.NS','TORNTPHARM.NS','APOLLOHOSP.NS',
        'ABBOTINDIA.NS','GLENMARK.NS','ALKEM.NS','GLAND.NS','JUBILANT.NS',
    ],
    'Metals & Materials': [
        'JSWSTEEL.NS','TATASTEEL.NS','HINDALCO.NS','GRASIM.NS','ULTRACEMCO.NS',
        'JINDALSTEL.NS','NMDC.NS','SAIL.NS','SHREECEM.NS','VEDL.NS','JSWENERGY.NS',
    ],
    'Capital Goods & Industrial': [
        'LT.NS','BEL.NS','IRFC.NS','BHEL.NS','RITES.NS','ABB.NS','CEATLTD.NS',
    ],
    'Telecommunication': [
        'BHARTIARTL.NS','TATACOMM.NS','VI.NS',
    ],
    'Media & Entertainment': [
        'SUNTV.NS','ZEEL.NS','PVR.NS','TV18BRDCST.NS',
    ],
    'Agricultural Chemicals': [
        'UPL.NS','ASIANPAINT.NS','PIDILITIND.NS','SRF.NS','TATACHEM.NS','RALLIS.NS',
    ],
    'Miscellaneous': [
        'ADANIENT.NS','CONCOR.NS','3MINDIA.NS','GRANULES.NS','SRTRANSFIN.NS','DIXON.NS',
    ],
    }

    @classmethod
    def _load_india_from_csv(cls):
        if not os.path.exists(NIFTY500_CSV_PATH):
            return None

        try:
            df = pd.read_csv(NIFTY500_CSV_PATH)
        except Exception as exc:
            logger.error("Failed to read NIFTY500 CSV: %s", exc)
            return None

        required = {"Symbol", "Company Name", "Industry"}
        if not required.issubset(set(df.columns)):
            logger.error("NIFTY500 CSV missing required columns: %s", required)
            return None

        categories = {}
        for _, row in df.iterrows():
            country = str(row.get("Country", "India")).strip() or "India"
            symbol = _normalize_symbol(str(row.get("Symbol", "")), country)
            if not symbol:
                continue
            company_name = str(row.get("Company Name", "")).strip()
            industry = str(row.get("Industry", "")).strip()
            category_name = _map_industry_to_category(industry)
            categories.setdefault(category_name, []).append({
                "symbol": symbol,
                "name": company_name,
                "industry": industry,
                "country": country,
            })

        return categories or None

    @classmethod
    def _load_usa_from_csv(cls):
        if not os.path.exists(USA200_CSV_PATH):
            return None

        try:
            df = pd.read_csv(USA200_CSV_PATH)
        except Exception as exc:
            logger.error("Failed to read USA200 CSV: %s", exc)
            return None

        required = {"Symbol", "Company"}
        if not required.issubset(set(df.columns)):
            logger.error("USA200 CSV missing required columns: %s", required)
            return None

        categories = {}
        category_name = "USA Market"
        for _, row in df.iterrows():
            country = str(row.get("Country", "USA")).strip() or "USA"
            symbol = _normalize_symbol(str(row.get("Symbol", "")), country)
            if not symbol:
                continue
            company_name = str(row.get("Company", "")).strip()
            categories.setdefault(category_name, []).append({
                "symbol": symbol,
                "name": company_name,
                "industry": "",
                "country": country,
            })

        return categories or None

    @classmethod
    def _load_categories_from_csvs(cls):
        categories = {}
        for source in (cls._load_india_from_csv(), cls._load_usa_from_csv()):
            if not source:
                continue
            for category_name, items in source.items():
                categories.setdefault(category_name, []).extend(items)
        return categories or None


    @classmethod
    def initialize_categories_and_stocks(cls):
        """Initialize stock categories and stocks in the database."""
        try:
            csv_categories = cls._load_categories_from_csvs()
            if csv_categories:
                cls.STOCK_CATEGORIES = {
                    cat: [item["symbol"] for item in items]
                    for cat, items in csv_categories.items()
                }
                categories = csv_categories
            else:
                categories = {
                    cat: [{"symbol": sym, "name": "", "industry": ""} for sym in syms]
                    for cat, syms in cls.STOCK_CATEGORIES.items()
                }

            for category_name, stock_items in categories.items():
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

                for item in stock_items:
                    symbol = item.get("symbol", "")
                    if not symbol:
                        continue
                    try:
                        stock_data = cls.fetch_stock_info(symbol)
                        fallback_name = item.get("name") or symbol
                        fallback_industry = item.get("industry") or ""
                        fallback_country = item.get("country") or ""
                        if stock_data:
                            stock, stock_created = Stock.objects.get_or_create(
                                symbol=symbol,
                                defaults={
                                    'name': stock_data.get('name') or fallback_name,
                                    'category': category,
                                    'exchange': stock_data.get('exchange', ''),
                                    'currency': stock_data.get('currency', 'USD'),
                                    'sector': stock_data.get('sector', ''),
                                    'industry': stock_data.get('industry', '') or fallback_industry,
                                    'market_cap': stock_data.get('market_cap'),
                                    'current_price': stock_data.get('current_price', 0),
                                    'previous_close': stock_data.get('previous_close', 0),
                                    'fifty_two_week_high': stock_data.get('fifty_two_week_high', 0),
                                    'fifty_two_week_low': stock_data.get('fifty_two_week_low', 0),
                                    'pe_ratio': stock_data.get('pe_ratio'),
                                    'description': stock_data.get('description', ''),
                                    'website': stock_data.get('website', ''),
                                    'city': stock_data.get('city', ''),
                                    'country': fallback_country or stock_data.get('country', ''),
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
                                if not stock.name:
                                    stock.name = fallback_name
                                if not stock.industry:
                                    stock.industry = fallback_industry
                                if fallback_country:
                                    stock.country = fallback_country
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
            current_price = _finite_or_none(info.get('currentPrice'))
            if current_price is None:
                current_price = _finite_or_none(info.get('regularMarketPrice'))
            current_price = current_price or 0

            previous_close = _finite_or_none(info.get('previousClose'))
            if previous_close is None:
                previous_close = _finite_or_none(info.get('regularMarketPreviousClose'))
            previous_close = previous_close or 0
            return {
                'name': info.get('longName', info.get('shortName', symbol)),
                'exchange': info.get('exchange', ''),
                'currency': info.get('currency', 'USD'),
                'sector': info.get('sector', ''),
                'industry': info.get('industry', ''),
                'market_cap': _finite_or_none(info.get('marketCap')),
                'current_price': current_price,
                'previous_close': previous_close,
                'fifty_two_week_high': _finite_or_none(info.get('fiftyTwoWeekHigh')) or 0,
                'fifty_two_week_low': _finite_or_none(info.get('fiftyTwoWeekLow')) or 0,
                'pe_ratio': _finite_or_none(info.get('trailingPE')) or _finite_or_none(info.get('forwardPE')),
                'description': info.get('longBusinessSummary', ''),
                'website': info.get('website', ''),
                'city': info.get('city', ''),
                'country': info.get('country', ''),
                'employees': _finite_or_none(info.get('fullTimeEmployees')),
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

    @staticmethod
    def update_stock_prices(period='1mo', interval=None, symbols=None, max_stocks=None):
        """Fetch and persist price history for stocks into StockPrice."""
        qs = Stock.objects.filter(is_active=True).order_by('id')
        if symbols:
            qs = qs.filter(symbol__in=symbols)
        if max_stocks:
            qs = qs[:max_stocks]

        errors = 0
        for stock in qs:
            try:
                interval_map = {
                    '1d': '5m', '5d': '15m', '1mo': '1d',
                    '3mo': '1d', '6mo': '1d', '1y': '1wk',
                    '2y': '1wk', '5y': '1mo', 'ytd': '1d', 'max': '1mo',
                }
                resolved_interval = interval or interval_map.get(period, '1d')

                ticker = yf.Ticker(stock.symbol)
                hist = ticker.history(period=period, interval=resolved_interval)
                if hist is None or hist.empty:
                    continue

                for date, row in hist.iterrows():
                    price_date = date.date() if hasattr(date, 'date') else date
                    close_val = _finite_or_none(row.get('Close')) or 0
                    open_val = _finite_or_none(row.get('Open'))
                    high_val = _finite_or_none(row.get('High'))
                    low_val = _finite_or_none(row.get('Low'))
                    adj_close_val = _finite_or_none(row.get('Adj Close'))
                    StockPrice.objects.update_or_create(
                        stock=stock,
                        date=price_date,
                        defaults={
                            'open_price': open_val if open_val is not None else close_val,
                            'high_price': high_val if high_val is not None else close_val,
                            'low_price': low_val if low_val is not None else close_val,
                            'close_price': close_val,
                            'adj_close': adj_close_val if adj_close_val is not None else close_val,
                            'volume': int(row.get('Volume', 0) or 0),
                        }
                    )

                closes = hist['Close'].dropna() if 'Close' in hist.columns else None
                if closes is not None and not closes.empty:
                    current_price = float(closes.iloc[-1])
                    previous_close = float(closes.iloc[-2]) if len(closes) > 1 else current_price
                    stock.current_price = current_price
                    stock.previous_close = previous_close

                try:
                    info = ticker.info or {}
                    high_val = _finite_or_none(info.get('fiftyTwoWeekHigh'))
                    low_val = _finite_or_none(info.get('fiftyTwoWeekLow'))
                    if high_val is not None:
                        stock.fifty_two_week_high = high_val
                    if low_val is not None:
                        stock.fifty_two_week_low = low_val
                except Exception:
                    pass

                stock.save(update_fields=['current_price', 'previous_close', 'fifty_two_week_high', 'fifty_two_week_low', 'updated_at'])

            except Exception as e:
                errors += 1
                logger.error("Error updating prices for %s: %s", stock.symbol, str(e))

        return errors == 0