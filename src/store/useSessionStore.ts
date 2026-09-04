import { create } from 'zustand';
import { BleSession, AttendanceRecord } from '../types';

interface SessionState {
  activeSession: BleSession | null;
  attendanceRecords: AttendanceRecord[];
  historySessions: {
    id: string;
    subjectName: string;
    className: string;
    date: string;
    time: string;
    presentCount: number;
    totalCount: number;
    attendanceRate: number;
  }[];
  startSession: (params: {
    facultyId: string;
    facultyName: string;
    classSectionId: string;
    classSectionName: string;
    subjectId: string;
    subjectName: string;
    room: string;
    durationMinutes: number;
    faceVerificationRequired: boolean;
    capacity: number;
  }) => void;
  studentCheckIn: (student: {
    id: string;
    name: string;
    rollNumber: string;
    department: string;
    method?: 'ble+face' | 'manual_override';
    overrideReason?: string;
  }) => boolean;
  endSession: () => void;
  manualMarkPresent: (student: {
    id: string;
    name: string;
    rollNumber: string;
    department: string;
    reason: string;
  }) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  attendanceRecords: [],
  historySessions: [
    {
      id: 'sess-hist-1',
      subjectName: 'Machine Learning (CS301)',
      className: 'CSE - 3rd Year - Sec A',
      date: 'Yesterday',
      time: '09:00 AM - 10:00 AM',
      presentCount: 41,
      totalCount: 45,
      attendanceRate: 91
    },
    {
      id: 'sess-hist-2',
      subjectName: 'Embedded IoT Systems (CS304)',
      className: 'CSE - 3rd Year - Sec A',
      date: '02 Sep 2026',
      time: '11:15 AM - 12:15 PM',
      presentCount: 36,
      totalCount: 45,
      attendanceRate: 80
    },
    {
      id: 'sess-hist-3',
      subjectName: 'Mobile & Cloud Computing (CS302)',
      className: 'CSE - 3rd Year - Sec A',
      date: '01 Sep 2026',
      time: '10:15 AM - 11:15 AM',
      presentCount: 31,
      totalCount: 45,
      attendanceRate: 68
    }
  ],

  startSession: (params) => {
    const newSession: BleSession = {
      id: `sess-${Date.now()}`,
      facultyId: params.facultyId,
      facultyName: params.facultyName,
      classSectionId: params.classSectionId,
      classSectionName: params.classSectionName,
      subjectId: params.subjectId,
      subjectName: params.subjectName,
      room: params.room,
      status: 'broadcasting',
      durationMinutes: params.durationMinutes,
      faceVerificationRequired: params.faceVerificationRequired,
      startedAt: new Date().toISOString(),
      checkedInStudentIds: [],
      capacity: params.capacity || 45,
    };

    set({
      activeSession: newSession,
      attendanceRecords: [],
    });
  },

  studentCheckIn: (student) => {
    const { activeSession, attendanceRecords } = get();
    if (!activeSession) return false;

    // Avoid duplicate check-in
    if (activeSession.checkedInStudentIds.includes(student.id)) {
      return true;
    }

    const newRecord: AttendanceRecord = {
      id: `rec-${Date.now()}-${student.id}`,
      sessionId: activeSession.id,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      markedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      method: student.method || 'ble+face',
      faceVerified: true,
      overrideReason: student.overrideReason,
    };

    set({
      activeSession: {
        ...activeSession,
        checkedInStudentIds: [...activeSession.checkedInStudentIds, student.id],
      },
      attendanceRecords: [newRecord, ...attendanceRecords],
    });

    return true;
  },

  manualMarkPresent: (student) => {
    const { activeSession, attendanceRecords } = get();
    if (!activeSession) return;

    if (activeSession.checkedInStudentIds.includes(student.id)) return;

    const newRecord: AttendanceRecord = {
      id: `rec-man-${Date.now()}-${student.id}`,
      sessionId: activeSession.id,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      markedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      method: 'manual_override',
      faceVerified: false,
      overrideReason: student.reason,
    };

    set({
      activeSession: {
        ...activeSession,
        checkedInStudentIds: [...activeSession.checkedInStudentIds, student.id],
      },
      attendanceRecords: [newRecord, ...attendanceRecords],
    });
  },

  endSession: () => {
    const { activeSession, attendanceRecords, historySessions } = get();
    if (!activeSession) return;

    const presentCount = activeSession.checkedInStudentIds.length;
    const totalCount = activeSession.capacity;
    const rate = Math.round((presentCount / (totalCount || 1)) * 100);

    const newHistoryItem = {
      id: activeSession.id,
      subjectName: activeSession.subjectName,
      className: activeSession.classSectionName,
      date: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      presentCount,
      totalCount,
      attendanceRate: rate,
    };

    set({
      activeSession: {
        ...activeSession,
        status: 'ended',
      },
      historySessions: [newHistoryItem, ...historySessions],
    });
  },
}));
