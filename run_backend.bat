@echo off
title StockCompass Backend

cd /d "D:\Learning\Trae\Stock3.0\backend"
if errorlevel 1 (
    echo [ERROR] Failed to change to backend directory
    pause
    exit /b 1
)

echo [INFO] Current directory: %cd%

set /p CLEAN_PYC=Do you want to remove .pyc files and __pycache__ folders? (y/n): 
if /i "%CLEAN_PYC%"=="y" (
    echo [INFO] Cleaning Python bytecode...
    for /r %%F in ("*.pyc") do del /f /q "%%F" >nul 2>&1
    for /d /r %%D in ("__pycache__") do rd /s /q "%%D" >nul 2>&1
    echo [INFO] Bytecode cleanup complete.
)

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
