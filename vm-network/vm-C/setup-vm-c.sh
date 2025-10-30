#!/bin/bash

# FarmSync 3-VM Geth Network Setup Script - VM C (Estate + Application Server)
# Run this script on VM C (192.168.1.103)

set -e

echo "=========================================="
echo "  FarmSync VM-C Setup (Estate Node)"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
VM_NAME="Estate"
NODE_DIR="$HOME/geth-estate"
ACCOUNT_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PASSWORD="estatepass"

# IMPORTANT: Set this to VM-A's enode URL
echo -e "${YELLOW}IMPORTANT: You need VM-A's enode URL${NC}"
echo "Please enter the enode URL from VM-A (or press Enter to skip for now):"
read -r BOOTNODE_ENODE

echo -e "${BLUE}[1/8] Checking Geth installation...${NC}"
if ! command -v geth &> /dev/null; then
    echo "Installing Geth..."
    sudo add-apt-repository -y ppa:ethereum/ethereum
    sudo apt-get update
    sudo apt-get install -y ethereum
else
    echo -e "${GREEN}✓ Geth already installed${NC}"
fi

geth version

echo -e "${BLUE}[2/8] Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✓ Node.js already installed ($(node --version))${NC}"
fi

echo -e "${BLUE}[3/8] Installing Mosquitto MQTT Broker...${NC}"
if ! command -v mosquitto &> /dev/null; then
    echo "Installing Mosquitto..."
    sudo apt-get update
    sudo apt-get install -y mosquitto mosquitto-clients
    sudo systemctl enable mosquitto
    sudo systemctl start mosquitto
else
    echo -e "${GREEN}✓ Mosquitto already installed${NC}"
fi

echo -e "${BLUE}[4/8] Creating Geth directory structure...${NC}"
mkdir -p "$NODE_DIR"
cd "$NODE_DIR"

echo -e "${BLUE}[5/8] Copying genesis.json...${NC}"
if [ ! -f genesis.json ]; then
    echo "Please copy genesis.json to $NODE_DIR"
    echo "You can use: scp genesis.json user@vm-c-ip:$NODE_DIR/"
    exit 1
fi

echo -e "${BLUE}[6/8] Initializing Geth with genesis block...${NC}"
if [ ! -d "./data/geth" ]; then
    geth --datadir ./data init genesis.json
    echo -e "${GREEN}✓ Genesis block initialized${NC}"
else
    echo -e "${GREEN}✓ Genesis already initialized${NC}"
fi

echo -e "${BLUE}[7/8] Importing account...${NC}"
if [ ! -f "./data/keystore/"* ]; then
    echo "$PRIVATE_KEY" > estate_key.txt
    echo "$PASSWORD" > password.txt
    geth --datadir ./data account import estate_key.txt --password password.txt
    rm estate_key.txt
    echo -e "${GREEN}✓ Account imported: $ACCOUNT_ADDRESS${NC}"
else
    echo -e "${GREEN}✓ Account already exists${NC}"
fi

echo -e "${BLUE}[8/8] Creating start script...${NC}"
cat > start-estate.sh << EOF
#!/bin/bash

cd "\$HOME/geth-estate"

echo "Starting Estate Geth Node..."
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
  --miner.etherbase "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \\
  --unlock "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \\
  --password password.txt \\
  --allow-insecure-unlock \\
  --syncmode "full" \\
  console 2>> geth.log
EOF

chmod +x start-estate.sh

echo ""
echo -e "${GREEN}=========================================="
echo "  VM-C Geth Setup Complete! ✓"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure VM-A and VM-B are running"
echo "2. Edit start-estate.sh and add VM-A's enode if not done"
echo "3. Start the node: ./start-estate.sh"
echo "4. In console, verify: admin.peers (should show 2 peers)"
echo ""
echo "After Geth network is running:"
echo "5. Copy FarmSync application to this VM"
echo "6. Run setup-farmsync.sh to configure applications"
echo ""
