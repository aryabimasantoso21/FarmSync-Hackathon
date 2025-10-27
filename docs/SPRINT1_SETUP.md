# Sprint 1 Setup Guide - MQTT to Smart Contract Integration

## 🎯 Overview
This guide will help you set up and run the complete MQTT-to-Blockchain integration.

## 📋 Prerequisites
- Node.js (v16+)
- Mosquitto MQTT Broker
- Hardhat (for local blockchain)

## 🔧 Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install blockchain dependencies
cd blockchain
npm install

# Install middleware dependencies
cd ../middleware
npm install

# Install MQTT publisher dependencies
cd ../mqtt
npm install
```

### 2. Start Local Blockchain (Hardhat)

```bash
cd blockchain
npx hardhat node
```

Keep this terminal running. It will show you:
- 20 test accounts with private keys
- RPC server at `http://127.0.0.1:8545`

### 3. Deploy Smart Contract

Open a new terminal:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Save the deployed contract address shown in the output.

### 4. Setup Environment Variables

```bash
# In the middleware directory
cd middleware
cp .env.example .env
```

Edit `.env` and add your deployed CONTRACT_ADDRESS:
```
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3  # Your address here
```

```bash
# In the mqtt directory
cd ../mqtt
cp .env.example .env
```

### 5. Start Mosquitto MQTT Broker

```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl start mosquitto

# macOS
brew install mosquitto
brew services start mosquitto

# Or run in foreground
mosquitto -v
```

### 6. Start the Middleware

Open a new terminal:

```bash
cd middleware
node index.js
```

You should see:
```
🚀 Starting FarmSync Middleware...
⛓️  Connecting to blockchain: http://localhost:8545
✅ Connected to network: 31337
📝 Contract address: 0x5FbDB...
📊 Current total records: 0
📡 Connecting to MQTT Broker: mqtt://localhost:1883
✅ Connected to MQTT Broker
📥 Subscribed to topic: tbs/received
✅ FarmSync Middleware is running!
📡 Listening for sensor data...
```

### 7. Start the Sensor Publisher

Open another terminal:

```bash
cd mqtt/publisher
node sensorPublisher.js
```

You should see sensor data being published every 5 seconds.

## 🎉 Expected Flow

```
┌─────────┐      ┌──────────┐      ┌────────────┐      ┌────────────┐
│ Sensor  │─────▶│   MQTT   │─────▶│ Middleware │─────▶│ Blockchain │
│Publisher│      │  Broker  │      │  Handler   │      │  (Hardhat) │
└─────────┘      └──────────┘      └────────────┘      └────────────┘
```

### Terminal 1 (Hardhat):
```
eth_sendTransaction
eth_getTransactionReceipt
...
```

### Terminal 2 (Middleware):
```
📨 Message received from topic: tbs/received
📊 Data: { sensorId: 'SENSOR_TBS_001', weight: 850, quality: 75 }
⛓️  Forwarding to blockchain...
💾 Storing data on blockchain...
⏳ Transaction sent: 0x1234...
✅ Transaction confirmed!
📝 Record ID: 1
🔐 Data integrity verified: true
```

### Terminal 3 (Publisher):
```
📤 Published to tbs/received
   Sensor ID: SENSOR_TBS_001
   Weight: 850 kg
   Quality: 75
   Timestamp: 2025-10-27T...
```

## 🧪 Testing

Test the integration manually:

```bash
# Publish test message using mosquitto_pub
mosquitto_pub -h localhost -t tbs/received -m '{"sensorId":"TEST_001","weight":1200,"quality":90,"timestamp":"2025-10-27T10:00:00Z"}'
```

## 🔍 Verify Data on Blockchain

Create a test script `blockchain/scripts/queryRecords.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const SensorLedger = await hre.ethers.getContractAt("SensorLedger", contractAddress);
  
  const totalRecords = await SensorLedger.getTotalRecords();
  console.log("Total Records:", totalRecords.toString());
  
  for (let i = 1; i <= totalRecords; i++) {
    const record = await SensorLedger.getRecord(i);
    console.log(`\nRecord ${i}:`);
    console.log("  Sensor ID:", record[0]);
    console.log("  Weight:", record[1].toString());
    console.log("  Quality:", record[2].toString());
    console.log("  Timestamp:", new Date(Number(record[3]) * 1000).toISOString());
    console.log("  Hash:", record[4]);
  }
}

main().catch(console.error);
```

Run it:
```bash
CONTRACT_ADDRESS=0x5FbDB... npx hardhat run scripts/queryRecords.js --network localhost
```

## 🛑 Stopping Services

1. Stop sensor publisher: `Ctrl+C` in publisher terminal
2. Stop middleware: `Ctrl+C` in middleware terminal
3. Stop Mosquitto: `sudo systemctl stop mosquitto` or `Ctrl+C`
4. Stop Hardhat: `Ctrl+C` in hardhat terminal

## ✅ Sprint 1 Complete!

You have successfully integrated:
- ✅ MQTT broker setup
- ✅ Sensor data publisher
- ✅ Middleware subscription & forwarding
- ✅ Smart contract deployment
- ✅ Blockchain data storage with hash verification

## 🚀 Next Steps (Sprint 2)
- Deploy to private Ethereum network (GETH)
- Setup VM-A and VM-B nodes
- Configure bootnode for peer discovery
- Implement ledger synchronization
