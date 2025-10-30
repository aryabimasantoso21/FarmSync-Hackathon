#!/bin/bash

# Test 3-Node Geth Network
# Run this to verify all nodes are connected and syncing

set -e

echo "=========================================="
echo "  Test Geth 3-Node Network"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Node IPs (change these to your actual IPs)
VM_A_IP="192.168.1.101"
VM_B_IP="192.168.1.102"
VM_C_IP="192.168.1.103"

test_node() {
    local NODE_NAME=$1
    local NODE_IP=$2
    local RPC_URL="http://$NODE_IP:8545"
    
    echo ""
    echo -e "${BLUE}Testing $NODE_NAME ($NODE_IP)...${NC}"
    
    # Test connectivity
    if ! curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' \
        "$RPC_URL" > /dev/null; then
        echo -e "${RED}✗ Cannot connect to $NODE_NAME${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Connected${NC}"
    
    # Get block number
    BLOCK_NUM=$(curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$RPC_URL" | grep -oP '"result":"\K[^"]+')
    BLOCK_DEC=$((16#${BLOCK_NUM#0x}))
    echo -e "  Block number: ${BLUE}$BLOCK_DEC${NC}"
    
    # Get peer count
    PEER_COUNT=$(curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
        "$RPC_URL" | grep -oP '"result":"\K[^"]+')
    PEER_DEC=$((16#${PEER_COUNT#0x}))
    echo -e "  Peers: ${BLUE}$PEER_DEC${NC}"
    
    # Get mining status
    MINING=$(curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_mining","params":[],"id":1}' \
        "$RPC_URL" | grep -oP '"result":\K[^,}]+')
    if [ "$MINING" == "true" ]; then
        echo -e "  Mining: ${GREEN}✓ Active${NC}"
    else
        echo -e "  Mining: ${YELLOW}○ Inactive${NC}"
    fi
    
    echo "$BLOCK_DEC"
}

echo ""
echo "Checking all 3 nodes..."
echo "If a node is unreachable, make sure:"
echo "1. The VM is powered on"
echo "2. Geth is running"
echo "3. Firewall allows port 8545"
echo ""

if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed${NC}"
    exit 1
fi

BLOCK_A=$(test_node "VM-A (Mill 1)" "$VM_A_IP")
BLOCK_B=$(test_node "VM-B (Mill 2)" "$VM_B_IP")
BLOCK_C=$(test_node "VM-C (Estate)" "$VM_C_IP")

echo ""
echo "=========================================="
echo "  Network Status Summary"
echo "=========================================="
echo ""

# Check if blocks are synced
if [ "$BLOCK_A" -eq "$BLOCK_B" ] && [ "$BLOCK_B" -eq "$BLOCK_C" ]; then
    echo -e "${GREEN}✓ All nodes synced at block $BLOCK_A${NC}"
    echo -e "${GREEN}✓ Consensus achieved!${NC}"
    echo ""
    echo "Network is ready for:"
    echo "  - Smart contract deployment"
    echo "  - Transaction submissions"
    echo "  - Application integration"
else
    echo -e "${YELLOW}⚠ Nodes not fully synced${NC}"
    echo "  VM-A: Block $BLOCK_A"
    echo "  VM-B: Block $BLOCK_B"
    echo "  VM-C: Block $BLOCK_C"
    echo ""
    echo "Wait a few minutes and run this test again."
fi

echo ""
