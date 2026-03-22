@echo off
title StockCompass Frontend

cd /d "D:\Learning\Trae\Stock3.0\frontend"
if errorlevel 1 (
    echo [ERROR] Failed to change to frontend directory
    pause
    exit /b 1
)

echo [INFO] Current directory: %cd%

if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
) else (
    echo [INFO] node_modules found. Skipping npm install.
)

echo.
echo [INFO] Starting Next.js server at http://localhost:3000/
echo -------------------------------------------
call npm run dev

echo.
echo [INFO] Server stopped.
pause
