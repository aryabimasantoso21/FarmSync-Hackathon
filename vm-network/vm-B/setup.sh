#!/bin/bash

# FarmSync VM-B Setup (Mill 2 Node)
# Run this script inside vm-B folder

set -e

echo "=========================================="
echo "  FarmSync VM-B Setup (Mill 2 Node)"
echo "=========================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ACCOUNT_ADDRESS="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
PRIVATE_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
PASSWORD="mill2pass"

echo -e "${BLUE}[1/5] Checking Geth installation...${NC}"
if ! command -v geth &> /dev/null; then
    echo "Installing Geth..."
    sudo add-apt-repository -y ppa:ethereum/ethereum
    sudo apt-get update
    sudo apt-get install -y ethereum
else
    echo -e "${GREEN}✓ Geth already installed${NC}"
fi

geth version

echo -e "${BLUE}[2/5] Checking genesis.json...${NC}"
if [ ! -f ../genesis.json ]; then
    echo "Error: genesis.json not found in parent directory"
    exit 1
fi
cp ../genesis.json .
echo -e "${GREEN}✓ Genesis file ready${NC}"

echo -e "${BLUE}[3/5] Initializing Geth...${NC}"
if [ ! -d "./gethData/geth" ]; then
    geth --datadir ./gethData init genesis.json
    echo -e "${GREEN}✓ Genesis block initialized${NC}"
else
    echo -e "${GREEN}✓ Genesis already initialized${NC}"
fi

echo -e "${BLUE}[4/5] Importing account...${NC}"
mkdir -p ./gethData/keystore
if [ -z "$(ls -A ./gethData/keystore 2>/dev/null)" ]; then
    CLEAN_KEY="${PRIVATE_KEY#0x}"
    echo -n "$CLEAN_KEY" > mill2_key.txt
    echo "$PASSWORD" > password.txt
    geth --datadir ./gethData account import --password password.txt mill2_key.txt
    rm mill2_key.txt
    mv password.txt ./gethData/
    echo -e "${GREEN}✓ Account imported: $ACCOUNT_ADDRESS${NC}"
else
    echo -e "${GREEN}✓ Account already exists${NC}"
    if [ ! -f "./gethData/password.txt" ]; then
        echo "$PASSWORD" > ./gethData/password.txt
    fi
fi

echo -e "${BLUE}[5/5] Creating start script template...${NC}"
cat > start-node.sh << 'EOF'
#!/bin/bash

cd "$(dirname "$0")"

echo "=========================================="
echo "  Starting Mill 2 Geth Node (VM-B)"
echo "=========================================="
echo ""

# IMPORTANT: Set VM-A's enode URL here
BOOTNODE_ENODE=""

if [ -z "$BOOTNODE_ENODE" ]; then
    echo "WARNING: BOOTNODE_ENODE not set!"
    echo "Please edit this script and set BOOTNODE_ENODE variable"
    echo "Example: BOOTNODE_ENODE=\"enode://abc123...@192.168.1.101:30303\""
    echo ""
    read -p "Enter VM-A's enode URL now (or press Enter to exit): " BOOTNODE_ENODE
    
    if [ -z "$BOOTNODE_ENODE" ]; then
        echo "Exiting. Please set BOOTNODE_ENODE and try again."
        exit 1
    fi
fi

echo "HTTP RPC: http://0.0.0.0:8545"
echo "P2P Port: 30303"
echo "Connecting to: $BOOTNODE_ENODE"
echo ""

geth --datadir ./gethData \
  --networkid 12345 \
  --port 30303 \
  --http \
  --http.addr "0.0.0.0" \
  --http.port 8545 \
  --http.api "eth,net,web3,personal,miner,admin,clique" \
  --http.corsdomain "*" \
  --bootnodes "$BOOTNODE_ENODE" \
  --mine \
  --miner.etherbase "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" \
  --unlock "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" \
  --password ./gethData/password.txt \
  --allow-insecure-unlock \
  --syncmode "full" \
  console 2>> geth.log
EOF

chmod +x start-node.sh

echo ""
echo -e "${GREEN}=========================================="
echo "  VM-B Setup Complete! ✓"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Before starting the node:${NC}"
echo "1. Make sure VM-A is running"
echo "2. Get VM-A's enode URL from VM-A console:"
echo "   admin.nodeInfo.enode"
echo ""
echo "3. Edit start-node.sh and set BOOTNODE_ENODE:"
echo "   nano start-node.sh"
echo "   Set: BOOTNODE_ENODE=\"enode://...@VM-A-IP:30303\""
echo ""
echo "4. Start the node:"
echo "   ./start-node.sh"
echo ""
echo "5. Verify connection in geth console:"
echo "   admin.peers  (should show 1 peer - VM-A)"
echo "   eth.blockNumber  (should match VM-A)"
echo ""
