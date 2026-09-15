import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Search, 
  AlertCircle, 
  Award, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  X, 
  ShieldCheck, 
  Layers, 
  Activity, 
  GraduationCap, 
  Building2,
  FileCheck2,
  Filter,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Users,
  CheckSquare,
  Sunrise,
  Sunset,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import { useSessionStore } from '../../store/useSessionStore';
import { LeaveRequest, DaySession } from '../../types';
import { FacultyHistory } from './FacultyHistory';
import { facultyApi } from '../../api/client';

// Helper to parse dates safely without timezone shifts
const parseDateString = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const clean = dateStr.split('T')[0].trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Formats a date string into rich day, month, year, and weekday components
const formatDateDetails = (dateStr?: string) => {
  const d = parseDateString(dateStr);
  if (!d) return { formatted: dateStr || 'N/A', weekday: '', short: dateStr || 'N/A' };
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return {
    formatted: `${day} ${month} ${year}`,
    weekday,
    short: `${day} ${month}`,
    full: `${weekday}, ${day} ${month} ${year}`,
  };
};

// Formats appliedAt timestamp into a clean readable string
const formatAppliedTime = (appliedAt?: string) => {
  if (!appliedAt) return 'Recently';
  try {
    const d = new Date(appliedAt);
    if (isNaN(d.getTime())) return appliedAt;
    const dateStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateStr} • ${timeStr}`;
  } catch {
    return appliedAt;
  }
};

// Computes the exact number of days a student is on leave, taking Forenoon/Afternoon sessions into account
const calculateLeaveDurationDetails = (
  startDate?: string,
  startSession: DaySession | string = 'FN',
  endDate?: string,
  endSession: DaySession | string = 'AN',
  storedDaysCount?: number,
  storedIsHalfDay?: boolean
) => {
  const sDate = startDate || '';
  const eDate = endDate || startDate || '';
  const sSess = (startSession || 'FN') as DaySession;
  const eSess = (endSession || (sDate === eDate ? sSess : 'AN')) as DaySession;

  const s = parseDateString(sDate);
  const e = parseDateString(eDate);

  if (!s || !e) {
    const days = storedDaysCount ?? 1;
    return {
      days,
      isHalfDay: storedIsHalfDay ?? (days === 0.5),
      displayBadge: `${days} ${days === 1 ? 'Day' : days === 0.5 ? 'Half Day' : 'Days'}`,
      tagText: days === 0.5 ? 'Half Day Leave' : days === 1 ? 'Full Day Leave' : `${days} Days Leave`,
    };
  }

  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let days = 1;
  let isHalfDay = false;

  if (diffDays <= 0) {
    // Same day
    if (sSess === eSess) {
      days = 0.5;
      isHalfDay = true;
    } else {
      days = 1.0;
      isHalfDay = false;
    }
  } else {
    // Multi-day
    const startContrib = sSess === 'FN' ? 1.0 : 0.5;
    const endContrib = eSess === 'AN' ? 1.0 : 0.5;
    const middleDays = Math.max(0, diffDays - 1);
    days = startContrib + middleDays + endContrib;
    isHalfDay = days === 0.5;
  }

  // If storedDaysCount exists and matches closely, respect it
  if (storedDaysCount && storedDaysCount > 0 && Math.abs(storedDaysCount - days) < 0.2) {
    days = storedDaysCount;
  }

  return {
    days,
    isHalfDay,
    displayBadge: `${days} ${days === 1 ? 'Day' : days === 0.5 ? 'Half Day' : 'Days'}`,
    tagText: days === 0.5 ? 'Half Day Leave' : days === 1 ? 'Single Day Leave' : `${days} Days Leave`,
  };
};

export const FacultyApprovals: React.FC = () => {
  const { 
    selectedFaculty, 
    setSelectedFaculty, 
    faculty, 
    students, 
    leaveRequests, 
    updateLeaveStatus 
  } = useAppStore();

  const { historySessions } = useSessionStore();

  // Primary view toggle: 'leaves' (Leave Approvals) or 'sessions' (Session Attendance Logs)
  const [activeView, setActiveView] = useState<'leaves' | 'sessions'>('leaves');

  // Leave filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMenteeFilter, setSelectedMenteeFilter] = useState<string | null>(null);

  // Helper to extract clean 2-letter initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (clean[0] || 'U').toUpperCase();
  };

  // Per-leave review comment state
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [revisingLeaveId, setRevisingLeaveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [serverApprovals, setServerApprovals] = useState<LeaveRequest[] | null>(null);

  const loadApprovals = async () => {
    setIsLoadingApprovals(true);
    try {
      const data = await facultyApi.getApprovals(
        statusFilter === 'all' ? undefined : statusFilter,
        selectedFaculty?.id
      );
      if (Array.isArray(data)) {
        setServerApprovals(data);
        useAppStore.setState((state) => {
          const otherLeaves = state.leaveRequests.filter(
            (l) => !data.some((d: any) => d.id === l.id)
          );
          return { leaveRequests: [...data, ...otherLeaves] };
        });
      }
    } catch (err) {
      console.warn('Failed to load faculty approvals:', err);
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [selectedFaculty?.id, statusFilter]);

  // Check if current faculty is a mentor
  const assignedMentees = useMemo(() => {
    return students.filter(
      (s) => s.mentorId === selectedFaculty.id || s.mentorName === selectedFaculty.name
    );
  }, [students, selectedFaculty]);

  // Leaves assigned to this mentor (supports ID match, name match, or mentee match)
  const mentorLeaves = useMemo(() => {
    if (serverApprovals !== null) {
      return serverApprovals;
    }
    const filtered = leaveRequests.filter((l) => {
      if (!selectedFaculty) return true;
      const idMatch = l.mentorId === selectedFaculty.id;
      const nameMatch = Boolean(
        l.mentorName && selectedFaculty.name && (
          l.mentorName.toLowerCase().includes(selectedFaculty.name.toLowerCase()) ||
          selectedFaculty.name.toLowerCase().includes(l.mentorName.toLowerCase())
        )
      );
      const menteeMatch = assignedMentees.some(
        (m) => m.id === l.studentId || m.rollNumber === l.rollNumber
      );
      return idMatch || nameMatch || menteeMatch;
    });
    return filtered.length > 0 ? filtered : leaveRequests;
  }, [serverApprovals, leaveRequests, selectedFaculty, assignedMentees]);

  const isMentor = useMemo(() => {
    return (
      assignedMentees.length > 0 ||
      mentorLeaves.length > 0
    );
  }, [assignedMentees, mentorLeaves]);

  const pendingCount = useMemo(
    () => mentorLeaves.filter((l) => l.status === 'pending').length,
    [mentorLeaves]
  );
  const approvedCount = useMemo(
    () => mentorLeaves.filter((l) => l.status === 'approved').length,
    [mentorLeaves]
  );
  const rejectedCount = useMemo(
    () => mentorLeaves.filter((l) => l.status === 'rejected').length,
    [mentorLeaves]
  );

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return mentorLeaves.filter((req) => {
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesType = typeFilter === 'all' || req.leaveType === typeFilter;
      const matchesSearch =
        searchQuery === '' ||
        req.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMentee =
        selectedMenteeFilter === null ||
        req.studentId === selectedMenteeFilter ||
        req.rollNumber === selectedMenteeFilter;

      return matchesStatus && matchesType && matchesSearch && matchesMentee;
    });
  }, [mentorLeaves, statusFilter, typeFilter, searchQuery, selectedMenteeFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = (req: LeaveRequest) => {
    const comment = reviewComments[req.id]?.trim() || 'Approved by mentor.';
    updateLeaveStatus(req.id, 'approved', comment);
    setServerApprovals((prev) =>
      prev ? prev.map((l) => (l.id === req.id ? { ...l, status: 'approved', reviewComment: comment } : l)) : prev
    );
    setRevisingLeaveId(null);

    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.6 },
    });

    showToast(`Leave request for ${req.studentName} approved successfully.`);
  };

  const handleReject = (req: LeaveRequest) => {
    const comment = reviewComments[req.id]?.trim() || 'Leave request denied by mentor.';
    updateLeaveStatus(req.id, 'rejected', comment);
    setServerApprovals((prev) =>
      prev ? prev.map((l) => (l.id === req.id ? { ...l, status: 'rejected', reviewComment: comment } : l)) : prev
    );
    setRevisingLeaveId(null);

    showToast(`Leave request for ${req.studentName} has been rejected.`);
  };

  const getLeaveTypeBadge = (type: LeaveRequest['leaveType']) => {
    switch (type) {
      case 'Medical Leave':
        return {
          icon: <Activity size={13} />,
          bg: 'bg-rose-50 text-rose-700 border-rose-200/90',
          dot: 'bg-rose-500',
        };
      case 'On-Duty (OD)':
        return {
          icon: <Award size={13} />,
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
          dot: 'bg-indigo-500',
        };
      case 'Academic / Conference':
        return {
          icon: <GraduationCap size={13} />,
          bg: 'bg-purple-50 text-purple-700 border-purple-200/90',
          dot: 'bg-purple-500',
        };
      case 'Personal / Emergency':
      default:
        return {
          icon: <AlertCircle size={13} />,
          bg: 'bg-amber-50 text-amber-700 border-amber-200/90',
          dot: 'bg-amber-500',
        };
    }
  };

  const getRingColor = (rate: number) => {
    if (rate >= 75) return '#10B981';
    if (rate >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto pb-28 bg-[#F8FAFC] text-slate-900">
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

      {/* Top Header & Segmented Subtab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileCheck2 size={18} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Approvals
              </h2>
            </div>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="inline-flex p-1 bg-slate-200/80 rounded-2xl border border-slate-300/80 self-start sm:self-auto">
          <button
            onClick={() => setActiveView('leaves')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeView === 'leaves'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare size={14} />
            <span>Approvals</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('sessions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'sessions'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar size={14} />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          VIEW 1: LEAVE APPROVALS (PRIMARY WORKFLOW)
          ======================================================== */}
      {activeView === 'leaves' && (
        <div className="space-y-6">
          {/* Mentor Status Hero Banner */}
          {isMentor ? (
            <div className="bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 rounded-3xl border border-indigo-100/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="relative">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-base shadow-sm font-mono tracking-tight ring-2 ring-white">
                      {getInitials(selectedFaculty.name)}
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white shadow-2xs"
                      title="Active Faculty Mentor"
                    >
                      <ShieldCheck size={11} />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                        {selectedFaculty.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100/80 text-indigo-800 text-[10px] font-bold border border-indigo-200">
                        Academic Mentor
                      </span>
                      <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                      <span className="text-slate-500 font-mono text-xs">
                        {selectedFaculty.employeeId || 'EMP-701'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedFaculty.department}
                    </p>
                  </div>
                </div>

                {/* Quick Metrics Bar */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3 bg-white/90 p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="text-center px-2 py-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Mentees
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      {assignedMentees.length}
                    </div>
                  </div>

                  <div className="text-center px-2 py-1 border-l border-slate-100">
                    <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Pending
                    </div>
                    <div className="text-base sm:text-lg font-black text-amber-600 font-mono">
                      {pendingCount}
                    </div>
                  </div>

                  <div className="text-center px-2 py-1 border-l border-slate-100">
                    <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                      Approved
                    </div>
                    <div className="text-base sm:text-lg font-black text-emerald-600 font-mono">
                      {approvedCount}
                    </div>
                  </div>

                  <div className="text-center px-2 py-1 border-l border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Rejected
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-500 font-mono">
                      {rejectedCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mentee Quick Selector Strip */}
              {assignedMentees.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-indigo-100/80 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                    <Users size={12} />
                    Mentees:
                  </span>

                  <button
                    onClick={() => setSelectedMenteeFilter(null)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedMenteeFilter === null
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    All ({assignedMentees.length})
                  </button>

                  {assignedMentees.map((m) => (
                    <button
                      key={m.id}
                      onClick={() =>
                        setSelectedMenteeFilter(
                          selectedMenteeFilter === m.id ? null : m.id
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                        selectedMenteeFilter === m.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-md font-bold text-[9px] flex items-center justify-center font-mono ${
                        selectedMenteeFilter === m.id ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {m.name[0]}
                      </span>
                      <span>{m.name}</span>
                      <span className="text-[10px] font-mono opacity-80">({m.rollNumber})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Non-Mentor Informational Notice with Demo Switcher */
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">
                    Not Assigned as Mentor
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Signed in as <strong className="text-slate-900">{selectedFaculty.name}</strong>. Only assigned mentors can approve leave.
                  </p>
                </div>
              </div>

              {/* Quick Switcher */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {faculty.slice(0, 4).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFaculty(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      selectedFaculty?.id === f.id
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Leave Filters and Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({mentorLeaves.length})
              </button>

              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Clock size={12} />
                <span>Pending ({pendingCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 size={12} />
                <span>Approved ({approvedCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <XCircle size={12} />
                <span>Rejected ({rejectedCount})</span>
              </button>

              <button
                onClick={loadApprovals}
                disabled={isLoadingApprovals}
                title="Refresh approvals from database"
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200"
              >
                <RefreshCw size={12} className={isLoadingApprovals ? 'animate-spin text-indigo-600' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Search Input & Category Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="all">All</option>
                <option value="Medical Leave">Medical</option>
                <option value="On-Duty (OD)">OD</option>
                <option value="Academic / Conference">Academic</option>
                <option value="Personal / Emergency">Personal</option>
              </select>
            </div>
          </div>

          {/* Leaves Cards List */}
          {filteredLeaves.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileCheck2 size={24} />
              </div>
              <h4 className="font-bold text-sm text-slate-800">
                No leave requests found
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || selectedMenteeFilter
                  ? 'No applications match your active filter criteria. Try resetting the filters.'
                  : 'There are no leave applications submitted by your assigned mentees at this time.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || selectedMenteeFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setSelectedMenteeFilter(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeaves.map((req) => {
                const typeStyle = getLeaveTypeBadge(req.leaveType);
                const isPending = req.status === 'pending';
                const isRevising = revisingLeaveId === req.id;

                const fromDateInfo = formatDateDetails(req.startDate);
                const toDateInfo = formatDateDetails(req.endDate || req.startDate);
                const fromSession = req.startSession || 'FN';
                const toSession = req.endSession || (req.startDate === req.endDate ? fromSession : 'AN');
                const durationInfo = calculateLeaveDurationDetails(
                  req.startDate,
                  fromSession,
                  req.endDate,
                  toSession,
                  req.daysCount,
                  req.isHalfDay
                );

                return (
                  <div
                    key={req.id}
                    className={`group relative bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                      isPending
                        ? 'border-amber-300/90 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.12)] hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.2)]'
                        : req.status === 'approved'
                        ? 'border-emerald-200/90 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.16)]'
                        : 'border-slate-200/90 shadow-xs hover:shadow-md'
                    }`}
                  >
                    {/* Left accent indicator strip */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        isPending
                          ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500'
                          : req.status === 'approved'
                          ? 'bg-gradient-to-b from-emerald-400 to-teal-600'
                          : 'bg-gradient-to-b from-rose-400 to-rose-600'
                      }`}
                    />

                    <div className="p-5 sm:p-6 pl-6 sm:pl-7 space-y-4">
                      {/* Top Row: Student Profile & Status Badge */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/20 ring-2 ring-white shrink-0 font-mono tracking-tight">
                              {getInitials(req.studentName)}
                            </div>
                            {isPending && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-white"></span>
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                                {req.studentName}
                              </h4>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200/80 shadow-2xs">
                                <GraduationCap size={12} className="text-indigo-600" />
                                Mentee
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 border border-slate-200/80 text-[11px]">
                                {req.rollNumber}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-sans font-medium text-slate-600 flex items-center gap-1 text-xs">
                                <Building2 size={12} className="text-slate-400" />
                                {req.department}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div>
                          {req.status === 'pending' ? (
                            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border border-amber-300/80 text-xs font-bold shadow-2xs">
                              <Clock size={13} className="text-amber-600 animate-spin" />
                              <span>Pending Review</span>
                            </span>
                          ) : req.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-2xs">
                              <CheckCircle2 size={14} className="text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold shadow-2xs">
                              <XCircle size={14} className="text-rose-600" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hero Schedule & Leave Duration Showcase */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50/90 via-indigo-50/25 to-slate-50/90 border border-slate-200/90 shadow-2xs relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
                          {/* FROM DATE */}
                          <div className="md:col-span-4 p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                              <span className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-indigo-500" />
                                From Date
                              </span>
                              <span className="text-slate-400 font-medium lowercase first-letter:uppercase">
                                {fromDateInfo.weekday}
                              </span>
                            </div>
                            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono">
                              {fromDateInfo.formatted}
                            </div>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                fromSession === 'FN'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              }`}>
                                {fromSession === 'FN' ? <Sunrise size={11} className="text-amber-600" /> : <Sunset size={11} className="text-indigo-600" />}
                                <span>{fromSession === 'FN' ? 'Forenoon (FN)' : 'Afternoon (AN)'}</span>
                              </span>
                            </div>
                          </div>

                          {/* DURATION PILL (Center Hero Connector) */}
                          <div className="md:col-span-3 flex flex-col items-center justify-center text-center px-1 py-1">
                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                              <ArrowRight size={11} className="hidden md:inline text-indigo-400" />
                              <span>Leave Duration</span>
                              <ArrowRight size={11} className="hidden md:inline text-indigo-400" />
                            </div>
                            
                            {/* Prominent High-Visibility Duration Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-sm shadow-indigo-600/30 ring-2 ring-indigo-200/50">
                              <Clock size={14} className="text-indigo-200" />
                              <span className="text-xs sm:text-sm font-black tracking-tight font-mono whitespace-nowrap">
                                {durationInfo.displayBadge}
                              </span>
                            </div>

                            <span className="text-[10px] font-bold text-indigo-900/80 mt-1.5 bg-indigo-100/60 px-2.5 py-0.5 rounded-full border border-indigo-200/70">
                              {durationInfo.tagText}
                            </span>
                          </div>

                          {/* TO DATE */}
                          <div className="md:col-span-4 p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                              <span className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-indigo-500" />
                                To Date
                              </span>
                              <span className="text-slate-400 font-medium lowercase first-letter:uppercase">
                                {toDateInfo.weekday}
                              </span>
                            </div>
                            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono">
                              {toDateInfo.formatted}
                            </div>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                toSession === 'FN'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              }`}>
                                {toSession === 'FN' ? <Sunrise size={11} className="text-amber-600" /> : <Sunset size={11} className="text-indigo-600" />}
                                <span>{toSession === 'FN' ? 'Forenoon (FN)' : 'Afternoon (AN)'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Secondary Metadata Grid: Leave Type & Applied Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Leave Type */}
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                          <div className={`p-2 rounded-xl border ${typeStyle.bg}`}>
                            {typeStyle.icon}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Leave Category
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {req.leaveType}
                            </span>
                          </div>
                        </div>

                        {/* Application Timestamp */}
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock size={14} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Submitted On
                            </span>
                            <span className="text-xs font-semibold text-slate-700 font-mono">
                              {formatAppliedTime(req.appliedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reason Statement Container */}
                      <div className="p-3.5 rounded-2xl bg-slate-50/90 border-l-4 border-l-indigo-500 border border-slate-200/80 text-xs">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          <FileText size={12} className="text-indigo-500" />
                          <span>Reason for Request:</span>
                        </div>
                        <p className="text-slate-800 font-medium italic leading-relaxed pl-0.5">
                          "{req.reason}"
                        </p>
                      </div>

                      {/* Review Comment Display if already reviewed */}
                      {req.reviewComment && !isRevising && (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-violet-50/50 border border-indigo-100 flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                              <MessageSquare size={12} className="text-indigo-600" />
                              Mentor Decision Note:
                            </span>
                            <p className="text-slate-700 font-medium pl-0.5">
                              "{req.reviewComment}"
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setRevisingLeaveId(req.id);
                              setReviewComments((prev) => ({
                                ...prev,
                                [req.id]: req.reviewComment || '',
                              }));
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs hover:shadow-xs transition shrink-0 cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      )}

                      {/* Action Bar (When pending OR revising decision) */}
                      {(isPending || isRevising) && (
                        <div className="pt-2 space-y-3 border-t border-slate-100">
                          {/* Optional Mentor Review Remark Input */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                <MessageSquare size={12} className="text-slate-400" />
                                <span>Remark / Approval Note:</span>
                              </label>

                              {/* Quick Suggestions */}
                              <div className="flex items-center gap-1 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReviewComments((prev) => ({
                                      ...prev,
                                      [req.id]: 'Approved for OD quota credit.',
                                    }))
                                  }
                                  className="text-[10px] font-semibold text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                                >
                                  + OD Credit
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReviewComments((prev) => ({
                                      ...prev,
                                      [req.id]: 'Medical certificate verified.',
                                    }))
                                  }
                                  className="text-[10px] font-semibold text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                                >
                                  + Medical Verified
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReviewComments((prev) => ({
                                      ...prev,
                                      [req.id]: 'Special duty permission granted.',
                                    }))
                                  }
                                  className="text-[10px] font-semibold text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                                >
                                  + Special Duty
                                </button>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={reviewComments[req.id] || ''}
                              onChange={(e) =>
                                setReviewComments((prev) => ({
                                  ...prev,
                                  [req.id]: e.target.value,
                                }))
                              }
                              placeholder="Enter mentor remarks or endorsement reason..."
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
                            />
                          </div>

                          {/* Approval / Rejection Buttons */}
                          <div className="flex items-center justify-end gap-2.5">
                            {isRevising && (
                              <button
                                onClick={() => setRevisingLeaveId(null)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}

                            <button
                              onClick={() => handleReject(req)}
                              className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-xs"
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </button>

                            <button
                              onClick={() => handleApprove(req)}
                              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-500/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 size={15} />
                              <span>Approve Leave</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          VIEW 2: SESSION ATTENDANCE LOGS (CONTINUITY)
          ======================================================== */}
      {activeView === 'sessions' && (
        <div className="-m-4 sm:-m-6 lg:-m-8">
          <FacultyHistory />
        </div>
      )}
    </div>
  );
};

export default FacultyApprovals;
