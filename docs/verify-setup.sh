#!/bin/bash

# FarmSync Sprint 1 - Setup Verification Script

echo "🔍 FarmSync Sprint 1 - Setup Verification"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        return 1
    fi
}

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Port $1 is in use ($2)"
        return 0
    else
        echo -e "${YELLOW}○${NC} Port $1 is not in use ($2 not running)"
        return 1
    fi
}

# 1. Check Prerequisites
echo "1️⃣  Checking Prerequisites..."
check_command node
check_command npm
check_command mosquitto
check_command npx

echo ""

# 2. Check Directory Structure
echo "2️⃣  Checking Directory Structure..."
check_dir "blockchain"
check_dir "middleware"
check_dir "mqtt"
check_dir "proof"
check_dir "vm-network"

echo ""

# 3. Check Node Modules
echo "3️⃣  Checking Dependencies..."
check_dir "blockchain/node_modules"
check_dir "middleware/node_modules"
check_dir "mqtt/node_modules"

echo ""

# 4. Check Key Files
echo "4️⃣  Checking Implementation Files..."
check_file "blockchain/contracts/SensorLedger.sol"
check_file "blockchain/scripts/deploy.js"
check_file "blockchain/scripts/queryRecords.js"
check_file "middleware/handler/mqttHandler.js"
check_file "middleware/handler/blockchainHandler.js"
check_file "middleware/index.js"
check_file "mqtt/publisher/sensorPublisher.js"

echo ""

# 5. Check Environment Files
echo "5️⃣  Checking Configuration..."
if [ -f "middleware/.env" ]; then
    echo -e "${GREEN}✓${NC} middleware/.env exists"
    if grep -q "CONTRACT_ADDRESS=" middleware/.env && grep -q "CONTRACT_ADDRESS=$" middleware/.env; then
        echo -e "${YELLOW}⚠${NC}  CONTRACT_ADDRESS is not set in middleware/.env"
    else
        echo -e "${GREEN}✓${NC} CONTRACT_ADDRESS is configured"
    fi
else
    echo -e "${YELLOW}⚠${NC}  middleware/.env not found (copy from .env.example)"
fi

if [ -f "mqtt/.env" ]; then
    echo -e "${GREEN}✓${NC} mqtt/.env exists"
else
    echo -e "${YELLOW}⚠${NC}  mqtt/.env not found (copy from .env.example)"
fi

echo ""

# 6. Check Running Services
echo "6️⃣  Checking Running Services..."
check_port 8545 "Hardhat node"
check_port 1883 "MQTT Broker (Mosquitto)"

echo ""

# 7. Summary
echo "=========================================="
echo "📋 Setup Status Summary"
echo "=========================================="
echo ""
echo "Next Steps:"
echo ""
echo "If dependencies are missing, run:"
echo "  cd blockchain && npm install"
echo "  cd middleware && npm install"
echo "  cd mqtt && npm install"
echo ""
echo "If .env files are missing, run:"
echo "  cp middleware/.env.example middleware/.env"
echo "  cp mqtt/.env.example mqtt/.env"
echo ""
echo "To start the system:"
echo "  1. Terminal 1: cd blockchain && npm run node"
echo "  2. Terminal 2: cd blockchain && npm run deploy"
echo "  3. Update CONTRACT_ADDRESS in middleware/.env"
echo "  4. Terminal 3: cd middleware && npm start"
echo "  5. Terminal 4: cd mqtt && npm run publish"
echo ""
echo "For detailed instructions, see: QUICKSTART.md"
echo ""
