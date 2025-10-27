const mqtt = require('mqtt');
const readline = require('readline');
require('dotenv').config();

// MQTT Broker Configuration
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const TOPIC_TBS = 'tbs/received';

// Connect to MQTT Broker
const client = mqtt.connect(BROKER_URL);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Sensor ID
const SENSOR_ID = process.env.SENSOR_ID || 'SENSOR_TBS_001';

client.on('connect', () => {
  console.log('✅ Connected to MQTT Broker:', BROKER_URL);
  console.log('📝 TBS Shipment Data Input (TAP-1 / TAP-2)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Start asking for input
  askForInput();
});

client.on('error', (error) => {
  console.error('❌ MQTT Connection Error:', error);
  process.exit(1);
});

/**
 * Ask user for sensor data input
 */
function askForInput() {
  rl.question('� Enter Truck ID (e.g., TRK-00001): ', (truckId) => {
    // Check for exit command
    if (truckId.toLowerCase() === 'exit' || truckId.toLowerCase() === 'quit') {
      console.log('\n👋 Shutting down...');
      client.end();
      rl.close();
      process.exit(0);
      return;
    }

    // Validate truck ID
    if (!truckId || truckId.trim().length === 0) {
      console.log('❌ Truck ID cannot be empty!\n');
      askForInput();
      return;
    }

    rl.question('📍 Enter Event Type (TAP-1 or TAP-2): ', (eventType) => {
      const eventUpper = eventType.toUpperCase();
      
      if (eventUpper !== 'TAP-1' && eventUpper !== 'TAP-2') {
        console.log('❌ Invalid event type! Please enter TAP-1 or TAP-2.\n');
        askForInput();
        return;
      }

      rl.question('⚖️  Enter Weight (kg): ', (weight) => {
        // Validate weight input
        const weightNum = parseInt(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
          console.log('❌ Invalid weight! Please enter a positive number.\n');
          askForInput();
          return;
        }

        rl.question('🏭 Enter Estate ID (e.g., EST-00001): ', (estateId) => {
          // Validate estate ID
          if (!estateId || estateId.trim().length === 0) {
            console.log('❌ Estate ID cannot be empty!\n');
            askForInput();
            return;
          }

          // Create shipment data
          const data = {
            truckId: truckId.trim(),
            eventType: eventUpper,
            weight: weightNum,
            estateId: estateId.trim(),
            timestamp: new Date().toISOString(),
          };

          // Publish to MQTT
          const message = JSON.stringify(data);
          client.publish(TOPIC_TBS, message, (err) => {
            if (err) {
              console.error('❌ Publish Error:', err);
            } else {
              console.log('\n✅ Data Published Successfully!');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('📤 Topic:', TOPIC_TBS);
              console.log('🚚 Truck ID:', data.truckId);
              console.log('📍 Event Type:', data.eventType);
              console.log('⚖️  Weight:', data.weight, 'kg');
              console.log('🏭 Estate ID:', data.estateId);
              console.log('🕐 Timestamp:', data.timestamp);
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            }

            // Ask if user wants to send more data
            rl.question('📮 Send another data? (y/n): ', (answer) => {
              if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                console.log('');
                askForInput();
              } else {
                console.log('\n👋 Goodbye!');
                client.end();
                rl.close();
                process.exit(0);
              }
            });
          });
        });
      });
    });
  });
}

// Graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down manual publisher...');
  client.end();
  rl.close();
  process.exit(0);
});
