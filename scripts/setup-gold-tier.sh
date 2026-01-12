#!/bin/bash

# Gold Tier Personal AI Employee - Setup Script
# This script initializes the Gold Tier environment

set -e

echo "=========================================="
echo "Gold Tier Personal AI Employee Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}Please edit .env file with your actual credentials before continuing${NC}"
    read -p "Press enter to continue after updating .env..."
fi

# Create necessary directories
echo ""
echo "Creating directory structure..."
mkdir -p logs/audit
mkdir -p logs/mcp_servers
mkdir -p data/audits
mkdir -p data/briefings
mkdir -p reports/audits
mkdir -p reports/briefings
mkdir -p templates/audit
echo -e "${GREEN}✓ Directory structure created${NC}"

# Check Node.js version
echo ""
echo "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 18 or higher is required. Current version: $(node --version)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"

# Install dependencies
echo ""
echo "Installing npm dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check Docker
echo ""
echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker not found. Install Docker to use containerized deployment${NC}"
else
    echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"
fi

# Check Kubernetes
echo ""
echo "Checking Kubernetes (kubectl)..."
if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}⚠ kubectl not found. Install kubectl for Kubernetes deployment${NC}"
else
    echo -e "${GREEN}✓ kubectl found: $(kubectl version --client --short 2>/dev/null || echo 'kubectl installed')${NC}"
fi

# Initialize audit database
echo ""
echo "Initializing audit database..."
node scripts/init-audit-db.js
echo -e "${GREEN}✓ Audit database initialized${NC}"

# Validate configuration
echo ""
echo "Validating configuration files..."
node scripts/validate-config.js
echo -e "${GREEN}✓ Configuration validated${NC}"

# Setup complete
echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review and update .env file with your credentials"
echo "2. Start MCP servers:"
echo "   - Docker Compose: docker-compose up -d"
echo "   - Kubernetes: kubectl apply -f k8s/"
echo "3. Run weekly audit manually: npm run audit:weekly"
echo "4. Generate CEO briefing: npm run briefing:weekly"
echo ""
echo "For more information, see README.md"
echo ""
