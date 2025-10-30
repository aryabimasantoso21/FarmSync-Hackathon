#!/bin/bash

# Deploy Smart Contract to Geth Network
# Run this after all 3 VM nodes are connected and synced

set -e

echo "=========================================="
echo "  Deploy Contract to Geth Network"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")/../blockchain"

echo -e "${BLUE}[1/4] Checking Hardhat configuration...${NC}"
if ! grep -q "geth_private" hardhat.config.js; then
    echo -e "${RED}Error: geth_private network not configured in hardhat.config.js${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Hardhat config OK${NC}"

echo -e "${BLUE}[2/4] Testing connection to Geth node...${NC}"
GETH_URL=$(grep -oP 'url: "\K[^"]+' hardhat.config.js | head -1 | tail -1)
echo "Testing: $GETH_URL"

if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$GETH_URL" || echo "000")
    
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✓ Connection successful${NC}"
    else
        echo -e "${RED}Error: Cannot connect to Geth node${NC}"
        echo "Make sure the Geth node is running on $GETH_URL"
        exit 1
    fi
else
    echo -e "${YELLOW}Warning: curl not found, skipping connection test${NC}"
fi

echo -e "${BLUE}[3/4] Compiling contracts...${NC}"
npx hardhat compile

echo -e "${BLUE}[4/4] Deploying to Geth network...${NC}"
echo ""
echo -e "${YELLOW}This may take 30-60 seconds due to block mining time...${NC}"
echo ""

npx hardhat run scripts/deploy.js --network geth_private | tee deploy-output.log

echo ""
echo -e "${GREEN}=========================================="
echo "  Deployment Complete! ✓"
echo "==========================================${NC}"
echo ""
echo "Contract address saved in deploy-output.log"
echo ""
echo "Next steps:"
echo "1. Copy the contract address from above"
echo "2. Update middleware/.env with the new CONTRACT_ADDRESS"
echo "3. Update backend/.env with the new CONTRACT_ADDRESS"
echo "4. Restart middleware and backend"
echo ""
echo "To verify deployment on all nodes, run in geth console:"
echo "  eth.getCode('0xYourContractAddress')"
echo ""
