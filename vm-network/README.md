# FarmSync 3-VM Geth Network Setup Guide

## 🎯 Overview

This setup creates a **3-node private Ethereum network** using Geth with Proof of Authority (PoA) consensus.

### Architecture
```
VM-A (Mill 1)  ◄──┐
    ▲             │
    │             ├─── P2P Network
    ▼             │    (Consensus)
VM-B (Mill 2)  ◄──┤
    ▲             │
    │             │
    ▼             │
VM-C (Estate)  ◄──┘
  + MQTT Broker
  + Middleware
  + Backend API
  + Frontend
```

## 📋 Prerequisites

### VM Requirements
- **VM-A**: Ubuntu Server, 2GB RAM, 20GB storage
- **VM-B**: Ubuntu Server, 2GB RAM, 20GB storage
- **VM-C**: Ubuntu Server, 4GB RAM, 30GB storage

### Network Setup
- All VMs must be on the same network
- Assign static IPs (recommended):
  - VM-A: 192.168.1.101
  - VM-B: 192.168.1.102
  - VM-C: 192.168.1.103
- Ports required:
  - 30303 (Geth P2P)
  - 8545 (Geth RPC)
  - 1883 (MQTT - VM-C only)
  - 5000 (Backend API - VM-C only)
  - 3000 (Frontend - VM-C only)

## 🚀 Setup Steps

### Phase 1: Setup VM-A (Mill 1 - Bootnode)

```bash
# 1. Copy files to VM-A
scp genesis.json setup-vm-a.sh user@vm-a-ip:~/

# 2. SSH to VM-A
ssh user@vm-a-ip

# 3. Run setup
chmod +x setup-vm-a.sh
./setup-vm-a.sh

# 4. Start Geth
cd ~/geth-mill1
./start-mill1.sh

# 5. In Geth console, get enode URL:
admin.nodeInfo.enode
# Copy this output: enode://abc123...@[::]:30303
# Replace [::] with actual IP: enode://abc123...@192.168.1.101:30303
```

### Phase 2: Setup VM-B (Mill 2)

```bash
# 1. Copy files to VM-B
scp genesis.json setup-vm-b.sh user@vm-b-ip:~/

# 2. SSH to VM-B
ssh user@vm-b-ip

# 3. Run setup (enter VM-A's enode when prompted)
chmod +x setup-vm-b.sh
./setup-vm-b.sh

# 4. If enode not entered during setup, edit start script:
cd ~/geth-mill2
nano start-mill2.sh
# Add --bootnodes "enode://..." line

# 5. Start Geth
./start-mill2.sh

# 6. Verify connection:
admin.peers  # Should show 1 peer (VM-A)
net.peerCount  # Should be 1
eth.blockNumber  # Should match VM-A
```

### Phase 3: Setup VM-C (Estate + Apps)

```bash
# 1. Copy files to VM-C
scp genesis.json setup-vm-c.sh user@vm-c-ip:~/

# 2. SSH to VM-C
ssh user@vm-c-ip

# 3. Run setup (enter VM-A's enode when prompted)
chmod +x setup-vm-c.sh
./setup-vm-c.sh

# 4. If enode not entered, edit start script:
cd ~/geth-estate
nano start-estate.sh
# Add --bootnodes "enode://..." line

# 5. Start Geth
./start-estate.sh

# 6. Verify connections:
admin.peers  # Should show 2 peers (VM-A, VM-B)
net.peerCount  # Should be 2
eth.blockNumber  # Should match VM-A and VM-B
```

### Phase 4: Verify Network

```bash
# From your development machine or any VM:
chmod +x test-network.sh
./test-network.sh

# Expected output:
# ✓ All nodes synced at block X
# ✓ Consensus achieved!
```

### Phase 5: Deploy Smart Contract

```bash
# From your development machine (with FarmSync project):
cd FarmSync/vm-network
chmod +x deploy-contract.sh
./deploy-contract.sh

# Save the contract address from output
# Example: SensorLedger deployed to: 0x1234...5678
```

### Phase 6: Configure Applications on VM-C

```bash
# 1. Copy FarmSync project to VM-C
scp -r FarmSync user@vm-c-ip:~/

# 2. SSH to VM-C
ssh user@vm-c-ip

# 3. Install dependencies
cd ~/FarmSync/middleware
npm install

cd ~/FarmSync/backend
npm install

cd ~/FarmSync/frontend
npm install

# 4. Update middleware/.env
nano ~/FarmSync/middleware/.env
```

Update these values:
```env
MQTT_BROKER_URL=mqtt://localhost:1883
RPC_URL=http://localhost:8545  # or http://192.168.1.101:8545
PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
CONTRACT_ADDRESS=0x...  # From deployment
ESTATE_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
MILL_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
PRICE_PER_KG=1000000000000000
```

```bash
# 5. Update backend/.env
nano ~/FarmSync/backend/.env
```

Update:
```env
PORT=5000
RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x...  # Same as middleware
ESTATE_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
MILL_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

### Phase 7: Start Applications

```bash
# Terminal 1: Middleware
cd ~/FarmSync/middleware
npm start

# Terminal 2: Backend
cd ~/FarmSync/backend
npm start

# Terminal 3: Frontend
cd ~/FarmSync/frontend
npm start
```

### Phase 8: Update ESP32

Update ESP32 code with VM-C IP:
```cpp
const char* MQTT_BROKER = "192.168.1.103";  // VM-C IP
```

## 🧪 Testing

### Test 1: Network Consensus
```bash
# On all VMs (in geth console):
eth.blockNumber  # Should be same on all 3 nodes
admin.peers      # VM-A: 2 peers, VM-B: 2 peers, VM-C: 2 peers
```

### Test 2: MQTT Flow
```bash
# On VM-C or dev machine:
mosquitto_pub -h 192.168.1.103 -t tbs/received -m '{"truckId":"TRK-001","eventType":"TAP-1","weight":10000,"estateId":"EST-001","timestamp":"2025-10-30T12:00:00.000Z"}'

# Check middleware logs for: "Departure recorded!"
# Check all geth nodes: eth.blockNumber should increase
```

### Test 3: TAP-1 → TAP-2
```bash
# TAP-1
mosquitto_pub -h 192.168.1.103 -t tbs/received -m '{"truckId":"TRK-001","eventType":"TAP-1","weight":10000,"estateId":"EST-001","timestamp":"2025-10-30T12:00:00.000Z"}'

# Wait 10 seconds

# TAP-2
mosquitto_pub -h 192.168.1.103 -t tbs/received -m '{"truckId":"TRK-001","eventType":"TAP-2","weight":9999,"estateId":"EST-001","timestamp":"2025-10-30T12:05:00.000Z"}'

# Check: Payment executed, dashboard updated
```

### Test 4: Immutability (Demo)
```bash
# Try to modify data on VM-A manually
# Other nodes (VM-B, VM-C) will reject invalid blocks
# Demonstrates Byzantine Fault Tolerance
```

### Test 5: Node Failure
```bash
# 1. Stop VM-A (Ctrl+C in geth console)
# 2. Submit transaction via VM-C
# 3. VM-B and VM-C still validate (2/3 majority)
# 4. Restart VM-A → auto-syncs
```

## 🔧 Useful Commands

### Geth Console Commands
```javascript
// Network info
admin.nodeInfo.enode      // Get enode URL
admin.peers               // List connected peers
net.peerCount            // Number of peers

// Blockchain info
eth.blockNumber          // Current block
eth.syncing              // Sync status
eth.mining               // Mining status

// Account info
eth.accounts             // List accounts
eth.getBalance(eth.accounts[0])  // Check balance

// Contract interaction
eth.getCode("0x...")     // Verify contract deployed
```

### Troubleshooting

#### Nodes not connecting
```bash
# Check firewall
sudo ufw allow 30303/tcp
sudo ufw allow 8545/tcp

# Verify enode URL has correct IP
admin.nodeInfo.enode

# Manually add peer
admin.addPeer("enode://...")
```

#### Blocks not syncing
```bash
# Check if mining
eth.mining  # Should be true

# Check peers
admin.peers  # Should have 2 peers

# Restart geth if needed
```

#### Contract deployment fails
```bash
# Check account unlocked
eth.accounts
eth.getBalance(eth.accounts[0])

# Check gas price
eth.gasPrice

# Increase timeout in hardhat.config.js
timeout: 120000
```

## 📊 Network Parameters

- **Chain ID**: 12345
- **Consensus**: Clique PoA
- **Block Time**: 5 seconds
- **Gas Limit**: 8,000,000
- **Initial Balance**: 1000 ETH per account

## 🔐 Accounts

| Role | Address | Private Key (for testing only!) |
|------|---------|----------------------------------|
| Estate | 0xf39F...b92266 | 0xac09...f2ff80 |
| Mill 1 | 0x7099...dc79C8 | 0x59c6...b78690d |
| Mill 2 | 0x3C44...4293BC | 0x5de4...dab365a |

⚠️ **Never use these keys in production!**

## 📝 Notes

- All nodes are validators and miners (PoA)
- 2/3 majority required for consensus
- Tolerates 1 node failure (Byzantine Fault Tolerance)
- Data persists on disk (survives restarts)
- Compatible with existing FarmSync code (config changes only)

## 🎯 Success Criteria

✅ All 3 nodes connected (admin.peers shows 2 peers each)
✅ Block numbers synced across all nodes
✅ Smart contract deployed successfully
✅ MQTT → Blockchain → Dashboard flow works
✅ TAP-1 and TAP-2 events processed
✅ Payment executed automatically
✅ Truck ID reusable after TAP-2

---

**For support, check the logs:**
- Geth logs: `~/geth-*/geth.log`
- Middleware logs: Terminal output
- Backend logs: Terminal output
