#!/bin/bash

# Initialize Docker-based 3-VM Geth Network
# This creates a containerized version for easy testing

set -e

echo "=========================================="
echo "  FarmSync Docker-based 3-VM Setup"
echo "=========================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(dirname "$0")"

echo -e "${BLUE}[1/5] Creating directory structure...${NC}"
mkdir -p vm-A/gethData vm-B/gethData vm-C/gethData

echo -e "${BLUE}[2/5] Initializing Genesis blocks...${NC}"
docker run --rm -v "$(pwd)/vm-A/gethData:/root/.ethereum" \
  -v "$(pwd)/genesis.json:/root/genesis.json" \
  ethereum/client-go:latest \
  --datadir /root/.ethereum init /root/genesis.json

docker run --rm -v "$(pwd)/vm-B/gethData:/root/.ethereum" \
  -v "$(pwd)/genesis.json:/root/genesis.json" \
  ethereum/client-go:latest \
  --datadir /root/.ethereum init /root/genesis.json

docker run --rm -v "$(pwd)/vm-C/gethData:/root/.ethereum" \
  -v "$(pwd)/genesis.json:/root/genesis.json" \
  ethereum/client-go:latest \
  --datadir /root/.ethereum init /root/genesis.json

echo -e "${GREEN}✓ Genesis blocks initialized${NC}"

echo -e "${BLUE}[3/5] Creating account files...${NC}"

# Mill 1
echo "mill1pass" > vm-A/gethData/password.txt
cat > vm-A/gethData/keyfile << 'EOF'
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
EOF

# Mill 2
echo "mill2pass" > vm-B/gethData/password.txt
cat > vm-B/gethData/keyfile << 'EOF'
0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
EOF

# Estate
echo "estatepass" > vm-C/gethData/password.txt
cat > vm-C/gethData/keyfile << 'EOF'
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
EOF

echo -e "${BLUE}[4/5] Importing accounts...${NC}"

docker run --rm -v "$(pwd)/vm-A/gethData:/root/.ethereum" \
  ethereum/client-go:latest \
  --datadir /root/.ethereum account import --password /root/.ethereum/password.txt /root/.ethereum/keyfile

docker run --rm -v "$(pwd)/vm-B/gethData:/root/.ethereum" \
  ethereum/client-go:latest \
  --datadir /root/.ethereum account import --password /root/.ethereum/password.txt /root/.ethereum/keyfile

docker run --rm -v "$(pwd)/vm-C/gethData:/root/.ethereum" \
  ethereum/client-go:latest \
  --datadir /root/.ethereum account import --password /root/.ethereum/password.txt /root/.ethereum/keyfile

# Cleanup keyfiles
rm vm-A/gethData/keyfile vm-B/gethData/keyfile vm-C/gethData/keyfile

echo -e "${GREEN}✓ Accounts imported${NC}"

echo -e "${BLUE}[5/5] Creating static-nodes.json for P2P discovery...${NC}"

# Create static nodes configuration
cat > vm-A/gethData/static-nodes.json << 'EOF'
[
  "enode://PLACEHOLDER_MILL2@172.25.0.102:30303",
  "enode://PLACEHOLDER_ESTATE@172.25.0.103:30303"
]
EOF

cat > vm-B/gethData/static-nodes.json << 'EOF'
[
  "enode://PLACEHOLDER_MILL1@172.25.0.101:30303",
  "enode://PLACEHOLDER_ESTATE@172.25.0.103:30303"
]
EOF

cat > vm-C/gethData/static-nodes.json << 'EOF'
[
  "enode://PLACEHOLDER_MILL1@172.25.0.101:30303",
  "enode://PLACEHOLDER_MILL2@172.25.0.102:30303"
]
EOF

echo -e "${GREEN}✓ Static nodes configured${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "  Initialization Complete! ✓"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Start the network: docker-compose up -d"
echo "2. Check logs: docker-compose logs -f"
echo "3. Connect to node: docker exec -it farmsync-mill1 geth attach /root/.ethereum/geth.ipc"
echo ""
echo "RPC Endpoints:"
echo "  - Mill 1: http://localhost:8545"
echo "  - Mill 2: http://localhost:8546"
echo "  - Estate: http://localhost:8547"
echo ""
echo "To deploy contract:"
echo "  cd ../blockchain"
echo "  Update hardhat.config.js with: http://localhost:8545"
echo "  npx hardhat run scripts/deploy.js --network geth_private"
echo ""
