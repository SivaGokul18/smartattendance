import { Student, Faculty, Subject, ClassSection, TimetableSlot, BookingSlot, NotificationItem, AdminSettings, LeaveRequest, FacultyLeaveRequest } from '../types';

export const emptyStudent: Student = {
  id: '',
  name: 'Student',
  rollNumber: '',
  department: '',
  year: 1,
  section: 'A',
  email: '',
  phone: '',
  faceIdStatus: 'pending',
  attendanceRate: 100,
};

export const emptyFaculty: Faculty = {
  id: '',
  name: 'Faculty',
  employeeId: '',
  department: '',
  email: '',
  phone: '',
  subjects: [],
  active: true,
};

export const initialStudents: Student[] = [];

export const initialFaculty: Faculty[] = [];

export const initialSubjects: Subject[] = [];

export const initialClassSections: ClassSection[] = [];

export const dbWeeklyTimetableCatalog: TimetableSlot[] = [];

export const initialTimetable: TimetableSlot[] = [];

export const initialBookings: BookingSlot[] = [];

export const initialNotifications: NotificationItem[] = [];

export const defaultSettings: AdminSettings = {
  bleSignalRange: 15,
  bleRssiThreshold: -75,
  faceConfidenceThreshold: 85,
  livenessCheckEnabled: true,
  autoSyncOffline: true,
  facultyManualOverrideAllowed: true
};

export const initialLeaves: LeaveRequest[] = [];

export const initialFacultyLeaves: FacultyLeaveRequest[] = [];
