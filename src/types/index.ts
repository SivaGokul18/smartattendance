export type Role = "admin" | "faculty" | "student";

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  year: number;
  section: string;
  email: string;
  phone: string;
  faceIdStatus: "enrolled" | "pending";
  photoUrl?: string;
  attendanceRate: number; // e.g. 88
  mentorId?: string;
  mentorName?: string;
  semester?: string;
}

export interface Faculty {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  email: string;
  phone: string;
  subjects: string[];
  active: boolean;
  photoUrl?: string;
  designation?: string;
  isMentor?: boolean;
  mentorGroup?: string;
}


export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  department: string;
  assignedFacultyIds: string[];
  assignedClassIds: string[];
}

export interface ClassSection {
  id: string;
  name: string; // e.g. "CSE - 3rd Year - Section A"
  department: string;
  year: number;
  section: string;
  studentCount: number;
  subjectFacultyMap: { subjectId: string; facultyId: string }[];
}

export interface TimetableSlot {
  id: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  subjectId: string;
  facultyId: string;
  classSectionId: string;
  room: string;
  color?: string;
  subjectName?: string;
  subjectCode?: string;
  facultyName?: string;
  classSectionName?: string;
}

export interface BleSession {
  id: string;
  facultyId: string;
  facultyName: string;
  classSectionId: string;
  classSectionName: string;
  subjectId: string;
  subjectName: string;
  room: string;
  status: "idle" | "broadcasting" | "ended";
  durationMinutes: number;
  faceVerificationRequired: boolean;
  startedAt?: string;
  checkedInStudentIds: string[];
  capacity: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  markedAt: string;
  method: "ble+face" | "manual_override";
  faceVerified: boolean;
  overrideReason?: string;
}

export interface BookingSlot {
  id: string;
  subjectName: string;
  facultyName: string;
  room: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM - 11:30 AM"
  totalSeats: number;
  bookedSeats: number;
  studentIds: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: "today" | "this_week" | "earlier";
  read: boolean;
  accentColor: "indigo" | "emerald" | "amber" | "rose";
  timestamp: string;
}

export interface AdminSettings {
  bleSignalRange: number; // in meters (e.g. 15)
  bleRssiThreshold: number; // in dBm (e.g. -75)
  faceConfidenceThreshold: number; // percentage (e.g. 85)
  livenessCheckEnabled: boolean;
  autoSyncOffline: boolean;
  facultyManualOverrideAllowed: boolean;
}

export type DaySession = 'FN' | 'AN'; // FN = Forenoon, AN = Afternoon

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  mentorId: string;
  mentorName: string;
  leaveType: 'Medical Leave' | 'On-Duty (OD)' | 'Personal / Emergency' | 'Academic / Conference';
  startDate: string;
  startSession?: DaySession;
  endDate: string;
  endSession?: DaySession;
  daysCount?: number;
  isHalfDay?: boolean;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewComment?: string;
}

export interface FacultyLeaveRequest {
  id: string;
  facultyId: string;
  facultyName: string;
  employeeId: string;
  department: string;
  leaveType: 'Casual Leave' | 'Medical Leave' | 'On-Duty (OD)' | 'Academic / Conference' | 'Special Leave';
  startDate: string;
  startSession: DaySession;
  endDate: string;
  endSession: DaySession;
  daysCount: number;
  isHalfDay?: boolean;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  substituteFacultyId?: string;
  substituteFacultyName?: string;
  affectedSubjects?: string[];
  reviewComment?: string;
}
