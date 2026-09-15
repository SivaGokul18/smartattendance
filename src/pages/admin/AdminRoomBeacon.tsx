import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Wifi, 
  Battery, 
  BatteryMedium, 
  BatteryLow, 
  Cpu, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Settings2, 
  Signal, 
  Sliders, 
  MapPin, 
  X, 
  Activity, 
  Zap, 
  Trash2 
} from 'lucide-react';
import { adminApi } from '../../api/client';

interface BeaconDevice {
  id: string;
  roomName: string;
  roomType: 'Lecture Hall' | 'Laboratory' | 'Auditorium' | 'Seminar Hall';
  beaconUuid: string;
  major: number;
  minor: number;
  powerTier: 'Near (5m)' | 'Classroom (15m)' | 'Auditorium (30m)';
  txPowerDbm: number;
  batteryLevel: number;
  status: 'active' | 'low_battery' | 'offline';
  lastPingAt: string;
  firmwareVersion: string;
}

export const AdminRoomBeacon: React.FC = () => {
  const [beacons, setBeacons] = useState<BeaconDevice[]>([]);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [selectedBeacon, setSelectedBeacon] = useState<BeaconDevice | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form for new beacon
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<BeaconDevice['roomType']>('Lecture Hall');
  const [newPowerTier, setNewPowerTier] = useState<BeaconDevice['powerTier']>('Classroom (15m)');
  const [newMinor, setNewMinor] = useState(210);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchRooms = async () => {
    try {
      const rooms = await adminApi.getRooms();
      if (rooms && Array.isArray(rooms)) {
        const mapped: BeaconDevice[] = rooms.map((r, idx) => ({
          id: r.id,
          roomName: r.name,
          roomType: (r.name.toLowerCase().includes('lab') ? 'Laboratory' : r.name.toLowerCase().includes('aud') ? 'Auditorium' : 'Lecture Hall') as any,
          beaconUuid: r.beaconUuid,
          major: 100,
          minor: 200 + (idx + 1) * 10,
          powerTier: (r.defaultTxPower >= -8 ? 'Auditorium (30m)' : r.defaultTxPower >= -14 ? 'Classroom (15m)' : 'Near (5m)') as any,
          txPowerDbm: r.defaultTxPower,
          batteryLevel: 98,
          status: 'active',
          lastPingAt: 'Just now',
          firmwareVersion: 'v2.4.1-ble5',
        }));
        setBeacons(mapped);
      }
    } catch (e) {
      console.warn('Failed to load rooms from backend:', e);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleTestPing = (beaconId: string) => {
    setPingingId(beaconId);
    setTimeout(() => {
      setPingingId(null);
      setBeacons(prev => prev.map(b => b.id === beaconId ? { ...b, lastPingAt: 'Just now' } : b));
      showToast('BLE Beacon ping acknowledged - RSSI: -54 dBm (Normal)');
    }, 1200);
  };

  const handleUpdatePowerTier = (beaconId: string, tier: BeaconDevice['powerTier']) => {
    const tx = tier.startsWith('Near') ? -18 : tier.startsWith('Classroom') ? -12 : -4;
    setBeacons(prev => prev.map(b => b.id === beaconId ? { ...b, powerTier: tier, txPowerDbm: tx } : b));
    adminApi.updateRoom(beaconId, { defaultTxPower: tx }).catch(console.warn);
    showToast(`Transmission power updated to ${tier}`);
  };

  const handleDeleteBeacon = (beaconId: string, roomName: string) => {
    adminApi.deleteRoom(beaconId).then(() => {
      setBeacons(prev => prev.filter(b => b.id !== beaconId));
      showToast(`Beacon node for "${roomName}" removed successfully.`);
    }).catch((err) => {
      console.warn(err);
      showToast(`Failed to delete room: ${err.message}`);
    });
  };

  const handleAddBeacon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const tx = newPowerTier.startsWith('Near') ? -18 : newPowerTier.startsWith('Classroom') ? -12 : -4;
    const generatedUuid = `fda50693-a4e2-4fb1-afcf-${Date.now().toString(16).slice(-12).padStart(12, '0')}`;
    const capacity = newRoomType === 'Auditorium' ? 250 : newRoomType === 'Laboratory' ? 40 : 60;

    adminApi.createRoom({
      name: newRoomName.trim(),
      beaconUuid: generatedUuid,
      capacity,
      defaultTxPower: tx,
    }).then(() => {
      fetchRooms();
      setIsAddModalOpen(false);
      setNewRoomName('');
      showToast(`Beacon node paired and saved for "${newRoomName}"`);
    }).catch((err) => {
      console.warn(err);
      showToast(`Failed to pair beacon: ${err.message}`);
    });
  };

  const activeCount = beacons.filter(b => b.status === 'active').length;
  const warningCount = beacons.filter(b => b.status === 'low_battery').length;
  const offlineCount = beacons.filter(b => b.status === 'offline').length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mb-2">
              <Radio className="w-3.5 h-3.5" />
              <span>Hardware</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Classroom Beacons
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Classroom Bluetooth transmitters, coverage range, and battery levels.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 text-xs self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Beacon</span>
          </button>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Beacons</span>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{beacons.length}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Online</span>
            <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">{activeCount}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Battery Alert</span>
            <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">{warningCount}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Offline</span>
            <div className="text-lg font-bold text-rose-700 font-mono mt-0.5">{offlineCount}</div>
          </div>
        </div>
      </div>

      {/* Beacon Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {beacons.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
            <Radio className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-slate-900 text-sm">No beacon hardware nodes registered</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Click &quot;Add Beacon&quot; above to deploy classroom micro-location transmitters.</p>
          </div>
        ) : (
          beacons.map((beacon) => {
            const isPinging = pingingId === beacon.id;

            return (
            <div
              key={beacon.id}
              className={`bg-white rounded-2xl p-5 border transition-all ${
                beacon.status === 'offline'
                  ? 'border-rose-200 bg-rose-50/20'
                  : beacon.status === 'low_battery'
                  ? 'border-amber-300 bg-amber-50/10 shadow-sm'
                  : 'border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400/60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      beacon.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : beacon.status === 'low_battery'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        beacon.status === 'active' ? 'bg-emerald-500 animate-pulse' : beacon.status === 'low_battery' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      {beacon.status === 'active' ? 'Broadcasting' : beacon.status === 'low_battery' ? 'Low Battery' : 'Offline'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{beacon.roomType}</span>
                  </div>
                  <h3 className="font-heading font-bold text-slate-900 text-base mt-1">
                    {beacon.roomName}
                  </h3>
                </div>

                {/* Battery Status */}
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {beacon.batteryLevel > 50 ? (
                    <Battery className="w-4 h-4 text-emerald-600" />
                  ) : beacon.batteryLevel > 20 ? (
                    <BatteryMedium className="w-4 h-4 text-amber-600" />
                  ) : (
                    <BatteryLow className="w-4 h-4 text-rose-600" />
                  )}
                  <span className={`text-xs font-mono font-bold ${
                    beacon.batteryLevel < 25 ? 'text-rose-600' : 'text-slate-700'
                  }`}>
                    {beacon.batteryLevel}%
                  </span>
                </div>
              </div>

              {/* Hardware identifiers */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 font-mono text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Major : Minor</span>
                  <span className="font-bold text-slate-800">{beacon.major} : {beacon.minor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Firmware</span>
                  <span className="text-slate-700">{beacon.firmwareVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Telemetry</span>
                  <span className="text-slate-700">{beacon.lastPingAt}</span>
                </div>
              </div>

              {/* Transmission Power Selector */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  RF Transmission Power (Range)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Near (5m)', 'Classroom (15m)', 'Auditorium (30m)'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => handleUpdatePowerTier(beacon.id, tier)}
                      className={`px-2 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                        beacon.powerTier === tier
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Tx: {beacon.txPowerDbm} dBm
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestPing(beacon.id)}
                    disabled={isPinging || beacon.status === 'offline'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isPinging 
                        ? 'bg-amber-100 text-amber-900 cursor-wait' 
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-400 active:scale-95 shadow-sm'
                    } disabled:opacity-50`}
                  >
                    <Activity className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-amber-600' : ''}`} />
                    <span>{isPinging ? 'Pinging...' : 'Ping'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteBeacon(beacon.id, beacon.roomName)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95"
                    title="Unpair and remove beacon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>

      {/* Add Beacon Node Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-bold text-lg">Pair Hardware Beacon Node</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBeacon} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Room Name / Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Design Studio 14"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Room Type
                  </label>
                  <select
                    value={newRoomType}
                    onChange={(e: any) => setNewRoomType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Auditorium">Auditorium</option>
                    <option value="Seminar Hall">Seminar Hall</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Minor Code (Room #)
                  </label>
                  <input
                    type="number"
                    value={newMinor}
                    onChange={(e) => setNewMinor(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default RF Power Range
                </label>
                <select
                  value={newPowerTier}
                  onChange={(e: any) => setNewPowerTier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="Near (5m)">Near (5m - Labs & Small Rooms)</option>
                  <option value="Classroom (15m)">Classroom (15m - Standard Classrooms)</option>
                  <option value="Auditorium (30m)">Auditorium (30m - Open Halls)</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Automated Pairing</span>
                The beacon will automatically register with Proximity UUID <span className="font-mono font-semibold">fda50693...</span> and run self-diagnostics.
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  Pair & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
