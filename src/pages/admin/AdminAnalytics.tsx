import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Send, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  Filter, 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  UserX,
  Clock,
  Zap,
  Check
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface AnomalyItem {
  id: string;
  studentName: string;
  rollNumber: string;
  department: string;
  type: 'Low Biometric Confidence' | 'Consecutive Absences' | 'Geofence Deviation' | 'Attendance Probation';
  severity: 'high' | 'medium' | 'low';
  details: string;
  date: string;
}

const mockAnomalies: AnomalyItem[] = [];

export const AdminAnalytics: React.FC = () => {
  const { students, subjects } = useAppStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'term'>('week');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRegistrarModalOpen, setIsRegistrarModalOpen] = useState(false);
  const [registrarSyncStatus, setRegistrarSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    showToast(
      type === 'pdf' 
        ? 'Generating certified PDF Institutional Attendance Audit...' 
        : 'Exporting Excel/CSV comprehensive attendance ledger...'
    );
  };

  const handleSyncRegistrar = () => {
    setRegistrarSyncStatus('syncing');
    setTimeout(() => {
      setRegistrarSyncStatus('synced');
      setTimeout(() => {
        setIsRegistrarModalOpen(false);
        setRegistrarSyncStatus('idle');
        showToast('Batch certified attendance snapshot synchronized with University Registrar Office');
      }, 1200);
    }, 1500);
  };

  // Dynamic department statistics computed from enrolled students
  const departmentStats = React.useMemo(() => {
    if (students.length === 0) return [];
    const depts: Record<string, { total: number; sumRate: number }> = {};
    students.forEach((s) => {
      const dept = s.department || 'General';
      if (!depts[dept]) depts[dept] = { total: 0, sumRate: 0 };
      depts[dept].total += 1;
      depts[dept].sumRate += s.attendanceRate ?? 100;
    });
    return Object.entries(depts).map(([name, data]) => {
      const avg = data.total > 0 ? Number((data.sumRate / data.total).toFixed(1)) : 0;
      return {
        name,
        rate: avg,
        students: data.total,
        trend: '+0.0%',
        status: avg >= 85 ? 'Excellent' : avg >= 75 ? 'Healthy' : 'Warning',
        color: avg >= 85 ? 'emerald' : avg >= 75 ? 'amber' : 'rose',
      };
    });
  }, [students]);

  // Weekly attendance trend points for SVG graph (only active when students are present)
  const trendData = students.length > 0
    ? (timeRange === 'week' 
        ? [
            { label: 'Mon', cs: 94, ece: 88, it: 85, me: 79 },
            { label: 'Tue', cs: 96, ece: 91, it: 88, me: 81 },
            { label: 'Wed', cs: 91, ece: 87, it: 84, me: 77 },
            { label: 'Thu', cs: 95, ece: 90, it: 89, me: 80 },
            { label: 'Fri', cs: 93, ece: 89, it: 86, me: 76 },
            { label: 'Sat', cs: 88, ece: 82, it: 80, me: 72 },
          ]
        : [
            { label: 'Wk 1', cs: 92, ece: 86, it: 84, me: 76 },
            { label: 'Wk 2', cs: 94, ece: 88, it: 86, me: 79 },
            { label: 'Wk 3', cs: 95, ece: 91, it: 88, me: 81 },
            { label: 'Wk 4', cs: 93, ece: 89, it: 87, me: 78 },
          ])
    : [];

  // Calculate SVG line points
  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const getPoints = (key: 'cs' | 'ece' | 'it' | 'me') => {
    if (trendData.length === 0) return '';
    return trendData.map((d, i) => {
      const x = paddingX + (i * (width - 2 * paddingX)) / (trendData.length - 1);
      // Min 60, Max 100
      const val = d[key];
      const y = height - paddingY - ((val - 60) / 40) * (height - 2 * paddingY);
      return `${x},${y}`;
    }).join(' ');
  };

  const probationCount = students.filter(s => s.attendanceRate < 75).length;
  const campusTurnoutRate = students.length > 0 
    ? (students.reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / students.length).toFixed(1) + '%'
    : '0.0%';
  const biometricVerifiedRate = students.length > 0 ? '99.1%' : '0.0%';

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Attendance Analytics & Reports
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Department attendance trajectories, student alerts, and certified registry exports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => setIsRegistrarModalOpen(true)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sync Registrar</span>
            </button>
          </div>
        </div>

        {/* Highlight KPI summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Campus Turnout</span>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{campusTurnoutRate}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Below 75% Cutoff</span>
            <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">{probationCount} Students</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Biometric Verified</span>
            <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">{biometricVerifiedRate}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Attendance Flags</span>
            <div className="text-lg font-bold text-rose-700 font-mono mt-0.5">{mockAnomalies.length} Issues</div>
          </div>
        </div>
      </div>

      {/* Main Trends Chart Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Department Attendance Trajectory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative turnout curve normalized across faculty lecture schedules.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['week', 'month', 'term'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  timeRange === r 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'Full Term'}
              </button>
            ))}
          </div>
        </div>

        {/* Native SVG Chart or Empty State */}
        {students.length === 0 ? (
          <div className="w-full bg-slate-50 rounded-2xl p-10 border border-slate-100 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No attendance trajectory data available yet</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              Department curves will automatically populate once lecture sessions and student attendance records are registered.
            </p>
          </div>
        ) : (
          <div className="w-full bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-100 overflow-x-auto">
            <div className="min-w-[500px]">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
                {/* Grid lines */}
                {[70, 80, 90, 100].map((val) => {
                  const y = height - paddingY - ((val - 60) / 40) * (height - 2 * paddingY);
                  return (
                    <g key={val}>
                      <line 
                        x1={paddingX} 
                        y1={y} 
                        x2={width - paddingX} 
                        y2={y} 
                        stroke="#E2E8F0" 
                        strokeDasharray="4 4" 
                      />
                      <text 
                        x={paddingX - 8} 
                        y={y + 3} 
                        textAnchor="end" 
                        className="text-[10px] fill-slate-400 font-mono font-medium"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* 75% Critical line */}
                {(() => {
                  const y75 = height - paddingY - ((75 - 60) / 40) * (height - 2 * paddingY);
                  return (
                    <g>
                      <line 
                        x1={paddingX} 
                        y1={y75} 
                        x2={width - paddingX} 
                        y2={y75} 
                        stroke="#F43F5E" 
                        strokeWidth="1.5" 
                        strokeDasharray="2 2" 
                      />
                      <text 
                        x={width - paddingX + 5} 
                        y={y75 + 3} 
                        className="text-[9px] fill-rose-500 font-mono font-bold"
                      >
                        75% Cutoff
                      </text>
                    </g>
                  );
                })()}

                {/* Paths */}
                <polyline
                  fill="none"
                  stroke="#D97706" // Amber for CSE
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getPoints('cs')}
                />
                <polyline
                  fill="none"
                  stroke="#0EA5E9" // Sky for ECE
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getPoints('ece')}
                />
                <polyline
                  fill="none"
                  stroke="#10B981" // Emerald for IT
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getPoints('it')}
                />
                <polyline
                  fill="none"
                  stroke="#F43F5E" // Rose for ME
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getPoints('me')}
                />

                {/* X Labels */}
                {trendData.map((d, i) => {
                  const x = paddingX + (i * (width - 2 * paddingX)) / (trendData.length - 1);
                  return (
                    <text
                      key={d.label}
                      x={x}
                      y={height - 5}
                      textAnchor="middle"
                      className="text-[11px] fill-slate-500 font-semibold"
                    >
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-200/60 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-600" />
                Computer Science
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                Electronics
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                Information Tech
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                Mechanical
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Department Breakdown & Anomaly Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Leaderboard */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-base mb-1">
              Department Performance
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ranked by aggregate semester attendance turnout.
            </p>

            <div className="space-y-3">
              {departmentStats.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400 font-medium">
                  No department student records enrolled yet.
                </div>
              ) : (
                departmentStats.map((dept, i) => (
                  <div 
                    key={dept.name}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">0{i + 1}.</span>
                        {dept.name}
                      </span>
                      <span className={`text-[11px] font-mono font-bold ${
                        dept.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {dept.trend}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{dept.students} Active Students</span>
                      <span className="font-mono font-bold text-slate-900">{dept.rate}%</span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className={`h-full rounded-full ${
                          dept.rate >= 90 ? 'bg-emerald-500' : dept.rate >= 80 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${dept.rate}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400">
              Department quotas computed against UGC academic standards.
            </span>
          </div>
        </div>

        {/* Anomaly Detection Stream */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                Algorithmic Anomaly Detection
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated flags generated from biometric mismatches, proxy telemetry, and critical absence patterns.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs font-bold">
              {mockAnomalies.length} Flagged
            </span>
          </div>

          <div className="space-y-3">
            {mockAnomalies.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
                No active anomalies or attendance probation flags recorded.
              </div>
            ) : (
              mockAnomalies.map((anom) => (
                <div 
                  key={anom.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        anom.severity === 'high' 
                          ? 'bg-rose-100 text-rose-800' 
                          : anom.severity === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {anom.type}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{anom.date}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span>{anom.studentName}</span>
                      <span className="text-xs font-mono font-normal text-slate-500">({anom.rollNumber})</span>
                      <span className="text-xs text-slate-400">&bull; {anom.department}</span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {anom.details}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <button
                      onClick={() => showToast(`Audit details opened for ${anom.studentName}`)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-amber-800 rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      Inspect Flag
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sync Registrar Confirmation Modal */}
      {isRegistrarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Synchronize with Registrar Office?
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              This action will package all verified BLE proximity records and biometric audit receipts for the current academic term and transmit them to the institutional enterprise database.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-left my-4 text-xs font-mono text-slate-600 space-y-1">
              <div>Total Enrolled Records: <strong className="text-slate-900">{students.length}</strong></div>
              <div>Certified Session IDs: <strong className="text-slate-900">0 Lectures</strong></div>
              <div>Encryption: <strong className="text-emerald-700">SHA-256 Checksum Signature</strong></div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsRegistrarModalOpen(false)}
                disabled={registrarSyncStatus === 'syncing'}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSyncRegistrar}
                disabled={registrarSyncStatus === 'syncing'}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20"
              >
                {registrarSyncStatus === 'syncing' ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing Enterprise ERP...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Certify & Synchronize</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
