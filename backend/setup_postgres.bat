@echo off
setlocal

echo Setting up Stock API Backend (PostgreSQL)...

REM Create virtual environment if missing
if not exist .venv (
  echo Creating virtual environment...
  python -m venv .venv
)

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Create database if needed
echo Ensuring PostgreSQL database exists...
python create_postgres_db.py
if errorlevel 1 (
  echo Failed to create PostgreSQL database.
  exit /b 1
)

REM Run migrations
echo Running database migrations...
python manage.py makemigrations
python manage.py migrate

REM Initialize stock data
echo Initializing stock data...
python manage.py init_stocks

echo Setup complete!
echo.
echo To start the development server, run:
echo   .venv\Scripts\activate
echo   python manage.py runserver
echo.
echo The API will be available at: http://localhost:8000/api/

pause
endlocal
