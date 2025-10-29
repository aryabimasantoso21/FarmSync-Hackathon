# 📍 Live Shipment Tracking Feature

## ✨ Features Implemented

### **1. Real-time Tracking Dashboard**
- 📦 Visual progress timeline (4 steps)
- 🚚 Live status updates (Dalam Perjalanan / Tiba / Selesai)
- ⚖️ Weight validation tracking
- 💰 Payment status monitoring

### **2. Interactive UI**
- Grid view of all shipments
- Click to view detailed tracking
- Auto-refresh every 5 seconds
- Color-coded status badges

### **3. Shipment Details Display**
- ✅ Truck ID (TRK-XXXXX)
- ✅ Estate ID (EST-XXXXX)
- ✅ Departure weight
- ✅ Arrival weight
- ✅ Weight difference (with validation)
- ✅ Wallet addresses
- ✅ Timestamps
- ✅ QR code placeholder

---

## 🎨 UI Components

### **Progress Timeline (4 Steps):**

```
1. ✓ Berangkat Estate    → TAP-1 completed
2. ✓ Tiba Pabrik         → TAP-2 completed  
3. ✓ Verifikasi Berat    → Weight validated
4. ✓ Pembayaran          → Payment released
```

### **Status Badges:**

| Status | Visual | Condition |
|--------|--------|-----------|
| **Belum Berangkat** | Gray | `departed = false` |
| **🚚 Dalam Perjalanan** | Yellow (animated) | `departed = true, arrived = false` |
| **Tiba - Menunggu Pembayaran** | Blue | `arrived = true, paid = false` |
| **✅ Selesai** | Green | `paid = true` |

---

## 📊 Usage

### **Access the Dashboard:**
```
http://localhost:3000/admin
```

### **Navigate:**
1. Click **📍 Live Tracking** tab
2. Select a truck from the grid
3. View detailed progress timeline
4. Monitor real-time status

---

## 🔄 Flow Example

### **Scenario: Normal Shipment**

**Initial State (TAP-1):**
```
Status: 🚚 Dalam Perjalanan
Progress: [✓]───[○]───[○]───[○]
          ↑
   Berangkat Estate
```

**After TAP-2:**
```
Status: Tiba - Menunggu Pembayaran
Progress: [✓]───[✓]───[✓]───[○]
                            ↑
                      Verifikasi Berat
```

**After Payment:**
```
Status: ✅ Selesai, Terverifikasi di Blockchain
Progress: [✓]───[✓]───[✓]───[✓]
                            ↑
                        Pembayaran
```

---

## 🎯 Key Features

### **1. Real-time Status:**
- ✅ Truck currently **"Dalam Perjalanan"** if TAP-1 done but no TAP-2
- ✅ Updates automatically every 5 seconds
- ✅ Shows exact timestamps for each step

### **2. Weight Validation:**
```javascript
if (weightDiff <= 1kg) {
  status = "✅ Valid"
  color = green
} else {
  status = "❌ Invalid"  
  color = red
}
```

### **3. Visual Feedback:**
- 🟢 Completed steps (green checkmark)
- 🟡 Active step (bouncing animation)
- ⚪ Pending steps (gray)
- ━━ Connected timeline

### **4. Information Cards:**
Display:
- Nomor Truk (highlighted)
- Nomor Estate
- Berat Berangkat / Tiba
- Wallet Verifikator
- Tanggal Pemesanan
- Batas Harga

---

## 🧪 Testing

### **Test Scenario 1: In Transit**
```bash
# Send TAP-1
mosquitto_pub -h localhost -t tbs/received -m '{
  "truckId":"TRK-00001",
  "eventType":"TAP-1",
  "weight":10000,
  "estateId":"EST-00001",
  "timestamp":"2025-10-29T10:00:00.000Z"
}'
```

**Expected Dashboard:**
- Status: 🚚 **Dalam Perjalanan**
- Progress: Step 1 completed, Step 2 active
- Badge: Yellow animated

---

### **Test Scenario 2: Completed**
```bash
# Send TAP-2
mosquitto_pub -h localhost -t tbs/received -m '{
  "truckId":"TRK-00001",
  "eventType":"TAP-2",
  "weight":9999,
  "estateId":"EST-00001",
  "timestamp":"2025-10-29T10:30:00.000Z"
}'
```

**Expected Dashboard:**
- Status: ✅ **Selesai**
- Progress: All 4 steps completed
- Badge: Green checkmark
- Payment info displayed

---

## 🎨 UI Mockup Reference

Based on "Detail Perizinan" image:
- ✅ Header with QR code
- ✅ Status badge (green/yellow)
- ✅ Timeline with dots and lines
- ✅ Metadata cards in grid
- ✅ Color-coded information
- ✅ Professional styling

---

## 📱 Responsive Design

### **Desktop:**
- Full width timeline
- 2-column metadata grid
- Large truck selection cards

### **Mobile:**
- Vertical timeline
- Single column metadata
- Stacked truck cards

---

## ✅ Complete Checklist

- [x] Visual progress timeline
- [x] Real-time status updates
- [x] Truck metadata display
- [x] Weight validation indicator
- [x] Payment status tracking
- [x] "Dalam Perjalanan" status for TAP-1 only
- [x] Interactive truck selection
- [x] Auto-refresh (5 seconds)
- [x] Color-coded badges
- [x] QR code placeholder
- [x] Responsive layout
- [x] Animated active step

---

## 🚀 Demo Flow

1. **Start all services:**
   ```bash
   # Terminal 1: Blockchain
   cd ~/FarmSync/blockchain && npx hardhat node
   
   # Terminal 2: Middleware
   cd ~/FarmSync/middleware && npm start
   
   # Terminal 3: Backend
   cd ~/FarmSync/backend && node server.js
   
   # Terminal 4: Frontend
   cd ~/FarmSync/frontend && npm start
   ```

2. **Access admin dashboard:**
   ```
   http://localhost:3000/admin
   ```

3. **Send TAP-1 (truck departure):**
   - Status shows: **🚚 Dalam Perjalanan**
   - Timeline shows step 1 completed

4. **Send TAP-2 (truck arrival):**
   - Status updates: **✅ Selesai**
   - Timeline shows all steps completed
   - Payment processed

5. **Click different trucks** to see their individual tracking

---

## 🎉 Result

Professional tracking interface that:
- ✅ Matches the reference design style
- ✅ Shows real-time truck locations/status
- ✅ Displays all metadata clearly
- ✅ Highlights "Dalam Perjalanan" state
- ✅ Auto-updates without manual refresh
- ✅ Works seamlessly with MQTT → Blockchain flow

---

**Ready for demo!** 🚀
