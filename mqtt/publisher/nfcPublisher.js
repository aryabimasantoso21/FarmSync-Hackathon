/**
 * FarmSync - NFC-based Automated Publisher
 * Simulates NFC tap + weight sensor for TBS shipment tracking
 */

const mqtt = require('mqtt');
const readline = require('readline');
require('dotenv').config();

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER_URL || 'mqtt://172.26.225.89:1883';
const TOPIC = 'tbs/received';

// Connect to MQTT Broker
const client = mqtt.connect(MQTT_BROKER);

// Truck ID Pool Management
let availableTrucks = [];
let activeTrucks = new Map(); // truckId -> { estateId, departureWeight, status }

// Initialize truck pool
function initializeTruckPool(count = 10) {
  for (let i = 1; i <= count; i++) {
    const truckId = `TRK-${String(i).padStart(5, '0')}`;
    availableTrucks.push(truckId);
  }
  console.log(`🚚 Truck pool initialized: ${count} trucks available`);
}

// Get next available truck
function getAvailableTruck() {
  if (availableTrucks.length === 0) {
    return null;
  }
  return availableTrucks.shift(); // Remove from available pool
}

// Release truck back to pool
function releaseTruck(truckId) {
  if (activeTrucks.has(truckId)) {
    activeTrucks.delete(truckId);
    availableTrucks.push(truckId);
    console.log(`♻️  Truck ${truckId} released back to pool`);
  }
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

client.on('connect', () => {
  console.log('✅ Connected to MQTT Broker');
  console.log('📡 Topic:', TOPIC);
  console.log('');
  console.log('='.repeat(60));
  console.log('🎯 NFC-BASED TBS SHIPMENT TRACKER');
  console.log('='.repeat(60));
  console.log('');
  
  // Initialize truck pool
  initializeTruckPool(10);
  
  // Show available trucks
  console.log('📋 Available Trucks:', availableTrucks.join(', '));
  console.log('');
  
  // Start input loop
  handleInput();
});

client.on('error', (err) => {
  console.error('❌ MQTT Connection Error:', err.message);
  process.exit(1);
});

async function handleInput() {
  try {
    console.log('\n' + '─'.repeat(60));
    console.log('📍 SELECT EVENT TYPE:');
    console.log('─'.repeat(60));
    
    const eventType = await question('Enter Event Type (TAP-1 or TAP-2): ');
    
    if (eventType.toUpperCase() !== 'TAP-1' && eventType.toUpperCase() !== 'TAP-2') {
      console.log('❌ Invalid event type. Please enter TAP-1 or TAP-2');
      return handleInput();
    }

    let truckId, estateId, weight;

    if (eventType.toUpperCase() === 'TAP-1') {
      // TAP-1: Departure - Assign new truck
      console.log('\n🚚 TAP-1: TRUCK DEPARTURE');
      console.log('─'.repeat(60));
      
      // Auto-assign truck
      truckId = getAvailableTruck();
      
      if (!truckId) {
        console.log('❌ No available trucks! All trucks are currently in transit.');
        console.log('📊 Active trucks:', Array.from(activeTrucks.keys()).join(', '));
        return handleInput();
      }
      
      console.log(`✅ Truck assigned: ${truckId}`);
      console.log('');
      
      // Input estate and weight
      estateId = await question('🏭 Enter Estate ID (e.g., EST-00001): ');
      weight = parseInt(await question('⚖️  Enter Weight (kg): '));
      
      // Validate input
      if (!estateId || isNaN(weight) || weight <= 0) {
        console.log('❌ Invalid input. Please try again.');
        availableTrucks.unshift(truckId); // Return truck to pool
        return handleInput();
      }
      
      // Mark truck as active
      activeTrucks.set(truckId, {
        estateId: estateId,
        departureWeight: weight,
        status: 'IN_TRANSIT',
        departureTime: new Date()
      });
      
      console.log('');
      console.log('✅ Truck marked as IN TRANSIT');
      console.log(`📊 Available trucks: ${availableTrucks.length}/${availableTrucks.length + activeTrucks.size}`);
      
    } else {
      // TAP-2: Arrival - Select from active trucks
      console.log('\n🏭 TAP-2: TRUCK ARRIVAL');
      console.log('─'.repeat(60));
      
      if (activeTrucks.size === 0) {
        console.log('❌ No trucks in transit! Please do TAP-1 first.');
        return handleInput();
      }
      
      // Show active trucks
      console.log('🚚 Trucks in transit:');
      let index = 1;
      const activeTruckList = Array.from(activeTrucks.entries());
      
      activeTruckList.forEach(([id, data]) => {
        const duration = Math.round((new Date() - data.departureTime) / 1000 / 60);
        console.log(`   ${index}. ${id} - ${data.estateId} (${data.departureWeight}kg, ${duration}min ago)`);
        index++;
      });
      console.log('');
      
      // Select truck
      const selection = await question(`Select truck (1-${activeTrucks.size}): `);
      const selectedIndex = parseInt(selection) - 1;
      
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= activeTruckList.length) {
        console.log('❌ Invalid selection');
        return handleInput();
      }
      
      const [selectedTruckId, truckData] = activeTruckList[selectedIndex];
      truckId = selectedTruckId;
      estateId = truckData.estateId;
      
      console.log(`✅ Selected: ${truckId}`);
      console.log('');
      
      // Input arrival weight
      weight = parseInt(await question('⚖️  Enter Arrival Weight (kg): '));
      
      if (isNaN(weight) || weight <= 0) {
        console.log('❌ Invalid weight');
        return handleInput();
      }
      
      // Calculate weight difference
      const weightDiff = truckData.departureWeight - weight;
      console.log('');
      console.log('📊 WEIGHT VALIDATION:');
      console.log(`   Departure: ${truckData.departureWeight} kg`);
      console.log(`   Arrival: ${weight} kg`);
      console.log(`   Difference: ${weightDiff} kg`);
      
      if (weightDiff > 1) {
        console.log('⚠️  WARNING: Weight difference exceeds 1kg tolerance!');
        console.log('   Payment may be blocked due to fraud detection.');
      } else {
        console.log('✅ Weight difference within tolerance');
      }
    }

    // Prepare MQTT message
    const message = {
      truckId: truckId,
      eventType: eventType.toUpperCase(),
      weight: weight,
      estateId: estateId,
      timestamp: new Date().toISOString()
    };

    // Publish to MQTT
    console.log('');
    console.log('📤 Publishing to MQTT...');
    console.log(JSON.stringify(message, null, 2));
    
    client.publish(TOPIC, JSON.stringify(message), (err) => {
      if (err) {
        console.error('❌ Failed to publish:', err.message);
      } else {
        console.log('✅ Message published successfully!');
        
        // Release truck after TAP-2
        if (eventType.toUpperCase() === 'TAP-2') {
          setTimeout(() => {
            releaseTruck(truckId);
            console.log(`📊 Available trucks: ${availableTrucks.length}/${availableTrucks.length + activeTrucks.size}`);
          }, 2000); // Delay to allow blockchain processing
        }
      }
      
      // Continue loop
      handleInput();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    handleInput();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  client.end();
  rl.close();
  process.exit(0);
});
