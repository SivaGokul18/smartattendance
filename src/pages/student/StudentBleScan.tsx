import React, { useState, useEffect, useRef } from 'react';
import { Radio, CheckCircle2, X, AlertCircle, Signal, Cpu, RefreshCw } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { 
  startPhysicalBleScan, 
  DiscoveredBleDevice, 
  isNativePlatform, 
  isWebBluetoothSupported 
} from '../../services/bleScanner';

export interface BleScanResult {
  rssi: number;
  distanceMeters: number;
  deviceId: string;
  name?: string;
}

interface StudentBleScanProps {
  onSignalFound: (data?: BleScanResult) => void;
  onCancel: () => void;
}

export const StudentBleScan: React.FC<StudentBleScanProps> = ({ onSignalFound, onCancel }) => {
  const { activeSession } = useSessionStore();
  const [status, setStatus] = useState<'searching' | 'found' | 'error' | 'timeout'>('searching');
  const [statusMessage, setStatusMessage] = useState('Initializing Bluetooth radio...');
  const [progress, setProgress] = useState(15);
  const [matchedDevice, setMatchedDevice] = useState<DiscoveredBleDevice | null>(null);
  const [discoveredCount, setDiscoveredCount] = useState(0);

  const isNative = isNativePlatform();
  const isWebBle = isWebBluetoothSupported();
  const scanCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let progressTimer: any = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + 8));
    }, 500);

    // Start physical BLE scan
    const startScan = async () => {
      try {
        const cleanup = await startPhysicalBleScan(
          {
            roomName: activeSession?.room || 'LH-204',
            beaconUuid: activeSession?.id,
            rssiThreshold: -75.0,
            scanTimeoutSeconds: 10,
          },
          {
            onStatusChange: (scanStatus, msg) => {
              if (msg) setStatusMessage(msg);
              if (scanStatus === 'error') {
                setStatus('error');
              } else if (scanStatus === 'timeout') {
                setStatus('timeout');
              }
            },
            onDeviceFound: (device) => {
              setDiscoveredCount((prev) => prev + 1);
              if (device.isMatchedBeacon) {
                setMatchedDevice(device);
              }
            },
            onScanComplete: (finalDevice) => {
              if (finalDevice) {
                setMatchedDevice(finalDevice);
                setStatus('found');
                setProgress(100);

                setTimeout(() => {
                  onSignalFound({
                    rssi: finalDevice.rssi,
                    distanceMeters: finalDevice.distanceMeters,
                    deviceId: finalDevice.deviceId,
                    name: finalDevice.name,
                  });
                }, 1400);
              } else {
                setStatus('timeout');
              }
            },
            onError: (err) => {
              setStatus('error');
              setStatusMessage(err || 'Bluetooth scan error');
            },
          }
        );

        scanCleanupRef.current = cleanup;
      } catch (err: any) {
        setStatus('error');
        setStatusMessage(err?.message || 'Failed to initialize hardware Bluetooth scan');
      }
    };

    startScan();

    return () => {
      clearInterval(progressTimer);
      if (scanCleanupRef.current) {
        scanCleanupRef.current();
      }
    };
  }, [activeSession, onSignalFound]);

  const handleRetry = () => {
    setStatus('searching');
    setProgress(15);
    setMatchedDevice(null);
    setStatusMessage('Re-scanning Bluetooth radio...');
  };

  return (
    <div className="flex-1 p-6 flex flex-col justify-between items-center text-center bg-white text-slate-900">
      {/* Top Header */}
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 flex items-center gap-1">
            <Cpu size={12} className="text-teal-600" />
            <span>
              {isNative ? 'Native Hardware BLE' : isWebBle ? 'Web Bluetooth Active' : 'Beacon Proximity Scan'}
            </span>
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Center Animated Searching Radar */}
      <div className="my-auto flex flex-col items-center max-w-sm w-full">
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center mb-6">
          <div className="absolute w-full h-full rounded-full border-2 border-teal-200 animate-ping"></div>
          <div className="absolute w-36 h-36 rounded-full border-2 border-teal-300 animate-pulse"></div>
          <div className="absolute w-24 h-24 rounded-full border border-teal-400"></div>

          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-teal-500/30 relative z-10 animate-bounce">
            <Radio size={30} className="text-white" />
          </div>
        </div>

        {status === 'searching' && (
          <div className="space-y-2">
            <h3 className="text-base font-black text-slate-900">
              Scanning Classroom BLE Radio...
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed px-4">
              {statusMessage}
            </p>
            {discoveredCount > 0 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[11px] font-semibold">
                <Signal size={12} />
                <span>{discoveredCount} BLE radio broadcast{discoveredCount > 1 ? 's' : ''} sensed</span>
              </div>
            )}
          </div>
        )}

        {status === 'found' && (
          <div className="w-full p-4 rounded-3xl bg-emerald-50/90 border border-emerald-200 shadow-md space-y-2.5 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs">
              <CheckCircle2 size={16} />
              <span>Physical Signal Found & Authenticated!</span>
            </div>

            <h4 className="text-sm font-black text-slate-900">
              {activeSession?.subjectName || 'Classroom Lecture'}
            </h4>

            <div className="flex items-center justify-center gap-3 text-xs font-mono text-slate-700 bg-white/80 py-1.5 px-3 rounded-xl border border-emerald-200/60">
              <span className="font-semibold text-teal-800">
                Room {activeSession?.room || 'LH-204'}
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">
                {matchedDevice?.rssi ?? -62} dBm
              </span>
              <span>•</span>
              <span className="text-indigo-700 font-bold">
                ~{matchedDevice?.distanceMeters ?? 1.8}m
              </span>
            </div>

            <p className="text-[11px] text-emerald-800 font-medium">
              Proximity verified within room perimeter. Launching biometric verification...
            </p>
          </div>
        )}

        {status === 'timeout' && (
          <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold text-xs">
              <AlertCircle size={16} />
              <span>Classroom Beacon Out of Range</span>
            </div>
            <p className="text-xs text-amber-700">
              No active BLE beacon signal detected for Room {activeSession?.room || 'LH-204'}. Please ensure you are physically inside the lecture hall.
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Retry Physical Scan</span>
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="w-full p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-center gap-1.5 text-rose-800 font-bold text-xs">
              <AlertCircle size={16} />
              <span>Bluetooth Hardware Notice</span>
            </div>
            <p className="text-xs text-rose-700 px-2">
              {statusMessage}
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Progress Bar & Cancel Link */}
      <div className="w-full max-w-sm space-y-3">
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-900 transition font-medium cursor-pointer"
        >
          Cancel Search
        </button>
      </div>
    </div>
  );
};
