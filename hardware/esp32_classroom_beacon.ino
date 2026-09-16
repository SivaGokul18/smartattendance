/*
 * =========================================================================================
 * SMART ATTENDANCE - ESP32 CLASSROOM BLE BEACON FIRMWARE
 * =========================================================================================
 * 
 * Hardware: Any standard ESP32 development board (ESP-WROOM-32, NodeMCU-32S, ESP32-C3/S3).
 * Purpose: Continuously broadcasts an iBeacon BLE packet identifying the classroom.
 * Proximity: Calibrated at -59 dBm measured at 1 meter.
 * 
 * How to Flash:
 * 1. Open Arduino IDE.
 * 2. Install "esp32 by Espressif Systems" in Boards Manager.
 * 3. Select board: "DOIT ESP32 DEVKIT V1" (or your specific board).
 * 4. Connect ESP32 via USB and click Upload.
 * 5. Mount the ESP32 to the classroom ceiling or wall near the lecturer podium.
 * =========================================================================================
 */

#include "sys/time.h"
#include "BLEDevice.h"
#include "BLEUtils.h"
#include "BLEBeacon.h"
#include "esp_sleep.h"

// -----------------------------------------------------------------------------------------
// BEACON CONFIGURATION (Match with database 'rooms' table)
// -----------------------------------------------------------------------------------------
#define BEACON_NAME      "LH-204-BEACON"
#define ROOM_NAME        "LH-204"
#define BEACON_UUID_STR  "fda50693-a4e2-4fb1-afcf-c6eb07647825" // Institutional UUID
#define BEACON_MAJOR     204                                     // Classroom Room Number
#define BEACON_MINOR     1                                       // Beacon device index in room
#define TX_POWER_DBM     -59                                     // Measured RSSI at 1 meter

BLEAdvertising *pAdvertising;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("==========================================");
  Serial.println("Smart Attendance - Classroom Beacon Boot");
  Serial.printf("Room: %s | Device: %s\n", ROOM_NAME, BEACON_NAME);
  Serial.println("==========================================");

  // Initialize BLE Hardware
  BLEDevice::init(BEACON_NAME);

  // Optional: Set transmit power level to maximum (+9dBm) for room-wide coverage
  esp_ble_tx_power_set(ESP_BLE_PWR_TYPE_ADV, ESP_PWR_LVL_P9);

  pAdvertising = BLEDevice::getAdvertising();
  BLEDevice::startAdvertising();

  // Construct iBeacon Packet
  setBeacon();

  Serial.println("[BLE] Advertising active. Broadcasting classroom presence packets...");
}

void setBeacon() {
  BLEBeacon oBeacon = BLEBeacon();
  oBeacon.setManufacturerId(0x4C00); // 0x4C00 = Apple Inc. (iBeacon standard)
  
  BLEUUID bleUUID = BLEUUID(BEACON_UUID_STR);
  bleUUID = bleUUID.to128();
  oBeacon.setProximityUUID(bleUUID);
  oBeacon.setMajor(BEACON_MAJOR);
  oBeacon.setMinor(BEACON_MINOR);
  oBeacon.setSignalPower(TX_POWER_DBM);

  BLEAdvertisementData oAdvertisementData = BLEAdvertisementData();
  BLEAdvertisementData oScanResponseData = BLEAdvertisementData();

  // Flags: BR/EDR Not Supported + General Discoverable Mode
  oAdvertisementData.setFlags(0x04 | 0x02);

  std::string strServiceData = "";
  strServiceData += (char)26;     // Length of packet
  strServiceData += (char)0xFF;   // Manufacturer Specific Data flag
  strServiceData += oBeacon.getData(); 
  oAdvertisementData.addData(strServiceData);

  // Set Local Name in Scan Response
  oScanResponseData.setName(BEACON_NAME);

  pAdvertising->setAdvertisementData(oAdvertisementData);
  pAdvertising->setScanResponseData(oScanResponseData);

  // Advertising frequency: Every 100ms (160 * 0.625ms = 100ms)
  pAdvertising->setMinInterval(0x00A0);
  pAdvertising->setMaxInterval(0x00A0);

  pAdvertising->start();
}

void loop() {
  // Beacon broadcasts continuously in the background hardware loop
  delay(5000);
  Serial.printf("[HEARTBEAT] Broadcasting active | Room: %s | Major: %d | Minor: %d\n", ROOM_NAME, BEACON_MAJOR, BEACON_MINOR);
}
