import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Users, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Ticket, 
  ChevronRight, 
  ChevronDown,
  Trash2, 
  Check,
  FileText,
  FileCheck,
  Send,
  Plus,
  Paperclip,
  GraduationCap,
  XCircle,
  Clock3,
  UserCheck,
  Sunrise, 
  Sunset,
  Database,
  Sparkles,
  BookOpen,
  Layers,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import { BookingSlot, TimetableSlot } from '../../types';
import { studentApi } from '../../api/client';

export const StudentBooking: React.FC = () => {
  const { 
    bookings, 
    addBooking, 
    cancelBooking, 
    selectedStudent, 
    students,
    subjects, 
    faculty, 
    leaveRequests, 
    addLeaveRequest, 
    cancelLeaveRequest,
    timetable,
    addTimetableSlot,
    deleteTimetableSlot,
    loadWeeklyTimetableFromDB,
    classSections,
    syncWithBackend,
    currentUser
  } = useAppStore();

  useEffect(() => {
    syncWithBackend();
  }, []);

  // Primary navigation: 'timetable' = Time Table, 'available' = Bookings, 'leave' = Leave Applications
  const [activeTab, setActiveTab] = useState<'available' | 'leave' | 'timetable'>('timetable');

  // Timetable states (Default: All Week matching reference)
  const [timetableDayFilter, setTimetableDayFilter] = useState<'all' | TimetableSlot['day']>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [isRefreshingSchedule, setIsRefreshingSchedule] = useState(false);
  const [isRefreshingLeaves, setIsRefreshingLeaves] = useState(false);

  // Match current student's class
  const studentClass = useMemo(() => {
    if (selectedSectionId && selectedSectionId !== 'all') {
      const found = classSections.find((c) => c.id === selectedSectionId || c.name === selectedSectionId);
      if (found) return found;
    }
    return (
      classSections.find(
        (c) => c.department === selectedStudent.department && c.year === selectedStudent.year && c.section === selectedStudent.section
      ) ||
      classSections[0] || {
        id: 'sec-all',
        name: `${selectedStudent.department || 'Information Technology'} (Year ${selectedStudent.year || 3})`,
        department: selectedStudent.department || 'Information Technology',
        year: selectedStudent.year || 3,
        section: selectedStudent.section || 'A',
        studentCount: 45,
        subjectFacultyMap: [],
      }
    );
  }, [selectedSectionId, classSections, selectedStudent]);

  const studentTimetableSlots = useMemo(() => {
    if (!timetable || timetable.length === 0) return [];
    if (selectedSectionId && selectedSectionId !== 'all') {
      const filtered = timetable.filter(
        (s) => s.classSectionId === selectedSectionId || s.classSectionName === selectedSectionId
      );
      if (filtered.length > 0) return filtered;
    }
    const matched = timetable.filter(
      (s) => !studentClass || !s.classSectionId || s.classSectionId === studentClass.id
    );
    // If matched slots is empty, fallback to all timetable slots so schedule is never blank
    return matched.length > 0 ? matched : timetable;
  }, [timetable, selectedSectionId, studentClass]);

  const filteredTimetableSlots = useMemo(() => {
    return studentTimetableSlots.filter((slot) => {
      if (timetableDayFilter === 'all') return true;
      return slot.day === timetableDayFilter;
    });
  }, [studentTimetableSlots, timetableDayFilter]);

  const refreshSchedule = async () => {
    setIsRefreshingSchedule(true);
    try {
      await syncWithBackend();
    } finally {
      setIsRefreshingSchedule(false);
    }
  };

  const refreshLeaves = async () => {
    setIsRefreshingLeaves(true);
    try {
      const data = await studentApi.getLeaves();
      if (Array.isArray(data)) {
        useAppStore.setState((state) => {
          const others = state.leaveRequests.filter(
            (l) => !data.some((d: any) => d.id === l.id)
          );
          return { leaveRequests: [...data, ...others] };
        });
      }
    } catch (err) {
      console.warn('Could not refresh student leaves:', err);
    } finally {
      setIsRefreshingLeaves(false);
    }
  };

  // Booking states
  const [confirmingSlot, setConfirmingSlot] = useState<BookingSlot | null>(null);
  const [confirmedPassSlot, setConfirmedPassSlot] = useState<BookingSlot | null>(null);
  const [cancelingSlotId, setCancelingSlotId] = useState<string | null>(null);
  const [cancelingLeaveId, setCancelingLeaveId] = useState<string | null>(null);

  // Leave Form states (Mentor is assigned via Admin Portal & automatically fetched)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<'Medical Leave' | 'On-Duty (OD)' | 'Personal / Emergency' | 'Academic / Conference'>('On-Duty (OD)');
  const [leaveStartDate, setLeaveStartDate] = useState('2026-09-07');
  const [startSession, setStartSession] = useState<'FN' | 'AN'>('FN');
  const [leaveEndDate, setLeaveEndDate] = useState('2026-09-07');
  const [endSession, setEndSession] = useState<'FN' | 'AN'>('FN');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  useEffect(() => {
    if (activeTab === 'leave') {
      studentApi.getLeaves()
        .then((data) => {
          if (Array.isArray(data)) {
            useAppStore.setState((state) => {
              const others = state.leaveRequests.filter(
                (l) => !data.some((d: any) => d.id === l.id)
              );
              return { leaveRequests: [...data, ...others] };
            });
          }
        })
        .catch((err) => console.warn('Could not refresh student leaves:', err));
    }
  }, [activeTab]);

  // Filter student leaves
  const studentLeaves = useMemo(() => {
    const matched = leaveRequests.filter(
      (l) => l.studentId === selectedStudent.id || (selectedStudent.rollNumber && l.rollNumber === selectedStudent.rollNumber)
    );
    return matched.length > 0 ? matched : leaveRequests;
  }, [leaveRequests, selectedStudent]);

  const filteredStudentLeaves = useMemo(() => {
    return studentLeaves.filter((l) => {
      if (leaveFilterStatus === 'all') return true;
      return l.status === leaveFilterStatus;
    });
  }, [studentLeaves, leaveFilterStatus]);

  // Calculate days between start and end date considering Forenoon (FN) and Afternoon (AN) sessions
  const calculateLeaveDuration = (
    start: string,
    startSess: 'FN' | 'AN' = 'FN',
    end: string,
    endSess: 'FN' | 'AN' = 'AN'
  ) => {
    if (!start || !end) return { days: 1, isHalfDay: false, summary: '1 Day' };
    const s = new Date(start);
    const e = new Date(end);

    if (s.getTime() > e.getTime()) {
      return { days: 0.5, isHalfDay: true, summary: '0.5 Day' };
    }

    const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day leave
      if (startSess === 'FN' && endSess === 'FN') {
        return { days: 0.5, isHalfDay: true, summary: 'Half Day (Forenoon)' };
      }
      if (startSess === 'AN' && endSess === 'AN') {
        return { days: 0.5, isHalfDay: true, summary: 'Half Day (Afternoon)' };
      }
      if (startSess === 'FN' && endSess === 'AN') {
        return { days: 1.0, isHalfDay: false, summary: 'Full Day' };
      }
      return { days: 0.5, isHalfDay: true, summary: 'Half Day' };
    }

    // Multiple days
    const startContrib = startSess === 'FN' ? 1.0 : 0.5;
    const endContrib = endSess === 'FN' ? 0.5 : 1.0;
    const betweenDays = Math.max(0, diffDays - 1);
    const totalDays = startContrib + betweenDays + endContrib;

    return {
      days: totalDays,
      isHalfDay: totalDays === 0.5,
      summary: `${totalDays} ${totalDays === 1 ? 'Day' : totalDays === 0.5 ? 'Half Day' : 'Days'}`
    };
  };

  // Backward-compatible calculateDays helper for strings
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 1 : diffDays;
  };

  // Automatically fetch student's assigned mentor from DB or currentUser
  const currentStudent = useMemo(() => {
    if (currentUser) {
      const byEmail = students.find((s) => currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase());
      if (byEmail) return byEmail;
      const byRoll = students.find((s) => currentUser.rollNumber && s.rollNumber === currentUser.rollNumber);
      if (byRoll) return byRoll;
    }
    return students.find((s) => s.id === selectedStudent.id) || selectedStudent;
  }, [students, currentUser, selectedStudent]);

  const studentMentorId = currentUser?.mentorId || currentStudent?.mentorId;
  const studentMentorName = currentUser?.mentorName || currentStudent?.mentorName;

  const fallbackMentor = useMemo(() => {
    return {
      id: studentMentorId || faculty[0]?.id || '',
      name: studentMentorName || faculty[0]?.name || (faculty.length > 0 ? 'Faculty Mentor' : 'Unassigned Mentor'),
      employeeId: faculty[0]?.employeeId || 'N/A',
      department: currentStudent?.department || faculty[0]?.department || '',
      email: faculty[0]?.email || '',
    };
  }, [currentStudent, studentMentorId, studentMentorName, faculty]);

  const assignedMentor = useMemo(() => {
    // 1. If student manually selected a mentor from the dropdown
    if (selectedMentorId) {
      const found = faculty.find((f) => f.id === selectedMentorId);
      if (found) return found;
    }
    // 2. Match student's official mentor by ID
    if (studentMentorId) {
      const found = faculty.find((f) => f.id === studentMentorId || f.employeeId === studentMentorId);
      if (found) return found;
    }
    // 3. Match student's official mentor by name
    if (studentMentorName) {
      const cleanTarget = studentMentorName.toLowerCase().replace(/^(dr\.|prof\.|mr\.|ms\.|mrs\.)\s+/i, '').trim();
      const found = faculty.find((f) => {
        const cleanF = f.name.toLowerCase().replace(/^(dr\.|prof\.|mr\.|ms\.|mrs\.)\s+/i, '').trim();
        return cleanF.includes(cleanTarget) || cleanTarget.includes(cleanF);
      });
      if (found) return found;
    }
    // 4. Match any faculty marked isMentor in the same department
    const dept = currentUser?.department || currentStudent?.department;
    if (dept) {
      const found = faculty.find((f) => f.isMentor && f.department.toLowerCase() === dept.toLowerCase());
      if (found) return found;
    }
    // 5. Fallback
    const firstMentor = faculty.find((f) => f.isMentor);
    return firstMentor || faculty[0] || fallbackMentor;
  }, [selectedMentorId, faculty, studentMentorId, studentMentorName, currentUser, currentStudent, fallbackMentor]);

  const handleOpenConfirmation = (slot: BookingSlot) => {
    setConfirmingSlot(slot);
    setConfirmedPassSlot(null);
  };

  const handleExecuteBooking = () => {
    if (!confirmingSlot) return;
    const success = addBooking(confirmingSlot.id, selectedStudent.id);
    if (success) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      setConfirmedPassSlot(confirmingSlot);
      setConfirmingSlot(null);
    }
  };

  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;

    const duration = calculateLeaveDuration(leaveStartDate, startSession, leaveEndDate, endSession);

    const studentIdToUse = currentStudent?.id || selectedStudent.id;
    const studentNameToUse = currentUser?.name || currentStudent?.name || selectedStudent.name;
    const rollNumberToUse = currentUser?.rollNumber || currentStudent?.rollNumber || selectedStudent.rollNumber;
    const departmentToUse = currentUser?.department || currentStudent?.department || selectedStudent.department;

    addLeaveRequest({
      studentId: studentIdToUse,
      studentName: studentNameToUse,
      rollNumber: rollNumberToUse,
      department: departmentToUse,
      mentorId: assignedMentor.id,
      mentorName: assignedMentor.name,
      leaveType,
      startDate: leaveStartDate,
      startSession,
      endDate: leaveEndDate,
      endSession,
      daysCount: duration.days,
      isHalfDay: duration.isHalfDay,
      reason: leaveReason.trim(),
    });

    confetti({
      particleCount: 65,
      spread: 55,
      origin: { y: 0.6 }
    });

    setLeaveReason('');
    setIsLeaveModalOpen(false);
    setSubmitFeedback(`Leave request (${duration.summary}) successfully submitted to your mentor ${assignedMentor.name}`);
    setTimeout(() => setSubmitFeedback(null), 3500);
  };

  // =========================================================================
  // VIEW 1: DEDICATED BOOKING CONFIRMATION PAGE
  // =========================================================================
  if (confirmingSlot) {
    const seatsLeft = confirmingSlot.totalSeats - confirmingSlot.bookedSeats;
    const isAlreadyBooked = confirmingSlot.studentIds.includes(selectedStudent.id);

    return (
      <div className="flex-1 p-4 sm:p-7 lg:p-10 space-y-6 overflow-y-auto pb-28 bg-[#FAFAF9] text-[#1A1D29]">
        {/* Top bar */}
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setConfirmingSlot(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#1A1D29] text-xs font-semibold hover:bg-slate-50 transition shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-pointer"
          >
            <ArrowLeft size={14} className="text-[#6B7280]" />
            <span>Back to Schedule</span>
          </button>

          <span className="text-[11px] font-mono text-[#6B7280] tracking-wider uppercase font-semibold">
            Reservation Review
          </span>
        </div>

        {/* Confirmation Content Card */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="h-1.5 bg-[#4F46E5]" />

          {/* Ticket Header */}
          <div className="p-6 sm:p-8 border-b border-[#F1F5F9]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="text-xs font-semibold text-[#4F46E5] bg-indigo-50/80 border border-indigo-100/90 px-3 py-1 rounded-full">
                Laboratory Reservation
              </span>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-mono text-[#6B7280]">SLOT REF:</span>
                <span className="font-mono font-semibold text-[#1A1D29] bg-slate-100 px-2 py-0.5 rounded">
                  {confirmingSlot.id.toUpperCase()}
                </span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1D29] tracking-tight">
              {confirmingSlot.subjectName}
            </h2>

            <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5">
              Supervising Faculty: <span className="font-semibold text-[#1A1D29]">{confirmingSlot.facultyName}</span>
            </p>
          </div>

          {/* Ticket Specs Matrix */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-xl bg-[#FAFAF9] border border-[#E5E7EB] space-y-1">
                <div className="flex items-center gap-1.5 text-[#6B7280] text-[11px] font-medium uppercase tracking-wider">
                  <Calendar size={13} className="text-[#4F46E5]" />
                  <span>Scheduled Slot</span>
                </div>
                <div className="text-sm font-bold text-[#1A1D29]">
                  {confirmingSlot.date}
                </div>
                <div className="text-xs text-[#6B7280] flex items-center gap-1">
                  <Clock size={12} />
                  <span>{confirmingSlot.time}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF9] border border-[#E5E7EB] space-y-1">
                <div className="flex items-center gap-1.5 text-[#6B7280] text-[11px] font-medium uppercase tracking-wider">
                  <MapPin size={13} className="text-[#4F46E5]" />
                  <span>Room & Workstation</span>
                </div>
                <div className="text-sm font-bold text-[#1A1D29] truncate">
                  {confirmingSlot.room}
                </div>
                <div className="text-xs font-semibold text-[#4F46E5]">
                  Station Node #0{((confirmingSlot.bookedSeats % 20) + 1)} Allotted
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF9] border border-[#E5E7EB] space-y-1">
                <div className="flex items-center gap-1.5 text-[#6B7280] text-[11px] font-medium uppercase tracking-wider">
                  <Users size={13} className="text-[#4F46E5]" />
                  <span>Availability</span>
                </div>
                <div className="text-sm font-bold text-[#1A1D29]">
                  {seatsLeft} Seats Left
                </div>
                <div className="text-xs text-[#6B7280]">
                  {confirmingSlot.bookedSeats} of {confirmingSlot.totalSeats} claimed
                </div>
              </div>
            </div>

            {/* Student Attendee Profile Verification Pill */}
            <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white font-semibold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Claiming Student:</div>
                  <div className="text-sm font-bold text-[#1A1D29]">{selectedStudent.name}</div>
                  <div className="text-xs text-[#6B7280] font-mono">
                    Roll: {selectedStudent.rollNumber} • {selectedStudent.department} (Year {selectedStudent.year})
                  </div>
                </div>
              </div>

              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-medium bg-white text-emerald-700 border border-emerald-200 shadow-2xs">
                Verified Attendee
              </span>
            </div>

            {/* Laboratory Protocols */}
            <div className="p-4 rounded-xl bg-[#FAFAF9] border border-[#E5E7EB] space-y-2">
              <div className="flex items-center gap-2 text-[#1A1D29] font-bold text-xs">
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>Entry & Check-in Protocol</span>
              </div>
              <ul className="text-xs text-[#6B7280] space-y-1 list-disc list-inside">
                <li>Arrive at {confirmingSlot.room} 5 minutes prior to slot start time.</li>
                <li>Touchless BLE beacon attendance check-in is active at the laboratory entrance.</li>
                <li>Station reserved quota is held for 15 minutes post session commencement.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmingSlot(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#E5E7EB] text-[#1A1D29] font-medium text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel & Return
              </button>

              {isAlreadyBooked ? (
                <div className="flex-1 w-full p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>You already hold an active reservation for this slot</span>
                </div>
              ) : seatsLeft <= 0 ? (
                <div className="flex-1 w-full p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs flex items-center justify-center gap-2">
                  <AlertCircle size={16} />
                  <span>Capacity Reached (Waitlist Closed)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleExecuteBooking}
                  className="flex-1 w-full py-3.5 px-6 rounded-xl font-semibold text-xs text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-[0_2px_8px_rgba(79,70,229,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <span>Confirm & Reserve Seat</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DIGITAL PASS VIEW (AFTER CONFIRMING A SESSION)
  // =========================================================================
  if (confirmedPassSlot) {
    return (
      <div className="flex-1 p-4 sm:p-7 lg:p-10 space-y-6 overflow-y-auto pb-28 bg-[#FAFAF9] text-[#1A1D29]">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setConfirmedPassSlot(null);
                setActiveTab('available');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#1A1D29] text-xs font-semibold hover:bg-slate-50 transition shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-pointer"
            >
              <ArrowLeft size={14} className="text-[#6B7280]" />
              <span>Back to Sessions</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirmedPassSlot(null);
                setActiveTab('available');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1D29] text-xs font-medium transition shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-pointer"
            >
              <X size={14} />
              <span>Close Pass</span>
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 text-left space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
              <div>
                <span className="text-[10px] font-mono text-[#6B7280] font-semibold block uppercase">
                  Digital Pass Reference
                </span>
                <span className="text-base font-mono font-bold text-[#4F46E5]">
                  REF-{confirmedPassSlot.id.toUpperCase()}-7492
                </span>
              </div>

              <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                <Check size={12} />
                <span>Confirmed</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#1A1D29]">
                {confirmedPassSlot.subjectName}
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Instructor: <strong className="text-[#1A1D29] font-medium">{confirmedPassSlot.facultyName}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAFAF9] p-4 rounded-xl border border-[#E5E7EB]">
              <div>
                <span className="text-[#6B7280] text-[10px] block uppercase font-medium">Date & Time</span>
                <span className="font-semibold text-[#1A1D29]">{confirmedPassSlot.date}</span>
                <span className="text-[#6B7280] block text-[11px]">{confirmedPassSlot.time}</span>
              </div>

              <div>
                <span className="text-[#6B7280] text-[10px] block uppercase font-medium">Room & Station</span>
                <span className="font-semibold text-[#1A1D29]">{confirmedPassSlot.room}</span>
                <span className="text-[#4F46E5] block font-medium text-[11px]">Station Alpha-07</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF9] border border-[#E5E7EB] flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#1A1D29] block">Turnstile & Lab Entry QR</span>
                <p className="text-[11px] text-[#6B7280]">
                  Scan at turnstile scanner or enable Bluetooth for auto-beacon recognition.
                </p>
                <div className="pt-1">
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E5E7EB] text-[#6B7280]">
                    HASH: SHA256-4D88AE1
                  </span>
                </div>
              </div>

              <div className="w-20 h-20 rounded-xl bg-white p-1.5 flex items-center justify-center border border-[#E5E7EB] shadow-2xs shrink-0">
                <QrCode size={60} className="text-[#1A1D29]" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmedPassSlot(null);
                  setActiveTab('available');
                }}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition cursor-pointer text-center"
              >
                Back to Class Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: MAIN DASHBOARD ("Bookings" vs "Leave" tabs)
  // =========================================================================
  return (
    <div className="flex-1 p-4 sm:p-7 lg:p-10 space-y-7 overflow-y-auto pb-32 md:pb-10 bg-[#FAFAF9] text-[#1A1D29]">
      {/* 1. Header: Left Title + Live Roster Pill, Subtext | Right User Profile Chip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-[#E5E7EB]/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D29] tracking-tight">
              Class Schedule & Sessions
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              Live Roster
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            View scheduled class & laboratory sessions, reserve seats, and apply for academic leave directly to faculty.
          </p>
        </div>

        {/* User Profile Chip */}
        <div className="self-start md:self-auto inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="w-7 h-7 rounded-full bg-[#4F46E5] text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {selectedStudent.name.charAt(0)}
          </div>
          <div className="text-xs">
            <span className="font-semibold text-[#1A1D29]">{selectedStudent.name}</span>{' '}
            <span className="text-[#6B7280] font-mono">({selectedStudent.rollNumber})</span>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {submitFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{submitFeedback}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSubmitFeedback(null)} 
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Tab Navigation: Rounded-full pills matching Image 1 */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'available'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Calendar size={14} />
          <span>Schedule</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold leading-none ${
            activeTab === 'available' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {bookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leave')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'leave'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <FileText size={14} />
          <span>Leave</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold leading-none ${
            activeTab === 'leave' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {studentLeaves.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'timetable'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Clock size={14} />
          <span>Time Table</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold leading-none ${
            activeTab === 'timetable' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {studentTimetableSlots.length}
          </span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: "Bookings" (Available Laboratory Sessions)
          ===================================================================== */}
      {activeTab === 'available' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1A1D29]">
              Available Sessions ({bookings.length})
            </h2>
            <span className="text-xs text-[#6B7280] font-normal">
              Showing {bookings.length} session slots
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bookings.map((slot) => {
              const seatsLeft = slot.totalSeats - slot.bookedSeats;
              const isAlreadyBooked = slot.studentIds.includes(selectedStudent.id);

              return (
                <div
                  key={slot.id}
                  onClick={() => handleOpenConfirmation(slot)}
                  className={`group bg-white border rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] flex flex-col justify-between cursor-pointer ${
                    isAlreadyBooked
                      ? 'border-emerald-300/80 ring-1 ring-emerald-500/20'
                      : 'border-[#E5E7EB] hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Top row: Slot ID + Status pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono text-[#6B7280] font-semibold bg-slate-100 px-2.5 py-1 rounded-md">
                        SLOT #{slot.id.toUpperCase()}
                      </span>

                      {isAlreadyBooked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 size={12} />
                          Reserved
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            seatsLeft <= 3
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                              : 'bg-slate-100 text-slate-700 border-slate-200/60'
                          }`}
                        >
                          {seatsLeft <= 0 ? 'Full' : `${seatsLeft} seats left`}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#1A1D29] tracking-tight group-hover:text-[#4F46E5] transition-colors line-clamp-2">
                      {slot.subjectName}
                    </h3>

                    <p className="text-xs text-[#6B7280] mt-1">
                      Faculty: <span className="text-[#374151] font-medium">{slot.facultyName}</span>
                    </p>

                    <div className="mt-3.5 space-y-1.5 text-xs text-[#6B7280]">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-[#6B7280] shrink-0" />
                        <span className="font-medium text-[#1A1D29]">{slot.date}</span>
                        <span className="text-slate-300">•</span>
                        <Clock size={12} className="text-[#6B7280] shrink-0" />
                        <span className="font-mono text-[11px]">{slot.time}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-[#6B7280] shrink-0" />
                        <span className="text-[#4B5563] truncate">{slot.room}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#F1F5F9]">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#4F46E5] group-hover:text-[#4338CA] transition-colors">
                      <span>{isAlreadyBooked ? 'View Confirmation Pass' : 'Click to Reserve'}</span>
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {bookings.length === 0 && (
            <div className="p-10 rounded-2xl bg-white border border-[#E5E7EB] text-center space-y-2">
              <Calendar size={32} className="mx-auto text-[#6B7280]" />
              <h4 className="text-sm font-bold text-[#1A1D29]">No Sessions Published</h4>
              <p className="text-xs text-[#6B7280]">
                There are currently no session slots published by administrators.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: "Leave" (Student Apply Leave & View Applications)
          ===================================================================== */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          {/* Top Actions & Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1A1D29]">
                  Leave Applications
                </h3>
                <span className="text-[11px] font-semibold text-[#4F46E5] bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {studentLeaves.length} {studentLeaves.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                Official leave and on-duty requests routed directly to your assigned faculty mentor.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={refreshLeaves}
                disabled={isRefreshingLeaves}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Refresh leave requests from server"
              >
                <RefreshCw size={13} className={isRefreshingLeaves ? 'animate-spin text-teal-600' : 'text-slate-500'} />
                <span>{isRefreshingLeaves ? 'Syncing...' : 'Refresh'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-[0_2px_8px_rgba(79,70,229,0.25)] transition cursor-pointer"
              >
                <Plus size={15} />
                <span>Apply for Leave</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#6B7280] font-semibold text-[11px] uppercase mr-1">Status Filter:</span>
            {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setLeaveFilterStatus(st)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition capitalize cursor-pointer ${
                  leaveFilterStatus === st
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {st === 'all' ? 'All Applications' : st}
              </button>
            ))}
          </div>

          {/* Leave Applications Roster */}
          {filteredStudentLeaves.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredStudentLeaves.map((leave) => {
                const calculated = calculateLeaveDuration(
                  leave.startDate,
                  leave.startSession || 'FN',
                  leave.endDate,
                  leave.endSession || 'AN'
                );
                const daysCount = leave.daysCount ?? calculated.days;
                const isHalfDay = leave.isHalfDay ?? (daysCount === 0.5);

                return (
                  <div
                    key={leave.id}
                    className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-[#4F46E5] font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            REF-{leave.id.toUpperCase()}
                          </span>

                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#1A1D29] border border-slate-200">
                            {leave.leaveType}
                          </span>

                          {isHalfDay && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              {leave.startSession === 'AN' ? <Sunset size={11} className="text-indigo-600" /> : <Sunrise size={11} className="text-amber-500" />}
                              Half Day ({leave.startSession || 'FN'})
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        {leave.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <CheckCircle2 size={12} />
                            Approved
                          </span>
                        ) : leave.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <XCircle size={12} />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                            <Clock3 size={12} />
                            Pending Mentor Review
                          </span>
                        )}
                      </div>

                      {/* Particular Mentor Assigned */}
                      <div className="p-3 rounded-xl bg-[#FAFAF9] border border-[#E5E7EB] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                            {leave.mentorName.charAt(leave.mentorName.indexOf(' ') + 1) || 'M'}
                          </div>
                          <div>
                            <div className="text-[10px] text-[#6B7280] font-medium">Assigned Mentor:</div>
                            <div className="text-xs font-semibold text-[#1A1D29]">{leave.mentorName}</div>
                          </div>
                        </div>

                        <span className="text-[10px] font-medium text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          Particular Mentor
                        </span>
                      </div>

                      {/* Dates & Reason */}
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[#6B7280]">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar size={13} className="text-[#4F46E5]" />
                            <span>
                              {leave.startDate} {leave.startSession && <span className="font-semibold text-slate-800">({leave.startSession})</span>} to {leave.endDate} {leave.endSession && <span className="font-semibold text-slate-800">({leave.endSession})</span>}
                            </span>
                          </span>
                          <span className="font-semibold text-[#1A1D29] bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                            {daysCount} {daysCount === 1 ? 'Day' : daysCount === 0.5 ? 'Day (Half)' : 'Days'}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[#4B5563] text-xs leading-relaxed">
                          <strong className="text-[#1A1D29] font-medium block mb-0.5">Reason for Leave:</strong>
                          {leave.reason}
                        </div>

                        {leave.reviewComment && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                            <span className="font-bold block">Mentor Endorsement:</span>
                            {leave.reviewComment}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#6B7280]">
                        Submitted {leave.appliedAt}
                      </span>

                      {leave.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => setCancelingLeaveId(leave.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Withdraw</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-white border border-[#E5E7EB] text-center space-y-3">
              <FileCheck size={36} className="mx-auto text-[#6B7280]" />
              <h4 className="text-base font-bold text-[#1A1D29]">No Leave Applications Found</h4>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                You haven't submitted any leave or on-duty requests matching this filter.
              </p>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-4 py-2 rounded-xl font-semibold text-xs text-white bg-[#4F46E5] hover:bg-[#4338CA] transition cursor-pointer"
              >
                Apply for Leave Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: "Time Table" (Weekly Academic Schedule & DB Sync)
          ===================================================================== */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          {/* Top Actions & Overview */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-[#1A1D29]">
                    Weekly Time Table
                  </h3>
                  <span className="text-[11px] font-semibold text-[#4F46E5] bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {studentClass?.name || 'Academic Class'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Database size={10} />
                    DB Active ({studentTimetableSlots.length} Slots)
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  Official weekly academic timetable synchronized directly with institutional database.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {/* Section filter */}
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Sections ({timetable.length} slots)</option>
                  {classSections.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.name} ({cs.department})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={refreshSchedule}
                  disabled={isRefreshingSchedule}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                  title="Refresh timetable schedule from server"
                >
                  <RefreshCw size={13} className={isRefreshingSchedule ? 'animate-spin text-teal-600' : 'text-slate-500'} />
                  <span>{isRefreshingSchedule ? 'Syncing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Day Filters matching Image 1 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((day) => {
              const count = day === 'all'
                ? studentTimetableSlots.length
                : studentTimetableSlots.filter((s) => s.day === day).length;
              const isSelected = timetableDayFilter === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setTimetableDayFilter(day)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{day === 'all' ? 'All Week' : day}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold leading-none ${
                    isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Timetable Grid / List */}
          {filteredTimetableSlots.length > 0 ? (
            <div className="space-y-6">
              {(timetableDayFilter === 'all' 
                ? (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const)
                : [timetableDayFilter]
              ).map((day) => {
                const daySlots = studentTimetableSlots.filter((s) => s.day === day);
                if (daySlots.length === 0 && timetableDayFilter === 'all') return null;

                const dayFullNames: Record<string, string> = {
                  Mon: 'Monday',
                  Tue: 'Tuesday',
                  Wed: 'Wednesday',
                  Thu: 'Thursday',
                  Fri: 'Friday',
                  Sat: 'Saturday'
                };

                return (
                  <div key={day} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <h4 className="text-xs font-bold text-[#1A1D29] uppercase tracking-wider">
                        {dayFullNames[day] || day}
                      </h4>
                      <span className="text-[11px] text-[#6B7280] font-mono">
                        ({daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'})
                      </span>
                    </div>

                    {daySlots.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {daySlots.map((slot) => {
                          const sub = subjects.find((s) => s.id === slot.subjectId);
                          const fac = faculty.find((f) => f.id === slot.facultyId);
                          const isLab = slot.room.toLowerCase().includes('lab') || (sub?.name.toLowerCase().includes('lab'));

                          return (
                            <div
                              key={slot.id}
                              className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between group"
                            >
                              <div className="space-y-2.5">
                                {/* Header: Time & Room */}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                    <Clock size={12} />
                                    {slot.startTime} - {slot.endTime}
                                  </span>

                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                    <MapPin size={11} className="text-slate-400" />
                                    {slot.room}
                                  </span>
                                </div>

                                {/* Subject Details */}
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                      {sub?.code || slot.subjectCode || 'SUB'}
                                    </span>
                                    {isLab && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        PRACTICAL LAB
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-bold text-sm text-[#1A1D29] leading-snug">
                                    {sub?.name || slot.subjectName || 'Class Session'}
                                  </h5>
                                </div>
                              </div>

                              {/* Footer: Faculty & Actions */}
                              <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-semibold flex items-center justify-center">
                                    {fac?.name?.charAt(0) || slot.facultyName?.charAt(0) || 'F'}
                                  </div>
                                  <span className="text-xs text-slate-700 font-medium truncate max-w-[130px]">
                                    {fac?.name || slot.facultyName || 'Faculty Member'}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => deleteTimetableSlot(slot.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Delete Slot (Admin)"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-white border border-dashed border-[#E5E7EB] text-center text-xs text-[#6B7280]">
                        No classes scheduled for {dayFullNames[day] || day}.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-white border border-[#E5E7EB] text-center space-y-3">
              <Clock size={36} className="mx-auto text-[#6B7280]" />
              <h4 className="text-base font-bold text-[#1A1D29]">No Timetable Slots Found</h4>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                There are currently no slots scheduled for this section. Please check back later.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL: APPLY FOR LEAVE (ROUTED TO PARTICULAR FACULTY MENTOR)
          ===================================================================== */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white p-6 sm:p-7 border border-[#E5E7EB] shadow-[0_16px_40px_rgba(0,0,0,0.15)] rounded-2xl space-y-5 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3.5">
              <div>
                <h3 className="font-bold text-[#1A1D29] text-lg">Apply for Leave</h3>
                <p className="text-xs text-[#6B7280]">
                  Official application routed directly to your assigned faculty mentor.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyLeaveSubmit} className="space-y-4 text-xs">
              {/* Student Identity Pill */}
              <div className="p-3 rounded-xl bg-slate-50 border border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#6B7280] font-medium block">Applying Student:</span>
                  <span className="text-xs font-bold text-[#1A1D29]">{currentUser?.name || currentStudent?.name || selectedStudent.name}</span>
                </div>
                <span className="font-mono text-xs text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                  {currentUser?.rollNumber || currentStudent?.rollNumber || selectedStudent.rollNumber} • {currentUser?.department || currentStudent?.department || selectedStudent.department}
                </span>
              </div>

              {/* 1. Mentor Selection & Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#1A1D29] block text-xs">
                    Designated Faculty Mentor *
                  </label>
                  <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full border border-teal-200 shadow-2xs">
                    {assignedMentor.id === studentMentorId || (studentMentorName && assignedMentor.name.toLowerCase().includes(studentMentorName.toLowerCase())) ? 'Official Assigned Mentor' : 'Mentor Route'}
                  </span>
                </div>

                {faculty.length > 0 && (
                  <select
                    value={assignedMentor.id}
                    onChange={(e) => setSelectedMentorId(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[#1A1D29] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                  >
                    {faculty.map((f) => {
                      const isAssigned = f.id === studentMentorId || 
                        (studentMentorName && f.name.toLowerCase().includes(studentMentorName.toLowerCase()));
                      return (
                        <option key={f.id} value={f.id}>
                          {f.name} — {f.department} ({f.employeeId || 'Faculty'}){isAssigned ? ' ★ (Your Assigned Mentor)' : ''}
                        </option>
                      );
                    })}
                  </select>
                )}

                {/* Particular Mentor Card */}
                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4F46E5] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      {assignedMentor.name ? assignedMentor.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'M'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A1D29] flex items-center gap-1.5">
                        <span>{assignedMentor.name}</span>
                        <span className="text-[10px] font-mono text-[#6B7280] bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                          {assignedMentor.employeeId || 'N/A'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6B7280] mt-0.5">
                        {assignedMentor.department} • {assignedMentor.email}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Leave Type Drop Down Button */}
              <div className="space-y-1.5">
                <label htmlFor="leaveTypeSelect" className="font-semibold text-[#1A1D29] block">
                  Leave Type *
                </label>
                <div className="relative">
                  <select
                    id="leaveTypeSelect"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full appearance-none px-3.5 py-2.5 pr-10 bg-[#FAFAF9] hover:bg-white rounded-xl border border-[#E5E7EB] text-[#1A1D29] text-xs font-medium focus:bg-white focus:outline-none focus:border-[#4F46E5] transition cursor-pointer"
                  >
                    <option value="On-Duty (OD)">On-Duty (OD)</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Personal / Emergency">Personal / Emergency</option>
                    <option value="Academic / Conference">Academic / Conference</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#6B7280]">
                    <ChevronDown size={15} />
                  </div>
                </div>
              </div>

              {/* 3. Date Range & Forenoon / Afternoon Session (Half Day Support) */}
              <div className="space-y-3">
                {/* Start Date & End Date with Forenoon / Afternoon */}
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
                      value={leaveStartDate}
                      onChange={(e) => {
                        setLeaveStartDate(e.target.value);
                        if (e.target.value > leaveEndDate) {
                          setLeaveEndDate(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5E7EB] text-[#1A1D29] text-xs focus:outline-none focus:border-[#4F46E5] transition"
                    />

                    {/* Forenoon & Afternoon Session with Simple Logo */}
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
                      min={leaveStartDate}
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5E7EB] text-[#1A1D29] text-xs focus:outline-none focus:border-[#4F46E5] transition"
                    />

                    {/* Forenoon & Afternoon Session with Simple Logo */}
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
                  const duration = calculateLeaveDuration(leaveStartDate, startSession, leaveEndDate, endSession);

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
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFAF9] rounded-xl border border-[#E5E7EB] text-[#1A1D29] text-xs focus:bg-white focus:outline-none focus:border-[#4F46E5] transition"
                />
              </div>

              {/* Notice */}
              <p className="text-[11px] text-[#6B7280] leading-relaxed">
                Notice: Once submitted, this application will be sent directly to your assigned mentor <strong className="text-[#1A1D29]">{assignedMentor.name}</strong> for review and approval.
              </p>

              {/* Form Actions */}
              <div className="pt-2 border-t border-[#F1F5F9] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-[#1A1D29] font-medium hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-[0_2px_8px_rgba(79,70,229,0.25)] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Send to {assignedMentor.name?.split(' ')[1] || assignedMentor.name || 'Mentor'}</span>
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
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={22} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-[#1A1D29] text-base">Withdraw Application?</h3>
              <p className="text-xs text-[#6B7280]">
                Are you sure you want to withdraw this pending leave request? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelingLeaveId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-[#1A1D29] font-medium text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Keep Application
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelLeaveRequest(cancelingLeaveId);
                  setCancelingLeaveId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition cursor-pointer"
              >
                Yes, Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentBooking;
