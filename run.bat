@echo off
setlocal enabledelayedexpansion
title StockCompass Setup & Run Launcher

:: Get the directory where this script is located
set "ROOT=%~dp0"
:: Remove trailing backslash
set "ROOT=%ROOT:~0,-1%"

set "BACKEND_DIR=%ROOT%\backend"
set "FRONTEND_DIR=%ROOT%\frontend"

echo =========================================
echo       StockCompass Startup Script
echo =========================================
echo.
echo Project Root: %ROOT%
echo Backend Dir:  %BACKEND_DIR%
echo Frontend Dir: %FRONTEND_DIR%
echo.

:: ----------------------------------------------------
:: 1. BACKEND — build temp launch script
:: ----------------------------------------------------

echo [INFO] Preparing backend launch script...

(
    echo @echo off
    echo title StockCompass Backend
    echo.
    echo cd /d "%BACKEND_DIR%"
    echo if errorlevel 1 ^(
    echo     echo [ERROR] Failed to change to backend directory!
    echo     pause
    echo     exit /b 1
    echo ^)
    echo.
    echo echo [INFO] Current directory: %%cd%%
    echo.
    echo if not exist ".venv\Scripts\activate.bat" ^(
    echo     echo [INFO] Creating Python virtual environment...
    echo     python -m venv .venv
    echo     if errorlevel 1 ^(
    echo         echo [ERROR] Failed to create virtual environment!
    echo         echo [ERROR] Make sure Python is installed and in PATH.
    echo         pause
    echo         exit /b 1
    echo     ^)
    echo     echo [INFO] Virtual environment created successfully.
    echo     echo.
    echo     echo [INFO] Activating virtual environment...
    echo     call .venv\Scripts\activate.bat
    echo     echo.
    echo     echo [INFO] Installing Python dependencies...
    echo     pip install -r requirements.txt
    echo     if errorlevel 1 ^(
    echo         echo [ERROR] Failed to install dependencies!
    echo         pause
    echo         exit /b 1
    echo     ^)
    echo     echo.
    echo     echo [INFO] Running database migrations...
    echo     python manage.py migrate
    echo ^) else ^(
    echo     echo [INFO] Virtual environment found. Activating...
    echo     call .venv\Scripts\activate.bat
    echo ^)
    echo.
    echo echo.
    echo echo [INFO] Starting Django server at http://127.0.0.1:8000/
    echo echo -------------------------------------------
    echo python manage.py runserver
    echo.
    echo echo.
    echo echo [INFO] Server stopped.
    echo pause
) > "%ROOT%\run_backend.bat"

:: ----------------------------------------------------
:: 2. FRONTEND — create .env.local if missing
:: ----------------------------------------------------

if not exist "%FRONTEND_DIR%\.env.local" (
    echo [INFO] Creating frontend\.env.local with default values...
    echo NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api> "%FRONTEND_DIR%\.env.local"
    echo [INFO] frontend\.env.local created.
) else (
    echo [INFO] frontend\.env.local already exists. Skipping.
)

:: Build temp frontend launch script
echo [INFO] Preparing frontend launch script...

(
    echo @echo off
    echo title StockCompass Frontend
    echo.
    echo cd /d "%FRONTEND_DIR%"
    echo if errorlevel 1 ^(
    echo     echo [ERROR] Failed to change to frontend directory!
    echo     pause
    echo     exit /b 1
    echo ^)
    echo.
    echo echo [INFO] Current directory: %%cd%%
    echo.
    echo if not exist "node_modules" ^(
    echo     echo [INFO] node_modules not found. Installing dependencies...
    echo     call npm install
    echo     if errorlevel 1 ^(
    echo         echo [ERROR] npm install failed!
    echo         pause
    echo         exit /b 1
    echo     ^)
    echo ^) else ^(
    echo     echo [INFO] node_modules found. Skipping npm install.
    echo ^)
    echo.
    echo echo.
    echo echo [INFO] Starting Next.js server at http://localhost:3000/
    echo echo -------------------------------------------
    echo call npm run dev
    echo.
    echo echo.
    echo echo [INFO] Server stopped.
    echo pause
) > "%ROOT%\run_frontend.bat"

:: ----------------------------------------------------
:: 3. Launch both windows
:: ----------------------------------------------------

echo.
echo [INFO] Launching Backend in a new terminal window...
start "StockCompass Backend" cmd /k "%ROOT%\run_backend.bat"

:: Small delay to prevent race conditions
timeout /t 2 /nobreak >nul

echo [INFO] Launching Frontend in a new terminal window...
start "StockCompass Frontend" cmd /k "%ROOT%\run_frontend.bat"

echo.
echo =========================================
echo   Both servers are starting.
echo   Backend  -^> http://127.0.0.1:8000/
echo   Frontend -^> http://localhost:3000/
echo =========================================
echo.
echo Press any key to exit this launcher...
echo (The server windows will remain open)
pause >nul

exit
