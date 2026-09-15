import React, { useState } from 'react';
import {
  Users,
  Radio,
  TrendingUp,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Award,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useSessionStore } from '../../store/useSessionStore';

interface AdminHomeProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminHome: React.FC<AdminHomeProps> = ({ onNavigateTab }) => {
  const { students, faculty, leaveRequests, facultyLeaveRequests } = useAppStore();
  const { activeSession, historySessions } = useSessionStore();

  const [selectedTerm, setSelectedTerm] = useState<'today' | 'weekly' | 'monthly'>('today');

  // Dynamic calculations
  const totalStudents = students.length;
  const enrolledBiometricsCount = students.filter(s => s.faceIdStatus === 'enrolled').length;
  const totalFaculty = faculty.length;
  const activeFacultyCount = faculty.filter(f => f.active).length;
  const isBroadcasting = activeSession && activeSession.status === 'broadcasting';

  const pendingStudentLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const pendingFacultyLeaves = (facultyLeaveRequests || []).filter(l => l.status === 'pending').length;
  const totalPendingLeaves = pendingStudentLeaves + pendingFacultyLeaves;
  const totalLeavesCount = leaveRequests.length + (facultyLeaveRequests || []).length;

  // Calculate average attendance rate
  const avgAttendance = students.length > 0
    ? (students.reduce((acc, s) => acc + s.attendanceRate, 0) / students.length).toFixed(1)
    : '0.0';

  // Department analytics data dynamically computed from student records
  const departmentData = React.useMemo(() => {
    const deptMap: Record<string, { total: number; sumRate: number }> = {};
    students.forEach((s) => {
      const dept = s.department || 'General';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, sumRate: 0 };
      deptMap[dept].total += 1;
      deptMap[dept].sumRate += s.attendanceRate || 0;
    });
    const colors = ['amber', 'emerald', 'sky', 'slate', 'indigo'];
    return Object.entries(deptMap).map(([name, data], idx) => ({
      name,
      students: data.total,
      rate: Number((data.sumRate / data.total).toFixed(1)),
      trend: '0.0%',
      color: colors[idx % colors.length],
    }));
  }, [students]);

  // Recent classroom sessions dynamically mapped from active/history sessions
  const recentEvents = React.useMemo(() => {
    const list: any[] = [];
    if (activeSession) {
      list.push({
        id: activeSession.id,
        title: `${activeSession.subjectName || 'Lecture'} (${activeSession.courseCode || ''})`,
        subtitle: `${activeSession.facultyName || 'Faculty'} • Room ${activeSession.roomId || '—'}`,
        status: isBroadcasting ? 'Live Now' : 'Session Open',
        time: 'Just now',
        present: activeSession.checkedInStudentIds?.length || 0,
        total: activeSession.totalStudents || 0,
        isLive: isBroadcasting,
      });
    }
    (historySessions || []).slice(0, 3).forEach((sess: any) => {
      if (activeSession && sess.id === activeSession.id) return;
      list.push({
        id: sess.id,
        title: `${sess.subjectName || 'Lecture'} (${sess.courseCode || ''})`,
        subtitle: `${sess.facultyName || 'Faculty'} • Room ${sess.roomId || '—'}`,
        status: 'Completed',
        time: sess.date || 'Earlier today',
        present: sess.presentCount || 0,
        total: sess.totalStudents || 0,
        isLive: false,
      });
    });
    return list;
  }, [activeSession, historySessions, isBroadcasting]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ========================================================
          1. CLEAN LIGHT HERO CARD (Matches Student & Faculty style)
          ======================================================== */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 text-slate-900 shadow-xl shadow-slate-200/50">
        {/* Soft amber radial glow in top-right */}
        <div
          className="absolute top-0 right-0 w-80 sm:w-96 h-64 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 80% 20%, rgba(217, 119, 6, 0.08) 0%, rgba(245, 158, 11, 0.03) 50%, transparent 75%)'
          }}
        />

        {/* Decorative silicon trace SVG in top right */}
        <div className="absolute top-0 right-0 w-64 sm:w-80 h-48 pointer-events-none opacity-40 select-none hidden sm:block">
          <svg viewBox="0 0 320 200" fill="none" className="w-full h-full">
            <path d="M 120 20 L 160 20 L 190 50 L 260 50" stroke="#CBD5E1" strokeWidth="1.5" />
            <path d="M 150 40 L 180 40 L 210 70 L 300 70" stroke="#E2E8F0" strokeWidth="1.2" />
            <path d="M 170 80 L 200 80 L 220 100 L 290 100" stroke="#CBD5E1" strokeWidth="1.5" />
            <circle cx="260" cy="50" r="3" fill="#D97706" />
            <circle cx="300" cy="70" r="2.5" fill="#94A3B8" />
            <circle cx="290" cy="100" r="3" fill="#64748B" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Top Date Pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Monday, September 7, 2026</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                Admin Console
              </span>
            </div>

            {/* Greeting & Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Institution Overview
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal leading-relaxed">
                Campus attendance monitoring, real-time classroom telemetry, and academic records.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('live')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition shadow-sm active:scale-95"
            >
              <Radio className="w-4 h-4 text-amber-400" />
              <span>Live Monitor</span>
            </button>
            <button
              onClick={() => onNavigateTab('users')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. EXECUTIVE KPI CARDS (Horizontal Row)
          ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Attendance Rate */}
        <div
          onClick={() => onNavigateTab('analytics')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              +1.8%
            </span>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Campus Attendance</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">{avgAttendance}%</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Target: 75%</span>
            <span className="text-amber-700 font-semibold flex items-center">View &rarr;</span>
          </div>
        </div>

        {/* Card 2: Students Enrolled */}
        <div
          onClick={() => onNavigateTab('users')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {totalStudents} Total
            </span>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Enrolled Students</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">{enrolledBiometricsCount}</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Face ID Active</span>
            <span className="text-amber-700 font-semibold flex items-center">Roster &rarr;</span>
          </div>
        </div>

        {/* Card 3: Active Faculty */}
        <div
          onClick={() => onNavigateTab('users')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Active
            </span>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Faculty Members</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">{activeFacultyCount}</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>{totalFaculty} Registered</span>
            <span className="text-amber-700 font-semibold flex items-center">Directory &rarr;</span>
          </div>
        </div>

        {/* Card 4: Leave Requests */}
        <div
          onClick={() => onNavigateTab('leaves')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            {totalPendingLeaves > 0 && (
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md animate-pulse">
                {totalPendingLeaves} Pending
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Leave Applications</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">{totalLeavesCount}</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>{pendingFacultyLeaves > 0 ? `${pendingFacultyLeaves} Faculty Pending` : 'Faculty & Students'}</span>
            <span className="text-amber-700 font-semibold flex items-center">Review &rarr;</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. TWO-COLUMN CONTENT: Department Comparison & Recent Classes
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Department Attendance Breakdown */}
        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Department Attendance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current term attendance rates by department.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
            >
              Full Analytics &rarr;
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {departmentData.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                No department attendance data registered yet. Enroll students or import departments to view breakdowns.
              </div>
            ) : (
              departmentData.map((dept) => (
                <div
                  key={dept.name}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{dept.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{dept.rate}%</span>
                      <span className={`text-[10px] font-semibold ${dept.trend.startsWith('+') ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {dept.trend}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full bg-amber-600 transition-all duration-500"
                      style={{ width: `${dept.rate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>{dept.students} Students</span>
                    <span>Target: 75%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Today's Lecture Sessions */}
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Today's Classes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Classroom sessions and attendance turnout.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('live')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
              >
                View Live &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {recentEvents.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                  No classroom sessions conducted today. Broadcasted sessions will appear here in real time.
                </div>
              ) : (
                recentEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3.5 rounded-xl border transition ${ev.isLive
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-slate-50 border-slate-100'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {ev.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ev.isLive
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : 'bg-slate-200 text-slate-700'
                        }`}>
                        {ev.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      {ev.subtitle}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">{ev.time}</span>
                      <span className="font-mono font-bold text-slate-800">
                        {ev.present} / {ev.total} Present
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('beacons')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Radio className="w-3.5 h-3.5 text-amber-700" />
              <span>Check Room BLE Beacons</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
