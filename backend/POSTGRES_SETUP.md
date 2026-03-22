# PostgreSQL setup (Windows)

This guide shows how to create the PostgreSQL database and run all DB-related steps for this backend.

## 1) Install PostgreSQL

1. Download and install PostgreSQL for Windows.
2. Remember the superuser (admin) password for the `postgres` user.
3. Ensure the server is running and listens on port 5432 (default).

## 2) Create an app user and database (manual)

Open `psql` as the admin user and run:

```sql
-- Create app user (replace the password)
CREATE USER stocks_user WITH PASSWORD 'change-me';

-- Create database owned by the app user
CREATE DATABASE stocks OWNER stocks_user;

-- Ensure the app user can create objects in public schema
ALTER SCHEMA public OWNER TO stocks_user;
GRANT ALL ON SCHEMA public TO stocks_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stocks_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO stocks_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO stocks_user;
```

If you already have the database and just need permissions, run only the `ALTER`/`GRANT` statements.

## 3) Configure .env

Update `backend/.env`:

```dotenv
POSTGRES_DB=stocks
POSTGRES_USER=stocks_user
POSTGRES_PASSWORD=change-me
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DJANGO_DB_ENGINE=postgresql
```

Optional admin credentials for automation (used by `create_postgres_db.py`):

```dotenv
POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=your-admin-password
```

## 4) Automated DB creation (recommended)

From `backend/` run:

```bash
.venv\Scripts\python.exe create_postgres_db.py
```

This script:
- Creates the database if missing
- Ensures the `public` schema is owned by `POSTGRES_USER`
- Grants required privileges

## 5) Run migrations

```bash
.venv\Scripts\python.exe manage.py makemigrations
.venv\Scripts\python.exe manage.py migrate
```

## 6) Seed stock data

```bash
.venv\Scripts\python.exe manage.py init_stocks
```

## 7) Common fixes

- **Permission denied for schema public**:
  - Ensure the `ALTER`/`GRANT` steps in section 2 were run with admin privileges.
  - Or rerun `create_postgres_db.py` using `POSTGRES_ADMIN_USER` and `POSTGRES_ADMIN_PASSWORD`.

- **Database does not exist**:
  - Create it manually (section 2) or run `create_postgres_db.py` (section 4).

- **Authentication failed**:
  - Confirm `POSTGRES_USER` and `POSTGRES_PASSWORD` in `.env` match the DB user.

## 8) Verify data was inserted

Run these in `psql` after connecting to the `stocks` database:

```sql
-- list all tables
\dt

-- check counts
SELECT COUNT(*) FROM stocks_stockcategory;
SELECT COUNT(*) FROM stocks_stock;

-- preview a few rows
SELECT id, name, slug, image FROM stocks_stockcategory LIMIT 5;
SELECT id, symbol, name, current_price FROM stocks_stock LIMIT 5;

-- check migrations ran
SELECT * FROM django_migrations ORDER BY applied DESC LIMIT 5;
```

## 8) One-shot setup (Windows)

If you want a one-shot setup script, run:

```bat
backend\setup_postgres.bat
```
