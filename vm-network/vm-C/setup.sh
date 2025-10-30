#!/bin/bash

# FarmSync VM-C Setup (Estate Node + Application Server)
# Run this script inside vm-C folder

set -e

echo "=========================================="
echo "  FarmSync VM-C Setup (Estate Node)"
echo "=========================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ACCOUNT_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PASSWORD="estatepass"

echo -e "${BLUE}[1/7] Checking Geth installation...${NC}"
if ! command -v geth &> /dev/null; then
    echo "Installing Geth..."
    sudo add-apt-repository -y ppa:ethereum/ethereum
    sudo apt-get update
    sudo apt-get install -y ethereum
else
    echo -e "${GREEN}✓ Geth already installed${NC}"
fi

geth version

echo -e "${BLUE}[2/7] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✓ Node.js already installed ($(node --version))${NC}"
fi

echo -e "${BLUE}[3/7] Checking Mosquitto...${NC}"
if ! command -v mosquitto &> /dev/null; then
    echo "Installing Mosquitto..."
    sudo apt-get update
    sudo apt-get install -y mosquitto mosquitto-clients
    sudo systemctl enable mosquitto
    sudo systemctl start mosquitto
else
    echo -e "${GREEN}✓ Mosquitto already installed${NC}"
    sudo systemctl status mosquitto --no-pager || true
fi

echo -e "${BLUE}[4/7] Checking genesis.json...${NC}"
if [ ! -f ../genesis.json ]; then
    echo "Error: genesis.json not found in parent directory"
    exit 1
fi
cp ../genesis.json .
echo -e "${GREEN}✓ Genesis file ready${NC}"

echo -e "${BLUE}[5/7] Initializing Geth...${NC}"
if [ ! -d "./gethData/geth" ]; then
    geth --datadir ./gethData init genesis.json
    echo -e "${GREEN}✓ Genesis block initialized${NC}"
else
    echo -e "${GREEN}✓ Genesis already initialized${NC}"
fi

echo -e "${BLUE}[6/7] Importing account...${NC}"
mkdir -p ./gethData/keystore
if [ -z "$(ls -A ./gethData/keystore 2>/dev/null)" ]; then
    CLEAN_KEY="${PRIVATE_KEY#0x}"
    echo -n "$CLEAN_KEY" > estate_key.txt
    echo "$PASSWORD" > password.txt
    geth --datadir ./gethData account import --password password.txt estate_key.txt
    rm estate_key.txt
    mv password.txt ./gethData/
    echo -e "${GREEN}✓ Account imported: $ACCOUNT_ADDRESS${NC}"
else
    echo -e "${GREEN}✓ Account already exists${NC}"
    if [ ! -f "./gethData/password.txt" ]; then
        echo "$PASSWORD" > ./gethData/password.txt
    fi
fi

echo -e "${BLUE}[7/7] Creating start script template...${NC}"
cat > start-node.sh << 'EOF'
#!/bin/bash

cd "$(dirname "$0")"

echo "=========================================="
echo "  Starting Estate Geth Node (VM-C)"
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
  --miner.etherbase "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --unlock "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --password ./gethData/password.txt \
  --allow-insecure-unlock \
  --syncmode "full" \
  console 2>> geth.log
EOF

chmod +x start-node.sh

echo ""
echo -e "${GREEN}=========================================="
echo "  VM-C Geth Setup Complete! ✓"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Before starting the node:${NC}"
echo "1. Make sure VM-A and VM-B are running"
echo "2. Get VM-A's enode URL from VM-A console"
echo "3. Edit start-node.sh and set BOOTNODE_ENODE"
echo "4. Start the node: ./start-node.sh"
echo "5. Verify: admin.peers (should show 2 peers)"
echo ""
echo "After Geth network is running:"
echo "6. Copy FarmSync application to this VM"
echo "7. Install dependencies (npm install)"
echo "8. Update .env files with contract address"
echo "9. Start middleware, backend, frontend"
echo ""
