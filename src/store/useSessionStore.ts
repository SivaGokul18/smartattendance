import { create } from 'zustand';
import { BleSession, AttendanceRecord } from '../types';
import { facultyApi, studentApi } from '../api/client';

interface SessionState {
  activeSession: BleSession | null;
  attendanceRecords: AttendanceRecord[];
  historySessions: {
    id: string;
    subjectName: string;
    subjectCode?: string;
    className: string;
    date: string;
    dateStr?: string;
    time: string;
    room?: string;
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
  historySessions: [],

  startSession: (params) => {
    const localId = `sess-${Date.now()}`;
    const newSession: BleSession = {
      id: localId,
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

    // Call backend to create real session and broadcast on WebSockets
    facultyApi.startSession({
      classSectionId: params.classSectionId,
      classSectionName: params.classSectionName,
      subjectId: params.subjectId,
      subjectName: params.subjectName,
      room: params.room,
      durationMinutes: params.durationMinutes,
      faceVerificationRequired: params.faceVerificationRequired,
      capacity: params.capacity || 45,
    }).then((resp) => {
      if (resp?.sessionId) {
        set((state) => ({
          activeSession: state.activeSession
            ? { ...state.activeSession, id: resp.sessionId }
            : null,
        }));
      }
    }).catch(console.warn);
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

    // Submit attendance check-in to backend
    studentApi.verifyAttendance({
      sessionId: activeSession.id,
      faceConfidenceScore: 95.0,
      faceVerified: true,
      method: student.method || 'ble+face',
    }).catch(console.warn);

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

    // Send manual override to backend
    facultyApi.manualCheckin(activeSession.id, student.id, student.reason).catch(console.warn);
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
      subjectCode: activeSession.subjectId || 'CS301',
      className: activeSession.classSectionName,
      date: '07 Sep 2026',
      dateStr: '2026-09-07',
      room: activeSession.room || 'LH-204',
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

    // Notify backend session has ended
    facultyApi.endSession(activeSession.id).catch(console.warn);
  },
}));
