import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp,
  Calendar,
  Layers,
  ChevronRight,
  ScanFace,
  Mail,
  Phone,
  Award,
  Briefcase
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useSessionStore } from '../../store/useSessionStore';

interface FacultyHomeProps {
  onStartAttendanceClick: (classInfo: any) => void;
}

export const FacultyHome: React.FC<FacultyHomeProps> = ({ onStartAttendanceClick }) => {
  const { selectedFaculty, faculty, timetable, subjects, classSections, syncWithBackend } = useAppStore();
  const { activeSession } = useSessionStore();

  useEffect(() => {
    syncWithBackend();
  }, []);

  const [activeFacultyId, setActiveFacultyId] = useState<string>('');
  const currentFaculty = (activeFacultyId ? faculty.find(f => f.id === activeFacultyId) : null) || 
    faculty.find(f => f.id === selectedFaculty.id) || 
    faculty[0] || 
    selectedFaculty;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDay = daysOfWeek[new Date().getDay()] || 'Mon';
  const [selectedDay, setSelectedDay] = useState<string>(todayDay);
  const [filter, setFilter] = useState<'all' | 'morning' | 'afternoon'>('all');

  const isBroadcasting = activeSession && activeSession.status === 'broadcasting';

  // Compute teaching classes for this faculty from real timetable
  const facultyTimetable = (timetable || []).filter(
    (s) => s.facultyId === currentFaculty.id
  );

  const dayFilteredSlots = facultyTimetable.filter((s) => {
    if (selectedDay === 'All') return true;
    return s.day === selectedDay;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const dynamicTodayClasses = dayFilteredSlots.map((slot, index) => {
    const sub = subjects.find(s => s.id === slot.subjectId);
    const sec = classSections.find(c => c.id === slot.classSectionId);
    const hour = parseInt((slot.startTime || '09').split(':')[0], 10);
    const period = hour < 12 ? 'morning' : 'afternoon';

    return {
      id: slot.id,
      code: sub?.code || slot.subjectCode || 'SUB',
      subjectName: sub?.name || slot.subjectName || 'Assigned Lecture',
      sectionName: sec?.name || slot.classSectionName || 'Class Section',
      time: `${slot.startTime} - ${slot.endTime}`,
      period,
      room: slot.room,
      wing: 'Academic Lecture Hall',
      expectedStudents: sec?.studentCount || 45,
      isCurrent: index === 0,
      subjectId: slot.subjectId,
      classSectionId: slot.classSectionId,
      avatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces'
      ]
    };
  });

  const filteredClasses = dynamicTodayClasses.filter(cls => {
    if (filter === 'morning') return cls.period === 'morning';
    if (filter === 'afternoon') return cls.period === 'afternoon';
    return true;
  });

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-32 md:pb-8 bg-[#F8FAFC] text-slate-900 overflow-y-auto space-y-6">
      {/* ========================================================
          1. CLEAN LIGHT PLATINUM / WHITE SEMICONDUCTOR DASHBOARD CARD
          - Layer 1: Clean Light Platinum / White background (#FFFFFF / #F8FAFC)
          - Lift: Soft cool-slate radial glow behind chip
          - Layer 2 & 3: Detailed dark titanium/slate microchip in TOP-RIGHT quadrant + outward circuit traces
          - Layer 4: Light gradient shield overlay ONLY on left two-thirds to protect text readability
          - Layer 5: Foreground UI text and frosted glass status panel
          ======================================================== */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-4 sm:p-7 text-slate-900 shadow-xl shadow-slate-200/50">
        {/* Soft indigo ambient radial glow */}
        <div 
          className="absolute top-0 right-0 w-80 sm:w-96 h-64 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.03) 50%, transparent 75%)'
          }}
        />

        {/* Decorative subtle circuit traces in top right */}
        <div className="absolute top-0 right-0 w-64 sm:w-80 h-48 pointer-events-none opacity-40 select-none hidden sm:block">
          <svg viewBox="0 0 320 200" fill="none" className="w-full h-full">
            <path d="M 120 20 L 160 20 L 190 50 L 260 50" stroke="#CBD5E1" strokeWidth="1.5" />
            <path d="M 150 40 L 180 40 L 210 70 L 300 70" stroke="#E2E8F0" strokeWidth="1.2" />
            <path d="M 170 80 L 200 80 L 220 100 L 290 100" stroke="#CBD5E1" strokeWidth="1.5" />
            <circle cx="260" cy="50" r="3" fill="#6366F1" />
            <circle cx="300" cy="70" r="2.5" fill="#8B5CF6" />
            <circle cx="290" cy="100" r="3" fill="#64748B" />
          </svg>
        </div>

        {/* ========================================================
            LAYER 5: FOREGROUND UI TEXT (FULLY OPAQUE, RESPONSIVE)
            ======================================================== */}
        <div className="relative z-10 space-y-3 sm:space-y-4 max-w-[80%] sm:max-w-[70%] md:max-w-none pr-2 sm:pr-0">
          {/* Top-Left: Date Badge */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-slate-100/80 text-slate-600 border border-slate-200/80 backdrop-blur-md">
              <Calendar size={11} className="text-slate-500 shrink-0" />
              <span>{todayFormatted}</span>
            </span>
          </div>

          {/* Mid-Section: Bold Greeting & Subtext */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Good morning, {currentFaculty?.name || 'Professor'}</span>
                <span className="text-xl sm:text-2xl">👋</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                  <ShieldCheck size={12} className="text-indigo-600" />
                  <span>Roster Faculty</span>
                </span>
              </h1>
            </div>

            {/* Email & Details bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-semibold text-slate-800 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                <Mail size={13} className="text-indigo-600" />
                <span>{currentFaculty?.email || 'faculty@campus.edu'}</span>
              </span>

              {currentFaculty?.phone && (
                <span className="flex items-center gap-1 font-mono font-medium text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                  <Phone size={13} className="text-indigo-600" />
                  <span>{currentFaculty.phone}</span>
                </span>
              )}

              <span className="flex items-center gap-1 font-medium text-slate-700 bg-purple-50/80 px-2.5 py-1 rounded-lg border border-purple-200/60">
                <Briefcase size={13} className="text-purple-600" />
                <span>{currentFaculty?.designation || 'Associate Professor'}</span>
              </span>

              {currentFaculty?.isMentor && (
                <span className="flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                  <Award size={13} className="text-emerald-600" />
                  <span>Mentor: {currentFaculty.mentorGroup || 'Active Group'}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-normal leading-relaxed">
                {currentFaculty?.department || 'Academic Faculty'} • Staff ID:{' '}
                <span className="font-mono text-slate-800 font-semibold">{currentFaculty?.employeeId || 'STAFF-IT-101'}</span>
              </p>

              {faculty.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Faculty Profile:</span>
                  <select
                    value={currentFaculty.id}
                    onChange={(e) => setActiveFacultyId(e.target.value)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none transition cursor-pointer"
                  >
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.department || 'Academic'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. EXECUTIVE METRIC OVERVIEW CARDS (HORIZONTAL ROW)
          ======================================================== */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Attendance Rate */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <span>+3.2%</span>
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
              94.2%
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1.5">
              Avg Attendance
            </p>
          </div>
        </div>

        {/* Card 2: Today's Classes */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock size={10} className="text-slate-500 shrink-0" />
              <span>{filteredClasses[0]?.time || 'Schedule'}</span>
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {dynamicTodayClasses.length} Classes
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1.5">
              Scheduled Periods
            </p>
          </div>
        </div>

        {/* Card 3: Biometric Match */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ScanFace size={16} />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={11} className="shrink-0" />
              <span>Active</span>
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
              99.1%
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1.5">
              Biometric Accuracy
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. HERO FOCUS CARD: PRIORITY NEXT SESSION
          ======================================================== */}
      {filteredClasses[0] && (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  Priority Next Session
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                  {filteredClasses[0].sectionName}
                </span>
                {isBroadcasting && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    BROADCAST ACTIVE
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {filteredClasses[0].subjectName} ({filteredClasses[0].code})
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Assigned Section: {filteredClasses[0].sectionName}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Clock size={13} className="text-slate-500 shrink-0" />
                  <span className="font-mono font-medium text-slate-800">{filteredClasses[0].time}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <MapPin size={13} className="text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-800">{filteredClasses[0].room}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Users size={13} className="text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-800">{filteredClasses[0].expectedStudents} Students</span>
                </div>
              </div>
            </div>

            <div className="lg:w-68 shrink-0 flex flex-col justify-center">
              {isBroadcasting && activeSession?.subjectName.includes(filteredClasses[0].code) ? (
                <button
                  onClick={() => onStartAttendanceClick(filteredClasses[0])}
                  className="w-full py-3.5 px-5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.99] transition cursor-pointer"
                >
                  <Radio size={16} />
                  <span>View Live Session ({activeSession.checkedInStudentIds.length})</span>
                  <ArrowRight size={15} className="ml-auto" />
                </button>
              ) : (
                <button
                  onClick={() => onStartAttendanceClick(filteredClasses[0])}
                  className="w-full py-3.5 px-5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.99] transition cursor-pointer"
                >
                  <Play size={15} fill="currentColor" />
                  <span>Start Attendance Beacon</span>
                  <ArrowRight size={15} className="ml-auto" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. SCHEDULE TIMELINE (FULL WIDTH)
          ======================================================== */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {selectedDay === todayDay ? "Today's Schedule" : selectedDay === 'All' ? 'Full Weekly Teaching Schedule' : `${selectedDay} Schedule`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentFaculty?.name} &bull; {filteredClasses.length} Scheduled Classes
            </p>
          </div>

          {/* Day & Period Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto">
              {['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    selectedDay === d ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d === todayDay ? `${d} (Today)` : d}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('morning')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  filter === 'morning' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Morning
              </button>
              <button
                onClick={() => setFilter('afternoon')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  filter === 'afternoon' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Afternoon
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {filteredClasses.map((cls) => {
            const isThisActive = isBroadcasting && activeSession?.subjectName.includes(cls.code);
            return (
              <div
                key={cls.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isThisActive
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : cls.isCurrent
                    ? 'bg-white border-slate-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {cls.code}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">{cls.sectionName}</span>
                  </div>

                  {isThisActive ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      <span>Live Now</span>
                    </span>
                  ) : cls.isCurrent ? (
                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      Next in Queue
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Upcoming
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900 tracking-tight">
                  {cls.subjectName}
                </h4>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-700">{cls.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-medium">{cls.room}</span>
                    <span className="text-slate-400">({cls.wing.split(',')[0]})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-slate-400 shrink-0" />
                    <span>{cls.expectedStudents} Students</span>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Mode: <strong className="text-slate-700 font-medium">BLE + Face</strong>
                  </span>

                  {isThisActive ? (
                    <button
                      onClick={() => onStartAttendanceClick(cls)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Radio size={13} />
                      <span>Live Session ({activeSession.checkedInStudentIds.length})</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartAttendanceClick(cls)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play size={11} fill="currentColor" />
                      <span>Start Beacon</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FacultyHome;
