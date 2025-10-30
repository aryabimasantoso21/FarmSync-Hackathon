# 🚀 FarmSync 3-VM Setup - Panduan Singkat

## ✅ Status: Setup Scripts Ready!

### 📁 Struktur yang Sudah Dibuat:
```
vm-network/
├── vm-A/
│   ├── setup.sh ✅ (Ready to run)
│   └── start-node.sh (akan dibuat otomatis)
├── vm-B/
│   ├── setup.sh ✅ (Ready to run)
│   └── start-node.sh (akan dibuat otomatis)
├── vm-C/
│   ├── setup.sh ✅ (Ready to run)
│   └── start-node.sh (akan dibuat otomatis)
├── genesis.json ✅
├── deploy-contract.sh ✅
└── test-network.sh ✅
```

---

## 🎯 Cara Pakai (3 Opsi)

### **OPSI 1: Simulasi 3-VM di 1 Laptop (Testing)** ⭐⭐⭐⭐

Pakai ini untuk **test dulu** sebelum pindah ke VM real!

```bash
# Terminal 1: VM-A (Mill 1)
cd ~/FarmSync/vm-network/vm-A
./start-node.sh
# Setelah muncul console, catat enode:
admin.nodeInfo.enode
# Output: enode://abc123...@[::]:30303
# Ganti [::] dengan 127.0.0.1 untuk localhost

# Terminal 2: VM-B (Mill 2)
cd ~/FarmSync/vm-network/vm-B
# Edit start-node.sh dulu:
nano start-node.sh
# Set: BOOTNODE_ENODE="enode://abc123...@127.0.0.1:30303"
./start-node.sh
# Verify: admin.peers (harus ada 1 peer)

# Terminal 3: VM-C (Estate)
cd ~/FarmSync/vm-network/vm-C
# Edit start-node.sh:
nano start-node.sh
# Set: BOOTNODE_ENODE="enode://abc123...@127.0.0.1:30303"
./start-node.sh
# Verify: admin.peers (harus ada 2 peers)
```

**Catatan:** 
- Semua nodes pakai port yang sama (8545, 30303) tapi binding ke address berbeda
- VM-A: --http.addr "127.0.0.1" --port 30303
- VM-B: --http.addr "127.0.0.2" --port 30304  
- VM-C: --http.addr "127.0.0.3" --port 30305

**Tapi tunggu!** Setup script perlu dimodifikasi untuk multi-node di 1 laptop...

---

### **OPSI 2: 3 VM Real (Final Demo)** ⭐⭐⭐⭐⭐

Pakai ini untuk **demo final/presentasi**.

#### VM-A (192.168.1.101):
```bash
# Copy folder vm-A ke VM-A
scp -r vm-network/vm-A user@192.168.1.101:~/

# SSH ke VM-A
ssh user@192.168.1.101

cd ~/vm-A
./setup.sh
./start-node.sh

# Dalam geth console:
admin.nodeInfo.enode
# Copy output: enode://abc123...@[::]:30303
# Ganti [::] dengan 192.168.1.101
```

#### VM-B (192.168.1.102):
```bash
scp -r vm-network/vm-B user@192.168.1.102:~/
ssh user@192.168.1.102

cd ~/vm-B
./setup.sh
nano start-node.sh
# Set BOOTNODE_ENODE="enode://abc123...@192.168.1.101:30303"
./start-node.sh

# Verify:
admin.peers  # Harus 1 peer (VM-A)
```

#### VM-C (192.168.1.103):
```bash
scp -r vm-network/vm-C user@192.168.1.103:~/
ssh user@192.168.1.103

cd ~/vm-C
./setup.sh
nano start-node.sh
# Set BOOTNODE_ENODE="enode://abc123...@192.168.1.101:30303"
./start-node.sh

# Verify:
admin.peers  # Harus 2 peers (VM-A, VM-B)
```

---

### **OPSI 3: Docker (Paling Cepat)** ⭐⭐⭐⭐

Pakai Docker Compose - **RECOMMENDED untuk testing cepat!**

```bash
cd ~/FarmSync/vm-network
./docker-init.sh
docker-compose up -d

# Cek logs
docker-compose logs -f

# Connect ke node
docker exec -it farmsync-mill1 geth attach /root/.ethereum/geth.ipc

# Dalam console:
admin.peers  # Harus 2 peers
eth.blockNumber
```

**RPC Endpoints:**
- VM-A (Mill 1): http://localhost:8545
- VM-B (Mill 2): http://localhost:8546
- VM-C (Estate): http://localhost:8547

---

## 🔥 Deploy Contract (Setelah 3 Nodes Running)

### Untuk Real VMs:
```bash
cd ~/FarmSync/vm-network
./deploy-contract.sh

# Output akan muncul contract address
# Copy address tersebut
```

### Untuk Docker:
```bash
cd ~/FarmSync/blockchain

# Update hardhat.config.js:
# url: "http://localhost:8545"  # Port 8545, 8546, atau 8547

npx hardhat run scripts/deploy.js --network geth_private
```

---

## 🧪 Test Network

```bash
cd ~/FarmSync/vm-network

# Update IP di test-network.sh kalau pakai real VMs
nano test-network.sh
# Set VM_A_IP, VM_B_IP, VM_C_IP

./test-network.sh
```

Expected output:
```
✓ All nodes synced at block X
✓ Consensus achieved!
```

---

## 📝 Update .env Files

Setelah deploy contract, update:

### `middleware/.env`:
```env
RPC_URL=http://localhost:8545  # atau IP VM yang kamu pakai
CONTRACT_ADDRESS=0x...  # dari deployment
```

### `backend/.env`:
```env
RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x...
```

---

## 🎯 Rekomendasi Untuk Kamu

Karena setup scripts sudah siap di folder `vm-A/`, `vm-B/`, `vm-C/`:

### **Untuk Hari Ini** (Testing):
```bash
# Pakai Docker - paling cepat!
cd ~/FarmSync/vm-network
./docker-init.sh
docker-compose up -d

# Deploy contract
cd ../blockchain
npx hardhat run scripts/deploy.js --network geth_private

# Update .env, test full flow
```

⏱️ **Time: 10-15 menit**

### **Untuk Besok/Demo** (Production):
- Setup 3 VM real
- Run setup.sh di masing-masing VM
- Connect semua nodes
- Deploy contract
- Test consensus & fault tolerance

⏱️ **Time: 1-2 jam**

---

## ✅ Checklist

- [x] Setup scripts created in vm-A/, vm-B/, vm-C/
- [x] Genesis.json configured
- [x] Accounts imported successfully
- [x] Deploy script ready
- [x] Test script ready
- [ ] Choose deployment option (Docker/Real VMs)
- [ ] Start nodes
- [ ] Deploy contract
- [ ] Update .env files
- [ ] Test full flow

---

## 🆘 Troubleshooting

### Permission denied:
```bash
chmod +x vm-A/setup.sh vm-B/setup.sh vm-C/setup.sh
```

### Nodes tidak connect:
```bash
# Cek enode URL benar
# Pastikan firewall allow port 30303, 8545
sudo ufw allow 30303/tcp
sudo ufw allow 8545/tcp
```

### Account import failed:
```bash
# Sudah fixed di script! Jika masih error:
rm -rf vm-X/gethData
./setup.sh
```

---

**Mau mulai dengan opsi mana?**
1. 🐳 Docker (fastest - 10 min)
2. 💻 1 Laptop multi-terminal (medium - 30 min)
3. 🖥️ 3 VMs real (best demo - 2 hours)

Tinggal pilih! 🚀
