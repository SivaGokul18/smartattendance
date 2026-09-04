import React, { useState } from 'react';
import { Filter, Calendar, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

export const FacultyHistory: React.FC = () => {
  const { historySessions } = useSessionStore();
  const [filter, setFilter] = useState('This Week');

  const filters = ['This Week', 'This Month', 'CS301', 'CS304'];

  const getRingColor = (rate: number) => {
    if (rate >= 75) return '#10B981';
    if (rate >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24 bg-white text-slate-900">
      <div>
        <h3 className="text-base font-black text-slate-900">Attendance History</h3>
        <p className="text-xs text-slate-500">Past broadcast records and compliance logs</p>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Past Sessions Cards */}
      <div className="space-y-3">
        {historySessions.map((sess) => {
          const ringColor = getRingColor(sess.attendanceRate);
          return (
            <div
              key={sess.id}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {sess.className}
                </span>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition">
                  {sess.subjectName}
                </h4>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar size={11} /> {sess.date}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock size={11} /> {sess.time}
                  </span>
                </div>
              </div>

              {/* Colored Circular Progress Ring */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke="#E2E8F0"
                      strokeWidth="3.5"
                      fill="transparent"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke={ringColor}
                      strokeWidth="3.5"
                      fill="transparent"
                      strokeDasharray={113}
                      strokeDashoffset={113 - (113 * sess.attendanceRate) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-black text-slate-900">
                    {sess.attendanceRate}%
                  </span>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 transition" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
