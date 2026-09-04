import React, { useState } from 'react';
import { 
  Radio, 
  ScanFace, 
  Sliders, 
  Bell, 
  ShieldCheck, 
  Database, 
  Check, 
  Save 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const AdminSettings: React.FC = () => {
  const { settings, updateSettings } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'general' | 'ble' | 'face' | 'notif' | 'roles' | 'backup'
  >('ble');

  const [bleRange, setBleRange] = useState(settings.bleSignalRange);
  const [bleRssi, setBleRssi] = useState(settings.bleRssiThreshold);
  const [faceConfidence, setFaceConfidence] = useState(settings.faceConfidenceThreshold);
  const [liveness, setLiveness] = useState(settings.livenessCheckEnabled);
  const [autoSync, setAutoSync] = useState(settings.autoSyncOffline);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      bleSignalRange: bleRange,
      bleRssiThreshold: bleRssi,
      faceConfidenceThreshold: faceConfidence,
      livenessCheckEnabled: liveness,
      autoSyncOffline: autoSync,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const tabs = [
    { id: 'general', label: 'General Institution', icon: <Sliders size={16} /> },
    { id: 'ble', label: 'BLE Proximity Configuration', icon: <Radio size={16} /> },
    { id: 'face', label: 'Face Biometrics & Liveness', icon: <ScanFace size={16} /> },
    { id: 'notif', label: 'Push Notifications', icon: <Bell size={16} /> },
    { id: 'roles', label: 'Roles & Permissions', icon: <ShieldCheck size={16} /> },
    { id: 'backup', label: 'Database Backup & Export', icon: <Database size={16} /> },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Fine-tune beacon broadcast parameters, neural vector confidence thresholds, and institutional security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Tab List (4 cols) */}
        <div className="md:col-span-4 space-y-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full p-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition text-left cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 shadow-xs'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Settings Cards (8 cols) */}
        <div className="md:col-span-8">
          <form onSubmit={handleSave} className="space-y-5">
            {activeTab === 'ble' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base">BLE Beacon Transmitter Settings</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Controls the Bluetooth Low Energy broadcast radius for faculty devices.
                  </p>
                </div>

                {/* Signal Range Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Classroom Radius Range (Meters)
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {bleRange} meters
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    value={bleRange}
                    onChange={(e) => setBleRange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>5m (Small Seminar Room)</span>
                    <span>20m (Standard LH)</span>
                    <span>35m (Auditorium)</span>
                  </div>
                </div>

                {/* RSSI Threshold Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Minimum RSSI Signal Threshold (dBm)
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {bleRssi} dBm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="-50"
                    value={bleRssi}
                    onChange={(e) => setBleRssi(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>-90 dBm (Permissive)</span>
                    <span>-75 dBm (Recommended)</span>
                    <span>-50 dBm (Ultra-Strict Proximity)</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'face' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base">Face Biometrics & Anti-Spoofing</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thresholds for facial embedding cosine match and active 3D liveness detection.
                  </p>
                </div>

                {/* Face Confidence Threshold Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Confidence Match Threshold
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {faceConfidence}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="98"
                    value={faceConfidence}
                    onChange={(e) => setFaceConfidence(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Reject attendance logs if neural model confidence falls below this value.
                  </p>
                </div>

                {/* Liveness Check Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Active 3D Liveness Detection</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Prevents photo/screen playback spoofing via eye-blink and micro-motion checks.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLiveness(!liveness)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      liveness ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        liveness ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-base">Campus General Settings</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Institution Name</label>
                    <input
                      type="text"
                      defaultValue="AttendEase University of Engineering & Tech"
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Academic Term</label>
                    <input
                      type="text"
                      defaultValue="Fall Semester 2026-2027"
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notif' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-base">Notification Triggers</h3>
                <div className="space-y-3">
                  {[
                    'Instant SMS/Push when attendance is recorded',
                    'Daily attendance deficit summary to Dean',
                    'Beacon hardware battery low warnings',
                  ].map((label, idx) => (
                    <label key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-300 focus:ring-indigo-500" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-base">Access Control Levels</h3>
                <p className="text-slate-500">Manage administrator privileges and faculty broadcast overrides.</p>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-900">Super Admin (IT Office):</span>
                  <span className="text-slate-600 block mt-1">Full database read/write and cryptographic key access</span>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-base">Automated Backup & Cryptographic Vault</h3>
                <p className="text-slate-500">Daily snapshot exports to encrypted Amazon S3 cold storage.</p>
                <button
                  type="button"
                  onClick={() => alert('Backup snapshot created successfully.')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-200 transition cursor-pointer"
                >
                  Trigger Instant Backup Now
                </button>
              </div>
            )}

            {/* Sticky Save Changes Button */}
            <div className="sticky bottom-6 bg-white/95 backdrop-blur p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Unsaved modifications will affect live campus hardware.
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check size={14} />
                    <span>Saved Changes</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
