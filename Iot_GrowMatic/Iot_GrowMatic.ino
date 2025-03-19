#include <WiFi.h>
#include <WebSocketsServer.h>
#include <DHT.h>

// Pin DHT22 dan Relay
#define DHTPIN 4
#define RELAY_PIN 5
#define DHTTYPE DHT22  // Ubah dari DHT11 ke DHT22

// Inisialisasi DHT
DHT dht(DHTPIN, DHTTYPE);

// WebSocket server
WebSocketsServer webSocket = WebSocketsServer(81);

// Variabel untuk kontrol manual/otomatis
bool isAutoMode = true;
bool relayState = false;

// Isi dengan SSID dan password Wi-Fi Anda
const char* ssid = "NYOTO PERMAK";
const char* password = "BIMWISBISAT";

// Fungsi untuk membaca suhu dan kelembaban
void readSensor() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("Gagal membaca DHT22!");
    return;
  }

  // Kirim data ke client melalui WebSocket
  String data = "TEMP:" + String(t) + ",HUM:" + String(h);
  webSocket.broadcastTXT(data);

  // Logging ke Serial Monitor
  Serial.print("Suhu: ");
  Serial.print(t);
  Serial.print(" °C, Kelembaban: ");
  Serial.print(h);
  Serial.println(" %");
}

// Fungsi untuk kontrol relay
void controlRelay(bool state) {
  digitalWrite(RELAY_PIN, state ? HIGH : LOW);  // HIGH untuk menyalakan relay (active high)
  relayState = state;

  // Kirim status relay ke client
  String relayStatus = "RELAY:" + String(relayState ? "ON" : "OFF");
  webSocket.broadcastTXT(relayStatus);

  // Logging ke Serial Monitor
  Serial.print("Relay: ");
  Serial.println(state ? "ON" : "OFF");
}

// Fungsi untuk kontrol otomatis berdasarkan suhu
void autoControl() {
  float t = dht.readTemperature();
  if (isAutoMode) {
    if (t > 30) {  // Jika suhu > 30°C, nyalakan relay
      controlRelay(true);
    } else {       // Jika suhu <= 30°C, matikan relay
      controlRelay(false);
    }
  }
}

// Setup
void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);  // Matikan relay saat awal (sesuaikan dengan logika relay)
  dht.begin();

  // Mulai koneksi Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Menghubungkan ke WiFi...");
  }
  Serial.println("Terhubung ke WiFi");
  Serial.println(WiFi.localIP());

  // Mulai WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("WebSocket server started");
}

// Loop
void loop() {
  webSocket.loop();
  readSensor();
  autoControl();
  delay(2000);  // Delay 2 detik
}

// Fungsi untuk menangani event WebSocket
void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
      }
      break;
    case WStype_TEXT:
      {
        String message = (char*)payload;
        Serial.printf("[%u] Received: %s\n", num, message);

        // Kontrol relay manual
        if (message == "RELAY:ON") {
          isAutoMode = false;
          controlRelay(true);
        } else if (message == "RELAY:OFF") {
          isAutoMode = false;
          controlRelay(false);
        } else if (message == "MODE:AUTO") {
          isAutoMode = true;
          Serial.println("Mode: Otomatis");
        }
      }
      break;
  }
}