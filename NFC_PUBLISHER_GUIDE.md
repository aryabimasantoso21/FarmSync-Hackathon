# 🎯 NFC-Based TBS Shipment Tracker

## 📋 Overview

Sistem **auto-generate TruckID** dengan NFC tap simulation untuk tracking pengiriman TBS dari Estate ke Mill.

## 🚀 Features

### 1. **Automatic Truck ID Management**
- ✅ Pool of 10 trucks (TRK-00001 to TRK-00010)
- ✅ Auto-assign truck on TAP-1 (departure)
- ✅ Auto-release truck after TAP-2 (arrival)
- ✅ Reusable truck IDs

### 2. **TAP-1: Departure Event**
```
📍 Truck leaves Estate
├─ System auto-assigns available truck
├─ User inputs: Estate ID, Weight
├─ Truck marked as "IN_TRANSIT"
└─ Removed from available pool
```

### 3. **TAP-2: Arrival Event**
```
📍 Truck arrives at Mill
├─ User selects from trucks in transit
├─ User inputs: Arrival Weight
├─ System validates weight difference (1kg tolerance)
├─ Blockchain records arrival + payment
└─ Truck released back to pool
```

## 🎮 How to Use

### Start NFC Publisher:
```bash
cd mqtt
npm run nfc
```

### Workflow Example:

#### **Step 1: TAP-1 (Departure)**
```
Enter Event Type (TAP-1 or TAP-2): TAP-1
✅ Truck assigned: TRK-00001
🏭 Enter Estate ID: EST-00001
⚖️  Enter Weight (kg): 1000
✅ Truck marked as IN TRANSIT
```

#### **Step 2: TAP-2 (Arrival)**
```
Enter Event Type (TAP-1 or TAP-2): TAP-2
🚚 Trucks in transit:
   1. TRK-00001 - EST-00001 (1000kg, 5min ago)
Select truck (1-1): 1
✅ Selected: TRK-00001
⚖️  Enter Arrival Weight (kg): 999
📊 WEIGHT VALIDATION:
   Departure: 1000 kg
   Arrival: 999 kg
   Difference: 1 kg
✅ Weight difference within tolerance
♻️  Truck TRK-00001 released back to pool
```

## 📊 Truck Pool Status

### Available Trucks
- Initially: 10 trucks
- After TAP-1: Decreases by 1
- After TAP-2: Increases by 1

### Active Trucks
- Shows: TruckID, Estate, Weight, Time in transit
- Real-time tracking

## ⚠️ Validation Rules

### TAP-1 Requirements:
- ✅ At least 1 truck available
- ✅ Valid Estate ID
- ✅ Weight > 0

### TAP-2 Requirements:
- ✅ At least 1 truck in transit
- ✅ Valid truck selection
- ✅ Weight > 0
- ⚠️  Weight difference ≤ 1kg (recommended)

## 🔄 Comparison: Manual vs NFC

| Feature | Manual Publisher | NFC Publisher |
|---------|-----------------|---------------|
| **Truck ID Input** | Manual entry | Auto-assigned |
| **Truck Tracking** | None | Active tracking |
| **Reusability** | Manual management | Automatic |
| **Error Prevention** | User responsibility | System validation |
| **Workflow** | Simple | Realistic IoT |

## 📝 MQTT Message Format

### TAP-1 (Departure):
```json
{
  "truckId": "TRK-00001",
  "eventType": "TAP-1",
  "weight": 1000,
  "estateId": "EST-00001",
  "timestamp": "2025-10-28T10:00:00.000Z"
}
```

### TAP-2 (Arrival):
```json
{
  "truckId": "TRK-00001",
  "eventType": "TAP-2",
  "weight": 999,
  "estateId": "EST-00001",
  "timestamp": "2025-10-28T10:15:00.000Z"
}
```

## 🎯 Use Cases

### Normal Flow:
1. TAP-1: TRK-00001 departs with 1000kg
2. TAP-2: TRK-00001 arrives with 999kg
3. Payment: ✅ Released (Rp 99,900,000)
4. TRK-00001: ✅ Available for next shipment

### Fraud Detection:
1. TAP-1: TRK-00002 departs with 1000kg
2. TAP-2: TRK-00002 arrives with 900kg (diff: 100kg)
3. Payment: ❌ Blocked (weight fraud detected)
4. TRK-00002: ✅ Still released (for investigation)

### All Trucks Busy:
1. All 10 trucks in transit
2. TAP-1 attempt: ❌ No available trucks
3. Wait for TAP-2 to complete
4. Retry TAP-1

## 🔧 Configuration

Edit `nfcPublisher.js` to change:
```javascript
// Line 17: Change truck pool size
initializeTruckPool(20); // Default: 10

// Line 13: Change MQTT topic
const TOPIC = 'tbs/received';

// Line 12: Change broker URL
const MQTT_BROKER = 'mqtt://localhost:1883';
```

## 🚀 Integration with Dashboard

Dashboard akan otomatis mendeteksi:
- ✅ Truck ID yang sama dari TAP-1 → TAP-2
- ✅ Weight validation
- ✅ Automatic payment
- ✅ Real-time updates

## 📱 Future: Real NFC Implementation

```javascript
// Pseudo-code for real NFC
nfcReader.on('tag', (tag) => {
  const truckId = getAvailableTruck();
  const weight = weightSensor.read();
  
  publishToMQTT({
    truckId: truckId,
    eventType: 'TAP-1',
    weight: weight,
    estateId: tag.estateId
  });
});
```

## ✅ Advantages

1. **Realistic IoT Simulation**
   - Mimics real NFC tap behavior
   - Automatic ID assignment

2. **Resource Management**
   - Truck pool prevents ID conflicts
   - Automatic cleanup after completion

3. **Error Prevention**
   - Can't TAP-2 without TAP-1
   - Can't reuse truck during transit

4. **User-Friendly**
   - Less manual input
   - Clear visual feedback
   - Real-time status

---

**Commands:**
```bash
# Start NFC Publisher
npm run nfc

# Start Manual Publisher (old way)
npm run manual

# Start Auto Publisher (simulator)
npm run publish
```
