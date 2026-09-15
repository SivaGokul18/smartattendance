import axios, { AxiosInstance } from 'axios';

// Extract API Base URL from environment (e.g. Render backend URL in production)
const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://smart-attendance-backend-f7vl.onrender.com').trim().replace(/\/+$/, '');
export const API_BASE_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

// Helper to construct WebSocket URL for Render or local
export const getWebSocketUrl = (path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = rawApiUrl.replace(/\/api\/v1$/, '');
  if (base) {
    const wsProto = base.startsWith('https') ? 'wss' : 'ws';
    const host = base.replace(/^https?:\/\//, '');
    return `${wsProto}://${host}/ws${cleanPath}`;
  }
  const loc = window.location;
  const wsProto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${loc.host}/ws${cleanPath}`;
};

// Create base Axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized or stale token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = String(error.response?.data?.detail || '').toLowerCase();
    const isAuthError = status === 401 || (status === 404 && detail.includes('token'));

    if (isAuthError) {
      const reqUrl = String(error.config?.url || '');
      // Never trigger automatic logout during login or credential submission
      if (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/google')) {
        return Promise.reject(error);
      }

      // Guard active admin session from being kicked out due to secondary background sync calls
      const userRole = localStorage.getItem('user_role');
      if (userRole === 'admin' && !reqUrl.includes('/auth/me')) {
        console.warn('Non-fatal admin request authorization notice on:', reqUrl);
        return Promise.reject(error);
      }

      console.warn('Session expired or unauthorized token detected. Clearing stale credentials.');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('auth_user_name');
      localStorage.removeItem('auth_user_email');
      localStorage.removeItem('auth_user_photo');
      localStorage.removeItem('auth_user_roll');
      localStorage.removeItem('auth_user_emp');
      localStorage.removeItem('auth_user_dept');
      localStorage.removeItem('auth_user_phone');
      localStorage.removeItem('auth_user_year');
      localStorage.removeItem('auth_user_section');
      localStorage.removeItem('auth_user_mentor_name');
      localStorage.removeItem('auth_user_mentor_id');
      localStorage.removeItem('auth_user_desig');

      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/auth') && currentPath !== '/') {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

// ================================================================
// Structured API Service Helpers
// ================================================================

export const authApi = {
  login: async (credentials: { identifier: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data?.access_token) {
      localStorage.setItem('auth_token', res.data.access_token);
      localStorage.setItem('user_role', res.data.role);
    }
    return res.data;
  },
  googleLogin: async (payload: { credential: string; target_role?: string }) => {
    const res = await api.post('/auth/google', payload);
    if (res.data?.access_token) {
      localStorage.setItem('auth_token', res.data.access_token);
      localStorage.setItem('user_role', res.data.role);
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  changePassword: async (payload: { currentPassword?: string; newPassword: string }) => {
    const res = await api.post('/auth/change-password', payload);
    return res.data;
  },
};

export const studentApi = {
  getHome: async () => {
    const res = await api.get('/student/home');
    return res.data;
  },
  getTimetable: async () => {
    const res = await api.get('/student/timetable');
    return res.data;
  },
  verifyAttendance: async (payload: {
    sessionId: string;
    bleToken?: string;
    rssi?: number;
    distanceMeters?: number;
    faceConfidenceScore: number;
    faceVerified: boolean;
    method?: string;
  }) => {
    const res = await api.post('/student/attendance/verify', payload);
    return res.data;
  },
  getHistory: async () => {
    const res = await api.get('/student/attendance/history');
    return res.data;
  },
  enrollFace: async (faceTemplateId: string) => {
    const res = await api.post('/student/enrollment/face', { faceTemplateId });
    return res.data;
  },
  submitLeave: async (leaveData: {
    leaveType: string;
    startDate: string;
    startSession?: string;
    endDate: string;
    endSession?: string;
    reason: string;
    mentorId?: string;
    mentorName?: string;
    daysCount?: number;
    isHalfDay?: boolean;
    documentUrl?: string;
  }) => {
    const res = await api.post('/student/leave', leaveData);
    return res.data;
  },
  getLeaves: async () => {
    const res = await api.get('/student/leave');
    return res.data;
  },
};

export const facultyApi = {
  getHome: async () => {
    const res = await api.get('/faculty/home');
    return res.data;
  },
  startSession: async (sessionConfig: {
    classSectionId: string;
    classSectionName?: string;
    subjectId: string;
    subjectName?: string;
    room: string;
    durationMinutes: number;
    faceVerificationRequired: boolean;
    capacity: number;
  }) => {
    const res = await api.post('/faculty/session/start', sessionConfig);
    return res.data;
  },
  manualCheckin: async (sessionId: string, studentId: string, reason: string) => {
    const res = await api.post(`/faculty/session/${sessionId}/manual-checkin`, { studentId, reason });
    return res.data;
  },
  endSession: async (sessionId: string) => {
    const res = await api.post(`/faculty/session/${sessionId}/end`);
    return res.data;
  },
  getHistory: async () => {
    const res = await api.get('/faculty/history');
    return res.data;
  },
  getApprovals: async (statusFilter?: string, facultyId?: string) => {
    const params: Record<string, string> = {};
    if (statusFilter && statusFilter !== 'all') params.status_filter = statusFilter;
    if (facultyId) params.faculty_id = facultyId;
    const res = await api.get('/faculty/approvals', { params });
    return res.data;
  },
  reviewLeave: async (leaveId: string, status: 'approved' | 'rejected', comment?: string) => {
    const res = await api.post(`/faculty/approvals/${leaveId}`, { status, comment });
    return res.data;
  },
  getLeaves: async () => {
    const res = await api.get('/faculty/leave');
    return res.data;
  },
  submitLeave: async (leaveData: {
    leaveType: string;
    startDate: string;
    startSession: string;
    endDate: string;
    endSession: string;
    reason: string;
    daysCount?: number;
    isHalfDay?: boolean;
    affectedSubjects?: string[];
  }) => {
    const res = await api.post('/faculty/leave', leaveData);
    return res.data;
  },
  cancelLeave: async (leaveId: string) => {
    const res = await api.delete(`/faculty/leave/${leaveId}`);
    return res.data;
  },
  getTimetable: async (facultyId?: string) => {
    const res = await api.get('/faculty/timetable', {
      params: facultyId ? { faculty_id: facultyId } : {},
    });
    return res.data;
  },
};

export const adminApi = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },
  getStudents: async () => {
    const res = await api.get('/admin/students');
    return res.data;
  },
  getFaculty: async () => {
    const res = await api.get('/admin/faculty');
    return res.data;
  },
  createUser: async (userData: any) => {
    const res = await api.post('/admin/users', userData);
    return res.data;
  },
  updateUser: async (userId: string, updates: any) => {
    const res = await api.put(`/admin/users/${userId}`, updates);
    return res.data;
  },
  deleteUser: async (userId: string) => {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  },
  forceEndSession: async (sessionId: string) => {
    const res = await api.post(`/admin/sessions/${sessionId}/force-end`);
    return res.data;
  },
  getLeaveOversight: async () => {
    const res = await api.get('/admin/leave-oversight');
    return res.data;
  },
  reviewLeave: async (
    leaveId: string,
    decision: {
      status: 'approved' | 'rejected';
      substituteFacultyId?: string;
      substituteFacultyName?: string;
      comment?: string;
      isFacultyLeave?: boolean;
    }
  ) => {
    const res = await api.post(`/admin/leave-oversight/${leaveId}/review`, decision, {
      params: { is_faculty_leave: decision.isFacultyLeave },
    });
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data;
  },
  getSettings: async () => {
    const res = await api.get('/admin/settings');
    return res.data;
  },
  updateSettings: async (settings: any) => {
    const res = await api.put('/admin/settings', settings);
    return res.data;
  },
  getDepartments: async () => {
    const res = await api.get('/admin/departments');
    return res.data;
  },
  getCourses: async () => {
    const res = await api.get('/admin/courses');
    return res.data;
  },
  createCourse: async (data: { code: string; name: string; department: string; credits?: number }) => {
    const res = await api.post('/admin/courses', data);
    return res.data;
  },
  updateCourse: async (courseId: string, data: { name?: string; department?: string; credits?: number }) => {
    const res = await api.put(`/admin/courses/${courseId}`, data);
    return res.data;
  },
  deleteCourse: async (courseId: string) => {
    const res = await api.delete(`/admin/courses/${courseId}`);
    return res.data;
  },
  getClassSections: async () => {
    const res = await api.get('/admin/sections');
    return res.data;
  },
  createClassSection: async (data: { name: string; department: string; year?: number; section?: string; studentCount?: number }) => {
    const res = await api.post('/admin/sections', data);
    return res.data;
  },
  updateClassSection: async (sectionId: string, data: { name?: string; department?: string; year?: number; section?: string; studentCount?: number }) => {
    const res = await api.put(`/admin/sections/${sectionId}`, data);
    return res.data;
  },
  deleteClassSection: async (sectionId: string) => {
    const res = await api.delete(`/admin/sections/${sectionId}`);
    return res.data;
  },
  getRooms: async () => {
    const res = await api.get('/admin/rooms');
    return res.data;
  },
  createRoom: async (data: { name: string; beaconUuid: string; capacity?: number; defaultTxPower?: number }) => {
    const res = await api.post('/admin/rooms', data);
    return res.data;
  },
  updateRoom: async (roomId: string, data: { name?: string; beaconUuid?: string; capacity?: number; defaultTxPower?: number }) => {
    const res = await api.put(`/admin/rooms/${roomId}`, data);
    return res.data;
  },
  deleteRoom: async (roomId: string) => {
    const res = await api.delete(`/admin/rooms/${roomId}`);
    return res.data;
  },
  mapSubjectFaculty: async (data: { classSectionId: string; courseId: string; facultyId: string }) => {
    const res = await api.post('/admin/mapping/subject-faculty', data);
    return res.data;
  },
  createTimetableSlot: async (data: {
    sectionId: string;
    courseId: string;
    facultyId: string;
    roomId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    color?: string;
  }) => {
    const res = await api.post('/admin/timetable/slot', data);
    return res.data;
  },
  deleteTimetableSlot: async (slotId: string) => {
    const res = await api.delete(`/admin/timetable/slot/${slotId}`);
    return res.data;
  },
  downloadImportTemplate: async (type: 'student' | 'faculty') => {
    const res = await api.get(`/admin/import/template/${type}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_import_template.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  previewImport: async (file: File, type: 'student' | 'faculty') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('import_type', type);
    const res = await api.post('/admin/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  confirmImport: async (payload: { import_type: 'student' | 'faculty'; rows: any[] }) => {
    const res = await api.post('/admin/import/confirm', payload);
    return res.data;
  },
  getSheetConfigs: async () => {
    const res = await api.get('/admin/sheets/config');
    return res.data;
  },
  saveSheetConfig: async (data: {
    sheet_type: 'student' | 'faculty';
    url?: string;
    sync_interval_minutes: number;
    auto_apply: boolean;
  }) => {
    const res = await api.post('/admin/sheets/config', data);
    return res.data;
  },
  syncSheet: async (sheetType: 'student' | 'faculty', customUrl?: string) => {
    const res = await api.post(`/admin/sheets/sync/${sheetType}`, null, {
      params: customUrl ? { custom_url: customUrl } : {},
    });
    return res.data;
  },
  applySheetRows: async (payload: {
    sheet_type: 'student' | 'faculty';
    rows: any[];
  }) => {
    const res = await api.post('/admin/sheets/apply', payload);
    return res.data;
  },
  downloadSheetTemplate: async (sheetType: 'student' | 'faculty') => {
    const res = await api.get(`/admin/sheets/template/${sheetType}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${sheetType}_roster_template.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  getAllTimetableSlots: async () => {
    const res = await api.get('/admin/timetable/all');
    return res.data;
  },
  getTimetableConfig: async (target?: 'student' | 'teacher') => {
    const res = await api.get('/admin/timetable/config', {
      params: target ? { target } : {},
    });
    return res.data;
  },
  getAllTimetableConfigs: async () => {
    const res = await api.get('/admin/timetable/configs');
    return res.data;
  },
  saveTimetableConfig: async (
    data: {
      sheet_type: string;
      url?: string;
      sync_interval_minutes: number;
      auto_apply: boolean;
    },
    target?: 'student' | 'teacher'
  ) => {
    const res = await api.post('/admin/timetable/config', data, {
      params: target ? { target } : {},
    });
    return res.data;
  },
  syncTimetable: async (options?: {
    customUrl?: string;
    file?: File;
    target?: 'student' | 'teacher';
    autoApply?: boolean;
  }) => {
    if (options?.file) {
      const formData = new FormData();
      formData.append('file', options.file);
      const res = await api.post('/admin/timetable/sync', formData, {
        params: {
          ...(options?.target ? { target: options.target } : {}),
          ...(options?.autoApply !== undefined ? { auto_apply: options.autoApply } : {}),
        },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    }
    const res = await api.post('/admin/timetable/sync', null, {
      params: {
        ...(options?.customUrl ? { custom_url: options.customUrl } : {}),
        ...(options?.target ? { target: options.target } : {}),
        ...(options?.autoApply !== undefined ? { auto_apply: options.autoApply } : {}),
      },
    });
    return res.data;
  },
  applyTimetableSlots: async (payload: { rows: any[]; replace_existing?: boolean }) => {
    const res = await api.post('/admin/timetable/apply', payload);
    return res.data;
  },
  downloadTimetableTemplate: async () => {
    const res = await api.get('/admin/timetable/template', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'academic_timetable_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

