#!/bin/bash

# FarmSync 3-VM Geth Network Setup Script - VM A (Mill 1)
# Run this script on VM A (192.168.1.101)

set -e

echo "=========================================="
echo "  FarmSync VM-A Setup (Mill 1 Node)"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VM_NAME="Mill-1"
NODE_DIR="$HOME/geth-mill1"
ACCOUNT_ADDRESS="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
PRIVATE_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
PASSWORD="mill1pass"

echo -e "${BLUE}[1/6] Checking Geth installation...${NC}"
if ! command -v geth &> /dev/null; then
    echo "Installing Geth..."
    sudo add-apt-repository -y ppa:ethereum/ethereum
    sudo apt-get update
    sudo apt-get install -y ethereum
else
    echo -e "${GREEN}✓ Geth already installed${NC}"
fi

geth version

echo -e "${BLUE}[2/6] Creating directory structure...${NC}"
mkdir -p "$NODE_DIR"
cd "$NODE_DIR"

echo -e "${BLUE}[3/6] Copying genesis.json...${NC}"
if [ ! -f genesis.json ]; then
    echo "Please copy genesis.json to $NODE_DIR"
    echo "You can use: scp genesis.json user@vm-a-ip:$NODE_DIR/"
    exit 1
fi

echo -e "${BLUE}[4/6] Initializing Geth with genesis block...${NC}"
if [ ! -d "./data/geth" ]; then
    geth --datadir ./data init genesis.json
    echo -e "${GREEN}✓ Genesis block initialized${NC}"
else
    echo -e "${GREEN}✓ Genesis already initialized${NC}"
fi

echo -e "${BLUE}[5/6] Importing account...${NC}"
if [ ! -f "./data/keystore/"* ]; then
    echo "$PRIVATE_KEY" > mill1_key.txt
    echo "$PASSWORD" > password.txt
    geth --datadir ./data account import mill1_key.txt --password password.txt
    rm mill1_key.txt
    echo -e "${GREEN}✓ Account imported: $ACCOUNT_ADDRESS${NC}"
else
    echo -e "${GREEN}✓ Account already exists${NC}"
fi

echo -e "${BLUE}[6/6] Creating start script...${NC}"
cat > start-mill1.sh << 'EOF'
#!/bin/bash

cd "$HOME/geth-mill1"

echo "Starting Mill 1 Geth Node..."
echo "HTTP RPC: http://0.0.0.0:8545"
echo "P2P Port: 30303"
echo ""
echo "To get enode URL, run in console: admin.nodeInfo.enode"
echo ""

geth --datadir ./data \
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
  --password password.txt \
  --allow-insecure-unlock \
  --syncmode "full" \
  --nodiscover \
  console 2>> geth.log
EOF

chmod +x start-mill1.sh

echo ""
echo -e "${GREEN}=========================================="
echo "  VM-A Setup Complete! ✓"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Start the node: ./start-mill1.sh"
echo "2. In geth console, get enode: admin.nodeInfo.enode"
echo "3. Copy the enode URL and use it in VM-B and VM-C setup"
echo ""
echo "Useful commands in geth console:"
echo "  - admin.nodeInfo.enode  (get enode URL)"
echo "  - eth.accounts          (list accounts)"
echo "  - eth.getBalance(eth.accounts[0])"
echo "  - admin.peers           (list connected peers)"
echo "  - eth.blockNumber       (current block)"
echo "  - eth.mining            (check if mining)"
echo ""
