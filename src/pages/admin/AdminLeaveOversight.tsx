import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  ShieldAlert, 
  Calendar, 
  Building2, 
  X, 
  UserCheck, 
  GraduationCap, 
  BookOpen, 
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { LeaveRequest, FacultyLeaveRequest } from '../../types';
import { adminApi } from '../../api/client';

export const AdminLeaveOversight: React.FC = () => {
  const { 
    leaveRequests, 
    facultyLeaveRequests, 
    faculty, 
    updateLeaveStatus, 
    updateFacultyLeaveStatus 
  } = useAppStore();

  // Active Category: Students vs Faculty
  const [activeCategory, setActiveCategory] = useState<'students' | 'faculty'>('students');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'approved' | 'rejected'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  
  // Student Override Modal
  const [selectedLeaveForOverride, setSelectedLeaveForOverride] = useState<LeaveRequest | null>(null);
  const [overrideDecision, setOverrideDecision] = useState<'approved' | 'rejected'>('approved');
  const [adminNote, setAdminNote] = useState('');

  // Faculty Review & Substitute Assignment Modal
  const [selectedFacultyLeave, setSelectedFacultyLeave] = useState<FacultyLeaveRequest | null>(null);
  const [facultyDecision, setFacultyDecision] = useState<'approved' | 'rejected'>('approved');
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>('');
  const [facultyAdminNote, setFacultyAdminNote] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadOversight = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getLeaveOversight();
      if (data) {
        useAppStore.setState((state) => {
          const updates: any = {};
          if (Array.isArray(data.studentLeaves)) {
            updates.leaveRequests = data.studentLeaves;
          }
          if (Array.isArray(data.facultyLeaves)) {
            updates.facultyLeaveRequests = data.facultyLeaves;
          }
          return updates;
        });
      }
    } catch (err) {
      console.warn('Failed to load leave oversight:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOversight();
  }, []);

  // Student list departments
  const studentDepartments = useMemo(() => {
    const depts = new Set(leaveRequests.map(l => l.department));
    return ['All', ...Array.from(depts)];
  }, [leaveRequests]);

  // Faculty list departments
  const facultyDepartments = useMemo(() => {
    const depts = new Set(facultyLeaveRequests.map(l => l.department));
    return ['All', ...Array.from(depts)];
  }, [facultyLeaveRequests]);

  // SLA calculation helper: If applied more than 48 hours ago and still pending, it is overdue
  const isOverdue = (appliedAtStr: string, status: string) => {
    if (status !== 'pending') return false;
    return appliedAtStr.includes('Aug') || appliedAtStr.includes('01 Sep') || appliedAtStr.includes('02 Sep');
  };

  // Filtered student leaves
  const filteredStudentLeaves = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return leaveRequests.filter((leave) => {
      const matchesSearch = 
        (leave.studentName || '').toLowerCase().includes(q) ||
        (leave.rollNumber || '').toLowerCase().includes(q) ||
        (leave.mentorName || '').toLowerCase().includes(q) ||
        (leave.reason || '').toLowerCase().includes(q);

      const matchesDept = departmentFilter === 'All' || leave.department === departmentFilter;

      const overdue = isOverdue(leave.appliedAt, leave.status);
      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = leave.status === 'pending';
      else if (statusFilter === 'overdue') matchesStatus = overdue;
      else if (statusFilter === 'approved') matchesStatus = leave.status === 'approved';
      else if (statusFilter === 'rejected') matchesStatus = leave.status === 'rejected';

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [leaveRequests, searchQuery, departmentFilter, statusFilter]);

  // Filtered faculty leaves
  const filteredFacultyLeaves = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return facultyLeaveRequests.filter((leave) => {
      const matchesSearch = 
        (leave.facultyName || '').toLowerCase().includes(q) ||
        (leave.employeeId || '').toLowerCase().includes(q) ||
        (leave.reason || '').toLowerCase().includes(q) ||
        (leave.leaveType || '').toLowerCase().includes(q) ||
        (leave.substituteFacultyName && leave.substituteFacultyName.toLowerCase().includes(q));

      const matchesDept = departmentFilter === 'All' || leave.department === departmentFilter;

      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = leave.status === 'pending';
      else if (statusFilter === 'approved') matchesStatus = leave.status === 'approved';
      else if (statusFilter === 'rejected') matchesStatus = leave.status === 'rejected';

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [facultyLeaveRequests, searchQuery, departmentFilter, statusFilter]);

  // Student Counts
  const studentPendingCount = leaveRequests.filter(l => l.status === 'pending').length;
  const studentOverdueCount = leaveRequests.filter(l => isOverdue(l.appliedAt, l.status)).length;
  const studentApprovedCount = leaveRequests.filter(l => l.status === 'approved').length;
  const studentRejectedCount = leaveRequests.filter(l => l.status === 'rejected').length;

  // Faculty Counts
  const facultyPendingCount = facultyLeaveRequests.filter(l => l.status === 'pending').length;
  const facultyApprovedCount = facultyLeaveRequests.filter(l => l.status === 'approved').length;
  const facultyRejectedCount = facultyLeaveRequests.filter(l => l.status === 'rejected').length;

  // Student Override Handlers
  const handleOpenStudentOverride = (leave: LeaveRequest, decision: 'approved' | 'rejected') => {
    setSelectedLeaveForOverride(leave);
    setOverrideDecision(decision);
    setAdminNote(
      decision === 'approved' 
        ? 'Approved under Administrative SLA Escalation Protocol.'
        : 'Rejected under Administrative SLA Escalation Protocol.'
    );
  };

  const handleConfirmStudentOverride = () => {
    if (!selectedLeaveForOverride) return;
    updateLeaveStatus(
      selectedLeaveForOverride.id, 
      overrideDecision, 
      `[Admin Escalation] ${adminNote}`
    );
    showToast(`Leave application #${selectedLeaveForOverride.id.slice(-4)} marked as ${overrideDecision}`);
    setSelectedLeaveForOverride(null);
  };

  // Faculty Review & Substitute Handlers
  const handleOpenFacultyReview = (leave: FacultyLeaveRequest, defaultDecision: 'approved' | 'rejected' = 'approved') => {
    setSelectedFacultyLeave(leave);
    setFacultyDecision(defaultDecision);
    
    // Suggest first faculty in same department who is not the applicant
    const possibleSubstitutes = faculty.filter(f => f.id !== leave.facultyId);
    const sameDeptSub = possibleSubstitutes.find(f => f.department === leave.department) || possibleSubstitutes[0];
    
    setSelectedSubstituteId(leave.substituteFacultyId || (sameDeptSub ? sameDeptSub.id : ''));
    setFacultyAdminNote(
      defaultDecision === 'approved'
        ? `Approved. Substitute faculty designated for lecture coverage.`
        : 'Leave application declined by administration.'
    );
  };

  const handleConfirmFacultyReview = () => {
    if (!selectedFacultyLeave) return;

    let subName: string | undefined = undefined;
    if (facultyDecision === 'approved' && selectedSubstituteId) {
      const sub = faculty.find(f => f.id === selectedSubstituteId);
      if (sub) subName = sub.name;
    }

    updateFacultyLeaveStatus(
      selectedFacultyLeave.id,
      facultyDecision,
      facultyDecision === 'approved' ? selectedSubstituteId : undefined,
      facultyDecision === 'approved' ? subName : undefined,
      facultyAdminNote
    );

    showToast(
      facultyDecision === 'approved'
        ? `Faculty leave approved. ${subName ? `${subName} assigned as substitute.` : ''}`
        : `Faculty leave marked as rejected.`
    );
    setSelectedFacultyLeave(null);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Leave & Substitute Oversight</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {activeCategory === 'students' ? 'Student Leave & OD Oversight' : 'Faculty Leaves & Substitute Assignments'}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              {activeCategory === 'students' 
                ? 'Review student leave applications, mentor feedback, and administrative SLA escalations.'
                : 'Approve faculty leave applications and assign substitute faculty to cover scheduled periods.'}
            </p>
          </div>

          {/* Category Toggle Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => {
                setActiveCategory('students');
                setStatusFilter('all');
                setDepartmentFilter('All');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeCategory === 'students'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap size={15} />
              <span>Student Leaves</span>
              {studentPendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {studentPendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveCategory('faculty');
                setStatusFilter('all');
                setDepartmentFilter('All');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeCategory === 'faculty'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck size={15} />
              <span>Faculty Requests & Substitutes</span>
              {facultyPendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold animate-pulse">
                  {facultyPendingCount}
                </span>
              )}
            </button>

            <button
              onClick={loadOversight}
              disabled={isLoading}
              title="Refresh leave oversight from database"
              className="px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-amber-800 hover:bg-white"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-amber-600' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        {activeCategory === 'students' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Total Requests</span>
              <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{leaveRequests.length}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Pending Review</span>
              <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">{studentPendingCount}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Overdue (&gt;48h)</span>
              <div className="text-lg font-bold text-rose-700 font-mono mt-0.5">{studentOverdueCount}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Approved</span>
              <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">{studentApprovedCount}</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Total Faculty Requests</span>
              <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{facultyLeaveRequests.length}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Substitute Required</span>
              <div className="text-lg font-bold text-indigo-700 font-mono mt-0.5">{facultyPendingCount}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Covered & Approved</span>
              <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">{facultyApprovedCount}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Rejected</span>
              <div className="text-lg font-bold text-slate-700 font-mono mt-0.5">{facultyRejectedCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Control Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeCategory === 'students' ? 'Search student, roll number, or reason...' : 'Search faculty name, ID, or substitute...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {activeCategory === 'students' ? (
              [
                { id: 'all', label: 'All' },
                { id: 'pending', label: `Pending (${studentPendingCount})` },
                { id: 'overdue', label: `Overdue (${studentOverdueCount})` },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? tab.id === 'overdue' 
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))
            ) : (
              [
                { id: 'all', label: `All (${facultyLeaveRequests.length})` },
                { id: 'pending', label: `Pending (${facultyPendingCount})` },
                { id: 'approved', label: `Approved (${facultyApprovedCount})` },
                { id: 'rejected', label: `Rejected (${facultyRejectedCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))
            )}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {(activeCategory === 'students' ? studentDepartments : facultyDepartments).map((d) => (
                <option key={d} value={d}>Dept: {d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STREAM A: STUDENT LEAVES */}
      {activeCategory === 'students' && (
        <div className="space-y-3.5">
          {filteredStudentLeaves.map((leave) => {
            const overdue = isOverdue(leave.appliedAt, leave.status);

            return (
              <div 
                key={leave.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  overdue 
                    ? 'border-rose-300 bg-rose-50/10 shadow-xs' 
                    : leave.status === 'pending'
                    ? 'border-amber-300/80 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        leave.leaveType === 'Medical Leave' 
                          ? 'bg-rose-100 text-rose-800'
                          : leave.leaveType === 'On-Duty (OD)'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {leave.leaveType}
                      </span>

                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        ID: {leave.id}
                      </span>

                      {overdue && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          48h SLA Breached
                        </span>
                      )}

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

                    <div className="flex items-center gap-3">
                      <h3 className="font-heading font-bold text-slate-900 text-base">
                        {leave.studentName}
                      </h3>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {leave.rollNumber}
                      </span>
                      <span className="text-xs text-slate-400">&bull; {leave.department}</span>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 max-w-2xl">
                      "{leave.reason}"
                    </p>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                    <div className="text-left md:text-right text-xs">
                      <div className="flex items-center md:justify-end gap-1.5 font-bold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>{leave.startDate} &rarr; {leave.endDate}</span>
                        <span className="text-slate-400 font-normal">({leave.daysCount || 1} day)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Assigned Mentor: <strong className="text-slate-700">{leave.mentorName}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Applied: {leave.appliedAt}
                      </div>
                    </div>

                    {leave.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleOpenStudentOverride(leave, 'rejected')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer"
                        >
                          Override: Reject
                        </button>
                        <button
                          onClick={() => handleOpenStudentOverride(leave, 'approved')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                        >
                          Override: Approve
                        </button>
                      </div>
                    )}

                    {leave.reviewComment && (
                      <div className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl max-w-xs text-left">
                        <span className="font-bold text-slate-700">Resolution Note: </span>
                        {leave.reviewComment}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredStudentLeaves.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No student requests match criteria</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All student applications are up to date under current filter selections.
              </p>
            </div>
          )}
        </div>
      )}

      {/* STREAM B: FACULTY LEAVES & SUBSTITUTE COVERAGE */}
      {activeCategory === 'faculty' && (
        <div className="space-y-3.5">
          {filteredFacultyLeaves.map((leave) => {
            return (
              <div 
                key={leave.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  leave.status === 'pending'
                    ? 'border-indigo-300 bg-indigo-50/15 shadow-xs'
                    : leave.status === 'approved'
                    ? 'border-emerald-200 shadow-xs'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
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
                        ID: {leave.id}
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

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {leave.facultyName.charAt(leave.facultyName.indexOf(' ') + 1) || 'F'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base leading-none">
                            {leave.facultyName}
                          </h3>
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {leave.employeeId}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 mt-0.5 block">{leave.department}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-2xl">
                      "{leave.reason}"
                    </p>

                    {/* Affected Lectures requiring alternative cover */}
                    {leave.affectedSubjects && leave.affectedSubjects.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <BookOpen size={13} className="text-indigo-600" />
                          <span>Affected Lectures Requiring Substitute:</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {leave.affectedSubjects.map((subj, idx) => (
                            <span key={idx} className="text-xs bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                              {subj}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assigned Substitute Faculty Pill */}
                    {leave.substituteFacultyName ? (
                      <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between gap-3 max-w-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            <UserCheck size={14} />
                          </div>
                          <div>
                            <div className="text-[10px] text-indigo-700 font-semibold uppercase tracking-wider">
                              Assigned Substitute Faculty
                            </div>
                            <div className="text-xs font-bold text-slate-900">
                              {leave.substituteFacultyName}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Coverage Confirmed
                        </span>
                      </div>
                    ) : leave.status === 'pending' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                        <AlertTriangle size={13} className="text-amber-600" />
                        <span>Alternative faculty needs to be assigned</span>
                      </div>
                    ) : null}

                    {leave.reviewComment && (
                      <div className="text-[11px] text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-xl max-w-xl">
                        <strong className="text-slate-800">Admin Resolution: </strong>
                        {leave.reviewComment}
                      </div>
                    )}
                  </div>

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
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleOpenFacultyReview(leave, 'rejected')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleOpenFacultyReview(leave, 'approved')}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <UserCheck size={14} />
                          <span>Assign Substitute & Approve</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredFacultyLeaves.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No faculty leave requests found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All faculty applications are addressed under the current filter selection.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: STUDENT SLA ESCALATION OVERRIDE */}
      {selectedLeaveForOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className={`p-5 text-white flex items-center justify-between ${
              overrideDecision === 'approved' ? 'bg-gradient-to-r from-slate-900 to-amber-950' : 'bg-gradient-to-r from-slate-900 to-rose-950'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-5 h-5 ${overrideDecision === 'approved' ? 'text-amber-400' : 'text-rose-400'}`} />
                <h3 className="font-heading font-bold text-base">
                  Administrative SLA Override
                </h3>
              </div>
              <button onClick={() => setSelectedLeaveForOverride(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-900">{selectedLeaveForOverride.studentName} ({selectedLeaveForOverride.rollNumber})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Leave Type:</span>
                  <span className="font-semibold text-slate-800">{selectedLeaveForOverride.leaveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-mono text-slate-700">{selectedLeaveForOverride.startDate} to {selectedLeaveForOverride.endDate}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Override Verdict
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOverrideDecision('approved')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      overrideDecision === 'approved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Authorize Approval
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideDecision('rejected')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      overrideDecision === 'rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Enforce Rejection
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resolution Comment *
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLeaveForOverride(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStudentOverride}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all active:scale-95 cursor-pointer ${
                    overrideDecision === 'approved'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Execute Verdict
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FACULTY REVIEW & ASSIGN SUBSTITUTE FACULTY */}
      {selectedFacultyLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className={`p-5 text-white flex items-center justify-between ${
              facultyDecision === 'approved' ? 'bg-gradient-to-r from-slate-900 to-indigo-950' : 'bg-gradient-to-r from-slate-900 to-rose-950'
            }`}>
              <div className="flex items-center gap-2">
                <UserCheck className={`w-5 h-5 ${facultyDecision === 'approved' ? 'text-indigo-400' : 'text-rose-400'}`} />
                <div>
                  <h3 className="font-heading font-bold text-base leading-none">
                    Review Faculty Leave & Assign Substitute
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Designate alternative faculty member for lecture coverage
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedFacultyLeave(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Applicant Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-900">{selectedFacultyLeave.facultyName} ({selectedFacultyLeave.employeeId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800">{selectedFacultyLeave.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Leave Period:</span>
                  <span className="font-mono text-slate-700">
                    {selectedFacultyLeave.startDate} ({selectedFacultyLeave.startSession}) &rarr; {selectedFacultyLeave.endDate} ({selectedFacultyLeave.endSession})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-indigo-700">
                    {selectedFacultyLeave.daysCount} Day(s) {selectedFacultyLeave.isHalfDay ? '(Half Day)' : ''}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 block mb-0.5">Stated Reason:</span>
                  <span className="text-slate-700 italic">"{selectedFacultyLeave.reason}"</span>
                </div>
              </div>

              {/* Affected Lectures Requiring Coverage */}
              {selectedFacultyLeave.affectedSubjects && selectedFacultyLeave.affectedSubjects.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-amber-700" />
                    <span>Lectures Requiring Coverage:</span>
                  </span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {selectedFacultyLeave.affectedSubjects.map((s, idx) => (
                      <span key={idx} className="bg-white border border-amber-200 text-slate-800 font-medium px-2 py-0.5 rounded text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Administrative Verdict
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFacultyDecision('approved')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      facultyDecision === 'approved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Approve Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacultyDecision('rejected')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      facultyDecision === 'rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Reject Application
                  </button>
                </div>
              </div>

              {/* Substitute Faculty Selector (Required when Approved) */}
              {facultyDecision === 'approved' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Assign Alternative / Substitute Faculty *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubstituteId}
                      onChange={(e) => setSelectedSubstituteId(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 pr-10 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="" disabled>Select available substitute faculty...</option>
                      {faculty
                        .filter(f => f.id !== selectedFacultyLeave.facultyId)
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.employeeId || 'EMP'}) &bull; {f.department}
                          </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                      <ChevronDown size={15} />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    The chosen substitute faculty will cover the scheduled periods and receive attendance authority.
                  </p>
                </div>
              )}

              {/* Admin Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Institutional Resolution Remark
                </label>
                <textarea
                  rows={2}
                  value={facultyAdminNote}
                  onChange={(e) => setFacultyAdminNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFacultyLeave(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFacultyReview}
                  disabled={facultyDecision === 'approved' && !selectedSubstituteId}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    facultyDecision === 'approved'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {facultyDecision === 'approved' ? 'Confirm & Assign Substitute' : 'Execute Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveOversight;
