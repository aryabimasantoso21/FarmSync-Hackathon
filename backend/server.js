require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain connection
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Contract ABI (will be loaded from artifact)
const CONTRACT_ABI = require('../blockchain/artifacts/contracts/SensorLedger.sol/SensorLedger.json').abi;
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// Helper: Get balance
async function getBalance(address) {
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

// Helper: Convert IDR to ETH display
function convertToIDR(ethAmount) {
  const pricePerKgIDR = parseFloat(process.env.PRICE_PER_KG_IDR);
  const pricePerKgETH = parseFloat(ethers.formatEther(process.env.PRICE_PER_KG_ETH));
  const ethValue = parseFloat(ethAmount);
  return (ethValue / pricePerKgETH) * pricePerKgIDR;
}

// Helper: Safely serialize any value to JSON-safe format
function safeSerialize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  
  // Handle ethers.js specific types
  if (value && typeof value === 'object') {
    // Check if it's an ethers Result with indexed properties
    if (value._isIndexed !== undefined || value.hash !== undefined) {
      return value.toString();
    }
    // If object has a toString method, use it
    if (value.toString && typeof value.toString === 'function') {
      const str = value.toString();
      // Avoid [object Object]
      if (str !== '[object Object]') {
        return str;
      }
    }
  }
  
  return String(value);
}

// ========== API ROUTES ==========

/**
 * GET /api/mill/balance
 * Get Mill balance and outgoing transactions
 */
app.get('/api/mill/balance', async (req, res) => {
  try {
    const millAddress = process.env.MILL_ADDRESS;
    const balance = await getBalance(millAddress);
    
    // Get payment events (outgoing from Mill)
    const filter = contract.filters.PaymentReleased();
    const events = await contract.queryFilter(filter);
    
    const transactions = events.map(event => {
      // PaymentReleased(string indexed truckId, address indexed seller, uint256 amount, uint256 timestamp)
      // For indexed string, use event.topics
      const truckIdTopic = event.topics[1]; // First indexed param (truckId is hashed)
      const sellerTopic = event.topics[2]; // Second indexed param
      
      // For non-indexed params, use args by position
      const amount = event.args.amount || event.args[0];
      const timestamp = event.args.timestamp || event.args[1];
      
      // Decode truckId from topics is complex, use args with proper extraction
      let truckId = 'Unknown';
      try {
        // Try to get truckId from logs - ethers v6 should parse it
        const parsed = contract.interface.parseLog(event);
        truckId = String(parsed.args.truckId || parsed.args[0] || '');
      } catch (e) {
        console.error('Failed to parse truckId:', e.message);
      }
      
      return {
        truckId: truckId,
        to: String(event.args.seller || sellerTopic),
        amount: ethers.formatEther(amount),
        amountIDR: convertToIDR(ethers.formatEther(amount)),
        timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
        blockNumber: Number(event.blockNumber),
        txHash: event.transactionHash
      };
    });

    res.json({
      address: millAddress,
      balance: balance,
      balanceIDR: convertToIDR(balance),
      transactions: transactions.reverse(), // Latest first
      totalSpent: transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/estate/balance
 * Get Estate balance and incoming transactions
 */
app.get('/api/estate/balance', async (req, res) => {
  try {
    const estateAddress = process.env.ESTATE_ADDRESS;
    const balance = await getBalance(estateAddress);
    
    // Get payment events (incoming to Estate)
    const filter = contract.filters.PaymentReleased(null, estateAddress);
    const events = await contract.queryFilter(filter);
    
    const transactions = events.map(event => {
      // Parse event properly
      let truckId = 'Unknown';
      try {
        const parsed = contract.interface.parseLog(event);
        truckId = String(parsed.args.truckId || parsed.args[0] || '');
      } catch (e) {
        console.error('Failed to parse truckId:', e.message);
      }
      
      const amount = event.args.amount || event.args[0];
      const timestamp = event.args.timestamp || event.args[1];
      
      return {
        truckId: truckId,
        from: process.env.MILL_ADDRESS,
        amount: ethers.formatEther(amount),
        amountIDR: convertToIDR(ethers.formatEther(amount)),
        timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
        blockNumber: Number(event.blockNumber),
        txHash: event.transactionHash
      };
    });

    res.json({
      address: estateAddress,
      balance: balance,
      balanceIDR: convertToIDR(balance),
      transactions: transactions.reverse(),
      totalReceived: transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/transactions
 * Get all transactions with full shipment details
 */
app.get('/api/admin/transactions', async (req, res) => {
  try {
    // Get all payment events
    const paymentFilter = contract.filters.PaymentReleased();
    const paymentEvents = await contract.queryFilter(paymentFilter);
    
    // Get shipment details for each payment
    const transactions = await Promise.all(
      paymentEvents.map(async (event) => {
        let truckId = 'Unknown';
        try {
          const parsed = contract.interface.parseLog(event);
          truckId = String(parsed.args.truckId || parsed.args[0] || '');
        } catch (e) {
          console.error('Failed to parse truckId:', e.message);
        }
        
        let shipment;
        try {
          shipment = await contract.getShipment(truckId);
        } catch (e) {
          console.error('Failed to get shipment:', truckId, e.message);
          // Return empty shipment data if query fails
          return null;
        }
        
        if (!shipment) return null;
        
        const amount = event.args.amount || event.args[0];
        const timestamp = event.args.timestamp || event.args[1];
        
        // Safely parse shipment data
        const estateId = String(shipment.estateId || shipment[0] || '');
        const departureWeight = Number(shipment.departureWeight || shipment[1] || 0);
        const arrivalWeight = Number(shipment.arrivalWeight || shipment[2] || 0);
        const departureTimestamp = Number(shipment.departureTimestamp || shipment[3] || 0);
        const arrivalTimestamp = Number(shipment.arrivalTimestamp || shipment[4] || 0);
        const seller = String(shipment.seller || shipment[5] || '');
        const buyer = String(shipment.buyer || shipment[6] || '');
        
        return {
          truckId: truckId,
          estateId: estateId,
          from: buyer,
          to: seller,
          departureWeight: departureWeight,
          arrivalWeight: arrivalWeight,
          weightDiff: departureWeight - arrivalWeight,
          amount: ethers.formatEther(amount),
          amountIDR: convertToIDR(ethers.formatEther(amount)),
          departureTime: new Date(departureTimestamp * 1000).toLocaleString(),
          arrivalTime: new Date(arrivalTimestamp * 1000).toLocaleString(),
          paymentTime: new Date(Number(timestamp) * 1000).toLocaleString(),
          status: 'Paid',
          blockNumber: Number(event.blockNumber),
          txHash: event.transactionHash
        };
      })
    );

    // Get all shipments (including unpaid)
    const departureFilter = contract.filters.DepartureRecorded();
    const departureEvents = await contract.queryFilter(departureFilter);
    
    const allShipments = await Promise.all(
      departureEvents.map(async (event) => {
        let truckId = 'Unknown';
        try {
          const parsed = contract.interface.parseLog(event);
          truckId = String(parsed.args.truckId || parsed.args[0] || '');
        } catch (e) {
          console.error('Failed to parse truckId:', e.message);
        }
        
        let shipment;
        try {
          shipment = await contract.getShipment(truckId);
        } catch (e) {
          console.error('Failed to get shipment:', truckId, e.message);
          return null;
        }
        
        if (!shipment) return null;
        
        // Safely parse shipment data
        const estateId = String(shipment.estateId || shipment[0] || '');
        const departureWeight = Number(shipment.departureWeight || shipment[1] || 0);
        const arrivalWeight = Number(shipment.arrivalWeight || shipment[2] || 0);
        const departureTimestamp = Number(shipment.departureTimestamp || shipment[3] || 0);
        const arrivalTimestamp = Number(shipment.arrivalTimestamp || shipment[4] || 0);
        const departed = Boolean(shipment.departed || shipment[7]);
        const arrived = Boolean(shipment.arrived || shipment[8]);
        const paid = Boolean(shipment.paid || shipment[9]);
        
        return {
          truckId: truckId,
          estateId: estateId,
          departureWeight: departureWeight,
          arrivalWeight: arrivalWeight,
          departed: departed,
          arrived: arrived,
          paid: paid,
          departureTime: new Date(departureTimestamp * 1000).toLocaleString(),
          arrivalTime: arrived ? new Date(arrivalTimestamp * 1000).toLocaleString() : null
        };
      })
    );

    // Filter out null values (failed queries)
    const validTransactions = transactions.filter(tx => tx !== null);
    const validShipments = allShipments.filter(s => s !== null);

    res.json({
      paidTransactions: validTransactions.reverse(),
      allShipments: validShipments.reverse(),
      stats: {
        totalTransactions: validTransactions.length,
        totalShipments: validShipments.length,
        pendingShipments: validShipments.filter(s => !s.paid).length,
        totalVolume: validShipments.reduce((sum, s) => sum + (s.arrivalWeight || 0), 0),
        totalValue: validTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error in /api/admin/transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shipment/:truckId
 * Get specific shipment details
 */
app.get('/api/shipment/:truckId', async (req, res) => {
  try {
    const { truckId } = req.params;
    const shipment = await contract.getShipment(truckId);
    
    res.json({
      truckId: truckId,
      estateId: shipment.estateId,
      seller: shipment.seller,
      buyer: shipment.buyer,
      departureWeight: Number(shipment.departureWeight),
      arrivalWeight: Number(shipment.arrivalWeight),
      weightDiff: Number(shipment.departureWeight) - Number(shipment.arrivalWeight),
      departureTime: new Date(Number(shipment.departureTimestamp) * 1000).toLocaleString(),
      arrivalTime: shipment.arrived ? new Date(Number(shipment.arrivalTimestamp) * 1000).toLocaleString() : null,
      status: {
        departed: shipment.departed,
        arrived: shipment.arrived,
        paid: shipment.paid
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/config
 * Get system configuration
 */
app.get('/api/config', (req, res) => {
  res.json({
    contractAddress: CONTRACT_ADDRESS,
    estateAddress: process.env.ESTATE_ADDRESS,
    millAddress: process.env.MILL_ADDRESS,
    pricePerKgIDR: parseFloat(process.env.PRICE_PER_KG_IDR),
    pricePerKgETH: ethers.formatEther(process.env.PRICE_PER_KG_ETH),
    network: 'Hardhat Local (31337)'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 FarmSync Backend Server');
  console.log('============================');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`⛓️  Connected to: ${process.env.RPC_URL}`);
  console.log(`📝 Contract: ${CONTRACT_ADDRESS}`);
  console.log(`💰 Price: Rp ${parseInt(process.env.PRICE_PER_KG_IDR).toLocaleString()}/kg`);
  console.log('============================\n');
});
