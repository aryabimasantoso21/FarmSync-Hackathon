const mqtt = require('mqtt');

class MQTTHandler {
  constructor(brokerUrl, blockchainHandler) {
    this.brokerUrl = brokerUrl;
    this.blockchainHandler = blockchainHandler;
    this.client = null;
    this.topics = ['tbs/received', 'tbs/weight', 'tbs/quality'];
  }

  /**
   * Connect to MQTT broker and subscribe to topics
   */
  connect() {
    return new Promise((resolve, reject) => {
      console.log('📡 Connecting to MQTT Broker:', this.brokerUrl);
      
      this.client = mqtt.connect(this.brokerUrl);

      this.client.on('connect', () => {
        console.log('✅ Connected to MQTT Broker');
        
        // Subscribe to topics
        this.topics.forEach(topic => {
          this.client.subscribe(topic, (err) => {
            if (err) {
              console.error(`❌ Failed to subscribe to ${topic}:`, err);
            } else {
              console.log(`📥 Subscribed to topic: ${topic}`);
            }
          });
        });
        
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT Connection Error:', error);
        reject(error);
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  async handleMessage(topic, message) {
    try {
      console.log('\n📨 Message received from topic:', topic);
      
      // Parse message
      const data = JSON.parse(message.toString());
      console.log('📊 Data:', data);

      // Check if this is a TBS shipment event or sensor data
      if (data.eventType) {
        // TBS Shipment tracking
        console.log('🚚 Processing TBS shipment event...');
        
        if (data.eventType === 'TAP-1') {
          // Departure event
          console.log('⛓️  Recording departure (TAP-1) to blockchain...');
          await this.blockchainHandler.recordDeparture(
            data.truckId,
            data.weight,
            data.estateId,
            data.millAddress // Pass mill address from MQTT message
          );
        } else if (data.eventType === 'TAP-2') {
          // Arrival event (will trigger payment automatically)
          console.log('⛓️  Recording arrival (TAP-2) to blockchain...');
          await this.blockchainHandler.recordArrival(
            data.truckId,
            data.weight,
            data.estateId,
            data.millAddress // Pass mill address to ensure correct payment signer
          );
        } else {
          console.log('❌ Unknown event type:', data.eventType);
        }
      } else if (data.sensorId && data.quality) {
        // Legacy sensor data
        console.log('⛓️  Forwarding sensor data to blockchain...');
        await this.blockchainHandler.storeData(
          data.sensorId,
          data.weight,
          data.quality
        );
      } else {
        console.log('❌ Invalid data format');
      }

    } catch (error) {
      console.error('❌ Error handling message:', error.message);
    }
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('🛑 Disconnected from MQTT Broker');
    }
  }
}

module.exports = MQTTHandler;
