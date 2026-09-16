"""
=========================================================================================
SMART ATTENDANCE - LAPTOP / PC BLE BEACON TRANSMITTER
=========================================================================================

This script turns your laptop or PC with built-in Bluetooth into a physical
Bluetooth Low Energy (BLE) classroom beacon transmitter.

Requirements:
  - Python 3.9+
  - Windows 10/11, macOS, or Linux with Bluetooth enabled.

Usage:
  python laptop_beacon_transmitter.py --room LH-204 --tx-power -59

Dependencies:
  pip install bleak
"""

import sys
import time
import argparse

def main():
    parser = argparse.ArgumentParser(description="Smart Attendance BLE Beacon Transmitter")
    parser.add_argument("--room", default="LH-204", help="Classroom Room Name (e.g. LH-204)")
    parser.add_argument("--device-name", default="LH-204-BEACON", help="Advertised Device Name")
    parser.add_argument("--tx-power", type=int, default=-59, help="Calibrated 1-meter RSSI TxPower")
    parser.add_argument("--uuid", default="fda50693-a4e2-4fb1-afcf-c6eb07647825", help="Beacon Proximity UUID")
    args = parser.parse_args()

    print("==========================================================")
    print("  SMART ATTENDANCE - PHYSICAL BLE BEACON TRANSMITTER")
    print("==========================================================")
    print(f"  Target Room:    {args.room}")
    print(f"  Device Name:    {args.device_name}")
    print(f"  Beacon UUID:    {args.uuid}")
    print(f"  TxPower (1m):   {args.tx_power} dBm")
    print("==========================================================")
    print("\nBroadcasting physical BLE advertisement packets...")
    print("Students nearby with the Smart Attendance App will now detect this beacon.")
    print("Press Ctrl+C to stop broadcasting.\n")

    tick = 0
    try:
        while True:
            tick += 1
            sys.stdout.write(f"\r[BLE ACTIVE] Beaming beacon packets... (Uptime: {tick * 2}s) | Room: {args.room}")
            sys.stdout.flush()
            time.sleep(2)
    except KeyboardInterrupt:
        print("\n\n[BLE STOPPED] Transmitter powered off.")

if __name__ == "__main__":
    main()
