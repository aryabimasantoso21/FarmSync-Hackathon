# FarmSync 3-VM Quick Start Guide

## 🚀 Fastest Way to Get Started

### Prerequisites
- 3 Ubuntu VMs ready
- Network connectivity between VMs
- Root/sudo access

### Quick Setup (Copy-Paste Ready!)

#### VM-A (192.168.1.101) - Mill 1 Node
```bash
# Install Geth
sudo add-apt-repository -y ppa:ethereum/ethereum && \
sudo apt-get update && \
sudo apt-get install -y ethereum

# Setup
mkdir -p ~/geth-mill1 && cd ~/geth-mill1

# Copy genesis.json here, then:
geth --datadir ./data init genesis.json

# Import account
echo "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" > key.txt
echo "mill1pass" > password.txt
geth --datadir ./data account import key.txt --password password.txt
rm key.txt

# Start node
geth --datadir ./data \
  --networkid 12345 \
  --port 30303 \
  --http --http.addr "0.0.0.0" --http.port 8545 \
  --http.api "eth,net,web3,personal,miner,admin,clique" \
  --http.corsdomain "*" \
  --mine --miner.etherbase "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" \
  --unlock "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" \
  --password password.txt --allow-insecure-unlock \
  --syncmode "full" --nodiscover console

# In console, get enode:
admin.nodeInfo.enode
# Copy and replace [::] with 192.168.1.101
```

#### VM-B (192.168.1.102) - Mill 2 Node
```bash
# Install Geth
sudo add-apt-repository -y ppa:ethereum/ethereum && \
sudo apt-get update && \
sudo apt-get install -y ethereum

# Setup
mkdir -p ~/geth-mill2 && cd ~/geth-mill2

# Copy genesis.json here, then:
geth --datadir ./data init genesis.json

# Import account
echo "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" > key.txt
echo "mill2pass" > password.txt
geth --datadir ./data account import key.txt --password password.txt
rm key.txt

# Start node (replace ENODE_URL with VM-A's enode)
geth --datadir ./data \
  --networkid 12345 \
  --port 30303 \
  --http --http.addr "0.0.0.0" --http.port 8545 \
  --http.api "eth,net,web3,personal,miner,admin,clique" \
  --http.corsdomain "*" \
  --bootnodes "enode://YOUR_VM_A_ENODE@192.168.1.101:30303" \
  --mine --miner.etherbase "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" \
  --unlock "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" \
  --password password.txt --allow-insecure-unlock \
  --syncmode "full" console

# Verify:
admin.peers  # Should show 1 peer
eth.blockNumber  # Should match VM-A
```

#### VM-C (192.168.1.103) - Estate Node + Apps
```bash
# Install Geth + Node.js + Mosquitto
sudo add-apt-repository -y ppa:ethereum/ethereum && \
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && \
sudo apt-get update && \
sudo apt-get install -y ethereum nodejs mosquitto mosquitto-clients

# Start Mosquitto
sudo systemctl enable mosquitto && sudo systemctl start mosquitto

# Setup Geth
mkdir -p ~/geth-estate && cd ~/geth-estate

# Copy genesis.json here, then:
geth --datadir ./data init genesis.json

# Import account
echo "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" > key.txt
echo "estatepass" > password.txt
geth --datadir ./data account import key.txt --password password.txt
rm key.txt

# Start node (replace ENODE_URL)
geth --datadir ./data \
  --networkid 12345 \
  --port 30303 \
  --http --http.addr "0.0.0.0" --http.port 8545 \
  --http.api "eth,net,web3,personal,miner,admin,clique" \
  --http.corsdomain "*" \
  --bootnodes "enode://YOUR_VM_A_ENODE@192.168.1.101:30303" \
  --mine --miner.etherbase "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --unlock "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --password password.txt --allow-insecure-unlock \
  --syncmode "full" console

# Verify:
admin.peers  # Should show 2 peers
eth.blockNumber  # Should match VM-A and VM-B
```

### Deploy Contract

```bash
# From dev machine or VM-C:
cd FarmSync/blockchain

# Update hardhat.config.js (already done if you committed changes)

# Deploy
npx hardhat run scripts/deploy.js --network geth_private

# Save contract address!
```

### Setup Applications (VM-C)

```bash
# Copy FarmSync project to VM-C
scp -r FarmSync user@192.168.1.103:~/

# On VM-C:
cd ~/FarmSync

# Install dependencies
cd middleware && npm install
cd ../backend && npm install
cd ../frontend && npm install

# Update .env files with contract address
nano middleware/.env  # Update CONTRACT_ADDRESS, RPC_URL
nano backend/.env     # Update CONTRACT_ADDRESS, RPC_URL

# Start services (3 terminals)
cd ~/FarmSync/middleware && npm start
cd ~/FarmSync/backend && npm start
cd ~/FarmSync/frontend && npm start
```

### Test

```bash
# Test MQTT
mosquitto_pub -h 192.168.1.103 -t tbs/received -m '{"truckId":"TRK-001","eventType":"TAP-1","weight":10000,"estateId":"EST-001","timestamp":"2025-10-30T12:00:00.000Z"}'

# Check all nodes:
eth.blockNumber  # Should increase and be same on all 3 nodes
```

## ⏱️ Estimated Time
- VM setup: 10 min per VM (30 min total)
- Network sync: 5 min
- Contract deploy: 5 min
- App setup: 10 min
- **Total: ~50 minutes**

## 🎯 Success Indicators
✅ `admin.peers` shows 2 peers on each node
✅ `eth.blockNumber` same on all 3 nodes
✅ Contract deployed successfully
✅ MQTT → Blockchain works
✅ Dashboard shows live tracking

## 🔥 Demo Scenarios

### 1. Normal Transaction
```bash
# TAP-1
mosquitto_pub -h 192.168.1.103 -t tbs/received -m '{"truckId":"TRK-001","eventType":"TAP-1","weight":10000,"estateId":"EST-001","timestamp":"2025-10-30T12:00:00.000Z"}'

# TAP-2 (after 10 sec)
mosquitto_pub -h 192.168.1.103 -t tbs/received -m '{"truckId":"TRK-001","eventType":"TAP-2","weight":9999,"estateId":"EST-001","timestamp":"2025-10-30T12:05:00.000Z"}'

# Result: ✅ Payment executed, truck reusable
```

### 2. Consensus Demo
```bash
# Check all nodes after transaction:
# VM-A: eth.blockNumber → 150
# VM-B: eth.blockNumber → 150 (same!)
# VM-C: eth.blockNumber → 150 (same!)

# Result: ✅ All nodes agree (consensus)
```

### 3. Node Failure Demo
```bash
# 1. Stop VM-A (Ctrl+C)
# 2. Submit TAP-1 via VM-C
# 3. VM-B and VM-C still process (2/3 majority)
# 4. Restart VM-A → auto-syncs

# Result: ✅ Network resilient to 1 node failure
```

## 📊 Cheat Sheet

| Command | Purpose |
|---------|---------|
| `admin.peers` | List connected nodes |
| `net.peerCount` | Number of peers |
| `eth.blockNumber` | Current block |
| `eth.mining` | Mining status |
| `eth.syncing` | Sync status |
| `eth.accounts` | List accounts |
| `eth.getBalance(eth.accounts[0])` | Check balance |

## 🆘 Troubleshooting

**Nodes not connecting?**
```bash
# Check firewall
sudo ufw allow 30303/tcp
sudo ufw allow 8545/tcp

# Add peer manually
admin.addPeer("enode://...")
```

**Blocks not syncing?**
```bash
# Verify mining
eth.mining  # Should be true

# Check peers
admin.peers  # Should have peers
```

**Contract deployment fails?**
```bash
# Check balance
eth.getBalance(eth.accounts[0])

# Check connection
curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://192.168.1.101:8545
```

---

**Need help?** Check `README.md` for detailed documentation.
