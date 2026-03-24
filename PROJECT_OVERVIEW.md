# StockCompass-AI: Project Overview & Development Guide

StockCompass-AI is a high-end financial intelligence platform designed for equity analysis, market sector exploration, and AI-driven predictive modeling.

## 🏗️ Technical Architecture

The project follows a modern decoupled architecture:

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide icons, and Recharts for data visualization.
- **Backend**: Django 4.2 (Python), Django REST Framework (DRF), SQLite database.
- **Data Source**: Real-time and historical market data primarily sourced from **Yahoo Finance (`yfinance`)**.
- **Intelligence Layer**: Scikit-learn (PCA, KMeans), TensorFlow (LSTM), statsmodels (ARIMA), and custom quantitative logic.

---

## 📁 Project Structure

### Backend (`/backend`)
- **`stocks/models.py`**: Defines `Stock`, `StockCategory` (Sectors), `StockPrice`, and `StockPrediction`.
- **`stocks/views.py`**: DRF endpoints for market data, analytics, PCA, and forecasting.
- **`stocks/analytics.py` & `services.py`**: Core mathematical logic for opportunity scoring, discount levels, and data transformation.
- **`stocks/urls.py`**: API route definitions (prefixed with `/api`).

### Frontend (`/frontend`)
- **`src/app/`**: Next.js pages (Routes).
  - `/portfolios`: Overview of all market sectors (Display label: **Sectors**).
  - `/portfolio/[sector]`: List of stocks within a specific sector.
  - `/stock/[ticker]`: Deep-dive analytics for a specific asset.
  - `/compare`: Technical comparison between multiple assets.
- **`src/components/`**: Reusable UI components.
  - `AiInsights.tsx`: Generates quantitative AI summaries of stocks.
  - `PortfolioAnalysis.tsx`: Advanced clustering and correlation logic.
  - `StockChart.tsx`: Professional time-series visualizations.
- **`src/lib/stock-data.ts`**: **CRITICAL FILE.** Contains all centralized API fetching logic and TypeScript interfaces for the entire app.

---

## 💎 Recent UI Redesign: Premium Fintech Aesthetic

The project recently underwent a major UI overhaul to achieve a production-level SaaS look (inspired by Stripe/Zerodha):

- **Color System**:
  - **Primary**: `#4F8DF7` (Professional Blue)
  - **Background**: `#FFFFFF` (Pure White)
  - **Text**: `#000000` (High Contrast Black) / `#1F2937` (Dark Gray)
  - **Accents**: `#DBEAFE` (Soft Blue Tint)
- **Nomenclature Change**: Every instance of "**Portfolios**" has been renamed to "**Sectors**" to better reflect the market-based nature of the categorization.
- **Components**: Cards, tables, and buttons now feature high contrast, sharp typography, and subtle shadows for a "premium" feel.

---

## 📂 Detailed Folder Breakdown

### 🏗️ Backend Structure (`/backend`)
The backend is a structured Django application optimized for financial calculations and ML inference.

- **`stocks/`**: The core application directory.
  - **`models.py`**: Database schema for assets, price logs, and sectors.
  - **`views.py`**: API endpoints (PCA, forecasting, live search, comparisons).
  - **`analytics.py`**: Mathematical logic for calculating metrics (RSR, opportunity scores, rankings).
  - **`services.py`**: High-level services for data fetching and normalization.
  - **`migrations/`**: Records of database schema changes.
- **`stock_api/`**: Global Django configuration (Settings, global URLs, CORS, Middleware).
- **`manage.py`**: Primary command-line utility for Django tasks (server, migrations, shell).
- **`db.sqlite3`**: Default local database for development.
- **`requirements.txt`**: List of Python dependencies (pandas, scikit-learn, yfinance, etc.).
- **`setup.bat` / `run_backend.bat`**: Windows scripts for quick environment setup and server startup.

---

### 🎨 Frontend Structure (`/frontend`)
The frontend is a sophisticated Next.js application that prioritizes high-end UI/UX and centralized data management.

- **`src/app/`**: Next.js App Router (defines the URL paths).
  - **`layout.tsx`**: Sets up global fonts, themes, and shared UI wrappers.
  - **`portfolios/` / `portfolio/`**: Market sector browsing and detailed sector analysis (UI label: **Sectors**).
  - **`stock/`**: Real-time stock deep-dive page.
  - **`compare/`**: Multi-asset technical comparison workshop.
- **`src/components/`**: The visual library of the app.
  - **`dashboard/`**: Persistent UI like the Sidebar and Global Shell.
  - **`ui/`**: Low-level Shadcn/Tailwind primitives (Buttons, Cards, Badges).
  - **Custom Components**: `StockChart.tsx`, `AiInsights.tsx`, `PortfolioAnalysis.tsx` (complex logic components).
- **`src/lib/`**: The application's "brain".
  - **`stock-data.ts`**: **The MOST critical file.** Defines every API call and data structure used in the frontend. If the API changes, this file must match it.
  - **`utils.ts`**: Global Tailwind merging (`cn`) and formatting helpers.
- **`src/hooks/`**: Custom React hooks for global state (e.g., `useCompareStocks`).
- **`src/ai/`**: Pre-configured AI flows (Genkit) for generating market summaries.

---

## 🔄 Core Data Flows

1. **Dashboard Loading**: Frontend calls `GET /sectors/` to populate the sectors list.
2. **Sector Analysis**: When a user selects a sector, the app calls `GET /sectors/<slug>/analysis/` to run quantitative scoring on all stocks in that group.
3. **Stock Detail**: The ticker page fetches metadata from the DB and live price history from Yahoo Finance simultaneously to ensure speed and accuracy.
4. **AI Summary**: The `AiInsights` component utilizes recent price action and fundamentals to generate a "Quantitative Intel" report for the user.

---

## 💡 Tips for AI-Driven Development

1. **Consistency**: Always use the **Sectors** terminology. Avoid returning to "Portfolios".
2. **Styling**: Maintain the **Blue & White premium theme**. Use bold black headlines (`font-black`) and blue primary accents (`bg-[#4F8DF7]`).
3. **API Logic**: If adding new data, update `src/lib/stock-data.ts` first. Most components should fetch data via the exported functions in that file.
4. **Icons**: Use **Lucide React** for all interactions.
5. **Charts**: Keep charts clean. Use the primary blue for lines/bars and ensure tooltips are high-contrast.

---

## 🚀 Getting Started

1. **Backend**: 
   - `cd backend`
   - `python manage.py runserver` (Default: port 8000)
2. **Frontend**:
   - `cd frontend`
   - `npm run dev` (Default: port 9002)
3. **Environment**:
   - Ensure `NEXT_PUBLIC_API_URL` points to `http://127.0.0.1:8000/api`.
