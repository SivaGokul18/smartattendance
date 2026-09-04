import React, { useState } from 'react';
import { ArrowLeft, Radio, ShieldCheck, Clock, Users, MapPin, Sparkles } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useAppStore } from '../../store/useAppStore';

interface FacultyStartSessionProps {
  classInfo: any;
  onBack: () => void;
  onBroadcastStarted: () => void;
}

export const FacultyStartSession: React.FC<FacultyStartSessionProps> = ({
  classInfo,
  onBack,
  onBroadcastStarted,
}) => {
  const { startSession } = useSessionStore();
  const { selectedFaculty } = useAppStore();

  const [duration, setDuration] = useState<5 | 10 | 15>(10);
  const [requireFace, setRequireFace] = useState(true);

  const handleStart = () => {
    startSession({
      facultyId: selectedFaculty.id,
      facultyName: selectedFaculty.name,
      classSectionId: classInfo?.id || 'cls-1',
      classSectionName: classInfo?.sectionName || 'CSE - 3rd Year - Sec A',
      subjectId: 'sub-1',
      subjectName: classInfo?.subjectName || 'Machine Learning (CS301)',
      room: classInfo?.room || 'LH-204',
      durationMinutes: duration,
      faceVerificationRequired: requireFace,
      capacity: classInfo?.expectedStudents || 45,
    });
    onBroadcastStarted();
  };

  return (
    <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto pb-6 bg-white text-slate-900">
      <div>
        {/* Back Header */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Start Attendance</h3>
            <span className="text-[10px] text-slate-500">Pre-Session Configuration</span>
          </div>
        </div>

        {/* Selected Class Info Card */}
        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-2.5 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              {classInfo?.sectionName || 'CSE - 3rd Year - Sec A'}
            </span>
            <span className="text-xs font-mono font-bold text-slate-700">
              {classInfo?.room || 'LH-204'}
            </span>
          </div>

          <h4 className="font-extrabold text-base text-slate-900">
            {classInfo?.subjectName || 'Machine Learning (CS301)'}
          </h4>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/80">
            <span className="flex items-center gap-1">
              <Users size={12} className="text-slate-400" />
              {classInfo?.expectedStudents || 45} Expected Students
            </span>
            <span className="flex items-center gap-1 font-mono text-slate-500">
              <Clock size={12} />
              {classInfo?.time || '09:00 - 10:00 AM'}
            </span>
          </div>
        </div>

        {/* Center Large Circular Gradient Button with Pulsing Ring Animation */}
        <div className="flex flex-col items-center justify-center my-6 relative">
          <div className="w-56 h-56 rounded-full absolute border border-indigo-200 animate-ping"></div>
          <div className="w-48 h-48 rounded-full absolute border border-violet-200"></div>

          <button
            onClick={handleStart}
            className="relative z-10 w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-2xl shadow-indigo-600/40 flex flex-col items-center justify-center text-center p-3 active:scale-95 transition-transform group cursor-pointer"
          >
            <Radio size={36} className="text-white mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-white">
              Start BLE
            </span>
            <span className="text-[10px] font-semibold text-indigo-100">Broadcast</span>
          </button>
        </div>
      </div>

      {/* Session Controls: Duration & Require Face */}
      <div className="space-y-4">
        {/* Session Duration Selector */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Clock size={13} className="text-indigo-600" />
              Session Duration
            </span>
            <span className="text-xs font-bold text-indigo-600">{duration} Minutes</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d as any)}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  duration === d
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {d} mins
              </button>
            ))}
          </div>
        </div>

        {/* Require Face Verification Switch */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <ShieldCheck size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Require Face Verification</span>
              <span className="text-[10px] text-slate-500">Dual-factor BLE + biometric verification</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRequireFace(!requireFace)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              requireFace ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                requireFace ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-500">
          Students within classroom range will be auto-detected via Bluetooth Low Energy.
        </p>
      </div>
    </div>
  );
};
