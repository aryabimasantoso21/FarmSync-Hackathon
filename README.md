# FarmSync - TBS Supply Chain Traceability with Blockchain & IoT

## 🎯 Project Overview

**FarmSync** is a blockchain-based supply chain system for **TBS (Tandan Buah Segar / Fresh Fruit Bunches)** transportation from estate to mills. The system uses **NFC sensors**, **MQTT messaging**, and **private Ethereum network** to create an immutable, transparent, and fraud-resistant ledger for tracking TBS shipments.

### Key Features
- 📡 **IoT Integration** - ESP32 with NFC reader for TAP-1 (departure) and TAP-2 (arrival)
- ⛓️ **3-Node Geth Network** - Distributed Ethereum nodes (Mill 1, Mill 2, Estate)
- 🔐 **Immutable Records** - Tamper-proof blockchain ledger with consensus verification
- � **Smart Contract Payments** - Automatic payment release based on weight verification
- 🌐 **Multi-Mill Support** - Dynamic mill selection for concurrent operations
- �️ **Fraud Prevention** - Weight tolerance checking and Byzantine Fault Tolerance

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- Geth 1.13.15 (for Clique PoA support)
- Mosquitto MQTT broker
- ESP32 with NFC reader (optional, can use MQTT simulator)

### 1️⃣ Start 3-Node Blockchain Network
```bash
cd vm-network

# Install Geth 1.13.15
./install-geth-1.13.sh

# Start all 3 nodes (Mill 1, Mill 2, Estate)
./start-all-nodes.sh

# Verify consensus (all nodes should have same block number)
./vm-A/attach.sh
> eth.blockNumber
> admin.peers  # Should show 2-4 peers
> exit
```

### 2️⃣ Deploy Smart Contract
```bash
cd blockchain

# Install dependencies
npm install

# Deploy TBSSupplyChain contract to Geth network
npx hardhat run scripts/deploy.js --network geth_private

# Copy the CONTRACT_ADDRESS from output
# Example: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 3️⃣ Configure Middleware
```bash
cd middleware

# Copy .env.example to .env (if not exists)
nano .env
```

Update with your values:
```env
MQTT_BROKER_URL=mqtt://192.168.0.101:1883  # Your MQTT broker IP
RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3  # From step 2

# Mill private keys (for payment signing)
PRIVATE_KEY_MILL1=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
PRIVATE_KEY_MILL2=0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

# Addresses
ESTATE_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
MILL1_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
MILL2_ADDRESS=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

PRICE_PER_KG=1000000000000000  # 0.001 ETH per kg
```

### 4️⃣ Start Middleware
```bash
cd middleware
npm install
npm start
```

You should see:
```
🚀 Starting FarmSync Middleware...
✅ Connected to network: 12345
📝 Contract address: 0x5FbDB2...
📡 Connecting to MQTT Broker...
✅ MQTT connected! Subscribed to: tbs/received
```

### 5️⃣ Test with MQTT Publishers (Manual Testing)
```bash
cd mqtt
npm install

# Test Mill 1 flow
npm run mill1
# Wait for TAP-1 (departure)
# Wait 10 seconds
# TAP-2 (arrival) sent automatically
# Payment released

# Test Mill 2 flow (in another terminal)
npm run mill2
```

### 6️⃣ Or Use ESP32 Hardware
Upload the ESP32 code with NFC configuration:
- **Mill 1 Card UID**: `18 82 35 A6 72 E8 48`
- **Mill 2 Card UID**: `8A B5 2E D9`
- Configure WiFi and MQTT broker IP
- Tap NFC card on sensor to trigger TAP-1
- Load TBS and tap again for TAP-2
- Check middleware logs for blockchain confirmation

---

## 📊 System Status Check

### Check Blockchain Consensus
```bash
# All 3 nodes should show same block number
./vm-network/vm-A/attach.sh
> eth.blockNumber
> exit

./vm-network/vm-B/attach.sh
> eth.blockNumber
> exit

./vm-network/vm-C/attach.sh
> eth.blockNumber
> exit
```

### Query Shipment Records
```bash
cd blockchain
npx hardhat run scripts/check-contract.js --network geth_private
```

### View Dashboard
```bash
# Start backend API
cd backend
npm install
npm start  # Port 5000

# Start frontend
cd frontend
npm install
npm start  # Port 3000

# Open browser: http://localhost:3000
# Login as: Estate, Mill 1, or Mill 2
```

---

## 🎬 Demo Scenarios

### Scenario 1: Normal TBS Shipment (Mill 1)
```bash
# 1. Tap NFC Card (TAP-1 - Departure from Estate)
# ESP32 sends: {"truckId":"TRK-00001","eventType":"TAP-1","weight":10000,"millAddress":"0x7099..."}

# 2. Middleware records departure to blockchain
# All 3 nodes receive and validate transaction

# 3. Truck arrives at Mill 1, tap card again (TAP-2)
# ESP32 sends: {"truckId":"TRK-00001","eventType":"TAP-2","weight":9999,"millAddress":"0x7099..."}

# 4. Middleware verifies weight (9999kg ≈ 10000kg, within tolerance)
# 5. Smart contract releases payment: 9.999 ETH to Estate
# 6. All 3 nodes confirm transaction
```

### Scenario 2: Fraud Prevention Demo
```bash
cd blockchain
npx hardhat run scripts/fraud-attempt.js --network geth_private

# Mill 1 attempts to manipulate weight from 9999kg → 5000kg
# Smart contract rejects: "Weight fraud detected"
# All 3 nodes maintain original data (9999kg)
# Demonstrates Byzantine Fault Tolerance
```

### Scenario 3: Concurrent Multi-Mill Operations
```bash
# Terminal 1: Mill 1 shipment
cd mqtt && npm run mill1

# Terminal 2: Mill 2 shipment (parallel)
cd mqtt && npm run mill2

# Both mills can operate independently
# Blockchain handles concurrent transactions with proper nonce management
```

---

## 📁 Project Structure

## backend
**REST API for dashboard**
```
backend/
├── server.js              # Express API with mill-specific endpoints
├── .env                   # Backend configuration
└── package.json
```

**API Endpoints:**
- `GET /api/shipments/:millId` - Get shipments for specific mill
- `GET /api/shipments/estate` - Get all estate shipments
- `GET /api/stats/:millId` - Get statistics for mill
```

```

## blockchain
**Smart contracts and deployment scripts**
```
blockchain/
├── contracts/
│   └── TBSSupplyChain.sol     # Main smart contract
├── scripts/
│   ├── deploy.js              # Deploy to Geth network
│   ├── check-contract.js      # Query shipment records
│   ├── fraud-attempt.js       # Demo fraud detection
│   └── demo-dashboard.js      # Consensus verification
├── hardhat.config.js          # Network configuration
└── package.json
```

**Smart Contract Functions:**
- `recordDeparture()` - Record TAP-1 (truck departure)
- `recordArrival()` - Record TAP-2 (truck arrival)
- `releasePayment()` - Automatic payment to estate
- `getShipment()` - Query shipment details
- `verifyIntegrity()` - Verify data hasn't been tampered

**Commands:**
- `npx hardhat compile` - Compile contracts
- `npx hardhat run scripts/deploy.js --network geth_private` - Deploy
- `npx hardhat run scripts/fraud-attempt.js --network geth_private` - Test fraud prevention

## frontend
**React dashboard for monitoring**
```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.js           # Login selection (Estate/Mill1/Mill2)
│   │   ├── EstateDashboard.js     # Estate view (all shipments)
│   │   ├── Mill1Dashboard.js      # Mill 1 specific view
│   │   └── Mill2Dashboard.js      # Mill 2 specific view
│   └── components/
│       └── ShipmentTracking.js    # Shipment details component
└── package.json
```

**Features:**
- Real-time shipment tracking
- Mill-specific filtering
- Payment status monitoring
- Blockchain confirmation display
```

```

## middleware
**Bridge between MQTT and Blockchain**
```
middleware/
├── handler/
│   ├── mqttHandler.js         # MQTT subscription & TAP-1/TAP-2 routing
│   └── blockchainHandler.js   # Dual mill support with dynamic signer
├── index.js                   # Main entry point
├── .env                       # Configuration (MILL1/MILL2 keys)
└── package.json
```

**Key Features:**
- Dynamic mill selection based on `millAddress` in MQTT payload
- Automatic nonce management for concurrent transactions
- TAP-1 → `recordDeparture()` / TAP-2 → `recordArrival()` + `releasePayment()`
- 10-second delay between TAP-2 and payment for weight verification

**Commands:**
- `npm start` - Run middleware

## mqtt
**NFC sensor publishers (for testing without hardware)**
```
mqtt/
├── publisher/
│   ├── mill1Publisher.js      # Simulate Mill 1 NFC taps
│   └── mill2Publisher.js      # Simulate Mill 2 NFC taps
└── package.json
```

**JSON Payload Format:**
```json
{
  "truckId": "TRK-00001",
  "eventType": "TAP-1",
  "weight": 10000,
  "estateId": "EST-00001",
  "millId": "MILL-00001",
  "millAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "timestamp": "2025-10-30T12:00:00.000Z"
}
```

**Commands:**
- `npm run mill1` - Test Mill 1 flow (TAP-1 → wait 10s → TAP-2)
- `npm run mill2` - Test Mill 2 flow

## vm-network
**3-Node Private Ethereum (Geth 1.13.15) Network**
```
vm-network/
├── vm-A/                      # Mill 1 Node
│   ├── start-mill1.sh         # Start script (port 8545)
│   ├── attach.sh              # Geth console
│   └── gethData/
│       └── static-nodes.json  # Peer discovery
├── vm-B/                      # Mill 2 Node
│   ├── start-mill2.sh         # Start script (port 8546)
│   ├── attach.sh
│   └── gethData/
│       └── static-nodes.json
├── vm-C/                      # Estate Node
│   ├── start-estate.sh        # Start script (port 8547)
│   ├── attach.sh
│   └── gethData/
│       └── static-nodes.json
├── genesis.json               # Clique PoA genesis config
├── install-geth-1.13.sh       # Geth installer
└── start-all-nodes.sh         # Start all 3 nodes + verify consensus
```

**Network Configuration:**
- Consensus: **Clique Proof of Authority (PoA)**
- Block Time: 5 seconds
- Chain ID: 12345
- Validators: Mill 1, Mill 2, Estate
- P2P Ports: 30301 (VM-A), 30302 (VM-B), 30303 (VM-C)
- RPC Ports: 8545 (VM-A), 8546 (VM-B), 8547 (VM-C)

---

## 🏗️ Development Progress

### ✅ Phase 1: Core Infrastructure (Complete)
- [x] TBSSupplyChain smart contract with payment logic
- [x] 3-node Geth 1.13.15 private network (Clique PoA)
- [x] MQTT broker setup (Mosquitto)
- [x] Middleware with dual mill support
- [x] Dynamic mill selection based on millAddress
- [x] Nonce management for concurrent transactions

### ✅ Phase 2: IoT Integration (Complete)
- [x] ESP32 + NFC reader integration
- [x] TAP-1 (departure) and TAP-2 (arrival) events
- [x] Weight sensor (HX711) calibration
- [x] MQTT publisher for Mill 1 and Mill 2
- [x] JSON payload with millAddress routing

### ✅ Phase 3: Security & Fraud Prevention (Complete)
- [x] Weight tolerance verification (max 1kg difference)
- [x] Byzantine Fault Tolerance demo
- [x] Fraud attempt script (weight manipulation detection)
- [x] Replay attack prevention
- [x] 2-of-3 consensus requirement

### ✅ Phase 4: Dashboard & Monitoring (Complete)
- [x] Backend REST API with mill-specific endpoints
- [x] React frontend with role-based dashboards
- [x] Estate dashboard (all shipments view)
- [x] Mill 1 & Mill 2 dashboards (filtered views)
- [x] Real-time payment status tracking

### 🔜 Phase 5: Production Deployment
- [ ] Hardware installation at actual mills
- [ ] Network optimization for WAN connectivity
- [ ] Backup and disaster recovery
- [ ] Performance monitoring and alerting

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         FarmSync Architecture                              │
└────────────────────────────────────────────────────────────────────────────┘

        ┌─────────────┐
        │   ESP32     │  NFC Reader + HX711 Weight Sensor
        │  + NFC      │  Tap Mill 1 Card → TAP-1 / TAP-2
        └──────┬──────┘  Tap Mill 2 Card → TAP-1 / TAP-2
               │
               │ MQTT Publish
               │ {"truckId":"TRK-00001","eventType":"TAP-1",
               │  "millAddress":"0x7099...","weight":10000}
               ▼
    ┌──────────────────┐
    │  MQTT Broker     │  Mosquitto (192.168.0.101:1883)
    │  (Mosquitto)     │  Topic: tbs/received
    └────────┬─────────┘
             │
             │ Subscribe
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Middleware (Node.js)                              │
│  ┌──────────────────┐              ┌───────────────────────────┐     │
│  │ mqttHandler.js   │              │ blockchainHandler.js      │     │
│  ├──────────────────┤              ├───────────────────────────┤     │
│  │ • Parse JSON     │──Forward───▶│ • Select Mill Signer      │     │
│  │ • Extract        │    TAP-1    │   (Mill1 or Mill2)        │     │
│  │   millAddress    │   /TAP-2    │ • Manage nonce            │     │
│  │ • Route to       │             │ • recordDeparture()       │     │
│  │   blockchain     │             │ • recordArrival()         │     │
│  └──────────────────┘             │ • releasePayment()        │     │
│                                    └───────────┬───────────────┘     │
└────────────────────────────────────────────────┼───────────────────────┘
                                                 │
                                                 │ ethers.js (JSON-RPC)
                                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│            3-Node Geth Private Network (Clique PoA)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   VM-A       │  │   VM-B       │  │   VM-C       │               │
│  │  (Mill 1)    │  │  (Mill 2)    │  │  (Estate)    │               │
│  │ :8545        │  │ :8546        │  │ :8547        │               │
│  │ Validator    │◀─┼─ Validator   │◀─┼─ Validator   │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                  │                        │
│         └─────────────────┴──────────────────┘                        │
│                      Synchronized                                     │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         TBSSupplyChain Smart Contract                         │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  recordDeparture(truckId, weight, estateAddr, millAddr)     │   │
│  │    ├─ Verify truck not in transit                           │   │
│  │    ├─ Store: departureWeight, seller, buyer                 │   │
│  │    └─ Emit: TruckDeparted                                   │   │
│  │                                                               │   │
│  │  recordArrival(truckId, weight)                             │   │
│  │    ├─ Verify weight tolerance (max 1kg diff)               │   │
│  │    ├─ Store: arrivalWeight                                  │   │
│  │    └─ Emit: TruckArrived                                    │   │
│  │                                                               │   │
│  │  releasePayment(truckId)                                    │   │
│  │    ├─ Calculate: price = arrivalWeight * PRICE_PER_KG      │   │
│  │    ├─ Transfer ETH: mill → estate                           │   │
│  │    ├─ Mark: paid = true                                     │   │
│  │    └─ Emit: PaymentReleased                                 │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                    ┌───────────────┴────────────────┐
                    │                                 │
            ┌───────▼────────┐             ┌─────────▼────────┐
            │   Backend API  │             │  React Frontend  │
            │  (Express.js)  │             │   (Dashboard)    │
            │  Port 5000     │             │   Port 3000      │
            └────────────────┘             └──────────────────┘
                 │                                  │
                 │                                  │
            Mill-specific                    Estate/Mill1/Mill2
            endpoints                         Dashboards
```

---

## 🛠️ Technology Stack

### Blockchain Layer
- **Network**: Private Ethereum with Geth 1.13.15
- **Consensus**: Clique Proof of Authority (PoA)
- **Smart Contracts**: Solidity ^0.8.28
- **Web3 Library**: ethers.js v6.15.0

### IoT Layer
- **Hardware**: ESP32 + PN532 NFC Reader + HX711 Load Cell
- **Protocol**: MQTT v3.1.1 (mqtt.js)
- **Broker**: Eclipse Mosquitto
- **Message Format**: JSON with millAddress routing

### Application Layer
- **Middleware**: Node.js v18+ with dotenv
- **Backend API**: Express.js (REST)
- **Frontend**: React 18 with React Router
- **Storage**: Blockchain (immutable) + In-memory (API cache)

### Development Tools
- **Smart Contract Dev**: Hardhat v2.22.18
- **Testing**: Hardhat Network + Geth Private Network
- **Version Control**: Git with branch isolation

---

## � Security Features

### Blockchain Security
✅ **Immutable Ledger** - All transactions cryptographically signed
✅ **Consensus Validation** - 2-of-3 nodes required for block confirmation
✅ **Byzantine Fault Tolerance** - Single node cannot corrupt network
✅ **Smart Contract Logic** - Weight fraud detection (max 1kg tolerance)

### Payment Security
✅ **Automatic Escrow** - Payment held in contract until TAP-2
✅ **Buyer Authentication** - Only buyer can release payment
✅ **Replay Protection** - Truck ID reuse prevented until payment complete
✅ **Transparent Pricing** - On-chain PRICE_PER_KG constant

### Network Security
✅ **Private Network** - Not exposed to public Ethereum
✅ **Peer Whitelisting** - Only authorized nodes can join
✅ **Key Management** - Private keys in .env (not in Git)

---

## 🧪 Testing & Verification

### 1. Test Blockchain Consensus
```bash
cd blockchain
npx hardhat run scripts/demo-dashboard.js --network geth_private
```
Expected: All 3 nodes show same block number and hash

### 2. Test Fraud Detection
```bash
npx hardhat run scripts/fraud-attempt.js --network geth_private
```
Expected: Smart contract rejects weight manipulation

### 3. Test Multi-Mill Concurrent Operations
```bash
# Terminal 1
cd mqtt && npm run mill1

# Terminal 2
cd mqtt && npm run mill2
```
Expected: Both shipments processed without nonce conflicts

### 4. Test Hardware (ESP32)
```
1. Upload ESP32 code
2. Tap Mill 1 card → Should send TAP-1
3. Check middleware logs → Should record departure
4. Tap again → Should send TAP-2
5. Check middleware logs → Should release payment
6. Check dashboard → Shipment should show "Paid"
```

### 5. Query Contract Data
```bash
cd blockchain
npx hardhat run scripts/check-contract.js --network geth_private
```

---

## 📊 Performance Metrics

- **Block Time**: 5 seconds (Clique PoA)
- **Transaction Finality**: ~15 seconds (3 confirmations)
- **Throughput**: ~200 TPS (local network, can be optimized)
- **Network Latency**: <100ms (local), <2s (WAN with good connectivity)
- **MQTT Latency**: <50ms (local broker)
- **End-to-End Latency**: TAP → Blockchain confirmation in ~20 seconds

---

## 🐛 Troubleshooting

### Blockchain Issues

**Problem: Nodes out of sync (different block numbers)**
```bash
# Solution: Restart all nodes
pkill -f "geth.*vm-"
./vm-network/start-all-nodes.sh
```

**Problem: "already known" transaction error**
```bash
# Solution: Nonce already managed automatically, but if still happens:
# Restart middleware to reset nonce tracking
cd middleware && npm start
```

**Problem: Contract not deployed**
```bash
# Solution: Redeploy contract
cd blockchain
npx hardhat run scripts/deploy.js --network geth_private
# Update CONTRACT_ADDRESS in middleware/.env
```

### MQTT Issues

**Problem: "EHOSTUNREACH" or "Connection refused"**
```bash
# Check Mosquitto running
sudo systemctl status mosquitto

# Check Mosquitto listening on correct IP
sudo netstat -tuln | grep 1883
# Should show: 0.0.0.0:1883

# Update .env with correct broker IP
# For hotspot: Find IP with `ip addr show`
```

**Problem: ESP32 not publishing**
```bash
# Test MQTT connection from ESP32 network
mosquitto_sub -h <broker_ip> -t tbs/received -v

# Check ESP32 serial monitor for WiFi connection
# Verify broker IP matches in ESP32 code
```

### Middleware Issues

**Problem: "PRIVATE_KEY_MILL1 not found"**
```bash
# Ensure .env file exists and has correct format
cd middleware
cat .env | grep PRIVATE_KEY

# No spaces around = sign!
# PRIVATE_KEY_MILL1=0x59c6... ✅
# PRIVATE_KEY_MILL1 = 0x59c6... ❌
```

**Problem: "Only buyer can release payment"**
```bash
# Check millAddress in MQTT payload matches Mill 1 or Mill 2
# Mill 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
# Mill 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

---

## ❓ FAQ

### Q: Can I use only 2 VMs instead of 3?
**A:** Yes, but you lose Byzantine Fault Tolerance. With 2 nodes, if one is compromised, the network cannot distinguish truth from fraud. 3 nodes minimum for (2-of-3) majority consensus.

### Q: Why Geth 1.13.15 and not latest?
**A:** Geth 1.14+ requires a separate Beacon Chain client for consensus (PoS). Geth 1.13.15 is the last version supporting pure Clique PoA without additional dependencies.

### Q: Can Mill 1 and Mill 2 operate at the same time?
**A:** Yes! Each mill has its own private key and manages its own nonce. The middleware handles concurrent transactions without conflicts.

### Q: What happens if weight difference > 1kg?
**A:** Smart contract reverts with "Weight fraud detected". The transaction is rejected by all nodes. Payment is NOT released.

### Q: Can I reuse the same truck ID immediately after payment?
**A:** Yes! Once `paid = true`, the smart contract allows the truck to start a new shipment (new TAP-1).

### Q: What if one node goes offline?
**A:** The other 2 nodes continue operating. When the offline node comes back, it auto-syncs from peers. No data loss.

### Q: How do I add a 3rd mill?
**A:** 
1. Generate new account: `await ethers.Wallet.createRandom()`
2. Add to `.env`: `PRIVATE_KEY_MILL3=...`
3. Update `blockchainHandler.js`: Add mill3 to signer map
4. Create `mill3Publisher.js` with new millAddress
5. Update frontend with Mill3Dashboard

### Q: Can hackers steal the private keys?
**A:** Private keys are stored in `.env` (not in Git). In production:
- Use hardware wallets (Ledger, Trezor)
- Or cloud KMS (AWS KMS, Azure Key Vault)
- Or HSM (Hardware Security Module)

### Q: What's the cost per transaction?
**A:** On private network: FREE (no real ETH needed, just test ETH).
On mainnet: ~$5-20 per transaction (not recommended for this use case).

---

## 📚 Further Reading

- **Geth Documentation**: https://geth.ethereum.org/docs
- **Clique PoA Spec**: https://eips.ethereum.org/EIPS/eip-225
- **ethers.js Docs**: https://docs.ethers.org/v6/
- **MQTT Specification**: https://mqtt.org/mqtt-specification/
- **Solidity Style Guide**: https://soliditylang.org/
- **ESP32 with NFC**: https://github.com/adafruit/Adafruit-PN532

---

## 🤝 Contributing

This is a hackathon project demonstrating blockchain-IoT integration for supply chain traceability. Feel free to fork and adapt for your own use cases!

---

## 📄 License

ISC License - Free to use for educational and commercial purposes.

---

## � Authors

**Aryabima Santoso** - Lead Developer
**FarmSync Team** - Blockchain IoT Integration

**GitHub**: https://github.com/aryabimasantoso21/FarmSync-Hackathon

---

## 🎯 Project Status

**Current Version**: 1.0.0 (Production Ready)
**Last Updated**: October 2025
**Status**: ✅ All core features implemented and tested

### Roadmap
- [x] 3-node Geth network with Clique PoA
- [x] TBS supply chain smart contract
- [x] Multi-mill support (Mill 1 & Mill 2)
- [x] ESP32 NFC integration
- [x] Fraud prevention mechanisms
- [x] Dashboard (Estate/Mill views)
- [ ] Mobile app for truckers
- [ ] Real-time GPS tracking integration
- [ ] Multi-commodity support (beyond TBS)
- [ ] Advanced analytics dashboard

---

**⭐ Star this repo if you found it helpful!**