import React, { useState, useEffect } from 'react';
import { Radio, Users, CheckCircle2, Clock, StopCircle, ShieldCheck } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useAppStore } from '../../store/useAppStore';

interface FacultyLiveMonitorProps {
  onEndSession: () => void;
}

export const FacultyLiveMonitor: React.FC<FacultyLiveMonitorProps> = ({ onEndSession }) => {
  const { activeSession, attendanceRecords, endSession, studentCheckIn } = useSessionStore();
  const { students } = useAppStore();

  const [simulatedTimeLeft, setSimulatedTimeLeft] = useState(580);

  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check in classmates automatically every few seconds so faculty screen feels alive
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const unchecked = students.filter(
        (s) => !activeSession.checkedInStudentIds.includes(s.id)
      );
      if (unchecked.length > 0 && Math.random() > 0.4) {
        const pick = unchecked[Math.floor(Math.random() * unchecked.length)];
        studentCheckIn({
          id: pick.id,
          name: pick.name,
          rollNumber: pick.rollNumber,
          department: pick.department,
          method: 'ble+face',
        });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [activeSession, students, studentCheckIn]);

  const handleStop = () => {
    endSession();
    onEndSession();
  };

  const minutes = Math.floor(simulatedTimeLeft / 60);
  const seconds = (simulatedTimeLeft % 60).toString().padStart(2, '0');

  const presentCount = activeSession?.checkedInStudentIds.length || 0;
  const capacity = activeSession?.capacity || 45;
  const progressPercent = Math.round((presentCount / capacity) * 100);

  return (
    <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto pb-4 relative bg-white text-slate-900">
      <div>
        {/* Top Header: Broadcasting Status & Timer */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Broadcasting Signal
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-mono font-bold text-indigo-700 border border-slate-200">
            <Clock size={12} />
            <span>
              {minutes}:{seconds} remaining
            </span>
          </div>
        </div>

        {/* Large Animated Radar Pulse Graphic with Center Bluetooth */}
        <div className="relative h-44 flex items-center justify-center my-3 overflow-hidden">
          {/* Animated concentric circles */}
          <div className="w-44 h-44 rounded-full border-2 border-indigo-200 absolute animate-ping opacity-60"></div>
          <div className="w-32 h-32 rounded-full border-2 border-violet-300 absolute animate-pulse"></div>
          <div className="w-20 h-20 rounded-full border border-indigo-400 absolute"></div>

          {/* Center Bluetooth Beacon icon */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-600/30 relative z-10 animate-bounce">
            <Radio size={24} className="text-white" />
          </div>
        </div>

        {/* Live Counter "18/45 Students Marked" with Progress Bar */}
        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {presentCount} / {capacity}
              </span>
              <span className="text-xs text-slate-500 ml-2">Students Verified</span>
            </div>
            <span className="text-xs font-bold text-emerald-600">{progressPercent}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Real-Time Scrollable List of Students as They Get Marked */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Live Check-In Feed
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Auto-syncing</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {attendanceRecords.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500 py-6">
                <p>Waiting for student beacon handshakes...</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Open Student App at /student to mark attendance live!
                </p>
              </div>
            ) : (
              attendanceRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs transition-all animate-in slide-in-from-top-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                      {rec.studentName.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 leading-tight">
                        {rec.studentName}
                      </h5>
                      <span className="text-[10px] font-mono text-slate-500">
                        {rec.rollNumber} • {rec.markedAt}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {rec.faceVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={10} /> Face Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Manual Entry
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fixed Red "End Session" Pill Button at Bottom */}
      <div className="pt-3 border-t border-slate-100">
        <button
          onClick={handleStop}
          className="w-full py-3 rounded-full font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
          <StopCircle size={15} />
          <span>End Attendance Broadcast</span>
        </button>
      </div>
    </div>
  );
};
