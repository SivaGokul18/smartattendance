import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Clock3, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  Search, 
  Plus, 
  X, 
  Sunrise, 
  Sunset, 
  ChevronDown, 
  Send, 
  BookOpen, 
  Trash2,
  CalendarDays,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { DaySession, FacultyLeaveRequest } from '../../types';
import { facultyApi } from '../../api/client';

// Helper to calculate leave duration taking Forenoon/Afternoon into account
const calculateLeaveDuration = (
  startDate: string,
  startSession: DaySession,
  endDate: string,
  endSession: DaySession
): { days: number; isHalfDay: boolean } => {
  if (!startDate || !endDate) return { days: 1, isHalfDay: false };
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { days: 0, isHalfDay: false };

  if (diffDays === 0) {
    if (startSession === endSession) {
      return { days: 0.5, isHalfDay: true };
    }
    return { days: 1, isHalfDay: false };
  }

  let days = diffDays;
  if (startSession === 'FN') days += 0.5;
  if (endSession === 'AN') days += 0.5;
  const isHalfDay = days % 1 !== 0;
  return { days, isHalfDay };
};

export const FacultyLeave: React.FC = () => {
  const { 
    selectedFaculty, 
    facultyLeaveRequests, 
    addFacultyLeaveRequest, 
    cancelFacultyLeaveRequest,
    timetable,
    subjects
  } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cancelingLeaveId, setCancelingLeaveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [leaveType, setLeaveType] = useState<FacultyLeaveRequest['leaveType']>('Casual Leave');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startSession, setStartSession] = useState<DaySession>('FN');
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endSession, setEndSession] = useState<DaySession>('AN');
  const [reason, setReason] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const [isLoadingLeaves, setIsLoadingLeaves] = useState(false);
  const [serverLeaves, setServerLeaves] = useState<FacultyLeaveRequest[] | null>(null);

  const loadFacultyLeaves = async () => {
    setIsLoadingLeaves(true);
    try {
      const data = await facultyApi.getLeaves();
      if (Array.isArray(data)) {
        setServerLeaves(data);
        useAppStore.setState({ facultyLeaveRequests: data });
      }
    } catch (err) {
      console.warn('Could not load faculty leaves from backend:', err);
    } finally {
      setIsLoadingLeaves(false);
    }
  };

  useEffect(() => {
    loadFacultyLeaves();
  }, [selectedFaculty?.id]);

  // Leaves for current faculty
  const myLeaves = useMemo(() => {
    if (serverLeaves !== null) {
      return serverLeaves;
    }
    const filtered = facultyLeaveRequests.filter((l) => {
      if (!selectedFaculty) return true;
      const idMatch = l.facultyId === selectedFaculty.id;
      const nameMatch = Boolean(
        l.facultyName && selectedFaculty.name && (
          l.facultyName.toLowerCase().includes(selectedFaculty.name.toLowerCase()) ||
          selectedFaculty.name.toLowerCase().includes(l.facultyName.toLowerCase())
        )
      );
      return idMatch || nameMatch;
    });
    return filtered.length > 0 ? filtered : facultyLeaveRequests;
  }, [serverLeaves, facultyLeaveRequests, selectedFaculty]);

  // Compute affected lectures for selected dates
  const affectedLectures = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    // Find days of week between startDate and endDate
    const daysSet = new Set<string>();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const curr = new Date(start);
    while (curr <= end) {
      daysSet.add(dayMap[curr.getDay()]);
      curr.setDate(curr.getDate() + 1);
    }

    // Filter faculty's timetable slots
    const mySlots = timetable.filter(
      (slot) => slot.facultyId === selectedFaculty?.id && daysSet.has(slot.day)
    );

    return mySlots.map((slot) => {
      const sub = subjects.find((s) => s.id === slot.subjectId);
      return {
        ...slot,
        subjectName: sub ? `${sub.name} (${sub.code})` : 'Class Lecture',
      };
    });
  }, [startDate, endDate, timetable, selectedFaculty, subjects]);

  const filteredLeaves = useMemo(() => {
    return myLeaves.filter((l) => {
      const matchesSearch = 
        l.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.substituteFacultyName && l.substituteFacultyName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = l.status === statusFilter;
      }
      return matchesSearch && matchesStatus;
    });
  }, [myLeaves, searchQuery, statusFilter]);

  const pendingCount = myLeaves.filter(l => l.status === 'pending').length;
  const approvedCount = myLeaves.filter(l => l.status === 'approved').length;
  const rejectedCount = myLeaves.filter(l => l.status === 'rejected').length;

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = calculateLeaveDuration(startDate, startSession, endDate, endSession);

    const affectedSubjectNames = Array.from(
      new Set(affectedLectures.map((l) => l.subjectName))
    );

    addFacultyLeaveRequest({
      facultyId: selectedFaculty.id,
      facultyName: selectedFaculty.name,
      employeeId: selectedFaculty.employeeId || 'EMP-701',
      department: selectedFaculty.department || 'Computer Science',
      leaveType,
      startDate,
      startSession,
      endDate,
      endSession,
      daysCount: duration.days,
      isHalfDay: duration.isHalfDay,
      reason,
      affectedSubjects: affectedSubjectNames,
    });

    setIsApplyModalOpen(false);
    setReason('');
    showToast('Leave application submitted to Administration for substitute assignment.');
    setTimeout(() => {
      loadFacultyLeaves();
    }, 400);
  };

  const handleConfirmCancel = () => {
    if (!cancelingLeaveId) return;
    cancelFacultyLeaveRequest(cancelingLeaveId);
    setCancelingLeaveId(null);
    showToast('Leave request withdrawn successfully.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold mb-2">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              <span>Faculty Leave Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              My Leave Applications & Substitute Coverage
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Apply for leave and track administrative approval and assigned alternative faculty.
            </p>
          </div>

          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer self-start sm:self-auto active:scale-95"
          >
            <Plus size={16} />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* Leave Balances Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Casual Leave (CL)</span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">8 Left</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">8 <span className="text-xs text-slate-400 font-normal">/ 12 days</span></div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Medical Leave (ML)</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">10 Left</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">10 <span className="text-xs text-slate-400 font-normal">/ 10 days</span></div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">On-Duty (OD)</span>
              <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">15 Left</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">15 <span className="text-xs text-slate-400 font-normal">/ 15 days</span></div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Academic / Conf</span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">3 Left</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">3 <span className="text-xs text-slate-400 font-normal">/ 5 days</span></div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reasons or substitute faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: `All (${myLeaves.length})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'approved', label: `Approved (${approvedCount})` },
            { id: 'rejected', label: `Rejected (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Requests Stream */}
      <div className="space-y-3.5">
        {filteredLeaves.map((leave) => {
          return (
            <div
              key={leave.id}
              className={`bg-white rounded-2xl p-5 border transition-all ${
                leave.status === 'pending'
                  ? 'border-amber-300/90 shadow-xs'
                  : leave.status === 'approved'
                  ? 'border-emerald-200 shadow-xs'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left: Type, Duration, Reason */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                      leave.leaveType === 'Casual Leave'
                        ? 'bg-indigo-100 text-indigo-800'
                        : leave.leaveType === 'Medical Leave'
                        ? 'bg-rose-100 text-rose-800'
                        : leave.leaveType === 'On-Duty (OD)'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {leave.leaveType}
                    </span>

                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {leave.id}
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      leave.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : leave.status === 'rejected'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {leave.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {leave.status === 'rejected' && <XCircle className="w-3 h-3 text-slate-600" />}
                      {leave.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                      {leave.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Reason for Absence
                    </h3>
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 max-w-2xl">
                      "{leave.reason}"
                    </p>
                  </div>

                  {/* Substitute Faculty Assigned Banner */}
                  {leave.substituteFacultyName && (
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3 max-w-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                          <UserCheck size={14} />
                        </div>
                        <div>
                          <div className="text-[10px] text-indigo-700 font-semibold uppercase tracking-wider">
                            Substitute Faculty Assigned
                          </div>
                          <div className="text-xs font-bold text-slate-900">
                            {leave.substituteFacultyName}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Coverage Confirmed
                      </span>
                    </div>
                  )}

                  {/* Affected Subjects List */}
                  {leave.affectedSubjects && leave.affectedSubjects.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-semibold text-slate-500">Lectures Covered:</span>
                      {leave.affectedSubjects.map((subj, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200">
                          {subj}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Review Remark */}
                  {leave.reviewComment && (
                    <div className="text-[11px] text-slate-600 bg-slate-100/70 px-3 py-1.5 rounded-xl max-w-xl">
                      <strong className="text-slate-800">Admin Remark: </strong>
                      {leave.reviewComment}
                    </div>
                  )}
                </div>

                {/* Right: Date Range & Actions */}
                <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                  <div className="text-left md:text-right text-xs">
                    <div className="flex items-center md:justify-end gap-1.5 font-bold text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{leave.startDate} ({leave.startSession}) &rarr; {leave.endDate} ({leave.endSession})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      {leave.daysCount} {leave.daysCount === 1 || leave.daysCount === 0.5 ? 'Day' : 'Days'}
                      {leave.isHalfDay ? ' (Half Day)' : ''}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Applied: {leave.appliedAt}
                    </div>
                  </div>

                  {leave.status === 'pending' && (
                    <button
                      onClick={() => setCancelingLeaveId(leave.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Trash2 size={13} />
                      <span>Withdraw Request</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredLeaves.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No leave requests found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't filed any leave applications under this filter status.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL: APPLY FOR LEAVE (Matches Student App design)
          ===================================================================== */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white p-6 sm:p-7 border border-[#E5E7EB] shadow-[0_16px_40px_rgba(0,0,0,0.15)] rounded-2xl space-y-5 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3.5">
              <div>
                <h3 className="font-bold text-[#1A1D29] text-lg">Apply for Leave</h3>
                <p className="text-xs text-[#6B7280]">
                  Official application routed directly to Academic Administration.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              {/* Faculty Identity Pill */}
              <div className="p-3 rounded-xl bg-slate-50 border border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#6B7280] font-medium block">Applying Faculty:</span>
                  <span className="text-xs font-bold text-[#1A1D29]">{selectedFaculty.name}</span>
                </div>
                <span className="font-mono text-xs text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                  {selectedFaculty.employeeId || 'EMP-701'} • {selectedFaculty.department || 'Computer Science'}
                </span>
              </div>

              {/* 1. Approving Authority: Office of Academic Dean / Administration */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#1A1D29] block">
                  Designated Approving Authority
                </label>

                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4F46E5] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      A
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A1D29] flex items-center gap-1.5">
                        <span>Office of the Dean & Academic Affairs</span>
                        <span className="text-[10px] font-mono text-[#6B7280] bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                          ADMIN-HQ
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6B7280] mt-0.5">
                        Academic Administration • dean.office@attend.edu
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold bg-white text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 shadow-2xs block">
                      Admin Review Route
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Leave Type Drop Down */}
              <div className="space-y-1.5">
                <label htmlFor="facultyLeaveTypeSelect" className="font-semibold text-[#1A1D29] block">
                  Leave Type *
                </label>
                <div className="relative">
                  <select
                    id="facultyLeaveTypeSelect"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full appearance-none px-3.5 py-2.5 pr-10 bg-[#FAFAF9] hover:bg-white rounded-xl border border-[#E5E7EB] text-[#1A1D29] text-xs font-medium focus:bg-white focus:outline-none focus:border-[#4F46E5] transition cursor-pointer"
                  >
                    <option value="Casual Leave">Casual Leave (CL)</option>
                    <option value="Medical Leave">Medical Leave (ML)</option>
                    <option value="On-Duty (OD)">On-Duty (OD)</option>
                    <option value="Academic / Conference">Academic / Conference</option>
                    <option value="Special Leave">Special Leave</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#6B7280]">
                    <ChevronDown size={15} />
                  </div>
                </div>
              </div>

              {/* 3. Date Range & Forenoon / Afternoon Session */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Start Date & Session */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-[#1A1D29] block text-xs">
                        Start Date *
                      </label>
                      <span className="text-[10px] font-mono text-[#6B7280]">Session</span>
                    </div>

                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value > endDate) {
                          setEndDate(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5E7EB] text-[#1A1D29] text-xs focus:outline-none focus:border-[#4F46E5] transition"
                    />

                    {/* Forenoon & Afternoon Session with Icons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setStartSession('FN')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                          startSession === 'FN'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-slate-300'
                        }`}
                        title="Forenoon (Morning / 1st Half)"
                      >
                        <Sunrise size={13} className={startSession === 'FN' ? 'text-amber-200' : 'text-amber-500'} />
                        <span>Forenoon (FN)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStartSession('AN')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                          startSession === 'AN'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-slate-300'
                        }`}
                        title="Afternoon (Post-Lunch / 2nd Half)"
                      >
                        <Sunset size={13} className={startSession === 'AN' ? 'text-indigo-300' : 'text-indigo-600'} />
                        <span>Afternoon (AN)</span>
                      </button>
                    </div>
                  </div>

                  {/* End Date & Session */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-[#1A1D29] block text-xs">
                        End Date *
                      </label>
                      <span className="text-[10px] font-mono text-[#6B7280]">Session</span>
                    </div>

                    <input
                      type="date"
                      required
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5E7EB] text-[#1A1D29] text-xs focus:outline-none focus:border-[#4F46E5] transition"
                    />

                    {/* Forenoon & Afternoon Session with Icons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEndSession('FN')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                          endSession === 'FN'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-slate-300'
                        }`}
                        title="Forenoon (Morning / 1st Half)"
                      >
                        <Sunrise size={13} className={endSession === 'FN' ? 'text-amber-200' : 'text-amber-500'} />
                        <span>Forenoon (FN)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEndSession('AN')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                          endSession === 'AN'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-slate-300'
                        }`}
                        title="Afternoon (Post-Lunch / 2nd Half)"
                      >
                        <Sunset size={13} className={endSession === 'AN' ? 'text-indigo-300' : 'text-indigo-600'} />
                        <span>Afternoon (AN)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Absence Period Calculation Box */}
                {(() => {
                  const duration = calculateLeaveDuration(startDate, startSession, endDate, endSession);

                  return (
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-center text-[#4F46E5] shrink-0">
                          <Clock3 size={15} />
                        </div>
                        <span className="font-semibold text-xs text-[#1A1D29]">
                          Leave Duration
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {duration.isHalfDay && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Half Day
                          </span>
                        )}
                        <div className="bg-white px-3 py-1 rounded-lg border border-[#E5E7EB] shadow-2xs text-xs font-mono font-bold text-[#1A1D29]">
                          {duration.days} {duration.days === 1 || duration.days === 0.5 ? 'Day' : 'Days'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Affected Lectures Preview */}
                {affectedLectures.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <BookOpen size={13} className="text-amber-700" />
                        <span>Affected Lectures Requiring Substitute ({affectedLectures.length})</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-700">Auto-detected</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {affectedLectures.map((slot) => (
                        <div
                          key={slot.id}
                          className="px-2 py-1 rounded-md bg-white border border-amber-200 text-[11px] text-slate-800 font-medium"
                        >
                          <strong className="text-indigo-700">{slot.day} {slot.startTime}:</strong> {slot.subjectName} ({slot.room})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Reason Description */}
              <div>
                <label className="font-semibold text-[#1A1D29] block mb-1">
                  Reason for Absence *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the detailed reason for requesting leave or on-duty..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFAF9] rounded-xl border border-[#E5E7EB] text-[#1A1D29] text-xs focus:bg-white focus:outline-none focus:border-[#4F46E5] transition"
                />
              </div>

              {/* Notice */}
              <p className="text-[11px] text-[#6B7280] leading-relaxed">
                Notice: Once submitted, this application will be sent directly to Academic Administration for review and substitute faculty assignment.
              </p>

              {/* Form Actions */}
              <div className="pt-2 border-t border-[#F1F5F9] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-[#1A1D29] font-medium hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-[0_2px_8px_rgba(79,70,229,0.25)] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Send to Administration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Dialog */}
      {cancelingLeaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white p-6 border border-[#E5E7EB] shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Withdraw Leave Application?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to withdraw this application? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setCancelingLeaveId(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Request
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyLeave;
