import { create } from 'zustand';
import { 
  Student, 
  Faculty, 
  Subject, 
  ClassSection, 
  TimetableSlot, 
  BookingSlot, 
  NotificationItem, 
  AdminSettings, 
  Role,
  LeaveRequest 
} from '../types';
import { 
  initialStudents, 
  initialFaculty, 
  initialSubjects, 
  initialClassSections, 
  initialTimetable, 
  initialBookings, 
  initialNotifications, 
  defaultSettings,
  initialLeaves 
} from '../lib/mock-data';

interface AppState {
  currentRole: Role;
  setRole: (role: Role) => void;

  adminActiveTab: string;
  setAdminActiveTab: (tab: string) => void;

  facultyActiveTab: string;
  setFacultyActiveTab: (tab: string) => void;

  studentActiveTab: string;
  setStudentActiveTab: (tab: string) => void;

  isPromptKitOpen: boolean;
  setPromptKitOpen: (open: boolean) => void;

  isNotificationOpen: boolean;
  setNotificationOpen: (open: boolean) => void;

  isOffline: boolean;
  setOffline: (offline: boolean) => void;

  selectedStudent: Student;
  setSelectedStudent: (student: Student) => void;

  selectedFaculty: Faculty;
  setSelectedFaculty: (faculty: Faculty) => void;

  students: Student[];
  addStudent: (student: Omit<Student, 'id' | 'attendanceRate'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  faculty: Faculty[];
  addFaculty: (faculty: Omit<Faculty, 'id'>) => void;
  updateFaculty: (id: string, updates: Partial<Faculty>) => void;
  toggleFacultyStatus: (id: string) => void;

  subjects: Subject[];
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;

  classSections: ClassSection[];
  updateClassMapping: (classId: string, subjectId: string, facultyId: string) => void;

  timetable: TimetableSlot[];
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  deleteTimetableSlot: (id: string) => void;

  bookings: BookingSlot[];
  addBooking: (slotId: string, studentId: string) => boolean;
  addBookingSlot: (slot: Omit<BookingSlot, 'id' | 'bookedSeats' | 'studentIds'>) => void;
  cancelBooking: (slotId: string, studentId: string) => void;

  leaveRequests: LeaveRequest[];
  addLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => void;
  updateLeaveStatus: (id: string, status: 'approved' | 'rejected', comment?: string) => void;
  cancelLeaveRequest: (id: string) => void;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  settings: AdminSettings;
  updateSettings: (updates: Partial<AdminSettings>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'admin',
  setRole: (role) => set({ currentRole: role }),

  adminActiveTab: 'dashboard',
  setAdminActiveTab: (tab) => set({ adminActiveTab: tab }),

  facultyActiveTab: 'home',
  setFacultyActiveTab: (tab) => set({ facultyActiveTab: tab }),

  studentActiveTab: 'home',
  setStudentActiveTab: (tab) => set({ studentActiveTab: tab }),

  isPromptKitOpen: false,
  setPromptKitOpen: (open) => set({ isPromptKitOpen: open }),

  isNotificationOpen: false,
  setNotificationOpen: (open) => set({ isNotificationOpen: open }),

  isOffline: false,
  setOffline: (offline) => set({ isOffline: offline }),

  selectedStudent: initialStudents[0],
  setSelectedStudent: (student) => set({ selectedStudent: student }),

  selectedFaculty: initialFaculty[0],
  setSelectedFaculty: (faculty) => set({ selectedFaculty: faculty }),

  students: initialStudents,
  addStudent: (newStd) =>
    set((state) => ({
      students: [
        {
          ...newStd,
          id: `std-${Date.now()}`,
          attendanceRate: 100,
        },
        ...state.students,
      ],
    })),
  updateStudent: (id, updates) =>
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      selectedStudent: state.selectedStudent.id === id ? { ...state.selectedStudent, ...updates } : state.selectedStudent,
    })),
  deleteStudent: (id) =>
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
    })),

  faculty: initialFaculty,
  addFaculty: (newFac) =>
    set((state) => ({
      faculty: [
        {
          ...newFac,
          id: `fac-${Date.now()}`,
        },
        ...state.faculty,
      ],
    })),
  updateFaculty: (id, updates) =>
    set((state) => ({
      faculty: state.faculty.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),
  toggleFacultyStatus: (id) =>
    set((state) => ({
      faculty: state.faculty.map((f) => (f.id === id ? { ...f, active: !f.active } : f)),
    })),

  subjects: initialSubjects,
  addSubject: (newSub) =>
    set((state) => ({
      subjects: [
        {
          ...newSub,
          id: `sub-${Date.now()}`,
        },
        ...state.subjects,
      ],
    })),
  updateSubject: (id, updates) =>
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  classSections: initialClassSections,
  updateClassMapping: (classId, subjectId, facultyId) =>
    set((state) => ({
      classSections: state.classSections.map((cs) => {
        if (cs.id !== classId) return cs;
        const exists = cs.subjectFacultyMap.some((m) => m.subjectId === subjectId);
        const updatedMap = exists
          ? cs.subjectFacultyMap.map((m) => (m.subjectId === subjectId ? { subjectId, facultyId } : m))
          : [...cs.subjectFacultyMap, { subjectId, facultyId }];
        return { ...cs, subjectFacultyMap: updatedMap };
      }),
    })),

  timetable: initialTimetable,
  addTimetableSlot: (newSlot) =>
    set((state) => ({
      timetable: [
        {
          ...newSlot,
          id: `slot-${Date.now()}`,
        },
        ...state.timetable,
      ],
    })),
  deleteTimetableSlot: (id) =>
    set((state) => ({
      timetable: state.timetable.filter((s) => s.id !== id),
    })),

  bookings: initialBookings,
  addBooking: (slotId, studentId) => {
    const { bookings } = get();
    const slot = bookings.find((b) => b.id === slotId);
    if (!slot) return false;
    if (slot.bookedSeats >= slot.totalSeats) return false;
    if (slot.studentIds.includes(studentId)) return true;

    set({
      bookings: bookings.map((b) =>
        b.id === slotId
          ? {
              ...b,
              bookedSeats: b.bookedSeats + 1,
              studentIds: [...b.studentIds, studentId],
            }
          : b
      ),
    });
    return true;
  },
  addBookingSlot: (newSlot) =>
    set((state) => ({
      bookings: [
        {
          ...newSlot,
          id: `book-${Date.now()}`,
          bookedSeats: 0,
          studentIds: [],
        },
        ...state.bookings,
      ],
    })),
  cancelBooking: (slotId, studentId) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === slotId
          ? {
              ...b,
              bookedSeats: Math.max(0, b.bookedSeats - 1),
              studentIds: b.studentIds.filter((id) => id !== studentId),
            }
          : b
      ),
    })),

  leaveRequests: initialLeaves,
  addLeaveRequest: (req) =>
    set((state) => ({
      leaveRequests: [
        {
          ...req,
          id: `leave-${Date.now()}`,
          appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'pending',
        },
        ...state.leaveRequests,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: `Leave Application Submitted`,
          body: `Your ${req.leaveType} application has been routed to your mentor ${req.mentorName}.`,
          category: 'today',
          read: false,
          accentColor: 'indigo',
          timestamp: 'Just now',
        },
        ...state.notifications,
      ],
    })),
  updateLeaveStatus: (id, status, comment) =>
    set((state) => ({
      leaveRequests: state.leaveRequests.map((l) =>
        l.id === id ? { ...l, status, reviewComment: comment || l.reviewComment } : l
      ),
    })),
  cancelLeaveRequest: (id) =>
    set((state) => ({
      leaveRequests: state.leaveRequests.filter((l) => l.id !== id),
    })),

  notifications: initialNotifications,
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  settings: defaultSettings,
  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),
}));
