@echo off
echo ================================================
echo      WebSentinals - Starting Dashboard
echo ================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

echo ✓ Node.js and Python are available
echo.

REM Change to backend directory
cd /d "%~dp0backend"

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install Node.js dependencies
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed successfully
    echo.
)

REM Check if Python requirements are installed
cd /d "%~dp0"
echo Checking Python dependencies...
python -c "import requests, firebase_admin, bs4" >nul 2>&1
if errorlevel 1 (
    echo Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install Python dependencies
        pause
        exit /b 1
    )
    echo ✓ Python dependencies installed successfully
    echo.
)

REM Start the server
cd /d "%~dp0backend"
echo Starting WebSentinals Dashboard...
echo Dashboard will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
node server.js
