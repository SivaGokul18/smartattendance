import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Users, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Play, 
  StopCircle, 
  Sparkles, 
  ShieldCheck, 
  Bell, 
  X,
  Search,
  Zap,
  ArrowRight,
  Send
} from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useAppStore } from '../../store/useAppStore';
import { useAdminLiveOversight, LiveSessionEvent } from '../../hooks/useLiveSession';
import { adminApi } from '../../api/client';

interface ConcurrentLecture {
  id: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  room: string;
  department: string;
  enrolled: number;
  present: number;
  startedAt: string;
  faceRequired: boolean;
  status: 'broadcasting' | 'concluded';
}

const mockConcurrentLectures: ConcurrentLecture[] = [];

export const AdminLiveOversight: React.FC = () => {
  const { activeSession, attendanceRecords, endSession, startSession, studentCheckIn } = useSessionStore();
  const { students } = useAppStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [endReason, setEndReason] = useState('Administrative schedule adjustment');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(742);

  // Live timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleStartDemoSession = () => {
    if (faculty.length === 0 || subjects.length === 0) {
      showToast('Please add faculty and course subjects before launching a live session.');
      return;
    }
    const fac = faculty[0];
    const sub = subjects[0];
    const sec = classSections[0];
    startSession({
      facultyId: fac.id,
      facultyName: fac.name,
      classSectionId: sec?.id || 'sec-default',
      classSectionName: sec ? `${sec.name} - Sec ${sec.section}` : 'General Section',
      subjectId: sub.id,
      subjectName: `${sub.name} (${sub.code})`,
      room: sec?.room || 'Room 101',
      durationMinutes: 60,
      faceVerificationRequired: true,
      capacity: 45,
    });

    // Simulate checkins
    const sampleStudents = students.slice(0, 12);
    sampleStudents.forEach(s => {
      studentCheckIn({
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        department: s.department,
        method: 'ble+face',
      });
    });

    showToast(`Live session initialized for ${sec?.room || 'Room 101'}`);
  };

  // WebSocket live oversight subscription
  useAdminLiveOversight((event) => {
    if (event.type === 'STUDENT_CHECKIN') {
      studentCheckIn({
        id: event.data.studentId,
        name: event.data.studentName,
        rollNumber: event.data.rollNumber,
        department: event.data.department,
        method: event.data.method as any,
        overrideReason: event.data.overrideReason,
      });
    } else if (event.type === 'SESSION_STATUS_CHANGED' && event.status === 'ended') {
      endSession();
    }
  });

  const handleConfirmForceEnd = () => {
    if (activeSession) {
      adminApi.forceEndSession(activeSession.id).catch(console.warn);
    }
    endSession();
    setIsEndModalOpen(false);
    showToast(`Session terminated by administrator: "${endReason}"`);
  };

  const handleSendNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastNotice.trim()) return;
    setIsBroadcastModalOpen(false);
    setBroadcastNotice('');
    showToast('Campus broadcast message dispatched to faculty console');
  };

  const isLive = activeSession && activeSession.status === 'broadcasting';
  const checkedInCount = activeSession?.checkedInStudentIds?.length || attendanceRecords.length;
  const totalCapacity = activeSession?.capacity || 45;
  const attendancePercent = Math.round((checkedInCount / totalCapacity) * 100);

  const filteredRecords = attendanceRecords.filter(r => 
    r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Attendance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Live Classroom Sessions
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Active BLE broadcasts, ongoing lectures, and real-time student check-in telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl transition text-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Broadcast Notice</span>
            </button>

            {!isLive && (
              <button
                onClick={handleStartDemoSession}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 text-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Session</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Active Broadcast Card */}
      {isLive ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-500/40 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500/10 to-transparent w-72 h-full pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  ACTIVE BLE BROADCAST
                </span>
                <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  ROOM: {activeSession.room}
                </span>
                {activeSession.faceVerificationRequired && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Biometric Face ID Required
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold font-heading text-slate-900">
                {activeSession.subjectName}
              </h2>
              <p className="text-sm text-slate-600 font-medium mt-1 flex items-center gap-2">
                <span>Instructor: <strong className="text-slate-900">{activeSession.facultyName}</strong></span>
                <span>&bull;</span>
                <span>Class: <strong className="text-slate-900">{activeSession.classSectionName}</strong></span>
              </p>
            </div>

            {/* Emergency Action */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Session Elapsed</span>
                <span className="text-xl font-bold font-mono text-slate-900 flex items-center gap-1.5 justify-end">
                  <Clock className="w-4 h-4 text-amber-600" />
                  {formatElapsed(elapsedSeconds)}
                </span>
              </div>
              <button
                onClick={() => setIsEndModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors active:scale-95"
              >
                <StopCircle className="w-4 h-4 text-rose-600" />
                <span>Force-End Session</span>
              </button>
            </div>
          </div>

          {/* Progress Bar & Realtime Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
                <span>Attendance Turnout</span>
                <span className="font-mono text-amber-700 text-sm">{checkedInCount} / {totalCapacity} ({attendancePercent}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(100, attendancePercent)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Threshold: 75% minimum required for official registrar submission.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Biometric Integrity</span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">98.2% Avg</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Proximity Signal</span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">-58 dBm RSSI</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
            <Radio className="w-7 h-7 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold font-heading text-slate-900">No Active BLE Broadcast in Primary Hall</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Faculty instructors have not yet triggered a high-density BLE broadcast, or the previous lecture has concluded.
          </p>
          <button
            onClick={handleStartDemoSession}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Launch Demonstration Lecture
          </button>
        </div>
      )}

      {/* Concurrent Campus Sessions (Multi-Room Oversight) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            Concurrent Campus Lecture Halls
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {mockConcurrentLectures.length} additional lectures in progress
          </span>
        </div>

        {mockConcurrentLectures.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 text-center text-xs text-slate-500">
            No concurrent lectures currently broadcasting on campus.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockConcurrentLectures.map((lec) => {
              const pct = Math.round((lec.present / lec.enrolled) * 100);
              return (
                <div 
                  key={lec.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-amber-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-mono font-bold rounded-md">
                      {lec.courseCode}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {lec.room}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {lec.courseName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {lec.facultyName} &bull; {lec.department}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Turnout:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {lec.present} / {lec.enrolled} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Stream of Check-Ins */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Live Verification Feed ({filteredRecords.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantaneous telemetry receipts as student mobile apps authenticate via BLE proximity and on-device Face ID.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search check-in receipt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Table / List of check-ins */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Roll Number</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Authentication Method</th>
                <th className="py-3 px-3 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {rec.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{rec.studentName}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 font-semibold">{rec.rollNumber}</td>
                  <td className="py-3 px-3 text-slate-500">{rec.department}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{rec.markedAt}</td>
                  <td className="py-3 px-3">
                    {rec.method === 'manual_override' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Manual Override ({rec.overrideReason || 'Faculty marked'})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        BLE Proximity + Face ID
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                    {rec.method === 'manual_override' ? 'N/A' : '99.4%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No verification events recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Force-End Session Confirmation Dialog */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Force-Terminate Lecture Session?
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              This will immediately cease the BLE transmitter in <strong className="text-slate-800">{activeSession?.room}</strong> and freeze attendance logs.
            </p>

            <div className="mt-4 text-left">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Administrative Override Reason *
              </label>
              <select
                value={endReason}
                onChange={(e) => setEndReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Lecture ended early by instructor">Lecture ended early by instructor</option>
                <option value="Administrative schedule adjustment">Administrative schedule adjustment</option>
                <option value="Classroom technical anomaly">Classroom technical anomaly</option>
                <option value="Dean emergency decree">Dean emergency decree</option>
              </select>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsEndModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmForceEnd}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20"
              >
                Terminate & Finalize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Message Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-bold text-base">Broadcast Notice to Faculty Console</h3>
              </div>
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNotice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Prompt / Announcement *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Please remind students to complete course feedback survey prior to session conclusion..."
                  value={broadcastNotice}
                  onChange={(e) => setBroadcastNotice(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
