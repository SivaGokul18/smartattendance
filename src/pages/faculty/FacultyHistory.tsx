import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  Search, 
  Bell, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Radio, 
  ShieldCheck, 
  Users, 
  Filter, 
  Sparkles, 
  Layers,
  X,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSessionStore } from '../../store/useSessionStore';
import { useAppStore } from '../../store/useAppStore';

export const FacultyHistory: React.FC = () => {
  const { historySessions } = useSessionStore();
  const { students } = useAppStore();

  // Filter modes: 'all' (All Days) or 'byDate' (Specific date)
  const [viewFilterMode, setViewFilterMode] = useState<'all' | 'byDate'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-07');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dark Charcoal Calendar Modal State (Matching Image 2)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(2026);
  const [pickerMonth, setPickerMonth] = useState(8); // 8 = September (0-indexed)
  const [tempDay, setTempDay] = useState(7);

  // Session Details Modal State ("see all details")
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<any | null>(null);
  const [rosterFilter, setRosterFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [rosterSearch, setRosterSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick dates for horizontal strip (matching Image 2 background)
  const quickDates = [
    { dayNum: 'all', label: 'All Days', dateStr: 'all' },
    { dayNum: 7, label: '07, Mon', dateStr: '2026-09-07' },
    { dayNum: 4, label: '04, Fri', dateStr: '2026-09-04' },
    { dayNum: 3, label: '03, Thu', dateStr: '2026-09-03' },
    { dayNum: 2, label: '02, Wed', dateStr: '2026-09-02' },
    { dayNum: 1, label: '01, Tue', dateStr: '2026-09-01' },
    { dayNum: 28, label: '28, Aug', dateStr: '2026-08-28' },
  ];

  // Ring color helper
  const getRingColor = (rate: number) => {
    if (rate >= 75) return '#10B981'; // Emerald
    if (rate >= 60) return '#F59E0B'; // Amber
    return '#EF4444'; // Rose
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Format header date for calendar modal: "Mon, 7 Sept"
  const getHeaderDateFormatted = (y: number, m: number, d: number) => {
    try {
      const dt = new Date(y, m, d);
      const weekday = dt.toLocaleDateString('en-US', { weekday: 'short' });
      const monthShort = dt.toLocaleDateString('en-US', { month: 'short' });
      return `${weekday}, ${d} ${monthShort}`;
    } catch {
      return `Mon, ${d} Sept`;
    }
  };

  // Format pill date: "Sep 7, 2026" or "All Days"
  const getFormattedPillDate = (dateStr: string) => {
    if (viewFilterMode === 'all' || dateStr === 'all') return 'All Days';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Open calendar modal
  const handleOpenDatePicker = () => {
    if (viewFilterMode === 'byDate' && selectedDate) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      setPickerYear(y || 2026);
      setPickerMonth((m || 9) - 1);
      setTempDay(d || 7);
    } else {
      setPickerYear(2026);
      setPickerMonth(8); // September
      setTempDay(7);
    }
    setIsDatePickerOpen(true);
  };

  // Month navigation in calendar
  const handlePrevMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear(pickerYear - 1);
    } else {
      setPickerMonth(pickerMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear(pickerYear + 1);
    } else {
      setPickerMonth(pickerMonth + 1);
    }
  };

  // SET button in calendar modal
  const handleApplySet = () => {
    const formatted = `${pickerYear}-${(pickerMonth + 1).toString().padStart(2, '0')}-${tempDay.toString().padStart(2, '0')}`;
    setSelectedDate(formatted);
    setViewFilterMode('byDate');
    setIsDatePickerOpen(false);
  };

  // CLEAR button in calendar modal (reverts to All Days)
  const handleClearDate = () => {
    setViewFilterMode('all');
    setSelectedDate('2026-09-07');
    setIsDatePickerOpen(false);
  };

  // Calculations for current picker month days
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(pickerYear, pickerMonth, 1).getDay();
  const monthName = new Date(pickerYear, pickerMonth, 1).toLocaleDateString('en-US', { month: 'long' });

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return historySessions.filter((sess) => {
      // Date filter: if byDate, match sess.dateStr or sess.date
      if (viewFilterMode === 'byDate') {
        const matchesDateStr = sess.dateStr === selectedDate;
        const matchesDateText = sess.date.toLowerCase().includes(
          new Date(selectedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toLowerCase()
        );
        if (!matchesDateStr && !matchesDateText) return false;
      }

      // Subject filter
      if (selectedSubject !== 'all') {
        const matchCode = sess.subjectCode?.toLowerCase() === selectedSubject.toLowerCase();
        const matchName = sess.subjectName.toLowerCase().includes(selectedSubject.toLowerCase());
        if (!matchCode && !matchName) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSub = sess.subjectName.toLowerCase().includes(q);
        const matchClass = sess.className.toLowerCase().includes(q);
        const matchRoom = (sess.room || '').toLowerCase().includes(q);
        const matchDate = sess.date.toLowerCase().includes(q);
        if (!matchSub && !matchClass && !matchRoom && !matchDate) return false;
      }

      return true;
    });
  }, [historySessions, viewFilterMode, selectedDate, selectedSubject, searchQuery]);

  // Detailed attendee roster for the selected session modal
  const sessionAttendees = useMemo(() => {
    if (!selectedSessionForDetails) return [];

    const presentIds = selectedSessionForDetails.checkedInStudentIds || [];
    return students.map((stu) => {
      const isPresent = presentIds.includes(stu.id);
      return {
        id: `att-${selectedSessionForDetails.id}-${stu.id}`,
        name: stu.name,
        rollNumber: stu.rollNumber,
        photoUrl: stu.photoUrl,
        department: stu.department,
        status: isPresent ? ('present' as const) : ('absent' as const),
        checkInTime: isPresent ? '09:05 AM' : '—',
        method: 'ble+face' as const,
        faceMatchRate: isPresent ? '98.6%' : 'No Signal',
        rssi: isPresent ? '-48 dBm' : 'Out of range',
      };
    });
  }, [selectedSessionForDetails, students]);

  // Helper to extract clean 2-letter initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (clean[0] || 'U').toUpperCase();
  };

  // Filter roster in session modal
  const filteredRoster = useMemo(() => {
    return sessionAttendees.filter((att) => {
      if (rosterFilter === 'present' && att.status !== 'present') return false;
      if (rosterFilter === 'absent' && att.status !== 'absent') return false;

      if (rosterSearch.trim()) {
        const q = rosterSearch.toLowerCase();
        const matchName = att.name.toLowerCase().includes(q);
        const matchRoll = att.rollNumber.toLowerCase().includes(q);
        if (!matchName && !matchRoll) return false;
      }

      return true;
    });
  }, [sessionAttendees, rosterFilter, rosterSearch]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5 overflow-y-auto pb-28 bg-[#F8FAFC] text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles size={16} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            History
          </h2>
        </div>

        {/* Header Action Icons matching Image 2 */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-48 sm:w-56 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => showToast('All lecture logs are synced with the central registrar ledger.')}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-2xs relative"
            title="Registry Sync Status"
          >
            <Bell size={16} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* =========================================================
          DUAL SELECTOR PILLS (Exact match to reference Image 2)
          [ 📅 Sep 7, 2026 ▾ ]   and   [ 🎚️ All Subjects ▾ ]
          ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Date Selector Pill (Triggers Dark Charcoal Calendar Modal) */}
        <button
          type="button"
          onClick={handleOpenDatePicker}
          className={`w-full px-4 py-3 rounded-2xl bg-white border text-left transition duration-150 cursor-pointer flex items-center justify-between shadow-xs hover:shadow-sm ${
            viewFilterMode === 'byDate' || isDatePickerOpen
              ? 'border-indigo-600 ring-1 ring-indigo-600/30'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CalendarIcon size={16} className="text-indigo-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {getFormattedPillDate(selectedDate)}
            </span>
          </div>

          {isDatePickerOpen ? (
            <ChevronUp size={16} className="text-indigo-600 shrink-0 ml-1" />
          ) : (
            <ChevronDown size={16} className="text-slate-400 shrink-0 ml-1" />
          )}
        </button>

        {/* Subject Filter Pill */}
        <div className="relative">
          <div className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Filter size={16} className="text-indigo-600 shrink-0" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all">All Subjects</option>
                <option value="CS301">CS301 - Machine Learning</option>
                <option value="CS304">CS304 - Embedded IoT Systems</option>
                <option value="CS302">CS302 - Mobile & Cloud Computing</option>
                <option value="CS305">CS305 - Deep Neural Architectures</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          FILTER BY DATE & HORIZONTAL QUICK DAY STRIP
          (Matching Image 2 background style)
          ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs space-y-2">
        {viewFilterMode === 'byDate' && (
          <div className="flex justify-end text-xs pb-1">
            <button
              onClick={handleClearDate}
              className="text-rose-600 hover:text-rose-700 font-semibold transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Quick Date Pills Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickDates.map((item) => {
            const isSelected =
              item.dateStr === 'all'
                ? viewFilterMode === 'all'
                : viewFilterMode === 'byDate' && selectedDate === item.dateStr;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.dateStr === 'all') {
                    setViewFilterMode('all');
                  } else {
                    setSelectedDate(item.dateStr);
                    setViewFilterMode('byDate');
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          PAST SESSIONS CARDS LIST (Matching Image 1)
          ========================================================= */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
              <CalendarIcon size={24} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">
              No sessions found
            </h4>
            <button
              onClick={handleClearDate}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <CalendarIcon size={13} />
              <span>All Days</span>
            </button>
          </div>
        ) : (
          filteredSessions.map((sess) => {
            const ringColor = getRingColor(sess.attendanceRate);
            return (
              <div
                key={sess.id}
                onClick={() => setSelectedSessionForDetails(sess)}
                className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
              >
                <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {sess.className}
                    </span>
                    {sess.room && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 font-mono">
                        <MapPin size={9} /> {sess.room}
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition truncate">
                    {sess.subjectName}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <CalendarIcon size={12} className="text-slate-400" />
                      <span>{sess.date}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={12} className="text-slate-400" />
                      <span>{sess.time}</span>
                    </span>
                  </div>
                </div>

                {/* Colored Circular Progress Ring matching Image 1 */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="relative w-13 h-13 flex items-center justify-center">
                    <svg className="w-13 h-13 transform -rotate-90">
                      <circle
                        cx="26"
                        cy="26"
                        r="20"
                        stroke="#E2E8F0"
                        strokeWidth="3.8"
                        fill="transparent"
                      />
                      <circle
                        cx="26"
                        cy="26"
                        r="20"
                        stroke={ringColor}
                        strokeWidth="3.8"
                        fill="transparent"
                        strokeDasharray={125.6}
                        strokeDashoffset={125.6 - (125.6 * sess.attendanceRate) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-slate-900 font-mono">
                      {sess.attendanceRate}%
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700 transition" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================
          DARK CHARCOAL MATERIAL CALENDAR MODAL (Exact match to Image 2)
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
                className="p-1.5 rounded-full hover:bg-slate-700/60 transition cursor-pointer text-slate-300 hover:text-white"
                title="Previous month"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-sm font-bold tracking-wide text-white">
                {monthName} {pickerYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-full hover:bg-slate-700/60 transition cursor-pointer text-slate-300 hover:text-white"
                title="Next month"
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

      {/* =========================================================
          SESSION DETAILS & STUDENT ROSTER MODAL ("see all details")
          ========================================================= */}
      {selectedSessionForDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSessionForDetails(null);
          }}
        >
          <div className="w-full max-w-2xl rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                    {selectedSessionForDetails.className}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                    <ShieldCheck size={11} /> BLE + Face Verified
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {selectedSessionForDetails.subjectName}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <CalendarIcon size={12} className="text-slate-400" />
                    <span>{selectedSessionForDetails.date}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    <span>{selectedSessionForDetails.time}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{selectedSessionForDetails.room || 'LH-204'}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedSessionForDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Attendance Performance Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/80">
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Compliance Rate
                </span>
                <span className="text-lg font-black text-slate-900 font-mono flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getRingColor(selectedSessionForDetails.attendanceRate) }}
                  />
                  {selectedSessionForDetails.attendanceRate}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Present Students
                </span>
                <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
                  {selectedSessionForDetails.presentCount} / {selectedSessionForDetails.totalCount || 45}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                  Absent Students
                </span>
                <span className="text-lg font-black text-rose-500 font-mono mt-0.5 block">
                  {(selectedSessionForDetails.totalCount || 45) - selectedSessionForDetails.presentCount}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  BLE Signal Range
                </span>
                <span className="text-xs font-bold text-indigo-700 font-mono mt-1.5 block">
                  -44 dBm (12m inside)
                </span>
              </div>
            </div>

            {/* Roster Controls: Search & Filter Tabs */}
            <div className="px-5 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
                <button
                  onClick={() => setRosterFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    rosterFilter === 'all'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({sessionAttendees.length})
                </button>
                <button
                  onClick={() => setRosterFilter('present')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    rosterFilter === 'present'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Present ({selectedSessionForDetails.presentCount})
                </button>
                <button
                  onClick={() => setRosterFilter('absent')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    rosterFilter === 'absent'
                      ? 'bg-white text-rose-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Absent ({(selectedSessionForDetails.totalCount || 45) - selectedSessionForDetails.presentCount})
                </button>
              </div>

              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Search student or roll..."
                  className="pl-7 pr-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                />
              </div>
            </div>

            {/* Student Attendee List */}
            <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2 divide-y divide-slate-100">
              {filteredRoster.map((att) => (
                <div key={att.id} className="pt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 via-slate-100 to-indigo-100/60 border border-slate-200/90 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs font-mono">
                      {getInitials(att.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">
                          {att.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {att.rollNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>Check-in: {att.checkInTime}</span>
                        <span>•</span>
                        <span>{att.faceMatchRate}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {att.status === 'present' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 size={10} />
                        <span>Present</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        <XCircle size={10} />
                        <span>Absent</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  confetti({
                    particleCount: 50,
                    spread: 50,
                    origin: { y: 0.6 },
                  });
                  showToast(`CSV downloaded for ${selectedSessionForDetails.subjectName}`);
                }}
                className="px-3.5 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setSelectedSessionForDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyHistory;
