import React, { useState } from 'react';
import { 
  Radio, 
  ScanFace, 
  Sliders, 
  Bell, 
  ShieldCheck, 
  Database, 
  Check, 
  Save,
  Clock,
  Send,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  Building2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const AdminSettings: React.FC = () => {
  const { settings, updateSettings } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'ble' | 'face' | 'sla' | 'registrar' | 'roles' | 'general'
  >('ble');

  // BLE state
  const [bleRange, setBleRange] = useState(settings.bleSignalRange || 15);
  const [bleRssi, setBleRssi] = useState(settings.bleRssiThreshold || -75);

  // Biometrics state
  const [faceConfidence, setFaceConfidence] = useState(settings.faceConfidenceThreshold || 85);
  const [liveness, setLiveness] = useState(settings.livenessCheckEnabled ?? true);
  const [autoSync, setAutoSync] = useState(settings.autoSyncOffline ?? true);

  // Institutional SLA & Registrar state
  const [slaWindowHours, setSlaWindowHours] = useState(48);
  const [registrarSyncCron, setRegistrarSyncCron] = useState('Daily at 23:59 UTC');
  const [allowManualOverride, setAllowManualOverride] = useState(settings.facultyManualOverrideAllowed ?? true);

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      bleSignalRange: bleRange,
      bleRssiThreshold: bleRssi,
      faceConfidenceThreshold: faceConfidence,
      livenessCheckEnabled: liveness,
      autoSyncOffline: autoSync,
      facultyManualOverrideAllowed: allowManualOverride,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const tabs = [
    { id: 'ble', label: 'BLE Proximity & Beacons', icon: <Radio size={16} /> },
    { id: 'face', label: 'Biometrics & Anti-Spoofing', icon: <ScanFace size={16} /> },
    { id: 'sla', label: 'Leave Review SLA (48h)', icon: <Clock size={16} /> },
    { id: 'registrar', label: 'Registrar Sync Schedule', icon: <Send size={16} /> },
    { id: 'roles', label: 'Roles & Privileges', icon: <ShieldCheck size={16} /> },
    { id: 'general', label: 'Institutional Metadata', icon: <Building2 size={16} /> },
  ] as const;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {isSaved && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-amber-500" />
          <span>System configuration parameters committed and synchronized</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>Configuration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              System Settings
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Classroom beacon ranges, biometric verification thresholds, and leave policies.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 text-xs self-start md:self-auto"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Tabs + Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Tabs (4 cols) */}
        <div className="md:col-span-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition text-left cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className={activeTab === tab.id ? 'text-amber-700' : 'text-slate-400'}>
                {tab.icon}
              </div>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Settings Pane (8 cols) */}
        <div className="md:col-span-8">
          <form onSubmit={handleSave} className="space-y-5">
            {/* BLE Tab */}
            {activeTab === 'ble' && (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-heading font-bold text-slate-900 text-base">BLE Beacon Transmitter Settings</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Controls default Bluetooth Low Energy broadcast radius for faculty transmitter consoles.
                  </p>
                </div>

                {/* Range */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Default Broadcast Radius (Meters)
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-md">
                      {bleRange} meters
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    value={bleRange}
                    onChange={(e) => setBleRange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>5m (Small Seminar Room)</span>
                    <span>15m (Classroom Standard)</span>
                    <span>35m (Auditorium)</span>
                  </div>
                </div>

                {/* RSSI Threshold */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Minimum Received RSSI Threshold (dBm)
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-md">
                      {bleRssi} dBm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="-50"
                    value={bleRssi}
                    onChange={(e) => setBleRssi(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>-90 dBm (Permissive)</span>
                    <span>-75 dBm (Institutional Standard)</span>
                    <span>-50 dBm (Strict Proximity)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Face Biometrics Tab */}
            {activeTab === 'face' && (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-heading font-bold text-slate-900 text-base">Biometrics & Neural Anti-Spoofing</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thresholds for facial embedding cosine match and passive 3D liveness detection.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Minimum Cosine Match Threshold
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
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
                    Check-ins with neural confidence below this score will raise an audit flag.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Active 3D Liveness Detection</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Prevents photograph / screen replay attacks through eye-blink and micro-motion vectors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLiveness(!liveness)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      liveness ? 'bg-amber-600' : 'bg-slate-300'
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

            {/* SLA Tab */}
            {activeTab === 'sla' && (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-heading font-bold text-slate-900 text-base">Leave Review SLA Policies</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define maximum resolution windows before unreviewed student leave requests trigger administrative escalation.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Faculty Review SLA Escalation Window
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[24, 48, 72].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => setSlaWindowHours(hours)}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all ${
                          slaWindowHours === hours
                            ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {hours} Hours {hours === 48 && '(Standard)'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Applications remaining pending beyond {slaWindowHours} hours are routed directly to Dean / Super Admin override dashboard.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Faculty Manual Override Permission</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Allow instructors to manually mark students present in emergency situations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowManualOverride(!allowManualOverride)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      allowManualOverride ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        allowManualOverride ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Registrar Sync Schedule */}
            {activeTab === 'registrar' && (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-heading font-bold text-slate-900 text-base">Registrar ERP Sync Schedule</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automated batch synchronization with University Student Information System (SIS).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Sync Frequency Cadence
                  </label>
                  <select
                    value={registrarSyncCron}
                    onChange={(e) => setRegistrarSyncCron(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="Hourly">Hourly at :00</option>
                    <option value="Daily at 23:59 UTC">Daily at 23:59 UTC (End of Day)</option>
                    <option value="Weekly on Friday">Weekly on Friday 18:00 UTC</option>
                  </select>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">API Endpoint:</span>
                    <span className="font-mono text-slate-800 font-bold">https://sis.institution.edu/api/v3/attendance</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Protocol:</span>
                    <span className="font-mono text-emerald-700 font-bold">mTLS + HMAC-SHA256</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Successful Sync:</span>
                    <span className="font-mono text-slate-700">07 Sep 2026, 06:00 AM UTC</span>
                  </div>
                </div>
              </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-heading font-bold text-slate-900 text-base">Institutional Access Control Hierarchy</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Role definitions and security privileges.</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Super Administrator (Dean & Registrar Office)
                  </span>
                  <p className="text-slate-600">
                    Unrestricted CRUD access, SLA escalation overrides, BLE beacon calibration, and direct ERP synchronization.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-sm">
                    Department Head (HOD)
                  </span>
                  <p className="text-slate-600">
                    Read and analytical oversight for department lectures, leave approvals, and student probation management.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-sm">
                    Faculty Instructor
                  </span>
                  <p className="text-slate-600">
                    Broadcast BLE attendance beacon, view live roster check-ins, and initiate first-tier leave reviews.
                  </p>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-heading font-bold text-slate-900 text-base">Campus General Metadata</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Accreditation identity and academic cycle parameters.</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block uppercase tracking-wider mb-1">Institution Name</label>
                    <input
                      type="text"
                      placeholder="Enter institution name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block uppercase tracking-wider mb-1">Academic Term</label>
                    <input
                      type="text"
                      placeholder="Enter academic term (e.g. Fall Semester 2026-2027)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Save All Settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
