const mqtt = require('mqtt');
require('dotenv').config();

// MQTT Broker Configuration
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const TOPIC_TBS = 'tbs/received';

// Connect to MQTT Broker
const client = mqtt.connect(BROKER_URL);

// Sensor ID
const SENSOR_ID = process.env.SENSOR_ID || 'SENSOR_TBS_001';

client.on('connect', () => {
  console.log('📡 Connected to MQTT Broker:', BROKER_URL);
  console.log('🔄 Starting sensor data simulation...\n');
  
  // Publish sensor data every 5 seconds
  setInterval(() => {
    publishSensorData();
  }, 15000);
});

client.on('error', (error) => {
  console.error('❌ MQTT Connection Error:', error);
});

/**
 * Generate random sensor data
 */
function generateSensorData() {
  return {
    sensorId: SENSOR_ID,
    weight: Math.floor(Math.random() * 1000) + 500, // 500-1500 kg
    quality: Math.floor(Math.random() * 100) + 1,   // 1-100 quality score
    timestamp: new Date().toISOString(),
  };
}

/**
 * Publish sensor data to MQTT
 */
function publishSensorData() {
  const data = generateSensorData();
  const message = JSON.stringify(data);
  
  client.publish(TOPIC_TBS, message, (err) => {
    if (err) {
      console.error('❌ Publish Error:', err);
    } else {
      console.log('📤 Published to', TOPIC_TBS);
      console.log('   Sensor ID:', data.sensorId);
      console.log('   Weight:', data.weight, 'kg');
      console.log('   Quality:', data.quality);
      console.log('   Timestamp:', data.timestamp);
      console.log('---');
    }
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down sensor publisher...');
  client.end();
  process.exit(0);
});
