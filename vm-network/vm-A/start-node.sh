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
