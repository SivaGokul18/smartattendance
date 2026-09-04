import React, { useState } from 'react';
import { Calendar, List, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const StudentHistory: React.FC = () => {
  const { selectedStudent } = useAppStore();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedSubject, setSelectedSubject] = useState('All');

  const overallRate = selectedStudent.attendanceRate || 88;
  const subjects = ['All', 'CS301', 'CS302', 'CS304'];

  const records = [
    { id: '1', date: 'Today', subject: 'Machine Learning (CS301)', time: '09:00 AM', status: 'present' },
    { id: '2', date: 'Yesterday', subject: 'Cloud Computing (CS302)', time: '10:15 AM', status: 'present' },
    { id: '3', date: '02 Sep 2026', subject: 'Embedded IoT (CS304)', time: '11:15 AM', status: 'present' },
    { id: '4', date: '01 Sep 2026', subject: 'Machine Learning (CS301)', time: '09:00 AM', status: 'absent' },
    { id: '5', date: '31 Aug 2026', subject: 'Distributed Systems', time: '02:00 PM', status: 'present' },
  ];

  const getRingColor = (rate: number) => {
    if (rate >= 75) return '#10B981';
    if (rate >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24 bg-white text-slate-900">
      {/* Top: Large Circular Percentage Ring */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Attendance Record
          </span>
          <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">Overall Percentage</h3>
          <span className="text-[11px] text-emerald-600 font-bold block mt-1">
            Status: Good Standing
          </span>
        </div>

        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="30"
              stroke="#E2E8F0"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="30"
              stroke={getRingColor(overallRate)}
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={188.4}
              strokeDashoffset={188.4 - (188.4 * overallRate) / 100}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-sm font-black text-slate-900">{overallRate}%</span>
        </div>
      </div>

      {/* Filter Chips & View Mode Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedSubject === s
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-1.5 rounded-lg ${viewMode === 'calendar' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
          >
            <Calendar size={14} />
          </button>
        </div>
      </div>

      {/* Session Records / Calendar View */}
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {records.map((r) => (
            <div
              key={r.id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs"
            >
              <div>
                <h5 className="font-bold text-xs text-slate-900">{r.subject}</h5>
                <span className="text-[10px] font-mono text-slate-500">
                  {r.date} • {r.time}
                </span>
              </div>

              {r.status === 'present' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={11} /> Present
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle size={11} /> Absent
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Monthly Calendar with colored status dots in light mode */
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            September 2026 Attendance
          </h4>
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400">
                {d}
              </span>
            ))}
            {Array.from({ length: 28 }, (_, i) => {
              const isAbsent = i === 1 || i === 14;
              const isWeekend = i % 7 === 5 || i % 7 === 6;
              return (
                <div
                  key={i}
                  className="h-8 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center relative"
                >
                  <span className="text-[10px] text-slate-700 font-medium">{i + 1}</span>
                  {!isWeekend && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isAbsent ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    ></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
