import React, { useState, useEffect, useRef } from 'react';
import { Radio, CheckCircle2, X, AlertCircle, Signal, Cpu, RefreshCw, Sparkles } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { 
  startPhysicalBleScan, 
  DiscoveredBleDevice, 
  isNativePlatform, 
  isWebBluetoothSupported,
  calculateEstimatedDistance
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

  const isSessionBroadcasting = activeSession && activeSession.status === 'broadcasting';

  const runScan = async () => {
    if (!isSessionBroadcasting) {
      setStatus('error');
      setStatusMessage('No active lecture broadcast found. Please wait for your instructor to start attendance.');
      return;
    }

    setStatus('searching');
    setProgress(15);
    setMatchedDevice(null);
    setDiscoveredCount(0);
    setStatusMessage('Scanning physical 2.4 GHz radio frequencies...');

    try {
      if (scanCleanupRef.current) {
        scanCleanupRef.current();
      }

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
              }, 1200);
            } else {
              setStatus('timeout');
            }
          },
          onError: (err) => {
            setStatus('error');
            setStatusMessage(err || 'Bluetooth scan failed.');
          },
        }
      );

      scanCleanupRef.current = cleanup;
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err?.message || 'Could not access Bluetooth hardware.');
    }
  };

  useEffect(() => {
    let progressTimer: any = null;
    if (status === 'searching') {
      progressTimer = setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + 8));
      }, 600);
    }

    runScan();

    return () => {
      if (progressTimer) clearInterval(progressTimer);
      if (scanCleanupRef.current) {
        scanCleanupRef.current();
      }
    };
  }, [activeSession]);

  // Explicit manual developer test override (NEVER automatic)
  const handleManualDemoSimulate = () => {
    const simRssi = -61;
    const simDist = calculateEstimatedDistance(simRssi, -59, 2.2);
    const mockDevice: DiscoveredBleDevice = {
      deviceId: `mock-beacon-${activeSession?.room || 'LH-204'}`,
      name: `Demo Beacon (${activeSession?.room || 'LH-204'})`,
      rssi: simRssi,
      txPower: -59,
      distanceMeters: simDist,
      isMatchedBeacon: true,
    };
    setMatchedDevice(mockDevice);
    setStatus('found');
    setProgress(100);
    setTimeout(() => {
      onSignalFound({
        rssi: mockDevice.rssi,
        distanceMeters: mockDevice.distanceMeters,
        deviceId: mockDevice.deviceId,
        name: mockDevice.name,
      });
    }, 1000);
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
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Center Animated Searching Radar */}
      <div className="my-auto flex flex-col items-center max-w-sm w-full">
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center mb-6">
          <div className={`absolute w-full h-full rounded-full border-2 ${status === 'searching' ? 'border-teal-200 animate-ping' : status === 'found' ? 'border-emerald-300' : 'border-slate-200'}`}></div>
          <div className={`absolute w-36 h-36 rounded-full border-2 ${status === 'searching' ? 'border-teal-300 animate-pulse' : status === 'found' ? 'border-emerald-400' : 'border-slate-200'}`}></div>
          <div className={`absolute w-24 h-24 rounded-full border ${status === 'searching' ? 'border-teal-400' : status === 'found' ? 'border-emerald-500' : 'border-slate-300'}`}></div>

          <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center shadow-xl relative z-10 ${
            status === 'found'
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30'
              : status === 'timeout' || status === 'error'
              ? 'bg-gradient-to-tr from-slate-400 to-slate-500 shadow-slate-400/20'
              : 'bg-gradient-to-tr from-teal-500 to-indigo-600 shadow-teal-500/30 animate-bounce'
          }`}>
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
                <span>{discoveredCount} radio signal{discoveredCount > 1 ? 's' : ''} detected</span>
              </div>
            )}
          </div>
        )}

        {status === 'found' && (
          <div className="w-full p-4 rounded-3xl bg-emerald-50/90 border border-emerald-200 shadow-md space-y-2.5 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs">
              <CheckCircle2 size={16} />
              <span>Physical Signal Authenticated!</span>
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
              Verified inside classroom perimeter. Launching biometric verification...
            </p>
          </div>
        )}

        {status === 'timeout' && (
          <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold text-xs">
              <AlertCircle size={16} />
              <span>Classroom Beacon Not Detected</span>
            </div>
            <p className="text-xs text-amber-800 px-2 leading-relaxed">
              No physical BLE beacon detected for <strong>Room {activeSession?.room || 'LH-204'}</strong> within proximity (&lt;15m). Attendance cannot be verified unless your instructor is broadcasting.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={runScan}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw size={13} />
                <span>Retry Physical Scan</span>
              </button>

              <button
                onClick={handleManualDemoSimulate}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline transition cursor-pointer pt-1 flex items-center justify-center gap-1"
                title="Only use if you do not have physical hardware transmitters nearby"
              >
                <Sparkles size={11} className="text-amber-500" />
                <span>[Test Mode] Simulate In-Room Beacon</span>
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="w-full p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-center gap-1.5 text-rose-800 font-bold text-xs">
              <AlertCircle size={16} />
              <span>Bluetooth Verification Failed</span>
            </div>
            <p className="text-xs text-rose-700 px-2 leading-relaxed">
              {statusMessage}
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={runScan}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw size={13} />
                <span>Try Again</span>
              </button>

              <button
                onClick={handleManualDemoSimulate}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline transition cursor-pointer pt-1 flex items-center justify-center gap-1"
              >
                <Sparkles size={11} className="text-amber-500" />
                <span>[Test Mode] Simulate In-Room Beacon</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Progress Bar & Cancel Link */}
      <div className="w-full max-w-sm space-y-3">
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              status === 'found' ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-500 to-indigo-600'
            }`}
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
