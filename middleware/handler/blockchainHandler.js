const { ethers } = require('ethers');

class BlockchainHandler {
  constructor(rpcUrl, mill1PrivateKey, mill2PrivateKey, contractAddress, contractABI) {
    this.rpcUrl = rpcUrl;
    
    // Store both mill private keys
    this.millKeys = {
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': mill1PrivateKey, // Mill 1
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': mill2PrivateKey  // Mill 2
    };
    
    // Use Mill 1 as default for non-payment operations
    this.privateKey = mill1PrivateKey;
    this.contractAddress = contractAddress;
    this.contractABI = contractABI;
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  /**
   * Get the correct signer for a specific mill address
   */
  getSignerForMill(millAddress) {
    const privateKey = this.millKeys[millAddress];
    if (!privateKey) {
      throw new Error(`No private key configured for mill address: ${millAddress}`);
    }
    return new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Initialize connection to blockchain
   */
  async connect() {
    try {
      console.log('⛓️  Connecting to blockchain:', this.rpcUrl);
      
      // Connect to provider
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      
      // Create signer
      this.signer = new ethers.Wallet(this.privateKey, this.provider);
      
      // Load contract
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        this.signer
      );

      // Test connection
      const network = await this.provider.getNetwork();
      console.log('✅ Connected to network:', network.chainId.toString());
      console.log('📝 Contract address:', this.contractAddress);
      
      // Get initial record count
      const recordCount = await this.contract.getTotalRecords();
      console.log('📊 Current total records:', recordCount.toString());
      
      return true;
    } catch (error) {
      console.error('❌ Blockchain connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Store sensor data on blockchain
   */
  async storeData(sensorId, weight, quality) {
    try {
      console.log('💾 Storing data on blockchain...');
      console.log('   Sensor ID:', sensorId);
      console.log('   Weight:', weight);
      console.log('   Quality:', quality);

      // Prepare transaction
      const tx = await this.contract.recordData(sensorId, weight, quality);
      
      console.log('⏳ Transaction sent:', tx.hash);
      console.log('   Waiting for confirmation...');

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      console.log('✅ Transaction confirmed!');
      console.log('   Block number:', receipt.blockNumber);
      console.log('   Gas used:', receipt.gasUsed.toString());

      // Get the record ID from event
      const event = receipt.logs.find(log => {
        try {
          return this.contract.interface.parseLog(log)?.name === 'DataRecorded';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = this.contract.interface.parseLog(event);
        const recordId = parsedEvent.args.recordId;
        console.log('📝 Record ID:', recordId.toString());
        
        // Verify data integrity
        const isValid = await this.contract.verifyDataIntegrity(recordId);
        console.log('🔐 Data integrity verified:', isValid);
      }

      console.log('---');
      return receipt;

    } catch (error) {
      console.error('❌ Error storing data:', error.message);
      throw error;
    }
  }

  /**
   * Record truck departure (TAP-1)
   */
  async recordDeparture(truckId, weight, estateId, millAddress = null) {
    try {
      console.log('🚚 Recording truck departure (TAP-1)...');
      console.log('   Truck ID:', truckId);
      console.log('   Weight:', weight, 'kg');
      console.log('   Estate ID:', estateId);

      // Check if truck was used before
      try {
        const previousShipment = await this.contract.getShipment(truckId);
        if (previousShipment.departed) {
          if (previousShipment.paid) {
            console.log('♻️  Truck reuse detected:');
            console.log('   Previous shipment completed and paid');
            console.log('   Truck ID is now available for new shipment ✅');
          } else {
            console.log('⚠️  Warning: Truck has existing active shipment');
            console.log('   Waiting for previous transaction to complete...');
            // Wait a bit for previous transaction to finalize
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      } catch (e) {
        // First time use - no previous shipment
        console.log('🆕 First time use for this truck ID');
      }

      // Get addresses
      const sellerAddress = process.env.ESTATE_ADDRESS;
      const buyerAddress = millAddress || process.env.MILL_ADDRESS; // Use millAddress from MQTT if provided

      if (!sellerAddress || !buyerAddress) {
        throw new Error('ESTATE_ADDRESS and buyer address must be set');
      }

      console.log('   Estate (Seller):', sellerAddress);
      console.log('   Mill (Buyer):', buyerAddress);

      // Get fresh nonce to avoid conflicts
      const nonce = await this.signer.getNonce('pending');
      console.log('   Using nonce:', nonce);

      // Prepare transaction with explicit nonce
      const tx = await this.contract.recordDeparture(
        truckId,
        weight,
        estateId,
        sellerAddress,
        buyerAddress,
        { nonce: nonce }
      );
      
      console.log('⏳ Transaction sent:', tx.hash);
      console.log('   Waiting for confirmation...');

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      console.log('✅ Departure recorded!');
      console.log('   Block number:', receipt.blockNumber);
      console.log('   Status: Truck departed from estate');
      console.log('---');
      
      // Small delay to ensure transaction is fully processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return receipt;

    } catch (error) {
      console.error('❌ Error recording departure:', error.message);
      throw error;
    }
  }

  /**
   * Record truck arrival (TAP-2) and process payment
   */
  async recordArrival(truckId, weight, estateId, millAddress) {
    try {
      console.log(`\n📍 Recording TAP-2 (Arrival) for ${truckId}...`);

      const nonce = await this.signer.getNonce('pending');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tx = await this.contract.recordArrival(truckId, weight, estateId, {
        nonce: nonce,
        gasLimit: 300000
      });
      
      console.log('⏳ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Arrival recorded!');

      // Get shipment details to calculate payment
      const shipment = await this.contract.getShipment(truckId);
      const arrivalWeight = shipment.arrivalWeight;
      const pricePerKg = ethers.parseEther('0.001'); // 0.001 ETH per kg

      // Automatically release payment with correct mill address
      console.log(`\n💰 Triggering automatic payment for mill ${millAddress}...`);
      await this.releasePayment(truckId, arrivalWeight, pricePerKg, millAddress);

      return receipt;
    } catch (error) {
      console.error('❌ Error recording arrival:', error.message);
      throw error;
    }
  }

  /**
   * Release payment from Mill to Estate after successful arrival
   */
  async releasePayment(truckId, arrivalWeight, pricePerKg, millAddress) {
    try {
      console.log(`💸 Processing payment for mill ${millAddress}...`);

      // Get shipment details
      const shipment = await this.contract.getShipment(truckId);
      
      // Calculate payment amount based on arrival weight
      // Using BigInt for arithmetic (ethers v6 compatible)
      const paymentAmount = arrivalWeight * pricePerKg;

      console.log('   Amount:', ethers.formatEther(paymentAmount), 'ETH');
      console.log('   From (Mill):', shipment.buyer);
      console.log('   To (Estate):', shipment.seller);

      // Get the correct signer for this mill
      const millSigner = this.getSignerForMill(millAddress);
      const millContract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        millSigner
      );

      // Get fresh nonce using 'pending'
      const nonce = await millSigner.getNonce('pending');
      console.log('   Using nonce:', nonce);
      console.log('   Signing with:', millAddress);

      // Prepare transaction with payment and explicit nonce
      const tx = await millContract.releasePayment(
        truckId,
        pricePerKg,
        { 
          value: paymentAmount,
          nonce: nonce
        }
      );
      
      console.log('⏳ Payment transaction sent:', tx.hash);
      console.log('   Waiting for confirmation...');

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      console.log('✅ Payment successful!');
      console.log('   Block number:', receipt.blockNumber);
      console.log('   Payment released to Estate');
      console.log('');
      console.log('🎉 Shipment completed!');
      console.log('   Truck ID:', truckId, 'is now available for reuse ♻️');
      console.log('---');
      
      return receipt;

    } catch (error) {
      console.error('❌ Error processing payment:', error.message);
      throw error;
    }
  }

  /**
   * Get record from blockchain
   */
  async getRecord(recordId) {
    try {
      const record = await this.contract.getRecord(recordId);
      return {
        sensorId: record[0],
        weight: record[1].toString(),
        quality: record[2].toString(),
        timestamp: record[3].toString(),
        dataHash: record[4]
      };
    } catch (error) {
      console.error('❌ Error getting record:', error.message);
      throw error;
    }
  }

  /**
   * Get total number of records
   */
  async getTotalRecords() {
    try {
      const count = await this.contract.getTotalRecords();
      return count.toString();
    } catch (error) {
      console.error('❌ Error getting total records:', error.message);
      throw error;
    }
  }
}

module.exports = BlockchainHandler;
