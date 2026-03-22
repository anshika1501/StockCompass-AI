@echo off
echo 🚀 Starting Stock API Backend Server...
echo.

REM Change to backend directory
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found!
    echo Please run setup.bat first to install dependencies.
    pause
    exit /b 1
)

REM Activate virtual environment
echo 📦 Activating virtual environment...
call .venv\Scripts\activate.bat

REM Check Django installation
python -c "import django; print('✅ Django version:', django.get_version())" >nul 2>&1
if errorlevel 1 (
    echo ❌ Django not found! Please run setup.bat first.
    pause
    exit /b 1
)

REM Start Django development server
echo 🌐 Starting Django development server...
echo.
echo Backend API will be available at: http://localhost:8000/api/
echo.
echo Available endpoints:
echo   - GET /api/categories/ - List all categories
echo   - GET /api/categories/{id}/stocks/ - Stocks by category  
echo   - GET /api/stocks/{symbol}/chart/ - Stock chart data
echo   - GET /api/search/?q={query} - Search stocks
echo.
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver