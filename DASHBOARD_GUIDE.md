# FarmSync Dashboard - Quick Start Guide

## 🚀 Setup & Run

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Start All Services

**Terminal 1: Hardhat Node**
```bash
cd blockchain
npm run node
```

**Terminal 2: Deploy Contract**
```bash
cd blockchain
npm run deploy
# Copy contract address to backend/.env
```

**Terminal 3: MQTT Broker** (if not running)
```bash
mosquitto
```

**Terminal 4: Middleware**
```bash
cd middleware
npm start
```

**Terminal 5: Backend API**
```bash
cd backend
npm start
```

**Terminal 6: Frontend**
```bash
cd frontend
npm start
```

## 📱 Access Dashboards

- **Login Page:** http://localhost:3000
- **Mill Dashboard:** http://localhost:3000/mill
- **Estate Dashboard:** http://localhost:3000/estate
- **Admin Dashboard:** http://localhost:3000/admin

## 💰 Price Configuration

Current setting: **Rp 100,000 per kg**

To change, edit:
1. `backend/.env` → `PRICE_PER_KG_IDR=100000`
2. `middleware/.env` → `PRICE_PER_KG=1000000000000000` (in wei)

## 🧪 Test Flow

1. Open Manual Publisher: `cd mqtt && npm run manual`
2. Send TAP-1: TRK-00001, 1000kg, EST-00001
3. Send TAP-2: TRK-00001, 999kg, EST-00001
4. Check dashboards - payment should appear!

## 📊 Dashboard Features

### Mill Dashboard (`/mill`)
- Current ETH balance
- Total spent in ETH & IDR
- Outgoing payment transactions

### Estate Dashboard (`/estate`)
- Current ETH balance
- Total received in ETH & IDR
- Incoming payment transactions

### Admin Dashboard (`/admin`)
- System statistics
- All shipments overview
- Completed transactions
- System configuration
- Real-time monitoring

## 🔄 Auto-refresh

All dashboards refresh every 5 seconds automatically.
