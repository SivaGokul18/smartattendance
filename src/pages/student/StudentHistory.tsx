import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check,
  Search,
  Bell
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface SessionRecord {
  id: string;
  dateStr: string; // '2026-09-07'
  dateLabel: string; // 'Mon, 7 Sep'
  subjectCode: string;
  subjectName: string;
  time: string;
  room: string;
  faculty: string;
  status: 'present' | 'absent' | 'leave';
  verificationMethod: string;
}

interface SubjectOption {
  code: string;
  name: string;
  attended: number;
  total: number;
  rate: number;
}

export const StudentHistory: React.FC = () => {
  const { selectedStudent } = useAppStore();

  // Date Filter & Picker States
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-07');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [viewFilterMode, setViewFilterMode] = useState<'byDate' | 'all'>('byDate');

  // Temporary picker states inside modal
  const [pickerYear, setPickerYear] = useState(2026);
  const [pickerMonth, setPickerMonth] = useState(8); // 8 = September
  const [tempDay, setTempDay] = useState(7);

  // Overall attendance statistics derived dynamically
  const allSessions: SessionRecord[] = [];

  const totalDaysPresent = allSessions.filter((s) => s.status === 'present').length;
  const totalDaysAbsent = allSessions.filter((s) => s.status === 'absent').length;
  const totalWorkingDays = totalDaysPresent + totalDaysAbsent;
  const overallRate = totalWorkingDays > 0 
    ? Math.round((totalDaysPresent / totalWorkingDays) * 100) 
    : (selectedStudent?.attendanceRate || 0);

  // Subject options
  const subjectOptions: SubjectOption[] = [
    { code: 'All', name: 'All Subjects', attended: totalDaysPresent, total: totalWorkingDays, rate: overallRate },
  ];

  const currentSubjectObj = subjectOptions.find((s) => s.code === selectedSubject) || subjectOptions[0];

  // Helper for formatting header date like "Mon, 7 Sept"
  const getHeaderDateFormatted = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    return `${dayName}, ${day} ${monthName}`;
  };

  // Helper for pill date label matching reference mockup: "Sep 7, 2026"
  const getFormattedPillDate = (dateString: string) => {
    if (viewFilterMode === 'all') return 'All Dates';
    const [y, m, d] = dateString.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filtered sessions
  const filteredSessions = allSessions.filter((s) => {
    const matchesDate = viewFilterMode === 'all' || s.dateStr === selectedDate;
    const matchesSubject = selectedSubject === 'All' || s.subjectCode === selectedSubject;
    return matchesDate && matchesSubject;
  });

  const selectedDayNum = parseInt(selectedDate.split('-')[2] || '7', 10);

  // Month navigation in dialog
  const handlePrevMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear((y) => y - 1);
    } else {
      setPickerMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear((y) => y + 1);
    } else {
      setPickerMonth((m) => m + 1);
    }
  };

  // Open picker dialog pre-loaded with currently selected date
  const handleOpenDatePicker = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    setPickerYear(y || 2026);
    setPickerMonth((m || 9) - 1);
    setTempDay(d || 7);
    setIsDatePickerOpen(true);
  };

  // Confirm date selection from modal (SET button)
  const handleApplySet = () => {
    const formatted = `${pickerYear}-${(pickerMonth + 1).toString().padStart(2, '0')}-${tempDay.toString().padStart(2, '0')}`;
    setSelectedDate(formatted);
    setViewFilterMode('byDate');
    setIsDatePickerOpen(false);
  };

  // Clear date selection (CLEAR button matching Image 2)
  const handleClearDate = () => {
    setSelectedDate('2026-09-07');
    setViewFilterMode('all');
    setIsDatePickerOpen(false);
  };


  // Ring color
  const getRingColor = (rate: number) => {
    if (rate >= 75) return '#10B981'; // Emerald
    if (rate >= 65) return '#F59E0B'; // Amber
    return '#EF4444'; // Rose
  };

  // Calculations for current picker month days
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(pickerYear, pickerMonth, 1).getDay();
  const monthName = new Date(pickerYear, pickerMonth, 1).toLocaleDateString('en-US', { month: 'long' });

  // Quick dates for September 2026 strip (matching reference mockup)
  const quickDates = [
    { dayNum: 7, label: '07, Mon', dateStr: '2026-09-07' },
    { dayNum: 4, label: '04, Fri', dateStr: '2026-09-04' },
    { dayNum: 3, label: '03, Thu', dateStr: '2026-09-03' },
    { dayNum: 2, label: '02, Wed', dateStr: '2026-09-02' },
    { dayNum: 1, label: '01, Tue', dateStr: '2026-09-01' },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto pb-28 bg-[#F8FAFC] text-[#1E293B]">
      {/* Header bar matching Image 2 */}
      <div className="flex items-center justify-between pb-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          History
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            title="Search records"
          >
            <Search size={16} />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-2xs relative"
            title="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* =========================================================
          1. DUAL SELECTOR PILLS (Exact match to reference image)
          [ 📅 Sep 7, 2026 ▾ ]   and   [ 🎚️ All Subjects ▾ ]
          ========================================================= */}
      <div className="grid grid-cols-2 gap-3 relative z-30">
        {/* Date Selector Pill */}
        <button
          type="button"
          onClick={handleOpenDatePicker}
          className={`w-full px-4 py-3 rounded-2xl bg-white border text-left transition duration-150 cursor-pointer flex items-center justify-between shadow-xs hover:shadow-sm ${
            viewFilterMode === 'byDate' || isDatePickerOpen ? 'border-teal-600' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CalendarIcon size={16} className="text-teal-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {getFormattedPillDate(selectedDate)}
            </span>
          </div>
          {isDatePickerOpen ? (
            <ChevronUp size={16} className="text-teal-600 shrink-0 ml-1" />
          ) : (
            <ChevronDown size={16} className="text-slate-400 shrink-0 ml-1" />
          )}
        </button>

        {/* Subject Selector Pill with Floating Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
            className={`w-full px-4 py-3 rounded-2xl bg-white border text-left transition duration-150 cursor-pointer flex items-center justify-between shadow-xs hover:shadow-sm ${
              selectedSubject !== 'All' ? 'border-teal-600' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <SlidersHorizontal size={15} className="text-teal-600 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                {selectedSubject === 'All' ? 'All Subjects' : selectedSubject}
              </span>
            </div>
            <ChevronDown size={16} className="text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Floating Subject Dropdown Menu */}
          {isSubjectDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsSubjectDropdownOpen(false)} 
              />
              <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-1.5 space-y-0.5">
                {subjectOptions.map((subj) => (
                  <button
                    key={subj.code}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(subj.code);
                      setIsSubjectDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between cursor-pointer text-xs ${
                      selectedSubject === subj.code
                        ? 'bg-teal-50 text-teal-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-slate-900">{subj.code}</span>
                      <span className="text-slate-500 font-normal truncate block text-[11px]">{subj.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono font-bold text-teal-700">{subj.rate}%</span>
                      {selectedSubject === subj.code && <Check size={14} className="text-teal-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* =========================================================
          2. FILTER BY DATE QUICK STRIP (Matching reference image)
          ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-teal-800 uppercase tracking-wider text-[11px]">
            <CalendarIcon size={14} className="text-teal-600" />
            <span>Filter By Date</span>
          </div>
          <div className="flex items-center gap-3">
            {(viewFilterMode === 'byDate' || selectedSubject !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setViewFilterMode('all');
                  setSelectedSubject('All');
                }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
              >
                Reset
              </button>
            )}
            <span className="text-slate-500 font-medium text-xs">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
            </span>
          </div>
        </div>

        {/* Quick Date Chips (Rounded-full matching Image 2) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {quickDates.map((qd) => (
            <button
              key={qd.dateStr}
              type="button"
              onClick={() => {
                setSelectedDate(qd.dateStr);
                setViewFilterMode('byDate');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                viewFilterMode === 'byDate' && selectedDate === qd.dateStr
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {qd.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleOpenDatePicker}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition cursor-pointer flex items-center gap-1"
          >
            <span>More</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* =========================================================
          3. CORE METRICS (Percentage, Days Present, Days Absent, Working Days)
          Clean, minimal, no filler wording
          ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Attendance Percentage */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Percentage
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {currentSubjectObj.rate}%
            </div>
          </div>
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="19"
                stroke="#E2E8F0"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="19"
                stroke={getRingColor(currentSubjectObj.rate)}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={119.3}
                strokeDashoffset={119.3 - (119.3 * currentSubjectObj.rate) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[11px] font-black text-slate-900">
              {currentSubjectObj.rate}%
            </span>
          </div>
        </div>

        {/* Days Present */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Days Present
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {currentSubjectObj.attended}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Days Absent */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Days Absent
            </span>
            <div className="text-2xl font-black text-rose-600 mt-0.5">
              {currentSubjectObj.total - currentSubjectObj.attended}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle size={18} />
          </div>
        </div>

        {/* Working Days */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Working Days
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {currentSubjectObj.total}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <CalendarIcon size={18} />
          </div>
        </div>
      </div>

      {/* =========================================================
          4. SESSIONS LIST (Clean, minimal cards)
          ========================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-900">
            {viewFilterMode === 'byDate' ? getHeaderDateFormatted(2026, 8, selectedDayNum) : 'All Sessions'}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {filteredSessions.length} {filteredSessions.length === 1 ? 'Class' : 'Classes'}
          </span>
        </div>

        {filteredSessions.length > 0 ? (
          <div className="space-y-2">
            {filteredSessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {sess.subjectCode}
                    </span>
                    <span className="text-xs text-slate-700 truncate">
                      {sess.subjectName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock size={11} className="text-slate-400" />
                      {sess.time}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />
                      {sess.room}
                    </span>
                    <span>•</span>
                    <span>{sess.faculty}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {sess.status === 'present' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Present
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Absent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
            No classes recorded for this date.
          </div>
        )}
      </div>

      {/* =========================================================
          5. DARK CHARCOAL MATERIAL CALENDAR MODAL (Matching Image 2)
          ========================================================= */}
      {isDatePickerOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDatePickerOpen(false);
          }}
        >
          <div className="w-full max-w-xs sm:max-w-sm rounded-3xl bg-[#374151] text-white shadow-2xl overflow-hidden border border-slate-600/50 my-auto animate-in zoom-in-95 duration-150">
            {/* Header: 2026 / Mon, 7 Sept in sleek dark container */}
            <div className="bg-[#374151] px-6 pt-6 pb-4 border-b border-slate-600/40">
              <span className="text-xs font-semibold text-slate-300 block tracking-wider uppercase">
                {pickerYear}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1 tracking-tight">
                {getHeaderDateFormatted(pickerYear, pickerMonth, tempDay)}
              </h2>
            </div>

            {/* Navigation: < September 2026 > */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2 text-white">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-full hover:bg-slate-700/60 transition cursor-pointer text-slate-300 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-sm font-semibold tracking-wide text-white">
                {monthName} {pickerYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-slate-700/60 transition cursor-pointer text-slate-300 hover:text-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Days row: S M T W T F S */}
            <div className="grid grid-cols-7 gap-1 px-5 text-center text-xs font-bold text-slate-400 py-2">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 px-5 pb-4">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="w-9 h-9" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = tempDay === dayNum;

                return (
                  <button
                    key={`d-${dayNum}`}
                    type="button"
                    onClick={() => setTempDay(dayNum)}
                    className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#80CBC4] text-slate-900 font-black shadow-md'
                        : 'text-slate-200 hover:bg-slate-700/60'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions: CLEAR (left), CANCEL and SET (right) in teal #80CBC4 */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-600/40 text-xs font-bold tracking-wider">
              <button
                type="button"
                onClick={handleClearDate}
                className="text-[#80CBC4] hover:text-teal-200 transition uppercase cursor-pointer"
              >
                CLEAR
              </button>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(false)}
                  className="text-[#80CBC4] hover:text-teal-200 transition uppercase cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleApplySet}
                  className="text-[#80CBC4] hover:text-teal-200 transition uppercase cursor-pointer"
                >
                  SET
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHistory;
