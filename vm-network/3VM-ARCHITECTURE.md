# FarmSync 3-VM Network Architecture

## 🏗️ Network Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    3-Node Geth Private Network                   │
│                     (Clique Proof of Authority)                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
   ┌────▼────┐              ┌─────▼─────┐           ┌──────▼──────┐
   │  VM-A   │              │   VM-B    │           │    VM-C     │
   │ Mill 1  │◄────────────►│  Mill 2   │◄─────────►│   Estate    │
   └─────────┘              └───────────┘           └─────────────┘
   Port: 30301              Port: 30302             Port: 30303
   RPC:  8545               RPC:  8546              RPC:  8547
   
   Account:                 Account:                Account:
   0x7099...79C8           0x3C44...93BC           0xf39F...2266
```

## 📡 Data Flow

### Mill 1 (VM-A) Purchase Flow
```
MQTT Publisher       MQTT Broker         Middleware          Blockchain (VM-A)
mill1Publisher.js ──► mosquitto ──────► middleware ───────► Geth Node (8545)
     │                                      │                      │
     │ TRK-M1-0001                         │ Process              │ Mine Block
     │ EST-00001                           │ Transaction          │ Consensus
     │ TAP-1/TAP-2                         └─────────────────────►│ 
     │                                                             │
     └─────────────────────────────────────────────────────────────┘
                           Consensus achieved across all 3 nodes
```

### Mill 2 (VM-B) Purchase Flow
```
MQTT Publisher       MQTT Broker         Middleware          Blockchain (VM-B)
mill2Publisher.js ──► mosquitto ──────► middleware ───────► Geth Node (8546)
     │                                      │                      │
     │ TRK-M2-0001                         │ Process              │ Mine Block
     │ EST-00001                           │ Transaction          │ Consensus
     │ TAP-1/TAP-2                         └─────────────────────►│ 
     │                                                             │
     └─────────────────────────────────────────────────────────────┘
                           Consensus achieved across all 3 nodes
```

## 🚀 Quick Start

### 1. Start 3-Node Geth Network
```bash
cd vm-network
./start-all-nodes.sh
```

Verify all nodes are running:
```bash
# Check consensus
geth attach --exec "eth.blockNumber" http://127.0.0.1:8545  # VM-A
geth attach --exec "eth.blockNumber" http://127.0.0.1:8546  # VM-B
geth attach --exec "eth.blockNumber" http://127.0.0.1:8547  # VM-C
```

### 2. Start Middleware
```bash
cd middleware
npm start
```

### 3. Run Mill 1 Publisher (Terminal 1)
```bash
cd mqtt
npm run mill1
```

Input example for Mill 1:
- Truck ID: `TRK-M1-0001` (auto-generated)
- Event Type: `TAP-1` (Departure from Estate)
- Weight: `15000` kg
- Estate ID: `EST-00001`

### 4. Run Mill 2 Publisher (Terminal 2)
```bash
cd mqtt
npm run mill2
```

Input example for Mill 2:
- Truck ID: `TRK-M2-0001` (auto-generated)
- Event Type: `TAP-1` (Departure from Estate)
- Weight: `18000` kg
- Estate ID: `EST-00001`

## 📊 Network Configuration

| Component | VM-A (Mill 1) | VM-B (Mill 2) | VM-C (Estate) |
|-----------|---------------|---------------|---------------|
| **Role** | Validator & Buyer | Validator & Buyer | Validator & Seller |
| **P2P Port** | 30301 | 30302 | 30303 |
| **RPC Port** | 8545 | 8546 | 8547 |
| **Auth RPC** | 8551 | 8552 | 8553 |
| **Address** | 0x7099...79C8 | 0x3C44...93BC | 0xf39F...2266 |
| **Balance** | 1000 ETH | 1000 ETH | 1000 ETH |
| **Account Name** | Mill 1 | Mill 2 | Estate |

## 🔗 Blockchain Details

- **Network ID**: 12345
- **Consensus**: Clique Proof of Authority (PoA)
- **Block Time**: 5 seconds
- **Gas Limit**: 8,000,000
- **Validators**: 3 nodes (VM-A, VM-B, VM-C)
- **Contract**: SensorLedger at `0x5FbDB2315678afecb367f032d93F642f64180aa3`

## 🎯 Use Cases

### Scenario 1: Mill 1 Purchases TBS
1. Estate loads TBS onto truck TRK-M1-0001
2. Mill 1 operator runs `npm run mill1`
3. Records TAP-1 (departure) - 15000 kg
4. Transaction mined on VM-A, consensus achieved on VM-B and VM-C
5. Truck arrives at Mill 1
6. Mill 1 operator records TAP-2 (arrival) - 14950 kg
7. Smart contract calculates payment and releases funds

### Scenario 2: Mill 2 Purchases TBS
1. Estate loads TBS onto truck TRK-M2-0001
2. Mill 2 operator runs `npm run mill2`
3. Records TAP-1 (departure) - 18000 kg
4. Transaction mined on VM-B, consensus achieved on VM-A and VM-C
5. Truck arrives at Mill 2
6. Mill 2 operator records TAP-2 (arrival) - 17950 kg
7. Smart contract calculates payment and releases funds

### Scenario 3: Concurrent Purchases
- Mill 1 and Mill 2 can both purchase from Estate simultaneously
- Each transaction is validated by all 3 nodes
- Byzantine Fault Tolerance: Network continues if 1 node fails
- Data immutability: All records permanently stored on blockchain

## 🛡️ Security Features

1. **Consensus Validation**: 2/3 majority required (Byzantine Fault Tolerance)
2. **Immutable Ledger**: All transactions permanently recorded
3. **Multi-Node Verification**: Each transaction validated by all nodes
4. **Account Authentication**: Each mill has unique Ethereum account
5. **Smart Contract Logic**: Automated payment calculation and release

## 📝 Monitoring Commands

```bash
# Check network status
cd vm-network
./test-network.sh

# View VM-A logs
tail -f vm-network/vm-A/geth-console.log

# View VM-B logs
tail -f vm-network/vm-B/geth-console.log

# View VM-C logs
tail -f vm-network/vm-C/geth-console.log

# Check middleware logs
tail -f middleware/middleware.log

# Verify contract data
cd blockchain
npx hardhat run scripts/check-contract.js --network geth_private
```

## 🔧 Troubleshooting

### Network not syncing
```bash
# Restart all nodes
pkill -9 geth
cd vm-network
./start-all-nodes.sh
```

### Check peer connections
```bash
geth attach --exec "admin.peers" http://127.0.0.1:8545
```

### Verify consensus
```bash
# All nodes should show same block number
geth attach --exec "eth.blockNumber" http://127.0.0.1:8545
geth attach --exec "eth.blockNumber" http://127.0.0.1:8546
geth attach --exec "eth.blockNumber" http://127.0.0.1:8547
```

## 🎓 For TA/Thesis Presentation

This architecture demonstrates:
1. ✅ **Distributed Blockchain Network** - 3 independent nodes
2. ✅ **Consensus Mechanism** - Clique PoA with 2/3 validation
3. ✅ **Byzantine Fault Tolerance** - Network survives 1 node failure
4. ✅ **Real-world Simulation** - Multiple buyers (mills) from single seller (estate)
5. ✅ **IoT Integration** - MQTT → Middleware → Blockchain pipeline
6. ✅ **Smart Contract Automation** - Automated payment calculation
7. ✅ **Immutable Audit Trail** - Permanent record of all transactions

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Detailed installation instructions
- [Quick Start](QUICKSTART.md) - Fast deployment guide
- [Implementation Details](IMPLEMENTATION.md) - Technical architecture
- [API Reference](../backend/README.md) - Backend API documentation
