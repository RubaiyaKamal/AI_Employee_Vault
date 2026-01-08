@echo off
REM Personal AI Employee - Watcher System Startup Script

echo Starting Personal AI Employee Watcher System...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if requirements are installed
echo Checking for required packages...
python -c "import watchdog, requests, google.auth" >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo Error installing requirements
        pause
        exit /b 1
    )
)

echo.
echo Starting Watcher Manager...
echo Press Ctrl+C to stop
echo.

REM Start the watcher manager
python watcher_manager.py

echo.
echo Watcher Manager stopped.
pause