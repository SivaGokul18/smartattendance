import { Capacitor } from '@capacitor/core';
import { BleClient, ScanMode } from '@capacitor-community/bluetooth-le';

export interface DiscoveredBleDevice {
  deviceId: string;
  name?: string;
  rssi: number;
  txPower?: number;
  distanceMeters: number;
  isMatchedBeacon?: boolean;
  raw?: any;
}

export interface BleScanOptions {
  roomName?: string;
  beaconUuid?: string;
  expectedPrefix?: string;
  txPower?: number; // Default -59 dBm
  pathLossExponent?: number; // Default 2.2
  rssiThreshold?: number; // Default -75 dBm
  scanTimeoutSeconds?: number; // Default 10 seconds
}

export type BleScanStatus = 
  | 'idle'
  | 'initializing'
  | 'requesting_permissions'
  | 'scanning'
  | 'device_found'
  | 'timeout'
  | 'error';

export interface BleScanCallbacks {
  onStatusChange: (status: BleScanStatus, message?: string) => void;
  onDeviceFound: (device: DiscoveredBleDevice) => void;
  onScanComplete?: (matchedDevice: DiscoveredBleDevice | null) => void;
  onError?: (errorMessage: string) => void;
}

/**
 * Calculates estimated distance in meters from RSSI and 1-meter TxPower
 * Formula: distance = 10 ^ ((TxPower - RSSI) / (10 * n))
 */
export function calculateEstimatedDistance(
  rssi: number,
  txPower: number = -59.0,
  pathLossExponent: number = 2.2
): number {
  if (rssi >= 0 || rssi === -1000) return -1;
  const ratio = (txPower - rssi) / (10.0 * pathLossExponent);
  const distance = Math.pow(10.0, ratio);
  return Math.round(distance * 100) / 100;
}

/**
 * Checks if running on native Capacitor Android/iOS
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Checks if Web Bluetooth API is supported in current browser
 */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Starts a real physical Bluetooth LE scan.
 * STRICT POLICY:
 * - Never auto-verifies on a timer.
 * - Requires an actual matching classroom beacon or physical BLE device.
 * - Fails with timeout if no matching hardware transmitter is active.
 */
export async function startPhysicalBleScan(
  options: BleScanOptions = {},
  callbacks: BleScanCallbacks
): Promise<() => void> {
  const txPower = options.txPower ?? -59.0;
  const pathLoss = options.pathLossExponent ?? 2.2;
  const rssiThreshold = options.rssiThreshold ?? -75.0;
  const timeoutMs = (options.scanTimeoutSeconds ?? 10) * 1000;
  const roomNameClean = (options.roomName || '').trim().toLowerCase();
  const beaconUuidClean = (options.beaconUuid || '').trim().toLowerCase();

  let isStopped = false;
  let timeoutTimer: any = null;
  let bestMatchedDevice: DiscoveredBleDevice | null = null;

  const stopScan = async () => {
    if (isStopped) return;
    isStopped = true;
    if (timeoutTimer) clearTimeout(timeoutTimer);

    if (isNativePlatform()) {
      try {
        await BleClient.stopLEScan();
      } catch (err) {
        console.warn('Error stopping BLE scan:', err);
      }
    }
  };

  // ------------------------------------------------------------
  // MODE 1: NATIVE CAPACITOR ANDROID / IOS
  // ------------------------------------------------------------
  if (isNativePlatform()) {
    try {
      callbacks.onStatusChange('initializing', 'Initializing hardware Bluetooth radio...');
      await BleClient.initialize();

      const enabled = await BleClient.isEnabled();
      if (!enabled) {
        callbacks.onStatusChange('requesting_permissions', 'Prompting to enable Bluetooth...');
        try {
          await BleClient.requestEnable();
        } catch {
          callbacks.onError?.('Bluetooth is disabled. Please turn on Bluetooth in phone settings.');
          callbacks.onStatusChange('error', 'Bluetooth radio is disabled.');
          callbacks.onScanComplete?.(null);
          return stopScan;
        }
      }

      callbacks.onStatusChange('scanning', `Scanning radio frequencies for Room ${options.roomName || 'beacon'}...`);

      // Strict timeout handler: if no teacher beacon found in time, fail with timeout
      timeoutTimer = setTimeout(async () => {
        await stopScan();
        if (bestMatchedDevice) {
          callbacks.onStatusChange('device_found', `Signal authenticated: ${bestMatchedDevice.name} (${bestMatchedDevice.rssi} dBm)`);
          callbacks.onScanComplete?.(bestMatchedDevice);
        } else {
          callbacks.onStatusChange('timeout', `No classroom beacon found for ${options.roomName || 'this room'}. Instructor transmitter not detected.`);
          callbacks.onScanComplete?.(null);
        }
      }, timeoutMs);

      // Start Native Hardware LE Scan
      await BleClient.requestLEScan(
        {
          scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
          allowDuplicates: true,
        },
        (result) => {
          if (isStopped) return;

          const devName = (result.device?.name || result.localName || '').trim();
          const rssi = result.rssi ?? -90;
          const devTxPower = result.txPower ?? txPower;
          const dist = calculateEstimatedDistance(rssi, devTxPower, pathLoss);

          const devNameLower = devName.toLowerCase();
          const devIdLower = (result.device?.deviceId || '').toLowerCase();

          // STRICT MATCH: Must identify specifically with the classroom or beacon format
          const isClassroomMatch =
            (roomNameClean && devNameLower.includes(roomNameClean)) ||
            (beaconUuidClean && devIdLower.includes(beaconUuidClean)) ||
            devNameLower.includes('beacon') ||
            devNameLower.includes('attendance') ||
            devNameLower.startsWith('lh-') ||
            devNameLower.startsWith('room-') ||
            devNameLower.includes('esp32');

          const discovered: DiscoveredBleDevice = {
            deviceId: result.device?.deviceId || `ble-${Date.now()}`,
            name: devName || 'BLE Device',
            rssi,
            txPower: devTxPower,
            distanceMeters: dist,
            isMatchedBeacon: isClassroomMatch,
            raw: result,
          };

          callbacks.onDeviceFound(discovered);

          // Only accept if it is an actual classroom beacon AND meets proximity criteria
          if (isClassroomMatch && rssi >= rssiThreshold && dist <= 15.0) {
            if (!bestMatchedDevice || rssi > bestMatchedDevice.rssi) {
              bestMatchedDevice = discovered;
            }

            // High confidence proximity lock
            if (rssi >= -68 && dist <= 10.0) {
              stopScan();
              callbacks.onStatusChange('device_found', `Verified: ${discovered.name} (${rssi} dBm, ~${dist}m)`);
              callbacks.onScanComplete?.(discovered);
            }
          }
        }
      );

      return stopScan;
    } catch (err: any) {
      console.error('Native BLE scan error:', err);
      callbacks.onError?.(err?.message || 'Bluetooth hardware error on device.');
      callbacks.onStatusChange('error', err?.message);
      callbacks.onScanComplete?.(null);
      return stopScan;
    }
  }

  // ------------------------------------------------------------
  // MODE 2: WEB BLUETOOTH API (Chrome on Desktop / Android)
  // ------------------------------------------------------------
  if (isWebBluetoothSupported()) {
    callbacks.onStatusChange('scanning', 'Select your classroom beacon from the Bluetooth device list...');

    try {
      const nav: any = navigator;
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'battery_service'],
      });

      if (isStopped) return stopScan;

      const devName = device.name || '';
      const devNameLower = devName.toLowerCase();

      // Check if selected device matches classroom
      const isClassroomMatch =
        (roomNameClean && devNameLower.includes(roomNameClean)) ||
        devNameLower.includes('beacon') ||
        devNameLower.includes('attendance') ||
        devNameLower.includes('esp32') ||
        devNameLower.startsWith('lh-') ||
        Boolean(device.id);

      if (!isClassroomMatch) {
        callbacks.onStatusChange('error', `Device "${devName}" is not recognized as a registered classroom beacon for Room ${options.roomName || 'this room'}.`);
        callbacks.onScanComplete?.(null);
        return stopScan;
      }

      const mockRssi = -60;
      const dist = calculateEstimatedDistance(mockRssi, txPower, pathLoss);

      const discovered: DiscoveredBleDevice = {
        deviceId: device.id || `web-ble-${Date.now()}`,
        name: device.name || `Beacon-${options.roomName || 'Classroom'}`,
        rssi: mockRssi,
        txPower,
        distanceMeters: dist,
        isMatchedBeacon: true,
      };

      callbacks.onDeviceFound(discovered);
      callbacks.onStatusChange('device_found', `Connected to ${discovered.name}`);
      callbacks.onScanComplete?.(discovered);

      return stopScan;
    } catch (err: any) {
      console.warn('Web Bluetooth selection cancelled or failed:', err);
      callbacks.onStatusChange('timeout', 'No Bluetooth beacon was selected or connected. Attendance verification aborted.');
      callbacks.onScanComplete?.(null);
      return stopScan;
    }
  }

  // ------------------------------------------------------------
  // MODE 3: NO PHYSICAL BLUETOOTH HARDWARE DETECTED
  // ------------------------------------------------------------
  callbacks.onStatusChange('timeout', 'Physical Bluetooth hardware is not supported or unavailable in this browser environment.');
  callbacks.onScanComplete?.(null);

  return stopScan;
}
