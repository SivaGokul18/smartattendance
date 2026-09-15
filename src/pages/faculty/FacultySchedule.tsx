import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Layers,
  Sparkles,
  RefreshCw,
  Play,
  Grid,
  List,
  GraduationCap,
  BookOpen,
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface FacultyScheduleProps {
  onStartAttendanceClick?: (classInfo: any) => void;
}

export const FacultySchedule: React.FC<FacultyScheduleProps> = ({ onStartAttendanceClick }) => {
  const { selectedFaculty, faculty, timetable, subjects, classSections, syncWithBackend } = useAppStore();

  const [activeFacultyId, setActiveFacultyId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNames: Record<string, string> = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
  };

  const todayIndex = new Date().getDay();
  const todayCode = todayIndex === 0 ? 'Mon' : daysOfWeek[todayIndex - 1] || 'Mon';
  const [selectedDay, setSelectedDay] = useState<string>('all');

  useEffect(() => {
    syncWithBackend();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithBackend();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const currentFaculty =
    (activeFacultyId ? faculty.find((f) => f.id === activeFacultyId) : null) ||
    faculty.find((f) => f.id === selectedFaculty.id) ||
    faculty[0] ||
    selectedFaculty;

  // Filter slots for this faculty
  const facultySlots = (timetable || []).filter((s) => s.facultyId === currentFaculty?.id);

  // Filter by selected day if not 'all'
  const filteredSlots = selectedDay === 'all'
    ? facultySlots
    : facultySlots.filter((s) => {
        const slotDay = (s.day || '').toLowerCase().slice(0, 3);
        return slotDay === selectedDay.toLowerCase().slice(0, 3);
      });

  // Sort slots by period/time
  const sortedSlots = [...filteredSlots].sort((a, b) => {
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const aDay = dayOrder.indexOf((a.day || '').toLowerCase().slice(0, 3));
    const bDay = dayOrder.indexOf((b.day || '').toLowerCase().slice(0, 3));
    if (aDay !== bDay) return aDay - bDay;
    return (a.period || 0) - (b.period || 0);
  });

  // Calculate quick stats
  const totalWeeklyClasses = facultySlots.length;
  const distinctCourses = new Set(facultySlots.map((s) => s.subjectCode || s.subjectId)).size;
  const distinctSections = new Set(facultySlots.map((s) => s.classSectionName || s.classSectionId)).size;
  const todayClassesCount = facultySlots.filter(
    (s) => (s.day || '').toLowerCase().slice(0, 3) === todayCode.toLowerCase()
  ).length;

  // Standard period times mapping
  const standardPeriods = [
    { period: 1, time: '08:45 AM - 09:40 AM' },
    { period: 2, time: '09:40 AM - 10:35 AM' },
    { period: 3, time: '10:55 AM - 11:45 AM' },
    { period: 4, time: '11:45 AM - 12:35 PM' },
    { period: 5, time: '01:30 PM - 02:20 PM' },
    { period: 6, periodTime: '02:20 PM - 03:10 PM', time: '02:20 PM - 03:10 PM' },
    { period: 7, time: '03:15 PM - 04:05 PM' },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto bg-slate-50/60 max-w-7xl mx-auto w-full">
      {/* ========================================================
          HEADER & CONTROLS
          ======================================================== */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Calendar size={20} />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Faculty Teaching Schedule
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Weekly Timetable
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            View allocated lecture hours, sections, and room venues for each period across the week.
          </p>
        </div>

        {/* Action Controls: Faculty Select + Sync + View Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Faculty Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
            <GraduationCap size={15} className="text-slate-500" />
            <select
              value={currentFaculty?.id}
              onChange={(e) => setActiveFacultyId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.department || 'Faculty'})
                </option>
              ))}
            </select>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 transition shadow-2xs cursor-pointer"
            title="Refresh Timetable from Server"
          >
            <RefreshCw size={15} className={isSyncing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={13} />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid size={13} />
              <span>Weekly Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          SUMMARY METRIC STRIP
          ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Weekly Classes</span>
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalWeeklyClasses}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Assigned lecture slots</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Today's Classes</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{todayClassesCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">{dayNames[todayCode] || 'Today'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Courses Handled</span>
            <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <BookOpen size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{distinctCourses}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Subject curriculum</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Class Sections</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users size={14} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{distinctSections}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Student batches</p>
        </div>
      </div>

      {/* ========================================================
          DAY FILTER PILLS
          ======================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedDay('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            selectedDay === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span>All Days</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              selectedDay === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {facultySlots.length}
          </span>
        </button>

        {daysOfWeek.map((day) => {
          const count = facultySlots.filter(
            (s) => (s.day || '').toLowerCase().slice(0, 3) === day.toLowerCase()
          ).length;
          const isToday = day === todayCode;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedDay === day
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>{dayNames[day]}</span>
              {isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-white shrink-0" />
              )}
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  selectedDay === day ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          SCHEDULE CONTENT: CARDS / LIST VIEW
          ======================================================== */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {sortedSlots.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200/90 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Calendar size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Teaching Sessions</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No classes are scheduled for {selectedDay === 'all' ? currentFaculty?.name : `${dayNames[selectedDay]} for ${currentFaculty?.name}`}.
              </p>
              {selectedDay !== 'all' && (
                <button
                  onClick={() => setSelectedDay('all')}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition cursor-pointer"
                >
                  View All Days
                </button>
              )}
            </div>
          ) : (
            sortedSlots.map((slot) => {
              const subj = subjects.find((s) => s.id === slot.subjectId);
              const sec = classSections.find((cs) => cs.id === slot.classSectionId);

              const subjectTitle = slot.subjectName || subj?.name || 'Class Session';
              const subjectCode = slot.subjectCode || subj?.code || slot.subjectId;
              const sectionName = slot.classSectionName || sec?.name || 'Class Section';
              const room = slot.room || 'LH-201';
              const dayStr = slot.day ? dayNames[slot.day.slice(0, 3)] || slot.day : 'Weekday';

              return (
                <div
                  key={slot.id}
                  className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/90 hover:border-indigo-200 shadow-2xs hover:shadow-xs transition group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Period Badge */}
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50/90 border border-indigo-100 text-indigo-700 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-500">
                        Period
                      </span>
                      <span className="text-base font-black leading-tight">
                        {slot.period || 1}
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-100/70 text-indigo-700 text-xs font-mono font-black">
                          {subjectCode}
                        </span>
                        <h4 className="text-sm md:text-base font-black text-slate-900 group-hover:text-indigo-600 transition truncate">
                          {subjectTitle}
                        </h4>
                        {selectedDay === 'all' && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">
                            {dayStr}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={13} className="text-indigo-500 shrink-0" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Users size={13} className="text-amber-500 shrink-0" />
                          <span>{sectionName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin size={13} className="text-rose-500 shrink-0" />
                          <span>Room: {room}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action: Quick Attendance Broadcast */}
                  {onStartAttendanceClick && (
                    <button
                      onClick={() =>
                        onStartAttendanceClick({
                          subjectName: `${subjectTitle} (${subjectCode})`,
                          sectionName: sectionName,
                          room: room,
                          expectedStudents: 45,
                          time: `${slot.startTime} - ${slot.endTime}`,
                        })
                      }
                      className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer self-end md:self-auto"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Start Session</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          SCHEDULE CONTENT: WEEKLY MATRIX GRID VIEW
          ======================================================== */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="p-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider w-28 text-center">
                    Period
                  </th>
                  {daysOfWeek.map((day) => (
                    <th
                      key={day}
                      className={`p-3.5 text-xs font-bold uppercase tracking-wider text-center ${
                        day === todayCode ? 'text-indigo-600 bg-indigo-50/60' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{dayNames[day]}</span>
                        {day === todayCode && (
                          <span className="text-[9px] font-extrabold text-indigo-600 lowercase bg-indigo-100 px-1.5 rounded-full mt-0.5">
                            today
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {standardPeriods.map((p) => (
                  <tr key={p.period} className="hover:bg-slate-50/50 transition">
                    {/* Period Time Header Column */}
                    <td className="p-3 text-center bg-slate-50/40 border-r border-slate-200">
                      <div className="font-mono text-xs font-black text-slate-800">
                        Period {p.period}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.time}</div>
                    </td>

                    {/* Day Slot Cells */}
                    {daysOfWeek.map((day) => {
                      const slot = facultySlots.find(
                        (s) =>
                          (s.day || '').toLowerCase().slice(0, 3) === day.toLowerCase() &&
                          s.period === p.period
                      );

                      if (!slot) {
                        return (
                          <td
                            key={day}
                            className={`p-2.5 text-center border-r border-slate-100 last:border-r-0 ${
                              day === todayCode ? 'bg-indigo-50/20' : ''
                            }`}
                          >
                            <span className="text-[11px] text-slate-300 font-mono">—</span>
                          </td>
                        );
                      }

                      const subj = subjects.find((s) => s.id === slot.subjectId);
                      const sec = classSections.find((cs) => cs.id === slot.classSectionId);
                      const subjectCode = slot.subjectCode || subj?.code || slot.subjectId;
                      const sectionName = slot.classSectionName || sec?.name || 'Sec A';

                      return (
                        <td
                          key={day}
                          className={`p-2 border-r border-slate-100 last:border-r-0 ${
                            day === todayCode ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 hover:border-indigo-400 transition shadow-2xs text-left">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold text-[10px]">
                                {subjectCode}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                {slot.room || 'LH-201'}
                              </span>
                            </div>
                            <div className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">
                              {slot.subjectName || subj?.name || 'Class'}
                            </div>
                            <div className="text-[10px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                              <Users size={10} className="text-amber-500 shrink-0" />
                              <span className="truncate">{sectionName}</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
