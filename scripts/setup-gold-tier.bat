@echo off
REM Gold Tier Personal AI Employee - Setup Script (Windows)
REM This script initializes the Gold Tier environment

echo ==========================================
echo Gold Tier Personal AI Employee Setup
echo ==========================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo [OK] Created .env file
    echo [WARNING] Please edit .env file with your actual credentials before continuing
    pause
)

REM Create necessary directories
echo.
echo Creating directory structure...
mkdir logs\audit 2>nul
mkdir logs\mcp_servers 2>nul
mkdir data\audits 2>nul
mkdir data\briefings 2>nul
mkdir reports\audits 2>nul
mkdir reports\briefings 2>nul
mkdir templates\audit 2>nul
echo [OK] Directory structure created

REM Check Node.js version
echo.
echo Checking Node.js version...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18 or higher.
    exit /b 1
)
echo [OK] Node.js version:
node --version

REM Install dependencies
echo.
echo Installing npm dependencies...
call npm install
echo [OK] Dependencies installed

REM Check Docker
echo.
echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Docker not found. Install Docker to use containerized deployment
) else (
    echo [OK] Docker found:
    docker --version
)

REM Check Kubernetes
echo.
echo Checking Kubernetes (kubectl)...
kubectl version --client >nul 2>&1
if errorlevel 1 (
    echo [WARNING] kubectl not found. Install kubectl for Kubernetes deployment
) else (
    echo [OK] kubectl found
)

REM Initialize audit database
echo.
echo Initializing audit database...
node scripts\init-audit-db.js
echo [OK] Audit database initialized

REM Validate configuration
echo.
echo Validating configuration files...
node scripts\validate-config.js
echo [OK] Configuration validated

REM Setup complete
echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Review and update .env file with your credentials
echo 2. Start MCP servers:
echo    - Docker Compose: docker-compose up -d
echo    - Kubernetes: kubectl apply -f k8s/
echo 3. Run weekly audit manually: npm run audit:weekly
echo 4. Generate CEO briefing: npm run briefing:weekly
echo.
echo For more information, see README.md
echo.
pause
