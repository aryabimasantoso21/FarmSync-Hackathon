#!/bin/bash

# Automated startup script for 3-node Geth network on localhost

echo "=========================================="
echo "  Starting 3-Node Geth Network"
echo "=========================================="

# Kill any existing geth processes
echo "Stopping any existing geth processes..."
pkill -f "geth.*vm-"

sleep 2

# Start VM-A in background
echo "[1/3] Starting VM-A (Mill 1) on port 30301, RPC 8545..."
cd /home/aryabimasantoso/FarmSync/vm-network/vm-A
nohup geth --datadir ./gethData \
  --networkid 12345 \
  --port 30301 \
  --http \
  --http.addr "127.0.0.1" \
  --http.port 8545 \
  --http.api "eth,net,web3,personal,miner,admin,clique" \
  --http.corsdomain "*" \
  --authrpc.port 8551 \
  --mine \
  --miner.etherbase "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" \
  --unlock "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" \
  --password ./gethData/password.txt \
  --allow-insecure-unlock \
  --syncmode "full" \
  > geth-console.log 2>&1 &

VM_A_PID=$!
echo "✓ VM-A started (PID: $VM_A_PID)"

# Wait for VM-A to start
echo "Waiting for VM-A to initialize..."
sleep 10

# Get VM-A enode
echo "Getting VM-A enode..."
ENODE=$(geth attach --exec "admin.nodeInfo.enode" http://127.0.0.1:8545 2>/dev/null | tr -d '"')
# Replace [::] with 127.0.0.1
ENODE=${ENODE//\[::\]/127.0.0.1}
# Remove discport query parameter
ENODE=${ENODE//\?discport=0/}

echo "VM-A enode: $ENODE"

if [ -z "$ENODE" ]; then
    echo "ERROR: Could not get VM-A enode. Check geth-console.log"
    exit 1
fi

# Start VM-B
echo "[2/3] Starting VM-B (Mill 2) on port 30302, RPC 8546..."
cd /home/aryabimasantoso/FarmSync/vm-network/vm-B
nohup geth --datadir ./gethData \
  --networkid 12345 \
  --port 30302 \
  --http \
  --http.addr "127.0.0.1" \
  --http.port 8546 \
  --http.api "eth,net,web3,personal,miner,admin,clique" \
  --http.corsdomain "*" \
  --authrpc.port 8552 \
  --bootnodes "$ENODE" \
  --mine \
  --miner.etherbase "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" \
  --unlock "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" \
  --password ./gethData/password.txt \
  --allow-insecure-unlock \
  --syncmode "full" \
  > geth-console.log 2>&1 &

VM_B_PID=$!
echo "✓ VM-B started (PID: $VM_B_PID)"

# Start VM-C
echo "[3/3] Starting VM-C (Estate) on port 30303, RPC 8547..."
cd /home/aryabimasantoso/FarmSync/vm-network/vm-C
nohup geth --datadir ./gethData \
  --networkid 12345 \
  --port 30303 \
  --http \
  --http.addr "127.0.0.1" \
  --http.port 8547 \
  --http.api "eth,net,web3,personal,miner,admin,clique" \
  --http.corsdomain "*" \
  --authrpc.port 8553 \
  --bootnodes "$ENODE" \
  --mine \
  --miner.etherbase "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --unlock "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --password ./gethData/password.txt \
  --allow-insecure-unlock \
  --syncmode "full" \
  > geth-console.log 2>&1 &

VM_C_PID=$!
echo "✓ VM-C started (PID: $VM_C_PID)"

echo ""
echo "Waiting for nodes to connect..."
sleep 15

echo ""
echo "=========================================="
echo "  Network Status"
echo "=========================================="
echo "VM-A (Mill 1): http://127.0.0.1:8545 (PID: $VM_A_PID)"
echo "VM-B (Mill 2): http://127.0.0.1:8546 (PID: $VM_B_PID)"
echo "VM-C (Estate): http://127.0.0.1:8547 (PID: $VM_C_PID)"
echo ""

# Check block numbers
echo "Checking consensus..."
BLOCK_A=$(geth attach --exec "eth.blockNumber" http://127.0.0.1:8545 2>/dev/null)
BLOCK_B=$(geth attach --exec "eth.blockNumber" http://127.0.0.1:8546 2>/dev/null)
BLOCK_C=$(geth attach --exec "eth.blockNumber" http://127.0.0.1:8547 2>/dev/null)

echo "VM-A block: $BLOCK_A"
echo "VM-B block: $BLOCK_B"
echo "VM-C block: $BLOCK_C"

# Check peers
PEERS_A=$(geth attach --exec "net.peerCount" http://127.0.0.1:8545 2>/dev/null)
PEERS_B=$(geth attach --exec "net.peerCount" http://127.0.0.1:8546 2>/dev/null)
PEERS_C=$(geth attach --exec "net.peerCount" http://127.0.0.1:8547 2>/dev/null)

echo ""
echo "Peer counts:"
echo "VM-A peers: $PEERS_A"
echo "VM-B peers: $PEERS_B"
echo "VM-C peers: $PEERS_C"

echo ""
echo "=========================================="
echo "Next steps:"
echo "1. Deploy contract: cd /home/aryabimasantoso/FarmSync/blockchain && npx hardhat run scripts/deploy.js --network geth_private"
echo "2. Check logs: tail -f /home/aryabimasantoso/FarmSync/vm-network/vm-A/geth-console.log"
echo "3. Connect to node: geth attach http://127.0.0.1:8545"
echo "4. Stop all: pkill -f 'geth.*vm-'"
echo "=========================================="
