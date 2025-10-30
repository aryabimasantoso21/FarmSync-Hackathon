require('dotenv').config();
const mqtt = require('mqtt');
const readline = require('readline');

// MQTT Configuration
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const TOPIC = 'tbs/received';

// Mill 2 Configuration (VM-B)
const MILL_ID = 'MILL-00002';
const MILL_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'; // Mill 2 address
const MILL_NAME = 'Mill 2 (Pabrik Kelapa Sawit B)';

console.log('╔════════════════════════════════════════════╗');
console.log('║    FarmSync - Mill 2 MQTT Publisher        ║');
console.log('║    VM-B Connected (Port 30302/8546)        ║');
console.log('╚════════════════════════════════════════════╝');
console.log('');
console.log(`🏭 Mill ID: ${MILL_ID}`);
console.log(`📍 Mill Address: ${MILL_ADDRESS}`);
console.log(`🌐 VM-B RPC: http://localhost:8546`);
console.log('');

// Connect to MQTT Broker
const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
  console.log('✅ Connected to MQTT Broker');
  console.log(`📡 Publishing to topic: ${TOPIC}`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  startInteractiveMode();
});

client.on('error', (error) => {
  console.error('❌ MQTT Connection Error:', error.message);
  process.exit(1);
});

// Interactive Mode
function startInteractiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let truckCounter = 1;

  function promptForData() {
    console.log(`\n🚚 TBS Shipment Entry for ${MILL_NAME}`);
    console.log('─────────────────────────────────────────────');

    rl.question('Truck ID (Enter for auto: TRK-0000X): ', (truckInput) => {
      const truckId = truckInput.trim() || `TRK-${String(truckCounter).padStart(4, '0')}`;
      truckCounter++;

      rl.question('Event Type (TAP-1=Departure, TAP-2=Arrival) [TAP-1]: ', (eventInput) => {
        const eventType = eventInput.trim() || 'TAP-1';

        rl.question('Weight (kg) [18000]: ', (weightInput) => {
          const weight = parseInt(weightInput.trim()) || 18000;

          rl.question('Estate ID [EST-00001]: ', (estateInput) => {
            const estateId = estateInput.trim() || 'EST-00001';

            // Create message
            const message = {
              truckId: truckId,
              eventType: eventType,
              weight: weight,
              estateId: estateId,
              millId: MILL_ID,
              millAddress: MILL_ADDRESS,
              timestamp: new Date().toISOString()
            };

            // Publish to MQTT
            client.publish(TOPIC, JSON.stringify(message), (err) => {
              if (err) {
                console.error('❌ Failed to publish:', err.message);
              } else {
                console.log('\n✅ Message Published!');
                console.log('📊 Data:', JSON.stringify(message, null, 2));
                console.log('⛓️  Sent to Mill 2 VM-B for blockchain processing...');
              }

              // Ask if want to send more
              rl.question('\nSend another shipment? (y/n) [y]: ', (answer) => {
                if (answer.toLowerCase() === 'n') {
                  console.log('\n👋 Closing Mill 2 Publisher...');
                  client.end();
                  rl.close();
                  process.exit(0);
                } else {
                  promptForData();
                }
              });
            });
          });
        });
      });
    });
  }

  promptForData();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Mill 2 Publisher shutting down...');
  client.end();
  process.exit(0);
});
