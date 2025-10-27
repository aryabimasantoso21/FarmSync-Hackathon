# FarmSync - Blockchain-MQTT Integration for Decentralized Sensor Ledger

## 🎯 Project Overview

**FarmSync** demonstrates how IoT sensor data (via MQTT) can be stored immutably on a private blockchain network and validated across distributed nodes.

### Key Features
- 📡 **MQTT Integration** - Real-time sensor data streaming
- ⛓️ **Blockchain Storage** - Immutable ledger with cryptographic hashing
- 🔐 **Data Integrity** - Built-in verification mechanisms
- 🌐 **Distributed Network** - Multi-VM private Ethereum network
- 📊 **Proof System** - Ledger comparison and block verification

---

## 🚀 Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for rapid setup instructions.

### Sprint 1 - MQTT to Smart Contract (✅ Complete)

1. **Start Blockchain**: `cd blockchain && npm run node`
2. **Deploy Contract**: `npm run deploy`
3. **Setup .env**: Copy CONTRACT_ADDRESS to middleware/.env
4. **Start Middleware**: `cd middleware && npm start`
5. **Publish Data**: `cd mqtt && npm run publish`

📖 Detailed guide: [SPRINT1_SETUP.md](./SPRINT1_SETUP.md)

---

## 📁 Project Structure

## backend
```

```

## blockchain
**Smart contracts for immutable sensor data storage**
```
blockchain/
│   ├── contracts/
|   |   ├── SensorLedger.sol      # Main contract for sensor data
|   |   └── Lock.sol               # Hardhat example
|   ├── ignition/
|   |   └── modules/
|   |       └── Lock.js
│   ├── scripts/
|   |   ├── deploy.js              # Deploy SensorLedger
|   |   └── queryRecords.js        # Query blockchain data
│   ├── test/
|   |   └── Lock.js
|   ├── .env
|   ├── .gitignore
|   ├── hardhat.config.js
│   └── package.json
```

**Commands:**
- `npm run node` - Start local Hardhat node
- `npm run deploy` - Deploy SensorLedger contract
- `npm run compile` - Compile contracts

## frontend
```

```

## middleware
**Bridge between MQTT and Blockchain**
```
middleware/
│   ├── handler/
│   |   ├── mqttHandler.js         # MQTT subscription & message handling
│   |   └── blockchainHandler.js   # Web3 integration with ethers.js
│   ├── .env
|   ├── .gitignore
│   ├── index.js                   # Main entry point
│   └── package.json
```

**Commands:**
- `npm start` - Run middleware
- `npm run dev` - Run with nodemon (auto-reload)
## mqtt
**IoT sensor data simulator**
```
mqtt/
│   ├── publisher/
│   |   └── sensorPublisher.js     # Simulates TBS sensor data
│   ├── .env
|   ├── .gitignore
│   └── package.json
```

**Commands:**
- `npm run publish` - Start sensor data publisher (publishes every 5s)

## proof
**Data integrity verification modules (Sprint 3)**
```
proof/
│   ├── compareLedger.js           # Compare ledgers across nodes
│   ├── inspectBlock.js            # Block hash verification
│   └── proofOfIntegrity.md        # Documentation
```

## vm-network
**Private Ethereum (GETH) network configuration (Sprint 2)**
```
vm-network/
│   ├── vm-A/
│   |   └── gethData/
|   |       └── static-nodes.json   # Peer discovery for VM-A
│   ├── vm-B/
│   |   └── gethData/
|   |       └── static-nodes.json   # Peer discovery for VM-B
|   ├── docker-compose.yml          # Multi-VM orchestration
│   └── genesis.json                # Network genesis configuration
```

---

## 🏗️ Sprint Progress

### ✅ Sprint 1: MQTT & Middleware Core (Complete)
- [x] Mosquitto broker setup
- [x] Middleware subscription
- [x] Smart-contract bridge (ethers.js)
- [x] SensorLedger contract with hash verification
- [x] End-to-end data flow

### 🔜 Sprint 2: Blockchain Deployment
- [ ] Private Ethereum (GETH) network with 2 VMs
- [ ] Bootnode configuration
- [ ] Ledger synchronization

### 🔜 Sprint 3: Data Integrity & Proof
- [ ] Ledger comparison module
- [ ] Block hash verification
- [ ] Immutability proof

### 🔜 Sprint 4: UI & Visualization
- [ ] Real-time hash display
- [ ] Block comparison status
- [ ] MQTT → Ledger flow visualizer

### 🔜 Sprint 5: Demo & Documentation
- [ ] Local PoC demo
- [ ] System diagram
- [ ] Technical report + README

---

## 🔧 System Architecture

```
┌───────────┐     MQTT      ┌─────────────┐    ethers.js    ┌─────────────┐
│  Sensor   │ ────────────> │ Middleware  │ ──────────────> │ Blockchain  │
│ Publisher │  mqtt://1883  │ Node.js     │  JSON-RPC       │  (GETH)     │
└───────────┘               └─────────────┘                 └─────────────┘
                                  │                                  │
                                  │                                  │
                           ┌──────▼──────────┐                ┌──────▼──────┐
                           │mqttHandler      │                │SensorLedger │
                           │blockchainHandler│                │ Contract    │
                           └─────────────────┘                └─────────────┘
                                                                  │
                                                           ┌───────▼────────┐
                                                           │  Proof Module  │
                                                           │ compareLedger  │
                                                           │ inspectBlock   │
                                                           └────────────────┘
```

---

## 🛠️ Technology Stack

- **Blockchain**: Ethereum (Hardhat + GETH)
- **Smart Contracts**: Solidity ^0.8.28
- **Web3**: ethers.js v6
- **IoT Protocol**: MQTT (Mosquitto)
- **Backend**: Node.js
- **Network**: Private Ethereum with Docker

---

## 📚 Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide
- [SPRINT1_SETUP.md](./SPRINT1_SETUP.md) - Detailed Sprint 1 implementation
- [proofOfIntegrity.md](./proof/proofOfIntegrity.md) - Data integrity documentation

---

## 🧪 Testing the System

### Manual MQTT Test
```bash
mosquitto_pub -h localhost -t tbs/received -m '{"sensorId":"TEST_001","weight":1200,"quality":90,"timestamp":"2025-10-27T10:00:00Z"}'
```

### Query Blockchain Records
```bash
cd blockchain
CONTRACT_ADDRESS=0x... npx hardhat run scripts/queryRecords.js --network localhost
```

---

## 🤝 Contributing

This is a hackathon project demonstrating blockchain-IoT integration concepts.

---

## 📄 License

ISC

---

## 👨‍💻 Author

**Aryabima Santoso** - FarmSync Hackathon 2025