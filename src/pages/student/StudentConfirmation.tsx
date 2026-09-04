import React from 'react';
import { CheckCircle2, Flame, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

interface StudentConfirmationProps {
  onDone: () => void;
}

export const StudentConfirmation: React.FC<StudentConfirmationProps> = ({ onDone }) => {
  const { activeSession } = useSessionStore();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-1 p-6 flex flex-col justify-between items-center text-center bg-white text-slate-900 animate-in zoom-in-95">
      <div></div>

      {/* Center: Large animated green checkmark with soft glow */}
      <div className="flex flex-col items-center my-auto space-y-4">
        <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xl shadow-emerald-500/10 animate-bounce">
          <CheckCircle2 size={54} />
        </div>

        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Marked!</h3>
          <p className="text-xs text-slate-500 mt-1">
            Verified via Classroom BLE Beacon & Neural Biometrics
          </p>
        </div>

        {/* Subject, Time, Room Details */}
        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm w-full max-w-xs space-y-2 text-left">
          <h4 className="font-bold text-sm text-slate-900">
            {activeSession?.subjectName || 'CS301 Machine Learning'}
          </h4>
          <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/60">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-slate-400" />
              {activeSession?.room || 'LH-204'}
            </span>
            <span className="flex items-center gap-1 font-mono text-slate-500">
              <Clock size={12} />
              {currentTime}
            </span>
          </div>
        </div>

        {/* Gamified Streak Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 flex items-center justify-center gap-2.5 w-full max-w-xs shadow-xs">
          <div className="p-1.5 rounded-full bg-amber-100 text-amber-600">
            <Flame size={18} />
          </div>
          <div className="text-left">
            <span className="text-xs font-black text-amber-900 block leading-tight">
              Streak: 12 Days Strong! 🔥
            </span>
            <span className="text-[10px] text-amber-700 font-medium">
              You haven't missed a single scheduled lecture.
            </span>
          </div>
        </div>
      </div>

      {/* Gradient Done Button */}
      <div className="w-full pt-4">
        <button
          onClick={onDone}
          className="w-full py-3.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:brightness-110 shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
          <span>Done (Back to Dashboard)</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
