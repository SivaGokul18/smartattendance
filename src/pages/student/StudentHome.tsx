import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Calendar,
  ScanFace,
  User,
  Radio,
  BookOpen,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  Award
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useSessionStore } from '../../store/useSessionStore';
import { studentApi } from '../../api/client';

interface StudentHomeProps {
  onMarkAttendance: () => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ onMarkAttendance }) => {
  const { currentUser, selectedStudent, timetable, classSections, subjects, faculty, syncWithBackend } = useAppStore();
  const { activeSession, setActiveSession } = useSessionStore();

  useEffect(() => {
    syncWithBackend();

    const fetchLiveSession = async () => {
      try {
        const homeData = await studentApi.getHome();
        if (homeData?.activeSessionInRange) {
          setActiveSession(homeData.activeSessionInRange);
        } else if (activeSession && !homeData?.activeSessionInRange) {
          // If previous session ended on backend
          setActiveSession(null);
        }
      } catch (err) {
        // Silent fallback to local store if offline
      }
    };

    fetchLiveSession();
    const interval = setInterval(fetchLiveSession, 5000);

    return () => clearInterval(interval);
  }, []);

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  const displayName = currentUser?.name || (selectedStudent?.name && selectedStudent.name !== 'Student' ? selectedStudent.name : '') || 'Student';
  const displayRoll = currentUser?.rollNumber || selectedStudent?.rollNumber || '—';
  const displayDept = currentUser?.department || selectedStudent?.department || 'General';
  const displayYear = selectedStudent?.year || 1;

  // Match current student's class section
  const studentClass = (selectedSectionId ? classSections.find(c => c.id === selectedSectionId) : null) || classSections?.find(
    (c) => (c.department === selectedStudent?.department || c.name.toLowerCase().includes(selectedStudent?.department?.toLowerCase() || '')) &&
           c.year === selectedStudent?.year &&
           c.section === selectedStudent?.section
  ) || classSections?.[0];

  const matchedSlots = (timetable || []).filter(
    (s) => !studentClass || !s.classSectionId || s.classSectionId === studentClass?.id
  );
  // If matchedSlots is empty, show all slots so student schedule is never blank
  const studentTimetableSlots = matchedSlots.length > 0 ? matchedSlots : (timetable || []);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDay = daysOfWeek[new Date().getDay()] || 'Mon';
  const [activeDayView, setActiveDayView] = useState<string>(todayDay);

  const todayPeriods = studentTimetableSlots.filter((s) => s.day === todayDay);

  const displayedPeriods = studentTimetableSlots
    .filter((s) => activeDayView === 'All' ? true : s.day === activeDayView)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const isBleSessionLive = activeSession && activeSession.status === 'broadcasting';
  const isAlreadyCheckedIn =
    activeSession && selectedStudent?.id && activeSession.checkedInStudentIds.includes(selectedStudent.id);

  // Current or next period
  const currentSlot = displayedPeriods[0] || studentTimetableSlots[0];
  const currentSubject = subjects.find((s) => s.id === currentSlot?.subjectId);
  const currentFaculty = faculty.find((f) => f.id === currentSlot?.facultyId);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-32 md:pb-8 bg-[#F8FAFC] text-slate-900 overflow-y-auto space-y-6 font-sans">
      {/* 1. CLEAN LIGHT HERO GREETING CARD */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 text-slate-900 shadow-xl shadow-slate-200/50">
        <div 
          className="absolute -top-10 -right-10 w-72 sm:w-96 h-64 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 80% 20%, rgba(13, 148, 136, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, transparent 75%)'
          }}
        />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Calendar size={13} className="text-teal-600 shrink-0" />
              <span>{todayFormatted}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 border border-teal-200 text-teal-700">
              {todayPeriods.length > 0 ? `${todayPeriods.length} Periods Today` : 'No Classes Today'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>Hello, {displayName}</span>
                <span className="text-xl sm:text-2xl">👋</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-bold">
                  <ShieldCheck size={12} className="text-teal-600" />
                  <span>Roster Student</span>
                </span>
              </h1>
            </div>

            {/* Email & Contact bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-semibold text-slate-800 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                <Mail size={13} className="text-teal-600" />
                <span>{currentUser?.email || selectedStudent?.email || 'student@campus.edu'}</span>
              </span>

              {(currentUser?.phone || selectedStudent?.phone) && (
                <span className="flex items-center gap-1 font-mono font-medium text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                  <Phone size={13} className="text-teal-600" />
                  <span>{currentUser?.phone || selectedStudent?.phone}</span>
                </span>
              )}

              {(currentUser?.mentorName || selectedStudent?.mentorName) && (
                <span className="flex items-center gap-1 font-medium text-slate-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-200/60">
                  <Award size={13} className="text-indigo-600" />
                  <span>Mentor: <strong className="text-indigo-900">{currentUser?.mentorName || selectedStudent?.mentorName}</strong></span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Roll No: <span className="font-mono text-slate-800 font-semibold">{displayRoll}</span> &bull;{' '}
                <span>{displayDept} &bull; Year {displayYear} (Sec {currentUser?.section || selectedStudent?.section || 'A'})</span>
              </p>

              {classSections.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Class:</span>
                  <select
                    value={studentClass?.id || ''}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none transition cursor-pointer"
                  >
                    {classSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SPOTLIGHT / ACTIVE PERIOD CARD */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-600 text-white shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{currentSlot ? 'PERIOD 1 • UPCOMING' : 'STATUS'}</span>
              </span>

              {isAlreadyCheckedIn ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Attendance Verified</span>
                </span>
              ) : isBleSessionLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Session Live</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Clock size={12} className="text-slate-500" />
                  <span>{currentSlot ? `Starts at ${currentSlot.startTime}` : 'No Active Session'}</span>
                </span>
              )}
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {isBleSessionLive ? activeSession.subjectName : currentSubject ? `${currentSubject.name} (${currentSubject.code})` : currentSlot?.subjectName || (currentSlot ? 'Scheduled Period' : 'No Active Lecture')}
              </h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <User size={13} className="text-slate-400" />
                <span>Faculty:</span>
                <strong className="text-slate-800 font-semibold">
                  {isBleSessionLive ? activeSession.facultyName : currentFaculty?.name || currentSlot?.facultyName || (currentSlot ? 'Assigned Faculty' : 'None Scheduled')}
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
                <Clock size={13} className="text-teal-600" />
                <span className="font-mono font-semibold">{currentSlot ? `${currentSlot.startTime} - ${currentSlot.endTime}` : 'No Scheduled Hours'}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
                <MapPin size={13} className="text-emerald-600" />
                <span className="font-medium">Room {currentSlot?.room || '—'}</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Box */}
          <div className="lg:w-64 shrink-0">
            {isAlreadyCheckedIn ? (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={18} />
                </div>
                <div className="text-emerald-900 font-bold text-sm">Present</div>
                <p className="text-xs text-emerald-700">
                  Your attendance has been recorded for this period.
                </p>
              </div>
            ) : isBleSessionLive ? (
              <button
                onClick={onMarkAttendance}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <ScanFace size={18} />
                <span>Mark Attendance</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-teal-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Radio size={16} className="text-teal-600" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Ready for Attendance
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Attendance will open when class begins.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          3. TODAY'S PERIODS (EXCLUSIVELY TODAY'S CLASSES)
          ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen size={18} className="text-teal-600" />
              <span>{activeDayView === todayDay ? "Today's Periods" : activeDayView === 'All' ? 'All Scheduled Periods' : `${activeDayView} Schedule`}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {studentClass?.name || 'Class Section'} &bull; {displayedPeriods.length} Classes Scheduled
            </p>
          </div>

          {/* Day Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 bg-slate-100 p-1 rounded-xl">
            {['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <button
                key={d}
                onClick={() => setActiveDayView(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeDayView === d
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {d === todayDay ? `${d} (Today)` : d}
              </button>
            ))}
          </div>
        </div>

        {/* List of Periods for Today */}
        {displayedPeriods.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
            <BookOpen size={28} className="mx-auto text-slate-400" />
            <h4 className="text-sm font-bold text-slate-800">No Lectures Scheduled for this selection</h4>
            <p className="text-xs text-slate-500">
              Select another day or class section to view scheduled periods.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedPeriods.map((slot, index) => {
            const sub = subjects.find((s) => s.id === slot.subjectId);
            const fac = faculty.find((f) => f.id === slot.facultyId);
            const isLab = (slot.room && slot.room.toLowerCase().includes('lab')) || (sub?.name && sub.name.toLowerCase().includes('lab'));
            const isCurrentPeriod = index === 0;

            return (
              <div
                key={slot.id || index}
                className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all ${
                  isCurrentPeriod
                    ? 'border-teal-400 shadow-sm ring-1 ring-teal-400/30'
                    : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Period Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold font-mono">
                      {slot.day} &bull; Period {index + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {sub?.code || slot.subjectCode || 'SUB'}
                    </span>
                    {isLab && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Practical Lab
                      </span>
                    )}
                  </div>

                  {isCurrentPeriod ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                      <span>Upcoming</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Scheduled
                    </span>
                  )}
                </div>

                {/* Subject Title */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {sub?.name || slot.subjectName || 'Class Lecture'}
                </h3>

                {/* Period Meta: Time, Room, Faculty */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="font-mono font-medium text-slate-700">{slot.startTime} - {slot.endTime}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800">{slot.room}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-medium">{fac?.name || slot.facultyName || 'Faculty Member'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};

export default StudentHome;
