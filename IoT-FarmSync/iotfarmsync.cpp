#include <WiFi.h>
#include <HX711.h>
#include <Wire.h>
#include <Adafruit_PN532.h>
#include <PubSubClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <time.h>

// =================== KONFIGURASI ===================
#define DT_PIN  32
#define SCK_PIN 18

#define PN532_IRQ   (4)
#define PN532_RESET (5)

const char* WIFI_SSID = "ETERNOS_PRIV";
const char* WIFI_PASS = "eternos21";

const char* MQTT_SERVER = "192.168.0.101";
const int   MQTT_PORT   = 1883;
const char* MQTT_TOPIC  = "tbs/received";

// Timeout dan interval
const unsigned long NFC_TIMEOUT_MS = 10000UL;     // 10 detik timeout tanpa NFC
const unsigned long KEEPALIVE_INTERVAL = 15000UL; // 15 detik keepalive MQTT
const unsigned long NFC_CHECK_INTERVAL = 100UL;   // Check NFC setiap 100ms

HX711 scale;
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);
WiFiClient espClient;
PubSubClient mqttClient(espClient);
Preferences prefs;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 7 * 3600);

// Variabel timing
unsigned long lastNFCActivityTime = 0;
unsigned long lastKeepaliveTime = 0;
unsigned long lastNFCCheckTime = 0;
bool nfcActivityDetected = false;

// =================== DATA PABRIK (MILL) ===================
struct MillInfo {
  String id;
  String address;
};

MillInfo mill1 = {"MILL-00001", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"};
MillInfo mill2 = {"MILL-00002", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"};

// =================== SETUP ===================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== System Boot: NFC + HX711 + MQTT ===");

  prefs.begin("tbs", false);

  connectWiFi();

  Serial.println("Configuring NTP...");
  configTime(7 * 3600, 0, "pool.ntp.org", "id.pool.ntp.org", "time.google.com");

  Serial.print("Waiting for NTP sync");
  int retry = 0;
  time_t now = time(nullptr);
  while (now < 100000 && retry < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    retry++;
  }

  if (retry >= 20) {
    Serial.println("\nNTP sync timeout! Continuing anyway...");
  } else {
    Serial.println("\nNTP synced!");
    Serial.println(ctime(&now));
  }


  if (!initHX711()) {
    Serial.println("ERROR: HX711 not ready (check wiring). Halting.");
    while (true) delay(1000);
  }

  if (!initPN532()) {
    Serial.println("ERROR: PN532 not detected. Halting.");
    while (true) delay(1000);
  }
  
  connectMQTT();
  
  // Inisialisasi timer
  lastNFCActivityTime = millis();
  lastKeepaliveTime = millis();
  lastNFCCheckTime = millis();
  
  Serial.println("System Ready.\n");
}

// =================== LOOP ===================
void loop() {
  unsigned long currentMillis = millis();
  
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    Serial.println("MQTT disconnected, reconnecting...");
    connectMQTT();
  } else {
    mqttClient.loop(); // Process MQTT
  }
  
  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectWiFi();
  }

  // ===== KEEPALIVE MECHANISM =====
  // Kirim ping/keepalive setiap interval untuk menjaga koneksi
  if (currentMillis - lastKeepaliveTime >= KEEPALIVE_INTERVAL) {
    lastKeepaliveTime = currentMillis;
    
    if (mqttClient.connected()) {
      // Kirim keepalive message sederhana
      StaticJsonDocument<128> keepaliveDoc;
      keepaliveDoc["type"] = "keepalive";
      keepaliveDoc["device"] = "ESP32Client";
      keepaliveDoc["timestamp"] = getISO8601Time();
      
      String keepaliveMsg;
      serializeJson(keepaliveDoc, keepaliveMsg);
      
      if (mqttClient.publish("tbslocal/keepalive", keepaliveMsg.c_str())) {
        Serial.println("Keepalive sent");
      }
    }
  }

  // ===== NFC TIMEOUT CHECK =====
  // Jika tidak ada aktivitas NFC dalam 10 detik, reconnect MQTT
  if (currentMillis - lastNFCActivityTime >= NFC_TIMEOUT_MS) {
    if (nfcActivityDetected) {
      Serial.println("NFC timeout (10s), reconnecting MQTT...");
      mqttClient.disconnect();
      delay(500);
      connectMQTT();
      nfcActivityDetected = false;
    }
    lastNFCActivityTime = currentMillis; // Reset timer
  }

  // ===== NFC DETECT (dengan interval check) =====
  if (currentMillis - lastNFCCheckTime >= NFC_CHECK_INTERVAL) {
    lastNFCCheckTime = currentMillis;
    
    uint8_t uid[7];
    uint8_t uidLength;
    
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50)) {
      Serial.println("\n=== NFC DETECTED ===");
      
      // Update timing
      lastNFCActivityTime = currentMillis;
      nfcActivityDetected = true;

      String uidStr = "";
      for (uint8_t i = 0; i < uidLength; i++) {
        if (uid[i] < 0x10) uidStr += "0";
        uidStr += String(uid[i], HEX);
        if (i < uidLength - 1) uidStr += " ";
      }
      uidStr.toUpperCase();
      Serial.print("UID: "); Serial.println(uidStr);

      // Identifikasi Mill
      MillInfo selectedMill;
      bool validCard = false;
      
      if (uidStr == "53 DD 0E E2") {
        selectedMill = mill1;
        validCard = true;
      } else if (uidStr == "29 2C 03 04") {
        selectedMill = mill2;
        validCard = true;
      }
      
      if (!validCard) {
        Serial.println("Unknown NFC card!");
        delay(1500);
        return;
      }

      // Baca berat
      Serial.println("Reading weight...");
      float weight = readStableWeight();
      Serial.print("Weight measured: "); Serial.println(weight);

      // Toggle event type
      String lastEvent = prefs.getString(uidStr.c_str(), "NONE");
      String eventType;

      if (lastEvent == "TAP-1") {
        eventType = "TAP-2";
      } else {
        eventType = "TAP-1";
      }

      prefs.putString(uidStr.c_str(), eventType);
      Serial.print("Event toggled to: "); Serial.println(eventType);

      // Buat JSON payload
      String timestamp = getISO8601Time();

      StaticJsonDocument<256> doc;
      doc["truckId"] = "TRK-00001";
      doc["eventType"] = eventType;
      doc["weight"] = (int)weight;
      doc["estateId"] = "EST-00001";
      doc["millId"] = selectedMill.id;
      doc["millAddress"] = selectedMill.address;
      doc["timestamp"] = timestamp;

      String jsonStr;
      serializeJson(doc, jsonStr);
      Serial.println("Publishing: " + jsonStr);

      // Publish ke MQTT dengan retry
      int retryCount = 0;
      bool publishSuccess = false;
      
      while (retryCount < 3 && !publishSuccess) {
        if (mqttClient.connected()) {
          if (mqttClient.publish(MQTT_TOPIC, jsonStr.c_str())) {
            Serial.println("MQTT publish OK\n");
            publishSuccess = true;
          } else {
            Serial.println("MQTT publish FAILED, retry...");
            retryCount++;
            delay(500);
          }
        } else {
          Serial.println("MQTT not connected, reconnecting...");
          connectMQTT();
          retryCount++;
        }
      }
      
      if (!publishSuccess) {
        Serial.println("Failed to publish after 3 retries\n");
      }

      // Cooldown untuk mencegah double tap
      delay(3000);
    }
  }
}

// =================== FUNCTION DEFINISI ===================

bool initHX711() {
  Serial.println("Initializing HX711...");
  scale.begin(DT_PIN, SCK_PIN);

  unsigned long start = millis();
  while (!scale.is_ready()) {
    if (millis() - start > 20000) {
      Serial.println("HX711 timeout!");
      return false;
    }
    Serial.print(".");
    delay(1000);
  }

  delay(2000);
  float calFactor = prefs.getFloat("calFactor", 2280.0);
  scale.set_scale(calFactor);
  scale.tare();
  Serial.print("\nHX711 Ready. Cal Factor: ");
  Serial.println(calFactor);
  return true;
}

bool initPN532() {
  Serial.println("Initializing PN532...");
  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("PN532 not found!");
    return false;
  }
  
  Serial.print("Found PN5"); Serial.print((versiondata>>24) & 0xFF, HEX); 
  Serial.print(" Firmware ver. "); Serial.print((versiondata>>16) & 0xFF, DEC);
  Serial.print('.'); Serial.println((versiondata>>8) & 0xFF, DEC);
  
  nfc.SAMConfig();
  Serial.println("PN532 Ready.");
  return true;
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  Serial.print("Connecting WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++retry > 40) {
      Serial.println("\nWiFi failed, restarting...");
      ESP.restart();
    }
  }
  Serial.println();
  Serial.print("WiFi connected, IP: ");
  Serial.println(WiFi.localIP());
}

void connectMQTT() {
  if (mqttClient.connected()) return;
  
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setKeepAlive(60); // Set keepalive ke 60 detik
  mqttClient.setSocketTimeout(30); // Socket timeout 30 detik
  
  Serial.print("Connecting MQTT");
  int retry = 0;
  while (!mqttClient.connected() && retry < 5) {
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("\nMQTT connected.");
      // Update timing setelah connect
      lastKeepaliveTime = millis();
      lastNFCActivityTime = millis();
      break;
    } else {
      Serial.print(".");
      Serial.print(" (rc=");
      Serial.print(mqttClient.state());
      Serial.print(") ");
      delay(2000);
      retry++;
    }
  }
  
  if (!mqttClient.connected()) {
    Serial.println("\nMQTT connection failed after retries");
  }
}

float readStableWeight() {
  if (!scale.is_ready()) {
    Serial.println("HX711 not ready, returning 0");
    return 0.0;
  }
  
  // Baca multiple kali untuk stabilitas
  float weight = scale.get_units(10);
  
  // Filter nilai negatif kecil (noise)
  if (weight < 0 && weight > -10) {
    weight = 0;
  }
  
  return weight;
}

String getISO8601Time() {
  time_t now;
  time(&now);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S.000Z", &timeinfo);
  return String(buffer);
}