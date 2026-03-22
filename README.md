# StockCompass
[![LOC](https://badge.aiyu.co.in/repo-batch?owner=anshika1501&repo=Stock-3.0&fields=loc)](https://github.com/anshika1501/Stock-3.0)

StockCompass is a comprehensive, AI-powered stock analysis platform featuring curated industry portfolios, stock clustering, and predictive trajectory forecasting using machine learning models.

![StockCompass Preview](./preview.png)

The project is divided into a **Django** backend that handles data fetching, ML modeling, and API endpoints, alongside a **Next.js** frontend showcasing a modern, glassmorphic UI.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16.x or higher)
- npm or yarn
- [Python](https://www.python.org/) 3.10+
- Git
- [PostgreSQL](https://www.postgresql.org/) 14+ (with pgvector extension)
- [Ollama](https://ollama.com/download) (for local LLM + embeddings)

---

## 🚀 Getting Started

### 1. Backend Setup (Django + Python + Postgres + Ollama)

The backend exposes the core API, handles stock data retrieval (via yfinance), and runs the predictive models.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   - **Windows:**
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install the required Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables (`backend/.env`):**
   ```env
   DJANGO_SECRET_KEY=change-me
   DJANGO_DEBUG=True
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

   POSTGRES_DB=stocks
   POSTGRES_USER=stocks_user
   POSTGRES_PASSWORD=change-me
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   DJANGO_DB_ENGINE=postgresql

   # Ollama defaults (local)
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_CHAT_MODEL=tinyllama
   OLLAMA_EMBED_MODEL=qwen3-embedding:0.6b
   ```

5. **Prepare PostgreSQL with pgvector (choose one)**

   **Option A — Local Postgres install**
   - Start Postgres and create DB/user (adjust credentials as needed):
     ```sql
     CREATE DATABASE stocks;
     CREATE USER stocks_user WITH PASSWORD 'change-me';
     GRANT ALL PRIVILEGES ON DATABASE stocks TO stocks_user;
     ALTER DATABASE stocks OWNER TO stocks_user;
     \c stocks
     ALTER SCHEMA public OWNER TO stocks_user;
     GRANT ALL ON SCHEMA public TO stocks_user;
     GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stocks_user;
     GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stocks_user;
     ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stocks_user;
     ```
   - Enable pgvector inside the DB:
     ```sql
     \c stocks
     CREATE EXTENSION IF NOT EXISTS vector;
     ```

   **Option B — Dockerized pgvector (PG16)**
   ```bash
   docker pull pgvector/pgvector:pg16
   docker run -d --name pgvector-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 pgvector/pgvector:pg16
   docker exec -it pgvector-db psql -U postgres -d postgres
   ```
   Then inside psql:
   ```sql
   CREATE DATABASE stocks;
   CREATE USER stocks_user WITH PASSWORD 'change-me';
   GRANT ALL PRIVILEGES ON DATABASE stocks TO stocks_user;
   ALTER DATABASE stocks OWNER TO stocks_user;
   \c stocks
   CREATE EXTENSION IF NOT EXISTS vector;
   ALTER SCHEMA public OWNER TO stocks_user;
   GRANT ALL ON SCHEMA public TO stocks_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stocks_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stocks_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stocks_user;
   ```

6. **Install Ollama (WSL/mac/Linux) and pull required models**
   - Install Ollama (WSL-friendly):
     ```bash
     curl -fsSL https://ollama.com/install.sh | sh
     ```
   - Pull models:
   ```bash
   ollama pull tinyllama
   ollama pull qwen3-embedding:0.6b
   ```

7. **Apply database migrations:**
   ```bash
   python manage.py migrate
   ```

8. **Build vector embeddings (uses Ollama embed model):**
   ```bash
   python manage.py build_stock_embeddings --force
   ```

9. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```
   *The backend API will now be running on `http://127.0.0.1:8000/`*

---

### 2. Frontend Setup (Next.js + React)

The frontend contains the interactive dashboards, beautiful UI components, and authentication forms.

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install node dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment Variables:**
   You must set up environment variables for the frontend to know where the backend API is hosted.
   - Copy the provided `.env.example` file to create a `.env.local` file:
     ```bash
     cp .env.example .env.local
     ```
   - Ensure the `.env.local` file contains the following variable pointing to your local Django server:
     ```env
     NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
     ```

4. **Start the Next.js development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   *The frontend application will now be accessible at `http://localhost:3000/` (or the port specified by Next.js, e.g., 9002).*

---

## Environment Variables (.env)
The frontend uses environment variables to dictate base paths for API requests.

**Frontend (`frontend/.env.local`)**
- `NEXT_PUBLIC_API_URL`: The root URL attached to all backend API calls (e.g., login, registering, fetching trajectory datasets). When running locally, this should always be `http://127.0.0.1:8000/api`.

*(Backend environment variables live in `backend/.env` as shown above).*

---

## Running Full Stack Locally

### Using the Automated Script (Recommended)
You can easily start both the frontend and backend servers using the provided `run.bat` script. 
**Important:** You must run `run.bat` as an **Administrator** for it to work properly.

### Running Manually
To run the full stack manually during development, you will need to open **two separate terminal windows/tabs**:
1. One running the backend (`python manage.py runserver`).
2. One running the frontend (`npm run dev`).

Navigate to the frontend URL in your browser to start exploring StockCompass!

---

## Architecture & Application Flow

The following sequence diagram outlines how the **Next.js Frontend**, **Django Backend**, and **External Data Providers** interact during a standard analysis request (e.g., fetching a predictive trajectory model):

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js (Frontend)
    participant Backend as Django (Backend)
    participant YFinance as yfinance API
    participant ML as ML Service (Scikit / Custom)

    %% Authentication Flow
    User->>Frontend: Enters credentials /login
    Frontend->>Backend: POST /api/login/
    Backend-->>Frontend: Return Auth Token + User Info
    Frontend-->>User: Redirect to Platform Hub

    %% Data Request Flow
    User->>Frontend: Selects Asset (e.g., BTC-USD) & Model (Logistic)
    Frontend->>Backend: GET /api/forecast/?ticker=BTC-USD&model=logistic

    %% Backend Processing
    activate Backend
    Backend->>YFinance: Fetch historical market data (6mo - 1yr)
    YFinance-->>Backend: Return OHLCV Data (Open, High, Low, Close, Volume)
    
    %% Machine Learning
    Backend->>ML: Pass historical data for feature engineering
    activate ML
    Note over ML: Calculate SMA, RSI, MACD, etc.
    Note over ML: Train model or load pre-trained weights
    Note over ML: Predict next 30 days trajectory
    ML-->>Backend: Return predictions, RMSE, confidence intervals
    deactivate ML

    Backend-->>Frontend: JSON payload (predictions + historical bounds)
    deactivate Backend

    %% Render
    Frontend-->>User: Render interactive Recharts.js Trajectory Graph
```
