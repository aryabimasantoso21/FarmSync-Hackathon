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
