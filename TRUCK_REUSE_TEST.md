# 🔄 Truck ID Reuse Test Guide

## ✅ Feature: Automatic Truck ID Reuse

After TAP-2 and payment completion, the same Truck ID can be used for a new shipment.

---

## 🧪 Test Scenario

### **Test 1: Single Truck - Complete Cycle**

#### **Cycle 1: First Shipment**

**TAP-1 (Departure):**
```json
{
  "truckId": "TRK-00001",
  "eventType": "TAP-1",
  "weight": 10000,
  "estateId": "EST-00001",
  "timestamp": "2025-10-29T10:00:00.000Z"
}
```

**Expected Middleware Log:**
```
🚚 Recording truck departure (TAP-1)...
   Truck ID: TRK-00001
   Weight: 10000 kg
   Estate ID: EST-00001
🆕 First time use for this truck ID
   Estate (Seller): 0xf39F...
   Mill (Buyer): 0x7099...
✅ Departure recorded!
```

---

**TAP-2 (Arrival):**
```json
{
  "truckId": "TRK-00001",
  "eventType": "TAP-2",
  "weight": 9999,
  "estateId": "EST-00001",
  "timestamp": "2025-10-29T10:30:00.000Z"
}
```

**Expected Middleware Log:**
```
🏭 Recording truck arrival (TAP-2)...
✅ Arrival recorded!
⚖️  Weight validation:
   Weight valid: true
💰 Initiating automatic payment...
✅ Payment successful!

🎉 Shipment completed!
   Truck ID: TRK-00001 is now available for reuse ♻️
```

---

#### **Cycle 2: Reuse Same Truck**

**TAP-1 (Departure - Same Truck):**
```json
{
  "truckId": "TRK-00001",
  "eventType": "TAP-1",
  "weight": 8500,
  "estateId": "EST-00001",
  "timestamp": "2025-10-29T14:00:00.000Z"
}
```

**Expected Middleware Log:**
```
🚚 Recording truck departure (TAP-1)...
   Truck ID: TRK-00001
   Weight: 8500 kg
   Estate ID: EST-00001
♻️  Truck reuse detected:
   Previous shipment completed and paid
   Truck ID is now available for new shipment ✅
   Estate (Seller): 0xf39F...
   Mill (Buyer): 0x7099...
✅ Departure recorded!
```

✅ **SUCCESS! Truck ID reused!**

---

**TAP-2 (Arrival - Complete 2nd Cycle):**
```json
{
  "truckId": "TRK-00001",
  "eventType": "TAP-2",
  "weight": 8499,
  "estateId": "EST-00001",
  "timestamp": "2025-10-29T14:30:00.000Z"
}
```

✅ **Payment executed again!**

---

### **Test 2: Multiple Trucks Simultaneously**

```
Timeline:
10:00 - TRK-00001 TAP-1 (10000kg)
10:05 - TRK-00002 TAP-1 (9000kg)
10:15 - TRK-00001 TAP-2 (9999kg) → ✅ Completed
10:20 - TRK-00002 TAP-2 (8998kg) → ✅ Completed
10:30 - TRK-00001 TAP-1 (8000kg) → ♻️ REUSED!
10:35 - TRK-00002 TAP-1 (7500kg) → ♻️ REUSED!
```

---

### **Test 3: Failed Reuse (Incomplete Shipment)**

**Scenario: Try to reuse truck before completing previous shipment**

```
1. TRK-00003 TAP-1 (10000kg)  → ✅ Departed
2. TRK-00003 TAP-1 (9000kg)   → ❌ REJECTED!
```

**Expected Error:**
```
❌ Error recording departure: Truck already departed - previous shipment not completed
```

**Fix:** Complete TAP-2 first, then TAP-1 again.

---

## 📊 Smart Contract Logic

### **In `SensorLedger.sol` (Line 170-172):**

```solidity
// Allow reuse if previous shipment is completed (paid)
if (shipments[_truckId].departed) {
    require(shipments[_truckId].paid, "Truck already departed - previous shipment not completed");
}
```

### **States:**

| Truck Status | `departed` | `arrived` | `paid` | Can Reuse? |
|--------------|------------|-----------|--------|------------|
| **Never used** | `false` | `false` | `false` | ✅ Yes |
| **In transit** | `true` | `false` | `false` | ❌ No |
| **Arrived** | `true` | `true` | `false` | ❌ No |
| **Completed** | `true` | `true` | `true` | ✅ **Yes** |

---

## 🚀 Testing Commands

### **Terminal 1: Hardhat Node**
```bash
cd ~/FarmSync/blockchain
npx hardhat node
```

### **Terminal 2: Middleware**
```bash
cd ~/FarmSync/middleware
npm start
```

### **Terminal 3: MQTT Publisher (Simulate ESP32)**

**First Cycle:**
```bash
cd ~/FarmSync/mqtt

# TAP-1
mosquitto_pub -h localhost -t tbs/received -m '{"truckId":"TRK-00001","eventType":"TAP-1","weight":10000,"estateId":"EST-00001","timestamp":"2025-10-29T10:00:00.000Z"}'

# Wait 5 seconds...

# TAP-2
mosquitto_pub -h localhost -t tbs/received -m '{"truckId":"TRK-00001","eventType":"TAP-2","weight":9999,"estateId":"EST-00001","timestamp":"2025-10-29T10:05:00.000Z"}'
```

**Second Cycle (Reuse):**
```bash
# TAP-1 (Same Truck!)
mosquitto_pub -h localhost -t tbs/received -m '{"truckId":"TRK-00001","eventType":"TAP-1","weight":8500,"estateId":"EST-00001","timestamp":"2025-10-29T14:00:00.000Z"}'

# Wait 5 seconds...

# TAP-2
mosquitto_pub -h localhost -t tbs/received -m '{"truckId":"TRK-00001","eventType":"TAP-2","weight":8499,"estateId":"EST-00001","timestamp":"2025-10-29T14:05:00.000Z"}'
```

---

## ✅ Expected Results

### **Middleware Log (Complete Flow):**

```
📨 Message received from topic: tbs/received
🚚 Recording truck departure (TAP-1)...
   Truck ID: TRK-00001
🆕 First time use for this truck ID
✅ Departure recorded!
---

📨 Message received from topic: tbs/received
🏭 Recording truck arrival (TAP-2)...
✅ Arrival recorded!
💰 Initiating automatic payment...
✅ Payment successful!
🎉 Shipment completed!
   Truck ID: TRK-00001 is now available for reuse ♻️
---

📨 Message received from topic: tbs/received
🚚 Recording truck departure (TAP-1)...
   Truck ID: TRK-00001
♻️  Truck reuse detected:
   Previous shipment completed and paid
   Truck ID is now available for new shipment ✅
✅ Departure recorded!
---

📨 Message received from topic: tbs/received
🏭 Recording truck arrival (TAP-2)...
✅ Arrival recorded!
💰 Initiating automatic payment...
✅ Payment successful!
🎉 Shipment completed!
   Truck ID: TRK-00001 is now available for reuse ♻️
---
```

---

## 🎯 Summary

✅ **Truck ID reuse is AUTOMATIC**
- No manual reset needed
- Works immediately after TAP-2 + payment
- Protected against double-departure

✅ **Smart contract enforces:**
- Can't use truck if previous shipment incomplete
- Can reuse after `paid = true`

✅ **Middleware provides:**
- Clear logging of reuse events
- Status visibility

✅ **NFC Publisher (ESP32) logic:**
- Same alternating TAP-1/TAP-2 logic
- Works seamlessly with reuse

---

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────┐
│ Shipment Lifecycle with Reuse              │
└─────────────────────────────────────────────┘

TRK-00001 Status:
┌─────────────┐
│ Available   │ (paid = false OR paid = true from previous)
└──────┬──────┘
       │ TAP-1
       ▼
┌─────────────┐
│ Departed    │ (departed = true, arrived = false)
└──────┬──────┘
       │ TAP-2
       ▼
┌─────────────┐
│ Arrived     │ (departed = true, arrived = true, paid = false)
└──────┬──────┘
       │ Payment
       ▼
┌─────────────┐
│ Completed   │ (departed = true, arrived = true, paid = true)
└──────┬──────┘
       │
       │ ♻️ REUSABLE! New shipment creates new record
       │
       └──────┐
              ▼
       ┌─────────────┐
       │ Available   │ (Ready for next TAP-1)
       └─────────────┘
```

---

🎉 **Truck reuse feature is READY!** Test it now!
