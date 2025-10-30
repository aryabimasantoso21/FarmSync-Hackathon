#!/bin/bash

# FarmSync VM-A Setup (Mill 1 Node)
# Run this script inside vm-A folder

set -e

echo "=========================================="
echo "  FarmSync VM-A Setup (Mill 1 Node)"
echo "=========================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ACCOUNT_ADDRESS="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
PRIVATE_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
PASSWORD="mill1pass"

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
    echo "Please make sure genesis.json exists in vm-network/"
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
    # Remove 0x prefix if present
    CLEAN_KEY="${PRIVATE_KEY#0x}"
    echo -n "$CLEAN_KEY" > mill1_key.txt
    echo "$PASSWORD" > password.txt
    geth --datadir ./gethData account import --password password.txt mill1_key.txt
    rm mill1_key.txt
    
    # Keep password file for node startup
    mv password.txt ./gethData/
    echo -e "${GREEN}✓ Account imported: $ACCOUNT_ADDRESS${NC}"
else
    echo -e "${GREEN}✓ Account already exists${NC}"
    # Make sure password file exists
    if [ ! -f "./gethData/password.txt" ]; then
        echo "$PASSWORD" > ./gethData/password.txt
    fi
fi

echo -e "${BLUE}[5/5] Creating start script...${NC}"
cat > start-node.sh << 'EOF'
#!/bin/bash

cd "$(dirname "$0")"

echo "=========================================="
echo "  Starting Mill 1 Geth Node (VM-A)"
echo "=========================================="
echo ""
echo "HTTP RPC: http://0.0.0.0:8545"
echo "P2P Port: 30303"
echo ""
echo "IMPORTANT: After node starts, get enode URL:"
echo "  In geth console, run: admin.nodeInfo.enode"
echo "  Copy this URL for VM-B and VM-C setup"
echo ""

geth --datadir ./gethData \
  --networkid 12345 \
  --port 30303 \
  --http \
  --http.addr "0.0.0.0" \
  --http.port 8545 \
  --http.api "eth,net,web3,personal,miner,admin,clique" \
  --http.corsdomain "*" \
  --mine \
  --miner.etherbase "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" \
  --unlock "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" \
  --password ./gethData/password.txt \
  --allow-insecure-unlock \
  --syncmode "full" \
  --nodiscover \
  console 2>> geth.log
EOF

chmod +x start-node.sh

echo ""
echo -e "${GREEN}=========================================="
echo "  VM-A Setup Complete! ✓"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Start the node:"
echo "   ./start-node.sh"
echo ""
echo "2. In geth console, get enode URL:"
echo "   admin.nodeInfo.enode"
echo ""
echo "3. Copy the enode URL (replace [::] with your IP)"
echo "   Example: enode://abc123...@192.168.1.101:30303"
echo ""
echo "4. Use this enode URL when setting up VM-B and VM-C"
echo ""
echo "Useful commands in geth console:"
echo "  eth.accounts"
echo "  eth.getBalance(eth.accounts[0])"
echo "  eth.blockNumber"
echo "  admin.peers"
echo ""
