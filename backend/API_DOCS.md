# Stock API Documentation

## API Base URL
```
http://localhost:8000/api/
```

## Endpoints

### 1. List All Categories

**GET** `/api/categories/`

**Response:**
```json
[
    {
        "id": 1,
        "name": "Technology",
        "description": "Technology sector stocks",
        "created_at": "2026-03-05T10:00:00Z",
        "stock_count": 14
    },
    {
        "id": 2,
        "name": "Banking",
        "description": "Banking sector stocks", 
        "created_at": "2026-03-05T10:00:00Z",
        "stock_count": 14
    }
]
```

### 2. Get Stocks by Category

**GET** `/api/categories/{category_id}/stocks/`

**Example:** `/api/categories/1/stocks/`

**Response:**
```json
[
    {
        "id": 1,
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "category": 1,
        "category_name": "Technology",
        "exchange": "NASDAQ",
        "currency": "USD",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "market_cap": 3000000000000,
        "is_active": true,
        "latest_price": {
            "date": "2026-03-05",
            "close_price": 150.25,
            "volume": 89000000
        },
        "created_at": "2026-03-05T10:00:00Z",
        "updated_at": "2026-03-05T10:00:00Z"
    }
]
```

### 3. Get Stock Chart Data

**GET** `/api/stocks/{symbol}/chart/?period=1mo`

**Example:** `/api/stocks/AAPL/chart/?period=1mo`

**Parameters:**
- `period`: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max

**Response:**
```json
{
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "currency": "USD",
    "data": [
        {
            "date": "2026-03-05",
            "open": 149.50,
            "high": 151.75,
            "low": 148.25,
            "close": 150.25,
            "volume": 89000000
        },
        {
            "date": "2026-03-04",
            "open": 148.00,
            "high": 150.00,
            "low": 147.50,
            "close": 149.50,
            "volume": 75000000
        }
    ]
}
```

### 4. Get Stock Details

**GET** `/api/stocks/{stock_id}/`

**Example:** `/api/stocks/1/`

**Response:**
```json
{
    "id": 1,
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "category": {
        "id": 1,
        "name": "Technology", 
        "description": "Technology sector stocks",
        "created_at": "2026-03-05T10:00:00Z",
        "stock_count": 14
    },
    "exchange": "NASDAQ",
    "currency": "USD", 
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "market_cap": 3000000000000,
    "price_history": [
        {
            "id": 1,
            "stock": 1,
            "stock_symbol": "AAPL",
            "date": "2026-03-05",
            "open_price": "149.50",
            "high_price": "151.75", 
            "low_price": "148.25",
            "close_price": "150.25",
            "volume": 89000000,
            "adj_close": "150.25"
        }
    ],
    "created_at": "2026-03-05T10:00:00Z",
    "updated_at": "2026-03-05T10:00:00Z"
}
```

### 5. Search Stocks

**GET** `/api/search/?q={query}`

**Example:** `/api/search/?q=apple`

**Response:**
```json
[
    {
        "id": 1,
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "category": 1,
        "category_name": "Technology",
        "exchange": "NASDAQ",
        "currency": "USD",
        "sector": "Technology", 
        "industry": "Consumer Electronics",
        "market_cap": 3000000000000,
        "is_active": true,
        "latest_price": {
            "date": "2026-03-05",
            "close_price": 150.25,
            "volume": 89000000
        },
        "created_at": "2026-03-05T10:00:00Z",
        "updated_at": "2026-03-05T10:00:00Z"
    }
]
```

### 6. List All Stocks

**GET** `/api/stocks/`

**Optional Parameters:**
- `category`: Filter by category ID

**Example:** `/api/stocks/?category=1`

**Response:** Same format as stocks by category

### 7. Initialize Stock Data

**POST** `/api/initialize/`

**Response:**
```json
{
    "message": "Stock data initialized successfully"
}
```

### 8. Update Stock Prices

**POST** `/api/update-prices/`

**Request Body (optional):**
```json
{
    "symbol": "AAPL",
    "period": "1mo"
}
```

**Response:**
```json
{
    "message": "Stock prices updated successfully for AAPL"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
    "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Usage Examples with curl

### Get all categories:
```bash
curl http://localhost:8000/api/categories/
```

### Get technology stocks:
```bash
curl http://localhost:8000/api/categories/1/stocks/
```

### Get AAPL chart data:
```bash
curl "http://localhost:8000/api/stocks/AAPL/chart/?period=1mo"
```

### Search for stocks:
```bash
curl "http://localhost:8000/api/search/?q=apple"
```

### Initialize stock data:
```bash
curl -X POST http://localhost:8000/api/initialize/
```

### Update prices for specific stock:
```bash
curl -X POST http://localhost:8000/api/update-prices/ \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "period": "1mo"}'
```