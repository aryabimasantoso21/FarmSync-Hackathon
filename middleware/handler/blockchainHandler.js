const { ethers } = require('ethers');

class BlockchainHandler {
  constructor(rpcUrl, privateKey, contractAddress, contractABI) {
    this.rpcUrl = rpcUrl;
    this.privateKey = privateKey;
    this.contractAddress = contractAddress;
    this.contractABI = contractABI;
    this.provider = null;
    this.signer = null;
    this.contract = null;
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
  async recordDeparture(truckId, weight, estateId) {
    try {
      console.log('🚚 Recording truck departure (TAP-1)...');
      console.log('   Truck ID:', truckId);
      console.log('   Weight:', weight, 'kg');
      console.log('   Estate ID:', estateId);

      // Get addresses from environment
      const sellerAddress = process.env.ESTATE_ADDRESS;
      const buyerAddress = process.env.MILL_ADDRESS;

      if (!sellerAddress || !buyerAddress) {
        throw new Error('ESTATE_ADDRESS and MILL_ADDRESS must be set in .env');
      }

      console.log('   Estate (Seller):', sellerAddress);
      console.log('   Mill (Buyer):', buyerAddress);

      // Prepare transaction
      const tx = await this.contract.recordDeparture(
        truckId,
        weight,
        estateId,
        sellerAddress,
        buyerAddress
      );
      
      console.log('⏳ Transaction sent:', tx.hash);
      console.log('   Waiting for confirmation...');

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      console.log('✅ Departure recorded!');
      console.log('   Block number:', receipt.blockNumber);
      console.log('   Status: Truck departed from estate');
      console.log('---');
      
      return receipt;

    } catch (error) {
      console.error('❌ Error recording departure:', error.message);
      throw error;
    }
  }

  /**
   * Record truck arrival (TAP-2) and process payment
   */
  async recordArrival(truckId, weight, estateId) {
    try {
      console.log('🏭 Recording truck arrival (TAP-2)...');
      console.log('   Truck ID:', truckId);
      console.log('   Weight:', weight, 'kg');
      console.log('   Estate ID:', estateId);

      // Get current nonce for arrival transaction
      const nonce = await this.signer.getNonce('latest');

      // Step 1: Record arrival with explicit nonce and estate validation
      const tx = await this.contract.recordArrival(truckId, weight, estateId, { nonce: nonce });
      
      console.log('⏳ Transaction sent:', tx.hash);
      console.log('   Waiting for confirmation...');

      const receipt = await tx.wait();
      
      console.log('✅ Arrival recorded!');
      console.log('   Block number:', receipt.blockNumber);

      // Step 2: Check weight validity
      const shipment = await this.contract.getShipment(truckId);
      const isValid = await this.contract.isWeightValid(
        shipment.departureWeight,
        shipment.arrivalWeight
      );

      console.log('⚖️  Weight validation:');
      console.log('   Departure weight:', shipment.departureWeight.toString(), 'kg');
      console.log('   Arrival weight:', shipment.arrivalWeight.toString(), 'kg');
      console.log('   Weight valid:', isValid);

      if (isValid) {
        console.log('💰 Initiating automatic payment...');
        
        // Get price per kg from environment
        const pricePerKg = BigInt(process.env.PRICE_PER_KG || '1000000000000000');
        
        // Add small delay to ensure arrival transaction is fully processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Release payment with arrival weight
        await this.releasePayment(truckId, shipment.arrivalWeight, pricePerKg);
      } else {
        console.log('❌ FRAUD DETECTED! Weight difference exceeds tolerance.');
        console.log('   Payment blocked - Mill funds protected');
      }

      console.log('---');
      return receipt;

    } catch (error) {
      console.error('❌ Error recording arrival:', error.message);
      throw error;
    }
  }

  /**
   * Release payment from Mill to Estate after successful arrival
   */
  async releasePayment(truckId, arrivalWeight, pricePerKg) {
    try {
      console.log('💸 Processing payment...');

      // Get shipment details
      const shipment = await this.contract.getShipment(truckId);
      
      // Calculate payment amount based on arrival weight
      // Using BigInt for arithmetic (ethers v6 compatible)
      const paymentAmount = arrivalWeight * pricePerKg;

      console.log('   Amount:', ethers.formatEther(paymentAmount), 'ETH');
      console.log('   From (Mill):', shipment.buyer);
      console.log('   To (Estate):', shipment.seller);

      // Get current nonce to prevent nonce conflicts
      const nonce = await this.signer.getNonce('latest');
      console.log('   Using nonce:', nonce);

      // Prepare transaction with payment and explicit nonce
      const tx = await this.contract.releasePayment(
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
