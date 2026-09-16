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
  LeaveRequest,
  FacultyLeaveRequest
} from '../types';
import {
  emptyStudent,
  emptyFaculty,
  defaultSettings,
} from '../lib/mock-data';
import { studentApi, facultyApi, adminApi } from '../api/client';

interface AppState {
  currentRole: Role;
  setRole: (role: Role) => void;

  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: Role;
    rollNumber?: string;
    employeeId?: string;
    photoUrl?: string;
    department?: string;
    phone?: string;
    year?: number;
    section?: string;
    attendanceRate?: number;
    mentorId?: string;
    mentorName?: string;
    designation?: string;
    isMentor?: boolean;
    mentorGroup?: string;
    mustChangePassword?: boolean;
  } | null;
  setAuthUser: (user: {
    id?: string;
    name: string;
    email: string;
    role: Role;
    rollNumber?: string;
    employeeId?: string;
    photoUrl?: string;
    department?: string;
    phone?: string;
    year?: number;
    section?: string;
    attendanceRate?: number;
    mentorId?: string;
    mentorName?: string;
    designation?: string;
    isMentor?: boolean;
    mentorGroup?: string;
    mustChangePassword?: boolean;
  }) => void;
  clearMustChangePassword: () => void;

  syncWithBackend: () => Promise<void>;

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
  deleteFaculty: (id: string) => void;

  subjects: Subject[];
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  classSections: ClassSection[];
  updateClassMapping: (classId: string, subjectId: string, facultyId: string) => void;

  timetable: TimetableSlot[];
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  deleteTimetableSlot: (id: string) => void;
  loadWeeklyTimetableFromDB: (classSectionId?: string) => void;

  bookings: BookingSlot[];
  addBooking: (slotId: string, studentId: string) => boolean;
  addBookingSlot: (slot: Omit<BookingSlot, 'id' | 'bookedSeats' | 'studentIds'>) => void;
  cancelBooking: (slotId: string, studentId: string) => void;

  leaveRequests: LeaveRequest[];
  addLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => void;
  updateLeaveStatus: (id: string, status: 'approved' | 'rejected', comment?: string) => void;
  cancelLeaveRequest: (id: string) => void;

  facultyLeaveRequests: FacultyLeaveRequest[];
  addFacultyLeaveRequest: (req: Omit<FacultyLeaveRequest, 'id' | 'appliedAt' | 'status'>) => void;
  updateFacultyLeaveStatus: (
    id: string, 
    status: 'approved' | 'rejected', 
    substituteFacultyId?: string, 
    substituteFacultyName?: string, 
    comment?: string
  ) => void;
  cancelFacultyLeaveRequest: (id: string) => void;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  settings: AdminSettings;
  updateSettings: (updates: Partial<AdminSettings>) => void;
}

const savedName = typeof window !== 'undefined' ? localStorage.getItem('auth_user_name') : null;
const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('auth_user_email') : null;
const savedPhoto = typeof window !== 'undefined' ? localStorage.getItem('auth_user_photo') || undefined : undefined;
const savedRoll = typeof window !== 'undefined' ? localStorage.getItem('auth_user_roll') || undefined : undefined;
const savedEmp = typeof window !== 'undefined' ? localStorage.getItem('auth_user_emp') || undefined : undefined;
const savedDept = typeof window !== 'undefined' ? localStorage.getItem('auth_user_dept') || undefined : undefined;
const savedPhone = typeof window !== 'undefined' ? localStorage.getItem('auth_user_phone') || undefined : undefined;
const savedYear = typeof window !== 'undefined' ? localStorage.getItem('auth_user_year') || undefined : undefined;
const savedSection = typeof window !== 'undefined' ? localStorage.getItem('auth_user_section') || undefined : undefined;
const savedMentorName = typeof window !== 'undefined' ? localStorage.getItem('auth_user_mentor_name') || undefined : undefined;
const savedMentorId = typeof window !== 'undefined' ? localStorage.getItem('auth_user_mentor_id') || undefined : undefined;
const savedDesignation = typeof window !== 'undefined' ? localStorage.getItem('auth_user_desig') || undefined : undefined;
const savedRole = (typeof window !== 'undefined' ? (localStorage.getItem('user_role') as Role) : null) || 'admin';

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: savedRole,
  setRole: (role) => set({ currentRole: role }),

  currentUser: savedName && savedEmail ? {
    name: savedName,
    email: savedEmail,
    role: savedRole,
    rollNumber: savedRoll,
    employeeId: savedEmp,
    photoUrl: savedPhoto,
    department: savedDept,
    phone: savedPhone,
    year: savedYear ? parseInt(savedYear, 10) : undefined,
    section: savedSection,
    mentorName: savedMentorName,
    mentorId: savedMentorId,
    designation: savedDesignation,
  } : null,

  setAuthUser: (userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user_name', userData.name);
      localStorage.setItem('auth_user_email', userData.email);
      if (userData.photoUrl) localStorage.setItem('auth_user_photo', userData.photoUrl);
      if (userData.rollNumber) localStorage.setItem('auth_user_roll', userData.rollNumber);
      if (userData.employeeId) localStorage.setItem('auth_user_emp', userData.employeeId);
      if (userData.department) localStorage.setItem('auth_user_dept', userData.department);
      if (userData.phone) localStorage.setItem('auth_user_phone', userData.phone);
      if (userData.year) localStorage.setItem('auth_user_year', userData.year.toString());
      if (userData.section) localStorage.setItem('auth_user_section', userData.section);
      if (userData.mentorName) localStorage.setItem('auth_user_mentor_name', userData.mentorName);
      if (userData.mentorId) localStorage.setItem('auth_user_mentor_id', userData.mentorId);
      if (userData.designation) localStorage.setItem('auth_user_desig', userData.designation);
      if (userData.role) localStorage.setItem('user_role', userData.role);
    }

    set((state) => {
      const updates: Partial<AppState> = {
        currentUser: userData,
        currentRole: userData.role,
      };

      if (userData.role === 'student') {
        const matchingStu = state.students.find(
          (s) =>
            (userData.rollNumber && s.rollNumber === userData.rollNumber) ||
            (userData.email && s.email.toLowerCase() === userData.email.toLowerCase())
        );
        updates.selectedStudent = {
          ...state.selectedStudent,
          id: matchingStu ? matchingStu.id : (userData.id || state.selectedStudent.id),
          name: userData.name,
          email: userData.email,
          rollNumber: userData.rollNumber || (matchingStu ? matchingStu.rollNumber : state.selectedStudent.rollNumber),
          department: userData.department || (matchingStu ? matchingStu.department : state.selectedStudent.department),
          year: userData.year || (matchingStu ? matchingStu.year : state.selectedStudent.year),
          section: userData.section || (matchingStu ? matchingStu.section : state.selectedStudent.section),
          phone: userData.phone || (matchingStu ? matchingStu.phone : state.selectedStudent.phone),
          attendanceRate: userData.attendanceRate ?? (matchingStu ? matchingStu.attendanceRate : state.selectedStudent.attendanceRate),
          photoUrl: userData.photoUrl || state.selectedStudent.photoUrl,
          mentorId: userData.mentorId || (matchingStu ? matchingStu.mentorId : state.selectedStudent.mentorId),
          mentorName: userData.mentorName || (matchingStu ? matchingStu.mentorName : state.selectedStudent.mentorName),
        };
      } else if (userData.role === 'faculty') {
        const matchingFac = state.faculty.find(
          (f) =>
            (userData.employeeId && f.employeeId === userData.employeeId) ||
            (userData.email && f.email.toLowerCase() === userData.email.toLowerCase()) ||
            (userData.name && f.name.toLowerCase() === userData.name.toLowerCase())
        );
        updates.selectedFaculty = {
          ...state.selectedFaculty,
          id: matchingFac ? matchingFac.id : (userData.id || state.selectedFaculty.id),
          name: userData.name,
          email: userData.email,
          employeeId: userData.employeeId || (matchingFac ? matchingFac.employeeId : state.selectedFaculty.employeeId),
          department: userData.department || (matchingFac ? matchingFac.department : state.selectedFaculty.department),
          phone: userData.phone || (matchingFac ? matchingFac.phone : state.selectedFaculty.phone),
          designation: userData.designation || (matchingFac ? matchingFac.designation : state.selectedFaculty.designation),
          isMentor: userData.isMentor ?? (matchingFac ? matchingFac.isMentor : state.selectedFaculty.isMentor),
          mentorGroup: userData.mentorGroup || (matchingFac ? matchingFac.mentorGroup : state.selectedFaculty.mentorGroup),
          photoUrl: userData.photoUrl || state.selectedFaculty.photoUrl,
        };
      }

      return updates as any;
    });
  },

  clearMustChangePassword: () => {
    set((state) => {
      if (!state.currentUser) return state;
      return {
        currentUser: {
          ...state.currentUser,
          mustChangePassword: false,
        },
      };
    });
  },

  syncWithBackend: async () => {
    try {
      const role = get().currentRole;
      const isAdm = role === 'admin';
      const isFac = role === 'faculty';
      const isStu = role === 'student';

      const [stus, facs, sets, oversight, slots, backendCourses, backendSections, facApprovals, facLeaves, stuLeaves] = await Promise.all([
        adminApi.getStudents().catch(() => null),
        adminApi.getFaculty().catch(() => null),
        isAdm ? adminApi.getSettings().catch(() => null) : Promise.resolve(null),
        isAdm ? adminApi.getLeaveOversight().catch(() => null) : Promise.resolve(null),
        adminApi.getAllTimetableSlots().catch(() => null),
        adminApi.getCourses().catch(() => null),
        adminApi.getClassSections().catch(() => null),
        isFac ? facultyApi.getApprovals().catch(() => null) : Promise.resolve(null),
        isFac ? facultyApi.getLeaves().catch(() => null) : Promise.resolve(null),
        isStu ? studentApi.getLeaves().catch(() => null) : Promise.resolve(null),
      ]);

      set((state) => {
        const nextState: Partial<AppState> = {};

        if (stus !== null && Array.isArray(stus)) {
          nextState.students = stus;
          if (state.currentUser?.role === 'student') {
            const currentStu = stus.find(s => 
              (state.currentUser?.email && s.email.toLowerCase() === state.currentUser.email.toLowerCase()) || 
              (state.currentUser?.rollNumber && s.rollNumber === state.currentUser.rollNumber)
            );
            if (currentStu) {
              nextState.selectedStudent = {
                ...state.selectedStudent,
                ...currentStu,
              };
            }
          }
        }

        const facultyList = facs !== null && Array.isArray(facs) ? facs : state.faculty;
        if (facs !== null && Array.isArray(facs)) {
          nextState.faculty = facs;
          if (state.currentUser?.role === 'faculty') {
            const currentFac = facs.find(f => 
              (state.currentUser?.email && f.email.toLowerCase() === state.currentUser.email.toLowerCase()) || 
              (state.currentUser?.employeeId && f.employeeId === state.currentUser.employeeId)
            );
            if (currentFac) {
              nextState.selectedFaculty = {
                ...state.selectedFaculty,
                ...currentFac,
              };
            }
          }
          // Ensure selectedStudent has their proper assigned mentor
          if (state.selectedStudent && facs.length > 0) {
            const studentMentorId = state.currentUser?.mentorId || state.selectedStudent.mentorId;
            const studentMentorName = state.currentUser?.mentorName || state.selectedStudent.mentorName;

            const currentMentor = (studentMentorId && facs.find(f => f.id === studentMentorId || f.employeeId === studentMentorId)) ||
              (studentMentorName && facs.find(f => f.name.toLowerCase().includes(studentMentorName.toLowerCase()) || studentMentorName.toLowerCase().includes(f.name.toLowerCase()))) ||
              facs.find(f => f.isMentor && f.department.toLowerCase() === (state.selectedStudent.department || '').toLowerCase()) ||
              facs.find(f => f.isMentor);

            if (currentMentor) {
              nextState.selectedStudent = {
                ...state.selectedStudent,
                mentorId: studentMentorId || currentMentor.id,
                mentorName: studentMentorName || currentMentor.name,
              };
            }
          }
        }

        if (sets) {
          nextState.settings = sets;
        }

        if (oversight) {
          if (oversight.studentLeaves && Array.isArray(oversight.studentLeaves)) {
            nextState.leaveRequests = oversight.studentLeaves;
          }
          if (oversight.facultyLeaves && Array.isArray(oversight.facultyLeaves)) {
            nextState.facultyLeaveRequests = oversight.facultyLeaves;
          }
        } else if (isFac) {
          if (facApprovals && Array.isArray(facApprovals)) {
            nextState.leaveRequests = facApprovals;
          }
          if (facLeaves && Array.isArray(facLeaves)) {
            nextState.facultyLeaveRequests = facLeaves;
          }
        } else if (isStu) {
          if (stuLeaves && Array.isArray(stuLeaves)) {
            nextState.leaveRequests = stuLeaves;
          }
        }

        // Build Subjects Map directly from backend courses (fallback to existing if offline/null)
        const subjectMap = new Map<string, Subject>();
        if (backendCourses !== null && Array.isArray(backendCourses)) {
          backendCourses.forEach((c: any) => {
            subjectMap.set(c.id, {
              id: c.id,
              code: c.code,
              name: c.name,
              department: c.department || 'General',
              credits: Number(c.credits) || 3,
              assignedFacultyIds: Array.isArray(c.assignedFacultyIds) ? c.assignedFacultyIds : [],
              assignedClassIds: Array.isArray(c.assignedClassIds) ? c.assignedClassIds : [],
            });
          });
        } else {
          state.subjects.forEach((s) => subjectMap.set(s.id, { ...s }));
        }

        // Build Class Sections Map directly from backend sections (fallback to existing if offline/null)
        const sectionMap = new Map<string, ClassSection>();
        if (backendSections !== null && Array.isArray(backendSections)) {
          backendSections.forEach((cs: any) => {
            sectionMap.set(cs.id, {
              id: cs.id,
              name: cs.name,
              department: cs.department || 'General',
              year: Number(cs.year) || 3,
              section: cs.section || 'A',
              studentCount: Number(cs.studentCount) || 45,
              subjectFacultyMap: Array.isArray(cs.subjectFacultyMap) ? cs.subjectFacultyMap : [],
            });
          });
        } else {
          state.classSections.forEach((cs) => sectionMap.set(cs.id, { ...cs }));
        }

        // Process timetable slots directly from backend
        if (slots !== null && Array.isArray(slots)) {
          const formattedSlots: TimetableSlot[] = slots.map((s: any) => ({
            id: s.id,
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            subjectId: s.subjectId,
            facultyId: s.facultyId,
            classSectionId: s.classSectionId,
            room: s.room,
            color: s.color || 'indigo',
            subjectName: s.subjectName,
            subjectCode: s.subjectCode,
            facultyName: s.facultyName,
            classSectionName: s.classSectionName,
          }));

          nextState.timetable = formattedSlots;

          // Ensure all subjects from slots exist in subjectMap
          formattedSlots.forEach((slot) => {
            const subId = slot.subjectId;
            if (!subId) return;

            if (!subjectMap.has(subId)) {
              subjectMap.set(subId, {
                id: subId,
                code: slot.subjectCode || subId,
                name: slot.subjectName || slot.subjectCode || 'Subject',
                department: 'Information Technology',
                credits: 3,
                assignedFacultyIds: [],
                assignedClassIds: [],
              });
            }
            const currentSub = subjectMap.get(subId)!;
            if (slot.facultyId && !currentSub.assignedFacultyIds.includes(slot.facultyId)) {
              currentSub.assignedFacultyIds.push(slot.facultyId);
            }
            if (slot.classSectionId && !currentSub.assignedClassIds.includes(slot.classSectionId)) {
              currentSub.assignedClassIds.push(slot.classSectionId);
            }
          });

          // Ensure all class sections from slots exist in sectionMap
          formattedSlots.forEach((slot) => {
            const secId = slot.classSectionId;
            if (!secId) return;

            if (!sectionMap.has(secId)) {
              const rawName = slot.classSectionName || secId;
              let dept = 'Information Technology';
              let yr = 3;
              let secLetter = 'A';

              const parts = rawName.split('-').map((p: string) => p.trim());
              if (parts.length >= 1 && parts[0]) dept = parts[0];
              if (parts.length >= 2) {
                const ym = parts[1].match(/\d+/);
                if (ym) yr = parseInt(ym[0], 10);
              }
              if (parts.length >= 3) {
                const sm = parts[2].replace(/Section/i, '').trim();
                if (sm) secLetter = sm;
              }

              sectionMap.set(secId, {
                id: secId,
                name: rawName,
                department: dept,
                year: yr,
                section: secLetter,
                studentCount: 45,
                subjectFacultyMap: [],
              });
            }
            const currentSec = sectionMap.get(secId)!;
            if (slot.subjectId && slot.facultyId) {
              if (!currentSec.subjectFacultyMap.some((m) => m.subjectId === slot.subjectId && m.facultyId === slot.facultyId)) {
                currentSec.subjectFacultyMap.push({ subjectId: slot.subjectId, facultyId: slot.facultyId });
              }
            }
          });
        }

        const finalSubjects = Array.from(subjectMap.values());
        const finalSections = Array.from(sectionMap.values());

        nextState.subjects = finalSubjects;
        nextState.classSections = finalSections;

        // Auto-select valid class section for student if unassigned
        if (finalSections.length > 0) {
          const currentStu = state.selectedStudent;
          const hasMatchingSection = finalSections.some(
            (c) => c.department === currentStu.department && c.year === currentStu.year && c.section === currentStu.section
          );
          if (!hasMatchingSection || !currentStu.department || currentStu.name === 'Student') {
            const primarySection = finalSections[0];
            nextState.selectedStudent = {
              ...currentStu,
              department: primarySection.department,
              year: primarySection.year,
              section: primarySection.section,
            };
          }
        }

        // Auto-select valid faculty if unassigned
        if (facultyList.length > 0) {
          const currentFac = state.selectedFaculty;
          if (!currentFac.name || currentFac.name === 'Faculty') {
            nextState.selectedFaculty = { ...facultyList[0] };
          }
        }

        return nextState;
      });
    } catch (e) {
      console.warn('Backend sync deferred (running with store state):', e);
    }
  },


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

  selectedStudent: savedName && savedEmail && savedRole === 'student' ? {
    ...emptyStudent,
    name: savedName,
    email: savedEmail,
    rollNumber: savedRoll || '',
    department: savedDept || '',
    phone: savedPhone || '',
    year: savedYear ? parseInt(savedYear, 10) : 3,
    section: savedSection || 'A',
    mentorName: savedMentorName || undefined,
    mentorId: savedMentorId || undefined,
    photoUrl: savedPhoto,
  } : emptyStudent,
  setSelectedStudent: (student) => set({ selectedStudent: student }),

  selectedFaculty: savedName && savedEmail && savedRole === 'faculty' ? {
    ...emptyFaculty,
    name: savedName,
    email: savedEmail,
    employeeId: savedEmp || '',
    department: savedDept || '',
    phone: savedPhone || '',
    designation: savedDesignation || 'Faculty',
    photoUrl: savedPhoto,
  } : emptyFaculty,
  setSelectedFaculty: (faculty) => set({ selectedFaculty: faculty }),

  students: [],
  addStudent: (newStd) => {
    // Optimistic store update
    set((state) => ({
      students: [
        {
          ...newStd,
          id: `std-${Date.now()}`,
          attendanceRate: 100,
        },
        ...state.students,
      ],
    }));
    // Async backend call with resync
    adminApi.createUser({ ...newStd, role: 'student' }).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },
  updateStudent: (id, updates) => {
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      selectedStudent: state.selectedStudent.id === id ? { ...state.selectedStudent, ...updates } : state.selectedStudent,
    }));
    adminApi.updateUser(id, updates).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },
  deleteStudent: (id) => {
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
    }));
    adminApi.deleteUser(id).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },

  faculty: [],
  addFaculty: (newFac) => {
    set((state) => ({
      faculty: [
        {
          ...newFac,
          id: `fac-${Date.now()}`,
        },
        ...state.faculty,
      ],
    }));
    adminApi.createUser({ ...newFac, role: 'faculty' }).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },
  updateFaculty: (id, updates) => {
    set((state) => ({
      faculty: state.faculty.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
    adminApi.updateUser(id, updates).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },
  toggleFacultyStatus: (id) => {
    const current = get().faculty.find((f) => f.id === id);
    const nextActive = current ? !current.active : true;
    set((state) => ({
      faculty: state.faculty.map((f) => (f.id === id ? { ...f, active: nextActive } : f)),
    }));
    adminApi.updateUser(id, { active: nextActive }).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },
  deleteFaculty: (id) => {
    set((state) => ({
      faculty: state.faculty.filter((f) => f.id !== id),
      students: state.students.map((s) => (s.mentorId === id ? { ...s, mentorId: undefined } : s)),
    }));
    adminApi.deleteUser(id).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },

  subjects: [],
  addSubject: (newSub) => {
    const tempId = newSub.id || `sub-${Date.now()}`;
    set((state) => ({
      subjects: [
        {
          ...newSub,
          id: tempId,
        },
        ...state.subjects,
      ],
    }));
    adminApi.createCourse({
      code: newSub.code,
      name: newSub.name,
      department: newSub.department,
      credits: newSub.credits,
    }).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },
  updateSubject: (id, updates) => {
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    adminApi.updateCourse(id, updates).catch(console.warn);
  },
  deleteSubject: (id) => {
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== id),
    }));
    adminApi.deleteCourse(id).catch(console.warn);
  },

  classSections: [],
  updateClassMapping: (classId, subjectId, facultyId) => {
    set((state) => ({
      classSections: state.classSections.map((cs) => {
        if (cs.id !== classId) return cs;
        const exists = cs.subjectFacultyMap.some((m) => m.subjectId === subjectId);
        const updatedMap = exists
          ? cs.subjectFacultyMap.map((m) => (m.subjectId === subjectId ? { subjectId, facultyId } : m))
          : [...cs.subjectFacultyMap, { subjectId, facultyId }];
        return { ...cs, subjectFacultyMap: updatedMap };
      }),
    }));
    adminApi.mapSubjectFaculty({ classSectionId: classId, courseId: subjectId, facultyId }).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },

  timetable: [],
  addTimetableSlot: (newSlot) => {
    const tempId = `slot-${Date.now()}`;
    set((state) => ({
      timetable: [
        {
          ...newSlot,
          id: tempId,
        },
        ...state.timetable,
      ],
    }));
    adminApi.createTimetableSlot({
      sectionId: newSlot.classSectionId,
      courseId: newSlot.subjectId,
      facultyId: newSlot.facultyId,
      roomId: newSlot.room || 'LH-204',
      dayOfWeek: newSlot.day,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      color: newSlot.color,
    }).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },
  deleteTimetableSlot: (id) => {
    set((state) => ({
      timetable: state.timetable.filter((s) => s.id !== id),
    }));
    adminApi.deleteTimetableSlot(id).then(() => {
      get().syncWithBackend();
    }).catch(console.warn);
  },
  loadWeeklyTimetableFromDB: async () => {
    await get().syncWithBackend();
  },

  bookings: [],
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

  leaveRequests: [],
  addLeaveRequest: (req) => {
    const tempId = `leave-${Date.now()}`;
    set((state) => ({
      leaveRequests: [
        {
          ...req,
          id: tempId,
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
    }));
    studentApi.submitLeave({
      leaveType: req.leaveType,
      startDate: req.startDate,
      startSession: req.startSession,
      endDate: req.endDate,
      endSession: req.endSession,
      reason: req.reason,
      mentorId: req.mentorId,
      mentorName: req.mentorName,
      daysCount: req.daysCount,
      isHalfDay: req.isHalfDay,
    }).then((created) => {
      if (created && created.id) {
        set((state) => ({
          leaveRequests: state.leaveRequests.map((l) =>
            l.id === tempId ? { ...l, id: created.id } : l
          ),
        }));
      }
      get().syncWithBackend();
    }).catch(console.warn);
  },
  updateLeaveStatus: (id, status, comment) => {
    const currentRole = get().currentRole;
    set((state) => {
      const targetLeave = state.leaveRequests.find((l) => l.id === id);
      const updatedLeaves = state.leaveRequests.map((l) =>
        l.id === id ? { ...l, status, reviewComment: comment !== undefined ? comment : l.reviewComment } : l
      );
      const newNotifs = targetLeave
        ? [
          {
            id: `notif-${Date.now()}`,
            title: `Leave Application ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            body: `Mentor ${targetLeave.mentorName} has ${status} your ${targetLeave.leaveType}.${comment ? ` Remark: "${comment}"` : ''}`,
            category: 'today' as const,
            read: false,
            accentColor: status === 'approved' ? ('emerald' as const) : ('rose' as const),
            timestamp: 'Just now',
          },
          ...state.notifications,
        ]
        : state.notifications;
      return {
        leaveRequests: updatedLeaves,
        notifications: newNotifs,
      };
    });
    if (currentRole === 'faculty') {
      facultyApi.reviewLeave(id, status, comment).catch(console.warn);
    } else {
      adminApi.reviewLeave(id, { status, comment, isFacultyLeave: false }).catch(console.warn);
    }
  },
  cancelLeaveRequest: (id) =>
    set((state) => ({
      leaveRequests: state.leaveRequests.filter((l) => l.id !== id),
    })),

  facultyLeaveRequests: [],
  addFacultyLeaveRequest: (req) => {
    const tempId = `fac-leave-${Date.now()}`;
    set((state) => ({
      facultyLeaveRequests: [
        {
          ...req,
          id: tempId,
          appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'pending',
        },
        ...state.facultyLeaveRequests,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: `Faculty Leave Submitted`,
          body: `${req.facultyName} has submitted a ${req.leaveType} application (${req.daysCount} day(s)). Routed to Administration for substitute assignment.`,
          category: 'today',
          read: false,
          accentColor: 'indigo',
          timestamp: 'Just now',
        },
        ...state.notifications,
      ],
    }));
    facultyApi.submitLeave({
      leaveType: req.leaveType,
      startDate: req.startDate,
      startSession: req.startSession,
      endDate: req.endDate,
      endSession: req.endSession,
      reason: req.reason,
      daysCount: req.daysCount,
      isHalfDay: req.isHalfDay,
      affectedSubjects: req.affectedSubjects,
    }).then((created) => {
      if (created && created.id) {
        set((state) => ({
          facultyLeaveRequests: state.facultyLeaveRequests.map((fl) =>
            fl.id === tempId ? { ...fl, id: created.id } : fl
          ),
        }));
      }
      get().syncWithBackend();
    }).catch(console.warn);
  },
  updateFacultyLeaveStatus: (id, status, substituteFacultyId, substituteFacultyName, comment) => {
    set((state) => {
      const targetLeave = state.facultyLeaveRequests.find((l) => l.id === id);
      const updatedLeaves = state.facultyLeaveRequests.map((l) =>
        l.id === id
          ? {
              ...l,
              status,
              substituteFacultyId: substituteFacultyId !== undefined ? substituteFacultyId : l.substituteFacultyId,
              substituteFacultyName: substituteFacultyName !== undefined ? substituteFacultyName : l.substituteFacultyName,
              reviewComment: comment !== undefined ? comment : l.reviewComment,
            }
          : l
      );
      const newNotifs = targetLeave
        ? [
            {
              id: `notif-${Date.now()}`,
              title: `Faculty Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
              body: `Administration has ${status} leave for ${targetLeave.facultyName}.${
                substituteFacultyName ? ` Assigned substitute: ${substituteFacultyName}.` : ''
              }${comment ? ` Note: "${comment}"` : ''}`,
              category: 'today' as const,
              read: false,
              accentColor: status === 'approved' ? ('emerald' as const) : ('rose' as const),
              timestamp: 'Just now',
            },
            ...state.notifications,
          ]
        : state.notifications;
      return {
        facultyLeaveRequests: updatedLeaves,
        notifications: newNotifs,
      };
    });
    adminApi.reviewLeave(id, {
      status,
      substituteFacultyId,
      substituteFacultyName,
      comment,
      isFacultyLeave: true,
    }).catch(console.warn);
  },
  cancelFacultyLeaveRequest: (id) => {
    set((state) => ({
      facultyLeaveRequests: state.facultyLeaveRequests.filter((l) => l.id !== id),
    }));
    facultyApi.cancelLeave(id).catch(console.warn);
  },

  notifications: [],
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  settings: defaultSettings,
  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
    adminApi.updateSettings(updates).catch(console.warn);
  },
}));
