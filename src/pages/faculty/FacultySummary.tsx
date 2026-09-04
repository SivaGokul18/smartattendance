import React, { useState } from 'react';
import { CheckCircle2, Download, UserCheck, UserX, Plus, X, ArrowRight } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useAppStore } from '../../store/useAppStore';
import { Student } from '../../types';

interface FacultySummaryProps {
  onDone: () => void;
}

export const FacultySummary: React.FC<FacultySummaryProps> = ({ onDone }) => {
  const { activeSession, attendanceRecords, manualMarkPresent } = useSessionStore();
  const { students } = useAppStore();

  const [activeTab, setActiveTab] = useState<'present' | 'absent'>('present');
  const [overrideStudent, setOverrideStudent] = useState<Student | null>(null);
  const [overrideReason, setOverrideReason] = useState('Medical slip verified');

  const checkedInIds = activeSession?.checkedInStudentIds || [];
  const presentStudents = students.filter((s) => checkedInIds.includes(s.id));
  const absentStudents = students.filter((s) => !checkedInIds.includes(s.id));

  const totalPresent = presentStudents.length;
  const totalAbsent = absentStudents.length;
  const totalCount = students.length || 1;
  const attendancePercent = Math.round((totalPresent / totalCount) * 100);

  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideStudent) return;
    manualMarkPresent({
      id: overrideStudent.id,
      name: overrideStudent.name,
      rollNumber: overrideStudent.rollNumber,
      department: overrideStudent.department,
      reason: overrideReason,
    });
    setOverrideStudent(null);
  };

  return (
    <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto pb-4 bg-white text-slate-900">
      <div>
        {/* Top Success Checkmark Animation & Heading */}
        <div className="text-center pt-2 pb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200 shadow-md animate-in zoom-in-50">
            <CheckCircle2 size={30} />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Session Completed</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeSession?.subjectName || 'Machine Learning'} • {activeSession?.room || 'LH-204'}
          </p>
        </div>

        {/* Summary Card */}
        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm grid grid-cols-4 gap-2 text-center mb-4">
          <div>
            <span className="text-[10px] text-slate-500 block">Present</span>
            <span className="text-base font-black text-emerald-600 mt-0.5 block">
              {totalPresent}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Absent</span>
            <span className="text-base font-black text-rose-600 mt-0.5 block">
              {totalAbsent}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Ratio</span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">
              {attendancePercent}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Duration</span>
            <span className="text-base font-black text-indigo-600 mt-0.5 block">10m</span>
          </div>
        </div>

        {/* Tabbed List: Present & Absent */}
        <div className="flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200 mb-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('present')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'present'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck size={14} />
            <span>Present ({totalPresent})</span>
          </button>
          <button
            onClick={() => setActiveTab('absent')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'absent'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX size={14} />
            <span>Absent ({totalAbsent})</span>
          </button>
        </div>

        {/* List of students */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {activeTab === 'present' ? (
            presentStudents.map((std) => (
              <div
                key={std.id}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={std.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{std.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{std.rollNumber}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified
                </span>
              </div>
            ))
          ) : (
            absentStudents.map((std) => (
              <div
                key={std.id}
                className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={std.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover grayscale opacity-70"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-700 block">{std.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{std.rollNumber}</span>
                  </div>
                </div>
                <button
                  onClick={() => setOverrideStudent(std)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 transition"
                >
                  <Plus size={11} /> Mark Present
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual Override Modal */}
      {overrideStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white p-5 border border-slate-200 rounded-3xl shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-slate-900 text-sm">Manual Override Check-In</h4>
              <button
                onClick={() => setOverrideStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Override absence for <strong className="text-slate-900">{overrideStudent.name}</strong> ({overrideStudent.rollNumber}).
            </p>
            <form onSubmit={handleApplyOverride} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Audit Reason Note</label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideStudent(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-emerald-600 text-white font-bold shadow"
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Buttons: "Save & Submit" (gradient) and "Export" (outline) */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <button
          onClick={onDone}
          className="w-full py-3 rounded-full font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
          <span>Save & Submit to Registrar</span>
          <ArrowRight size={14} />
        </button>
        <button
          onClick={() => alert('Session PDF attendance sheet downloaded.')}
          className="w-full py-2.5 rounded-full font-semibold text-xs text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Download size={13} />
          <span>Export Session Audit Sheet</span>
        </button>
      </div>
    </div>
  );
};
