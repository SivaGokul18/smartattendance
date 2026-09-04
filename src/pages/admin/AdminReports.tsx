import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Table, 
  AlertTriangle, 
  Send, 
  BarChart3, 
  Calendar, 
  Check, 
  TrendingUp 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const AdminReports: React.FC = () => {
  const { students } = useAppStore();
  const [notifiedStudentId, setNotifiedStudentId] = useState<string | null>(null);

  const lowAttendanceStudents = students.filter((s) => s.attendanceRate < 75);

  const handleSendWarning = (id: string) => {
    setNotifiedStudentId(id);
    setTimeout(() => setNotifiedStudentId(null), 2500);
  };

  // Heatmap data representation for 28 days
  const heatmapDays = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    level: i % 7 === 5 || i % 7 === 6 ? 0 : [3, 4, 4, 3, 2, 4, 3][i % 7], // 0: weekend, 1-4: presence intensity
  }));

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Compliance Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical breakdown of attendance thresholds, subject compliance, and student risk alerts.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => alert('Exporting PDF audit summary report...')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText size={14} className="text-rose-500" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => alert('Exporting raw attendance matrix to XLSX Excel...')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Table size={14} className="text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Overall Institutional Attendance</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-900">89.4%</span>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">+2.1% this month</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full w-[89.4%]"></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Sessions Held</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-900">418</span>
            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">100% BLE verified</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-mono">0 beacon synchronization failures</p>
        </div>

        <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 font-bold">Students Below 75% Quorum</span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-amber-700">{lowAttendanceStudents.length}</span>
            <span className="text-xs text-amber-700 font-medium bg-amber-100/60 px-2 py-0.5 rounded-full">Requires Academic Warning</span>
          </div>
          <p className="text-[11px] text-amber-600/80 mt-3">Immediate parent & mentor dispatch pending</p>
        </div>
      </div>

      {/* Main Analysis: Stacked Bar Chart & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance by Subject Stacked Bar (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" />
            Subject Attendance Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-6">Comparison of present vs absent ratios per course</p>

          <div className="space-y-4">
            {[
              { code: 'CS301', name: 'Machine Learning', present: 92, absent: 8 },
              { code: 'CS302', name: 'Cloud Computing', present: 88, absent: 12 },
              { code: 'CS304', name: 'Embedded IoT', present: 81, absent: 19 },
              { code: 'AI203', name: 'Deep Learning', present: 95, absent: 5 },
            ].map((course, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {course.code} • {course.name}
                  </span>
                  <span className="text-emerald-600 font-bold">{course.present}% Present</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full"
                    style={{ width: `${course.present}%` }}
                  ></div>
                  <div
                    className="bg-rose-400 h-full"
                    style={{ width: `${course.absent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present Quorum
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Absenteeism
            </span>
          </div>
        </div>

        {/* Heatmap Calendar Showing Daily Attendance Density (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600" />
              Monthly Attendance Heatmap
            </h3>
            <p className="text-xs text-slate-500 mb-4">Daily campus check-in density matrix</p>

            {/* 7 columns grid for days Mon - Sun */}
            <div className="grid grid-cols-7 gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className="text-center text-[10px] font-bold text-slate-400 mb-1">
                  {d}
                </span>
              ))}
              {heatmapDays.map((item) => {
                const colors = [
                  'bg-slate-50 text-slate-400 border border-slate-100', // weekend
                  'bg-emerald-100 text-emerald-800 border border-emerald-200', // low
                  'bg-emerald-200 text-emerald-900', // mid
                  'bg-emerald-500 text-white font-bold', // high
                  'bg-emerald-600 text-white font-extrabold shadow-xs', // very high
                ];
                return (
                  <div
                    key={item.day}
                    title={`Day ${item.day}: Level ${item.level}`}
                    className={`h-9 rounded-lg flex items-center justify-center text-xs transition hover:scale-105 cursor-pointer ${colors[item.level]}`}
                  >
                    {item.day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100">
            <span>Low presence</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-100"></span>
              <span className="w-3 h-3 rounded bg-emerald-100"></span>
              <span className="w-3 h-3 rounded bg-emerald-200"></span>
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span className="w-3 h-3 rounded bg-emerald-600"></span>
            </div>
            <span>High presence</span>
          </div>
        </div>
      </div>

      {/* Sortable "Low Attendance Alert" Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Low Attendance Warning Registry</h3>
              <p className="text-xs text-slate-500">Students with current semester presence below 75% quorum</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
            Action Required
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Cumulative %</th>
                <th className="py-3 px-4">Deficit Classes</th>
                <th className="py-3 px-4 text-right">Intervention Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowAttendanceStudents.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={std.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-900">{std.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{std.rollNumber}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {std.department} (Year {std.year})
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-rose-600">{std.attendanceRate}%</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">Needs 4 consecutive classes</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleSendWarning(std.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ml-auto transition cursor-pointer ${
                        notifiedStudentId === std.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {notifiedStudentId === std.id ? (
                        <>
                          <Check size={13} /> Sent!
                        </>
                      ) : (
                        <>
                          <Send size={12} /> Send Warning
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
