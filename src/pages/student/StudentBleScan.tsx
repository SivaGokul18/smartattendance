import React, { useState, useEffect } from 'react';
import { Radio, CheckCircle2, X } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

interface StudentBleScanProps {
  onSignalFound: () => void;
  onCancel: () => void;
}

export const StudentBleScan: React.FC<StudentBleScanProps> = ({ onSignalFound, onCancel }) => {
  const { activeSession } = useSessionStore();
  const [status, setStatus] = useState<'searching' | 'found'>('searching');
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const pTimer = setInterval(() => {
      setProgress((p) => Math.min(95, p + 18));
    }, 400);

    const fTimer = setTimeout(() => {
      setStatus('found');
      setProgress(100);
      setTimeout(() => {
        onSignalFound();
      }, 1200);
    }, 1800);

    return () => {
      clearInterval(pTimer);
      clearTimeout(fTimer);
    };
  }, [onSignalFound]);

  return (
    <div className="flex-1 p-6 flex flex-col justify-between items-center text-center bg-white text-slate-900">
      {/* Top Header */}
      <div className="w-full flex justify-between items-center">
        <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600">
          Proximity Beacon Verification
        </span>
        <button
          onClick={onCancel}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Center Animated Searching Radar */}
      <div className="my-auto flex flex-col items-center">
        <div className="relative w-52 h-52 flex items-center justify-center mb-6">
          <div className="absolute w-52 h-52 rounded-full border-2 border-teal-200 animate-ping"></div>
          <div className="absolute w-40 h-40 rounded-full border-2 border-teal-300 animate-pulse"></div>
          <div className="absolute w-28 h-28 rounded-full border border-teal-400"></div>

          <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-teal-500/30 relative z-10 animate-bounce">
            <Radio size={32} className="text-white" />
          </div>
        </div>

        {status === 'searching' ? (
          <div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Searching for classroom signal...
            </h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Listening for Bluetooth Low Energy beacon broadcasts from faculty instructor.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 shadow-md space-y-2 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs">
              <CheckCircle2 size={16} />
              <span>Signal Found & Authenticated!</span>
            </div>
            <h4 className="text-sm font-black text-slate-900">
              {activeSession?.subjectName || 'CS301 Machine Learning'}
            </h4>
            <span className="text-xs font-mono text-slate-600 block">
              Room {activeSession?.room || 'LH-204'} • Signal -62 dBm
            </span>
          </div>
        )}
      </div>

      {/* Bottom Progress Bar & Cancel Link */}
      <div className="w-full space-y-3">
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-900 transition font-medium"
        >
          Cancel Search
        </button>
      </div>
    </div>
  );
};
