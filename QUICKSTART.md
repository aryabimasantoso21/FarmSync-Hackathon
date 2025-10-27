# FarmSync - Quick Start Guide

## 🚀 Sprint 1: MQTT to Smart Contract Integration

### Quick Commands

#### 1. Start Blockchain (Terminal 1)
```bash
cd blockchain
npx hardhat compile
npx hardhat node
```

#### 2. Deploy Contract (Terminal 2)
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
# Copy the CONTRACT_ADDRESS and add to .env files
```

#### 3. Setup Environment
```bash
# Update ABI
cd blockchain
node scripts/updateABI.js

# Middleware
cd middleware
cp .env.example .env
# Edit .env and add CONTRACT_ADDRESS

# MQTT Publisher
cd .mqtt
cp .env.example .env
```

#### 4. Start Middleware (Terminal 3)
```bash
cd middleware
npm start
```

#### 5. Start Sensor Publisher (Terminal 4)
```bash
cd mqtt
npm run manual
```

#### 6. Query Records
```bash
cd blockchain
CONTRACT_ADDRESS=0x... npx hardhat run scripts/queryRecords.js --network localhost
```

### System Components

```
┌─────────────┐
│   Sensor    │ ──── Publishes data every 5s
└──────┬──────┘
       │ MQTT (mqtt://localhost:1883)
       ▼
┌─────────────┐
│ MQTT Broker │ ──── Mosquitto
└──────┬──────┘
       │ Subscribe to: tbs/received
       ▼
┌─────────────────────┐
│ Middleware          │ ──── Node.js + ethers.js
│ - mqttHandler       |
│ - blockchainHandler |
└──────┬──────────────┘
       │ Web3 RPC
       ▼
┌──────────────┐
│ Blockchain   │ ──── Hardhat (Local)
│ SensorLedger │ ──── Smart Contract
└──────────────┘
```

### Troubleshooting

**MQTT Broker not running:**
```bash
sudo systemctl start mosquitto
# or
mosquitto -v
```

**Contract deployment failed:**
- Make sure Hardhat node is running
- Check if port 8545 is available

**Middleware connection error:**
- Verify CONTRACT_ADDRESS in .env
- Check if blockchain node is running
- Verify MQTT broker is running

### Data Flow Example

1. **Sensor publishes:**
   ```json
   {
     "sensorId": "SENSOR_TBS_001",
     "weight": 850,
     "quality": 75,
     "timestamp": "2025-10-27T10:00:00Z"
   }
   ```

2. **Middleware receives & stores on blockchain:**
   - Creates transaction
   - Generates data hash (keccak256)
   - Waits for confirmation

3. **Blockchain confirms:**
   - Record ID assigned
   - Event emitted
   - Data immutable & verifiable

### Next: Sprint 2
- Private Ethereum (GETH) network
- VM-A and VM-B setup
- Bootnode configuration
- Ledger synchronization
