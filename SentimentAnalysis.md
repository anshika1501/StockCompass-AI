# Stock Sentiment Analysis API - Integration Guide

This document is designed to help developers and AI agents understand and integrate the Stock Sentiment Analysis API into any external application (frontend web app, mobile app, or another backend service). 

The underlying application uses a Django REST Framework backend to scrape financial news, analyze it using natural language processing (NLP) models, and aggregate the sentiment into bullish/bearish/neutral trends.

---

## 1. Overview & Setup

### What is this API?
This API serves as a unified interface to retrieve and analyze the market sentiment for any given stock ticker (e.g., `AAPL`, `TSLA`). It performs real-time data fetching, sentiment analysis scoring, and historical trend aggregation.

### Prerequisites for Integration
- **CORS is Pre-Configured**: The backend (`settings.py`) explicitly allows all cross-origin requests (`CORS_ALLOW_ALL_ORIGINS = True`). You do not need any special proxy or headers to bypass CORS from a browser-based frontend.
- **No API Keys Required (for clients)**: Calls directly to this API do not require an authorization header or API key.
- **Server Startup**: The Django development server must be running locally to handle requests. It can be started from the `sentiment_backend` project root via:
  ```bash
  python manage.py runserver
  ```
- **Base URL (Local Development)**: `http://localhost:8000/api`

---

## 2. API Reference

### 2.1 Analyze Stock Data (POST)
**Triggers the full pipeline**: fetches new news articles, cleans the text, runs ML-based sentiment analysis, stores the results in the database, and aggregates the scores for the current day.

- **Endpoint:** `/analyze-stock`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "stock_name": "AAPL"
  }
  ```

- **Success Response (200 OK):**
  ```json
  {
      "message": "Analysis completed successfully",
      "stock_name": "AAPL",
      "articles_processed": 15,
      "summary": {
          "date": "2026-03-20",
          "avg_sentiment": 4.25,
          "daily_trend": "BULLISH"
      }
  }
  ```
  *(Note: `summary` may be omitted if no articles were processed today)*

- **Error Responses:**
  - `400 Bad Request`: When `stock_name` is missing.
    ```json
    { "error": "stock_name is required" }
    ```
  - `404 Not Found`: When no news could be fetched.
    ```json
    { "message": "No news found for AAPL or error fetching news." }
    ```
  - `500 Server Error`: If the analysis pipeline crashes.

---

### 2.2 Retrieve Historical Analysis (GET)
**Fetches past aggregated sentiment analysis** for a specific stock. Returns an array of daily sentiment data ordered from newest to oldest.

- **Endpoint:** `/get-analysis/<stock_name>`
- **Method:** `GET`

- **Success Response (200 OK):**
  ```json
  {
      "stock_name": "AAPL",
      "history": [
          {
              "date": "2026-03-20",
              "avg_sentiment": 4.25,
              "daily_trend": "BULLISH"
          },
          {
              "date": "2026-03-19",
              "avg_sentiment": 3.80,
              "daily_trend": "BEARISH"
          }
      ]
  }
  ```

- **Error Responses:**
  - `404 Not Found`: If no records exist in the database for the given stock.
    ```json
    { "message": "No analysis found for AAPL" }
    ```

---

## 3. How to Integrate (For AI Agents & Developers)

### Important Implementation Notes for AI Agents:
1. **Fallback/Mock Data Generation**: The API heavily relies on external news scraping APIs (like NewsAPI or AlphaVantage) running on the backend. If external limits are reached, the API might return `404` or `500`. It is **highly recommended** to implement synthetic fallback data (mock data generation) on the client application if the API call fails, to ensure UI resilience.
2. **Padding Historical Data**: Often, the `/get-analysis` endpoint returns fewer than 30 days of data. If the integrated application requires a rich area/line chart spanning a month, generating padded historical data points client-side is a best practice.
3. **`daily_trend` Interpretation**: The `daily_trend` string returned is typically `BULLISH`, `BEARISH`, or `NEUTRAL`. Ensure UI badges/colors appropriately parse these exact string matches.

### Example Integration (JavaScript / React / Next.js)

```javascript
/* 
 * 1. API Call Utilities
 */
const BASE_URL = 'http://localhost:8000/api';

export const analyzeStockSentiment = async (ticker) => {
  const response = await fetch(`${BASE_URL}/analyze-stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock_name: ticker }),
  });
  
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || errData.message || 'Error occurred during sentiment analysis');
  }
  return response.json();
};

export const getSentimentHistory = async (ticker) => {
  const response = await fetch(`${BASE_URL}/get-analysis/${ticker}`);
  
  if (!response.ok) {
    throw new Error('History not found');
  }
  return response.json();
};

/*
 * 2. Usage in a Component
 */
const fetchStockData = async (ticker) => {
  try {
    // Parallelize or sequence based on requirements
    const currentAnalysisData = await analyzeStockSentiment(ticker);
    const historyData = await getSentimentHistory(ticker);
    
    console.log("Current Day Summary:", currentAnalysisData.summary);
    console.log("Historical Data Array:", historyData.history);
    
    // Update Your State Here
    
  } catch (err) {
    console.error("API Call Failed", err.message);
    // Trigger Fallback/Mock logic here
  }
}
```

### Example Integration (Python / Requests Toolkit)
```python
import requests

BASE_URL = "http://localhost:8000/api"

def get_stock_sentiment(ticker: str):
    # Trigger analysis
    resp = requests.post(
        f"{BASE_URL}/analyze-stock", 
        json={"stock_name": ticker}
    )
    
    if resp.status_code == 200:
        print("Analysis Summary:", resp.json().get("summary"))
    else:
        print("Error triggering analysis:", resp.json())

    # Get history
    history_resp = requests.get(f"{BASE_URL}/get-analysis/{ticker}")
    if history_resp.status_code == 200:
        print("Historical Trends:", history_resp.json().get("history"))

get_stock_sentiment("NVDA")
```
