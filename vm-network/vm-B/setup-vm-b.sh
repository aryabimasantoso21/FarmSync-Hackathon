#!/bin/bash

# FarmSync 3-VM Geth Network Setup Script - VM B (Mill 2)
# Run this script on VM B (192.168.1.102)

set -e

echo "=========================================="
echo "  FarmSync VM-B Setup (Mill 2 Node)"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
VM_NAME="Mill-2"
NODE_DIR="$HOME/geth-mill2"
ACCOUNT_ADDRESS="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
PRIVATE_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
PASSWORD="mill2pass"

# IMPORTANT: Set this to VM-A's enode URL
echo -e "${YELLOW}IMPORTANT: You need VM-A's enode URL${NC}"
echo "Please enter the enode URL from VM-A (or press Enter to skip for now):"
read -r BOOTNODE_ENODE

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
    echo "You can use: scp genesis.json user@vm-b-ip:$NODE_DIR/"
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
    echo "$PRIVATE_KEY" > mill2_key.txt
    echo "$PASSWORD" > password.txt
    geth --datadir ./data account import mill2_key.txt --password password.txt
    rm mill2_key.txt
    echo -e "${GREEN}✓ Account imported: $ACCOUNT_ADDRESS${NC}"
else
    echo -e "${GREEN}✓ Account already exists${NC}"
fi

echo -e "${BLUE}[6/6] Creating start script...${NC}"
cat > start-mill2.sh << EOF
#!/bin/bash

cd "\$HOME/geth-mill2"

echo "Starting Mill 2 Geth Node..."
echo "HTTP RPC: http://0.0.0.0:8545"
echo "P2P Port: 30303"
echo ""

BOOTNODE_ARG=""
if [ -n "$BOOTNODE_ENODE" ]; then
    BOOTNODE_ARG="--bootnodes $BOOTNODE_ENODE"
    echo "Connecting to bootnode: $BOOTNODE_ENODE"
else
    echo "WARNING: No bootnode specified. Node will run isolated."
    echo "Edit this script and add --bootnodes flag manually."
fi

geth --datadir ./data \\
  --networkid 12345 \\
  --port 30303 \\
  --http \\
  --http.addr "0.0.0.0" \\
  --http.port 8545 \\
  --http.api "eth,net,web3,personal,miner,admin,clique" \\
  --http.corsdomain "*" \\
  \$BOOTNODE_ARG \\
  --mine \\
  --miner.etherbase "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" \\
  --unlock "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" \\
  --password password.txt \\
  --allow-insecure-unlock \\
  --syncmode "full" \\
  console 2>> geth.log
EOF

chmod +x start-mill2.sh

echo ""
echo -e "${GREEN}=========================================="
echo "  VM-B Setup Complete! ✓"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure VM-A is running first"
echo "2. Edit start-mill2.sh and add VM-A's enode if not done"
echo "3. Start the node: ./start-mill2.sh"
echo "4. In console, verify connection: admin.peers"
echo ""
echo "Useful commands:"
echo "  - admin.peers           (should show VM-A)"
echo "  - net.peerCount         (should be >= 1)"
echo "  - eth.blockNumber       (should match VM-A)"
echo "  - eth.syncing           (should be false when synced)"
echo ""
