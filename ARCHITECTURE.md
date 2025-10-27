# FarmSync System Architecture - Sprint 1

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FarmSync Architecture                             │
│                     Sprint 1 - MQTT to Blockchain                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   IoT Sensor     │  Simulates TBS (weight/quality) sensors
│   Simulator      │  Generates data every 5 seconds
└────────┬─────────┘
         │
         │ Publishes JSON
         │ Topic: tbs/received
         │
         ▼
┌──────────────────┐
│  MQTT Broker     │  Mosquitto (localhost:1883)
│  (Mosquitto)     │  Message broker for pub/sub
└────────┬─────────┘
         │
         │ Subscribes
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Middleware (Node.js)                        │
│                                                                  │
│  ┌─────────────────┐              ┌──────────────────┐         │
│  │  mqttHandler.js │              │blockchainHandler │         │
│  ├─────────────────┤              │      .js         │         │
│  │ • Connect MQTT  │─────────────▶│ • Connect Web3   │         │
│  │ • Subscribe     │   Forward    │ • Sign TX        │         │
│  │ • Parse JSON    │   Data       │ • Send TX        │         │
│  │ • Log events    │              │ • Wait confirm   │         │
│  └─────────────────┘              └──────────┬───────┘         │
│                                               │                  │
│  Orchestrated by: index.js                   │                  │
└───────────────────────────────────────────────┼──────────────────┘
                                                │
                                                │ JSON-RPC
                                                │ (ethers.js)
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────┐
│              Ethereum Network (Hardhat Local)                    │
│              http://localhost:8545                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          SensorLedger Smart Contract                   │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                         │    │
│  │  📝 recordData(sensorId, weight, quality)             │    │
│  │     ├─ Generate timestamp (block.timestamp)           │    │
│  │     ├─ Compute hash: keccak256(data)                  │    │
│  │     ├─ Store in mapping: records[recordId]            │    │
│  │     └─ Emit event: DataRecorded                       │    │
│  │                                                         │    │
│  │  🔍 getRecord(recordId)                               │    │
│  │     └─ Returns: (sensorId, weight, quality,           │    │
│  │                  timestamp, dataHash)                  │    │
│  │                                                         │    │
│  │  ✅ verifyDataIntegrity(recordId)                     │    │
│  │     ├─ Recompute hash from stored data                │    │
│  │     └─ Compare with stored hash                       │    │
│  │                                                         │    │
│  │  📊 getTotalRecords()                                 │    │
│  │     └─ Returns: uint256 count                         │    │
│  │                                                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Storage: Immutable blockchain ledger                           │
│  Consensus: Proof of Authority (PoA)                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow (Step by Step)

```
Step 1: Sensor Publishes
┌─────────────────────────────────────────┐
│ {                                       │
│   "sensorId": "SENSOR_TBS_001",        │
│   "weight": 850,                       │
│   "quality": 75,                       │
│   "timestamp": "2025-10-27T10:00:00Z" │
│ }                                       │
└─────────────────────────────────────────┘
        │
        ▼
Step 2: MQTT Broker Routes Message
        │
        ▼
Step 3: Middleware Receives & Processes
┌─────────────────────────────────────────┐
│ mqttHandler.handleMessage()             │
│   ├─ Parse JSON                         │
│   └─ Call blockchainHandler.storeData() │
└─────────────────────────────────────────┘
        │
        ▼
Step 4: Blockchain Transaction Created
┌─────────────────────────────────────────┐
│ contract.recordData(                    │
│   "SENSOR_TBS_001",                     │
│   850,                                  │
│   75                                    │
│ )                                       │
└─────────────────────────────────────────┘
        │
        ▼
Step 5: Smart Contract Executes
┌─────────────────────────────────────────┐
│ 1. timestamp = block.timestamp          │
│ 2. hash = keccak256(sensorId, weight,  │
│            quality, timestamp)          │
│ 3. recordCount++                        │
│ 4. records[recordCount] = SensorData {} │
│ 5. emit DataRecorded(...)               │
│ 6. return recordCount                   │
└─────────────────────────────────────────┘
        │
        ▼
Step 6: Transaction Confirmed ✅
┌─────────────────────────────────────────┐
│ Receipt:                                │
│   - Record ID: 1                        │
│   - Block Number: 123                   │
│   - Gas Used: 125000                    │
│   - Status: Success                     │
└─────────────────────────────────────────┘
        │
        ▼
Step 7: Data Stored Permanently on Blockchain
```

---

## 🎯 Component Interactions

```
┌──────────┐    MQTT     ┌────────────┐   ethers.js   ┌──────────┐
│  Sensor  │ ─────────▶ │ Middleware │ ────────────▶ │Blockchain│
└──────────┘  Publish    └────────────┘   JSON-RPC     └──────────┘
                              │
                              │ Logging
                              ▼
                         ┌─────────┐
                         │ Console │
                         │  Logs   │
                         └─────────┘

Protocols Used:
- MQTT v3.1.1 (mqtt.js)
- JSON-RPC 2.0 (ethers.js)
- WebSocket (optional for events)
```

---

## 📦 Module Dependencies

```
mqtt/publisher/sensorPublisher.js
  ├─ mqtt (v5.14.1)
  └─ dotenv (v17.2.3)

middleware/index.js
  ├─ handler/mqttHandler.js
  │   └─ mqtt (v5.14.1)
  ├─ handler/blockchainHandler.js
  │   └─ ethers (v6.15.0)
  └─ dotenv (v17.2.3)

blockchain/contracts/SensorLedger.sol
  └─ Solidity ^0.8.28
```

---

## 🔐 Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MQTT Layer:                                                │
│  ┌─────────────────────────────────────────────┐          │
│  │ • No authentication (local only)             │          │
│  │ • Plain text (localhost)                     │          │
│  │ • Recommended: Add TLS for production        │          │
│  └─────────────────────────────────────────────┘          │
│                                                              │
│  Middleware:                                                │
│  ┌─────────────────────────────────────────────┐          │
│  │ • Private key stored in .env (NOT in git)   │          │
│  │ • Environment variable isolation             │          │
│  │ • Input validation & sanitization           │          │
│  └─────────────────────────────────────────────┘          │
│                                                              │
│  Blockchain:                                                │
│  ┌─────────────────────────────────────────────┐          │
│  │ • Immutable storage (tamper-proof)          │          │
│  │ • Cryptographic hashing (keccak256)         │          │
│  │ • Transaction signing (ECDSA)               │          │
│  │ • Access control (msg.sender)               │          │
│  └─────────────────────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Model

```
SensorData Struct:
┌──────────────────────────────────────┐
│ Field       │ Type      │ Example    │
├──────────────────────────────────────┤
│ sensorId    │ string    │ "SENSOR_001"│
│ weight      │ uint256   │ 850        │
│ quality     │ uint256   │ 75         │
│ timestamp   │ uint256   │ 1698400000 │
│ dataHash    │ bytes32   │ 0x1234...  │
└──────────────────────────────────────┘

Storage Pattern:
mapping(uint256 => SensorData) public records;
          ↑                        ↑
       recordId              sensor data
```

---

## 🚀 Deployment Architecture

```
Development (Sprint 1):
┌─────────────────────────────────────┐
│         Single Machine              │
│  ┌──────────────────────────────┐  │
│  │  Hardhat Node (localhost)    │  │
│  │  Port: 8545                  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Mosquitto (localhost)       │  │
│  │  Port: 1883                  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Middleware (Node.js)        │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Sensor Publisher            │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘

Production (Sprint 2 - Planned):
┌──────────────┐    ┌──────────────┐
│   VM-A       │◀──▶│    VM-B      │
│  GETH Node   │    │  GETH Node   │
│  Bootnode    │    │  Peer Node   │
└──────────────┘    └──────────────┘
       ▲                   ▲
       └───────┬───────────┘
           Synchronized
            Ledgers
```

---

## 🎯 Sprint 1 Complete!

This architecture demonstrates:
✅ IoT sensor data collection
✅ MQTT message brokering
✅ Middleware data transformation
✅ Blockchain immutable storage
✅ Cryptographic integrity verification

Ready for Sprint 2: Multi-VM GETH Network! 🚀
