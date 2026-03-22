@echo off
title StockCompass Backend

cd /d "D:\Learning\Trae\Stock3.0\backend"
if errorlevel 1 (
    echo [ERROR] Failed to change to backend directory
    pause
    exit /b 1
)

echo [INFO] Current directory: %cd%

if not exist ".venv\Scripts\activate.bat" (
    echo [INFO] Creating Python virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        echo [ERROR] Make sure Python is installed and in PATH.
        pause
        exit /b 1
    )
    echo [INFO] Virtual environment created successfully.
    echo.
    echo [INFO] Activating virtual environment...
    call .venv\Scripts\activate.bat
    echo.
    echo [INFO] Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
    echo [INFO] Running database migrations...
    python manage.py migrate
) else (
    echo [INFO] Virtual environment found. Activating...
    call .venv\Scripts\activate.bat
)

echo.
echo [INFO] Starting Django server at http://127.0.0.1:8000/
echo -------------------------------------------
python manage.py runserver

echo.
echo [INFO] Server stopped.
pause
