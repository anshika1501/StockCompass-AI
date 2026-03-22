# Stock API Backend

A Django REST API backend that uses yfinance to fetch stock data with proper categorization for IT, Banking, Healthcare, Energy, and other sectors.

## Features

- **Stock Categories**: Organized stocks by sectors (Technology, Banking, Healthcare, Energy, etc.)
- **Real-time Stock Data**: Fetch live stock data using yfinance
- **RESTful APIs**: Clean REST endpoints for frontend integration
- **SQLite Database**: Lightweight database for development
- **Admin Interface**: Django admin for data management

## API Endpoints

### 1. List All Categories
```
GET /api/categories/
```
Returns all stock categories with stock count.

### 2. Get Stocks by Category
```
GET /api/categories/{category_id}/stocks/
```
Returns all stocks in a specific category.

### 3. Get Stock Details for Charts
```
GET /api/stocks/{symbol}/chart/?period=1mo
```
Returns detailed stock price data for charts.

**Available periods**: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max

### Other Endpoints

- `GET /api/stocks/` - List all stocks
- `GET /api/stocks/{id}/` - Get detailed stock information
- `GET /api/search/?q=query` - Search stocks by symbol or name
- `POST /api/initialize/` - Initialize stock categories and data
- `POST /api/update-prices/` - Update stock prices

## Setup Instructions

### Prerequisites
- Python 3.8+
- pip or conda

### Installation

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create superuser** (optional):
   ```bash
   python manage.py createsuperuser
   ```

7. **Initialize stock data**:
   ```bash
   python manage.py shell
   >>> from stocks.services import StockDataService
   >>> StockDataService.initialize_categories_and_stocks()
   >>> exit()
   ```

8. **Start development server**:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/`

## Stock Categories

The system includes the following predefined categories:

- **Technology**: AAPL, MSFT, GOOGL, AMZN, META, TSLA, NVDA, etc.
- **Banking**: JPM, BAC, WFC, GS, MS, C, USB, etc.
- **Healthcare**: JNJ, UNH, PFE, ABT, MRK, TMO, etc.
- **Energy**: XOM, CVX, COP, EOG, SLB, PSX, etc.
- **Consumer Goods**: PG, KO, PEP, WMT, COST, NKE, etc.
- **Finance**: BRK-B, V, MA, PYPL, SPGI, MCO, etc.
- **Industrial**: BA, CAT, GE, MMM, HON, UPS, etc.
- **Telecommunications**: VZ, T, TMUS, CMCSA, CHTR, etc.

## Usage Examples

### Get all categories:
```bash
curl http://localhost:8000/api/categories/
```

### Get Technology stocks:
```bash
curl http://localhost:8000/api/categories/1/stocks/
```

### Get AAPL chart data for last month:
```bash
curl http://localhost:8000/api/stocks/AAPL/chart/?period=1mo
```

### Search for Apple stock:
```bash
curl http://localhost:8000/api/search/?q=AAPL
```

## Development

### Running Tests
```bash
python manage.py test
```

### Accessing Admin Interface
1. Create superuser: `python manage.py createsuperuser`
2. Visit: `http://localhost:8000/admin/`

### Updating Stock Prices
```bash
# Update all stock prices
curl -X POST http://localhost:8000/api/update-prices/

# Update specific stock
curl -X POST http://localhost:8000/api/update-prices/ \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "period": "1mo"}'
```

## Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── stock_api/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── stocks/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── models.py
    ├── serializers.py
    ├── services.py
    ├── views.py
    ├── urls.py
    ├── tests.py
    └── migrations/
        └── __init__.py
```

## Notes

- The system automatically fetches real-time data from Yahoo Finance using yfinance
- Stock data is cached in the local SQLite database for performance
- CORS is enabled for frontend integration
- All endpoints return JSON responses
- Error handling and logging are implemented throughout