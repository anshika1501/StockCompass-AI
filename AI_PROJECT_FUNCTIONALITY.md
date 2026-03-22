# StockCompass AI Project Functionality Reference

This document explains what the project does, how backend and frontend modules interact, and how AI tools should reason about the codebase.

## 1. Project Summary

StockCompass is a full-stack stock analytics platform with:

- Django REST backend for market data retrieval, sector portfolio data, machine-learning style analytics, forecasting, and simple auth.
- Next.js frontend for portfolio browsing, stock deep-dive pages, multi-stock comparison, Nifty 50 PCA clustering, commodity/crypto forecasting, and sentiment UI.
- Primary market data source: Yahoo Finance via `yfinance`.
- Extra sentiment integration: a separate sentiment service (external URL from frontend env).

## 2. Tech Stack

### Backend

- Python + Django 4.2 + Django REST Framework.
- SQLite database (`backend/db.sqlite3`).
- ML/data libraries include `numpy`, `pandas`, `scikit-learn`, `statsmodels`, `tensorflow`.
- CORS enabled globally (`CORS_ALLOW_ALL_ORIGINS = True`).

### Frontend

- Next.js 15 + React 19 + TypeScript.
- UI via Tailwind and Radix components.
- Charts via Recharts.
- Optional Genkit-based AI summary flow for stock insights.

## 3. Runtime and Configuration

### Entry points

- Backend base URL path: `/api/` (Django routes include `stocks.urls`).
- Frontend dev script runs on port `9002`.

### Frontend env vars

- `NEXT_PUBLIC_API_URL` (default expected: `http://127.0.0.1:8000/api`).
- `NEXT_PUBLIC_SENTIMENT_API_URL` (external sentiment backend, example: `http://localhost:6969`).

### API base resolution behavior

Frontend API base (`src/lib/api-base.ts`) resolves in this order:

1. `NEXT_PUBLIC_API_URL` if present.
2. Browser same-origin fallback (`${window.location.origin}/api`).
3. Local default (`http://127.0.0.1:8000/api`) for SSR/dev fallback.

## 4. High-Level Architecture

### Data flow pattern

1. Frontend route/component invokes helper in `src/lib/stock-data.ts` or direct fetch.
2. Backend endpoint receives request and typically:
   - uses DB-first strategy where possible,
   - falls back to `yfinance` for live/uncached symbols,
   - computes analytics/predictions,
   - returns JSON payload for chart/table rendering.
3. Some backend endpoints cache results (Django cache) for time-bounded speedups.

### Persistence model

- `StockCategory`, `Stock`, `StockPrice`, `StockPrediction` are persisted.
- Price history for many analytics endpoints is fetched live from Yahoo and not fully persisted as time-series in every flow.
- Prediction records are persisted and later evaluated.

## 5. Backend Domain Models

### `StockCategory`

- Sector/category metadata (`name`, `slug`, `description`, `icon`, `image`).
- Auto-slug generation on save if missing.

### `Stock`

- Core security metadata (`symbol`, `name`, category relationship, sector/industry).
- Snapshot fundamentals (`market_cap`, `current_price`, `previous_close`, `52w high/low`, `pe_ratio`).
- Company profile fields (`description`, `website`, `city`, `country`, `employees`).

### `StockPrice`

- OHLCV time-series rows linked to `Stock`.
- Unique per (`stock`, `date`).

### `StockPrediction`

- Stores prediction jobs and evaluation:
  - context (`current_price`, `min/max 30d`),
  - outputs (`arima`, `lstm`, `cnn` predictions),
  - later actual + errors.

## 6. Backend API Surface (Implemented Endpoints)

Base prefix for all paths below: `/api`.

### 6.1 Sector and stock directory APIs

- `GET /sectors/`
  - Returns all sectors with icon/image/description + `stockCount`.
- `GET /sectors/<sector_slug>/stocks/`
  - Returns sector metadata + stock list for that sector.
- `GET /stocks/`
  - Returns all active stocks in frontend-friendly shape.
- `GET /stocks/<ticker>/?period=...`
  - Stock detail + history. DB-first for metadata, live history from Yahoo.
- `GET /stocks/<ticker>/chart/?period=...`
  - Chart-only history points.
- `GET /search/?q=...`
  - Searches local DB first, then Yahoo fallback.
- `POST /initialize/`
  - Initializes predefined categories and stock records.

### 6.2 Nifty 50 APIs

- `GET /nifty50/`
  - Returns Nifty 50 list using layered strategy:
    - cached response,
    - fresh DB values,
    - parallel live Yahoo fetch for missing symbols,
    - stale DB fallback if live fails.
  - Writes newly fetched live results back to DB.
  - Cache TTL: 5 minutes.

- `GET /nifty50-pca/?n_clusters=4`
  - Batch-downloads 1Y data for Nifty 50.
  - Computes 7 engineered features:
    - annual return,
    - annualized volatility,
    - 3-month momentum,
    - PE ratio (or fallback default),
    - 52-week position,
    - discount encoding,
    - opportunity score.
  - Runs `StandardScaler -> PCA(2) -> KMeans`.
  - Returns PC coordinates, cluster labels, explained variance, feature loadings.
  - Cache TTL: 30 minutes (keyed by cluster count).

### 6.3 Live analytics APIs

- `GET /stocks/live-search/?q=...&limit=...`
  - Yahoo-based symbol search + quick valuation fields.
- `GET /stocks/live-detail/?symbol=...&period=...&interval=...`
  - One-symbol live analytics including graph data + opportunity scoring.
- `GET /stocks/live-compare/?symbol_a=...&symbol_b=...&period=...&interval=...`
  - Pairwise aligned history, scatter points, Pearson correlation, regression equation.

### 6.4 Portfolio and advanced analytics

- `GET /sectors/<slug>/analysis/`
  - Sector portfolio scoring by discount level, opportunity score, recommendation.

- `GET /stocks/linear-regression/?symbol_a=...&symbol_b=...&period=...`
  - Pairwise linear regression metrics including $R^2$.

- `GET /stocks/pca-clustering/?symbols=A,B,...&period=...`
  - PCA/KMeans for up to 10 custom symbols.

- `GET /stocks/lstm-prediction/?symbol=...&period=...`
  - Returns pseudo-LSTM-style forecast payload (implementation uses smoothing + randomness).

- `GET /stocks/logistic-regression/?symbol=...&period=...`
  - Returns pseudo logistic direction probabilities (momentum + randomness).

- `GET /stocks/compare-analysis/?symbols=A,B,...&period=...`
  - DB-first comprehensive analysis for multiple symbols:
    - stock detail table,
    - all-pairs linear regression,
    - PCA clustering,
    - logistic direction forecasts,
    - correlation matrix.

### 6.5 Gold/Silver/Crypto forecasting APIs

- `GET /gold-silver/`
  - Returns:
    - current gold/silver prices (converted to INR per gram),
    - multi-range histories (`1d`, `1mo`, `1y`, `5y`),
    - 1Y correlation,
    - linear regression diagnostics,
    - SHAP-like and LIME-like explainability payloads,
    - 30-day trajectory with confidence intervals.

- `GET /forecast/?ticker=...&model=...&horizon=...`
  - Generic asset forecast supporting horizons `1h | 1d | 3d | 30d`.
  - Model options: `linear | logistic | lstm | rnn`.
  - Uses feature engineering on lag/momentum/volatility, then model-specific forecast loop.
  - Cache TTL: 1 hour.

### 6.6 Authentication APIs (basic)

- `POST /register/`
  - Creates Django user by email/password (username = email).
- `POST /login/`
  - Authenticates credentials.
  - Returns a simple mock token string (`session_<id>_valid`), not JWT.

### 6.7 Prediction lifecycle APIs

- `GET /predictions/`
  - List all prediction records.
- `POST /predictions/`
  - Create prediction record for symbol + target time:
    - pulls recent history,
    - runs ARIMA/LSTM/CNN mini-models,
    - stores outputs in DB.
- `POST /predictions/evaluate/`
  - Evaluates due predictions (`target_time <= now`) against latest observed price and stores errors.

## 7. Backend Service/Analytics Layer Notes

### `stocks/services.py`

- Owns sector bootstrap lists (`STOCK_CATEGORIES`) for Indian market symbols.
- Handles stock info retrieval and stock-to-frontend object transformation.
- Derives recommendation from position within 52-week range:
  - lower third: `BUY`,
  - middle third: `HOLD`,
  - upper third: `SELL`.

### `stocks/analytics.py`

- Contains reusable analytics helpers for live search/detail/compare/portfolio scoring.
- Implements custom regression calculation and payload normalization.

## 8. Frontend Route-to-Feature Map

### Public and auth-gated UX behavior

- Navigation checks login state from localStorage key `stock_compass_user`.
- Sign-in state is propagated through a custom browser event `auth_change`.
- Unauthenticated users see marketing-focused home; authenticated users see feature cards and nav menus.

### Routes

- `/`
  - Landing + capability cards + auth-sensitive entry flow.

- `/login`
  - Calls `POST /login/` and stores token/user in localStorage.

- `/register`
  - Calls `POST /register/`, then redirects to login.

- `/portfolios`
  - Loads sectors via `GET /sectors/`.

- `/portfolio/[sector]`
  - Loads sector stocks via `GET /sectors/<slug>/stocks/`.
  - Renders `PortfolioAnalysis` section from sector analytics endpoint.

- `/stocks`
  - Loads Nifty 50 via `GET /nifty50/`.
  - Provides two tabs:
    - table view,
    - PCA/KMeans view (`GET /nifty50-pca/`).

- `/stock/[ticker]`
  - Loads stock detail via `GET /stocks/<ticker>/`.
  - Fetches period charts via `GET /stocks/<ticker>/chart/`.
  - Loads live analytics widget via `GET /stocks/live-detail/`.
  - Exposes AI summary card via Genkit flow.

- `/compare`
  - Multi-symbol workflow using live search + compare list state.
  - Primary analysis call: `GET /stocks/compare-analysis/`.
  - Displays overview, linear regression, PCA clustering, logistic regression, correlation matrix tabs.

- `/nifty50-pca`
  - Dedicated PCA dashboard with cluster controls and drill-down visualizations.

- `/gold-silver`
  - Displays gold/silver analytics from `GET /gold-silver/`.
  - Also calls `GET /forecast/` for selectable asset/model/horizon trajectory forecasts.

- `/stock-prediction`
  - CRUD-like prediction workflow:
    - list via `GET /predictions/`,
    - create via `POST /predictions/`,
    - evaluate via `POST /predictions/evaluate/`.

- `/sentiment`
  - Uses external sentiment API URL (`NEXT_PUBLIC_SENTIMENT_API_URL`), not Django stock backend.
  - Calls:
    - `POST /api/analyze-stock`,
    - `GET /api/get-analysis/<ticker>`
    on that external service.

## 9. Shared Frontend Data Contracts

All core frontend API types/functions are centralized in `src/lib/stock-data.ts`.

Key interfaces used across pages:

- `Stock`, `Sector`, `SearchResult` for catalog and detail screens.
- `LiveStockDetail`, `ComparisonData`, `PortfolioAnalysisData` for live analytics and compare views.
- `Nifty50PCAResult` for PCA dashboards.
- `GoldSilverAnalysis` and `AssetForecast` for commodities/crypto panel.

## 10. Caching and Performance Characteristics

- Backend caching is applied to expensive endpoints:
  - `/nifty50/`: 5 minutes.
  - `/nifty50-pca/`: 30 minutes per `n_clusters`.
  - `/forecast/`: 1 hour per ticker/model/horizon.
- Nifty50 live fetch and gold/silver retrieval use parallel/concurrent requests to reduce latency.
- Frontend API helper uses `cache: 'no-store'` for dynamic freshness in many flows.

## 11. Security and Operational Notes for AI Tools

- Auth is session-mimicking and localStorage-based, not production-grade token auth.
- CORS is fully open in backend settings.
- Some endpoints include stochastic behavior (randomness in certain prediction/demo outputs), so repeated calls can differ.
- TensorFlow-dependent endpoints may be heavy and slower in constrained runtime environments.
- Sentiment page depends on an external service; if env var is missing or service is down, sentiment feature fails independently of core backend.

## 12. Typical End-to-End User Flows

### Flow A: Portfolio exploration

1. User opens `/portfolios`.
2. Frontend gets sectors (`/sectors/`).
3. User selects sector -> `/portfolio/[sector]`.
4. Page loads stock list (`/sectors/<slug>/stocks/`) and portfolio analytics (`/sectors/<slug>/analysis/`).
5. User opens individual stock page for chart + live analytics + AI insights.

### Flow B: Quant comparison workflow

1. User opens `/compare`.
2. Search adds symbols (`/stocks/live-search/`).
3. Run analysis triggers `/stocks/compare-analysis/`.
4. UI presents overview table + regression + PCA + logistic + correlation tabs.

### Flow C: Alternative assets + forecast

1. User opens `/gold-silver`.
2. Page loads `/gold-silver/` payload with explainability artifacts.
3. User selects asset/model/horizon -> `/forecast/` for trajectory.

### Flow D: Prediction lifecycle

1. User opens `/stock-prediction` and creates prediction (`/predictions/`, POST).
2. Record is stored with ARIMA/LSTM/CNN outputs.
3. Later, user (or job trigger) evaluates due predictions (`/predictions/evaluate/`).

## 13. AI-Agent Guidance for Code Changes

When extending this project, AI tools should prefer:

- Reusing `src/lib/stock-data.ts` instead of adding raw fetches in many components.
- Preserving DB-first + live-fallback pattern in backend endpoints.
- Adding cache keys for any new expensive live/ML endpoints.
- Keeping response shapes backward compatible with existing frontend interfaces.
- Isolating external-service dependencies (as done for sentiment API).
