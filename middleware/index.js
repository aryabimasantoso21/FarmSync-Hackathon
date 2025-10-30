require('dotenv').config();
const MQTTHandler = require('./handler/mqttHandler');
const BlockchainHandler = require('./handler/blockchainHandler');

// Contract ABI (all functions we need)
const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "truckId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "estateId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "weight",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "weightValid",
        "type": "bool"
      }
    ],
    "name": "ArrivalRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "recordId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "sensorId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "weight",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "quality",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "dataHash",
        "type": "bytes32"
      }
    ],
    "name": "DataRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "truckId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "estateId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "weight",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      }
    ],
    "name": "DepartureRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "truckId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PaymentReleased",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_recordId",
        "type": "uint256"
      }
    ],
    "name": "getRecord",
    "outputs": [
      {
        "internalType": "string",
        "name": "sensorId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "weight",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "quality",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "dataHash",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_truckId",
        "type": "string"
      }
    ],
    "name": "getShipment",
    "outputs": [
      {
        "internalType": "string",
        "name": "estateId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "departureWeight",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "arrivalWeight",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "departureTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "arrivalTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "departed",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "arrived",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "paid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalRecords",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_truckId",
        "type": "string"
      }
    ],
    "name": "isShipmentValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_departureWeight",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_arrivalWeight",
        "type": "uint256"
      }
    ],
    "name": "isWeightValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_truckId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_weight",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_estateId",
        "type": "string"
      }
    ],
    "name": "recordArrival",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "recordCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_sensorId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_weight",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_quality",
        "type": "uint256"
      }
    ],
    "name": "recordData",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_truckId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_weight",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_estateId",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "_seller",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_buyer",
        "type": "address"
      }
    ],
    "name": "recordDeparture",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "records",
    "outputs": [
      {
        "internalType": "string",
        "name": "sensorId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "weight",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "quality",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "dataHash",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_truckId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_pricePerKg",
        "type": "uint256"
      }
    ],
    "name": "releasePayment",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "shipments",
    "outputs": [
      {
        "internalType": "string",
        "name": "estateId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "truckId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "departureWeight",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "arrivalWeight",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "departureTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "arrivalTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "departed",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "arrived",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "paid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_recordId",
        "type": "uint256"
      }
    ],
    "name": "verifyDataIntegrity",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  try {
    console.log('🚀 Starting FarmSync Middleware...\n');

    // Configuration
    const config = {
      mqtt: {
        brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'
      },
      blockchain: {
        rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
        mill1PrivateKey: process.env.PRIVATE_KEY_MILL1,
        mill2PrivateKey: process.env.PRIVATE_KEY_MILL2,
        contractAddress: process.env.CONTRACT_ADDRESS
      }
    };

    // Validate configuration
    if (!process.env.PRIVATE_KEY_MILL1) {
      throw new Error('PRIVATE_KEY_MILL1 not found in environment variables');
    }
    if (!process.env.PRIVATE_KEY_MILL2) {
      throw new Error('PRIVATE_KEY_MILL2 not found in environment variables');
    }
    if (!process.env.CONTRACT_ADDRESS) {
      throw new Error('CONTRACT_ADDRESS not found in environment variables');
    }

    // Initialize blockchain handler with both mill keys
    const blockchainHandler = new BlockchainHandler(
      process.env.RPC_URL,
      process.env.PRIVATE_KEY_MILL1,
      process.env.PRIVATE_KEY_MILL2,
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI
    );

    // Connect to blockchain
    await blockchainHandler.connect();

    // Initialize MQTT handler
    const mqttHandler = new MQTTHandler(
      config.mqtt.brokerUrl,
      blockchainHandler
    );

    // Connect to MQTT broker
    await mqttHandler.connect();

    console.log('\n✅ FarmSync Middleware is running!');
    console.log('📡 Listening for sensor data...\n');

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down middleware...');
      mqttHandler.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start middleware:', error.message);
    process.exit(1);
  }
}

// Start the application
main();
