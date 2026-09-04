import { Student, Faculty, Subject, ClassSection, TimetableSlot, BookingSlot, NotificationItem, AdminSettings } from '../types';

export const initialStudents: Student[] = [
  {
    id: 'std-1',
    name: 'Aarav Sharma',
    rollNumber: '21CS101',
    department: 'Computer Science',
    year: 3,
    section: 'A',
    email: 'aarav.sharma@attend.edu',
    phone: '+91 98765 43210',
    faceIdStatus: 'enrolled',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    attendanceRate: 92,
  },
  {
    id: 'std-2',
    name: 'Ananya Verma',
    rollNumber: '21CS102',
    department: 'Computer Science',
    year: 3,
    section: 'A',
    email: 'ananya.v@attend.edu',
    phone: '+91 98765 43211',
    faceIdStatus: 'enrolled',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    attendanceRate: 96,
  },
  {
    id: 'std-3',
    name: 'Rohan Iyer',
    rollNumber: '21CS103',
    department: 'Computer Science',
    year: 3,
    section: 'A',
    email: 'rohan.iyer@attend.edu',
    phone: '+91 98765 43212',
    faceIdStatus: 'pending',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    attendanceRate: 68,
  },
  {
    id: 'std-4',
    name: 'Priya Patel',
    rollNumber: '21CS104',
    department: 'Computer Science',
    year: 3,
    section: 'B',
    email: 'priya.patel@attend.edu',
    phone: '+91 98765 43213',
    faceIdStatus: 'enrolled',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    attendanceRate: 84,
  },
  {
    id: 'std-5',
    name: 'Devraj Singh',
    rollNumber: '21CS105',
    department: 'Computer Science',
    year: 3,
    section: 'A',
    email: 'devraj.s@attend.edu',
    phone: '+91 98765 43214',
    faceIdStatus: 'enrolled',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    attendanceRate: 72,
  },
  {
    id: 'std-6',
    name: 'Meera Nambiar',
    rollNumber: '22AI201',
    department: 'AI & Data Science',
    year: 2,
    section: 'A',
    email: 'meera.n@attend.edu',
    phone: '+91 98765 43215',
    faceIdStatus: 'enrolled',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    attendanceRate: 94,
  },
  {
    id: 'std-7',
    name: 'Kavya Pillai',
    rollNumber: '21CS106',
    department: 'Computer Science',
    year: 3,
    section: 'A',
    email: 'kavya.p@attend.edu',
    phone: '+91 98765 43216',
    faceIdStatus: 'enrolled',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    attendanceRate: 89,
  },
  {
    id: 'std-8',
    name: 'Siddharth Rao',
    rollNumber: '21CS107',
    department: 'Computer Science',
    year: 3,
    section: 'A',
    email: 'sid.rao@attend.edu',
    phone: '+91 98765 43217',
    faceIdStatus: 'pending',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    attendanceRate: 64,
  }
];

export const initialFaculty: Faculty[] = [
  {
    id: 'fac-1',
    name: 'Dr. Rajesh Kumar',
    employeeId: 'EMP-701',
    department: 'Computer Science',
    email: 'dr.rajesh@attend.edu',
    phone: '+91 98220 11223',
    subjects: ['CS301 Machine Learning', 'CS304 Embedded IoT'],
    active: true,
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'fac-2',
    name: 'Prof. Shalini Gupta',
    employeeId: 'EMP-702',
    department: 'Computer Science',
    email: 'shalini.g@attend.edu',
    phone: '+91 98220 11224',
    subjects: ['CS302 Cloud Computing', 'CS303 Distributed Systems'],
    active: true,
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'fac-3',
    name: 'Dr. Vikramaditya Sen',
    employeeId: 'EMP-703',
    department: 'AI & Data Science',
    email: 'dr.sen@attend.edu',
    phone: '+91 98220 11225',
    subjects: ['AI201 Neural Networks', 'AI203 Deep Learning'],
    active: true,
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'fac-4',
    name: 'Prof. Anita Deshmukh',
    employeeId: 'EMP-704',
    department: 'Information Tech',
    email: 'anita.d@attend.edu',
    phone: '+91 98220 11226',
    subjects: ['IT305 Cyber Security'],
    active: false,
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  }
];

export const initialSubjects: Subject[] = [
  {
    id: 'sub-1',
    name: 'Machine Learning',
    code: 'CS301',
    credits: 4,
    department: 'Computer Science',
    assignedFacultyIds: ['fac-1'],
    assignedClassIds: ['cls-1', 'cls-2']
  },
  {
    id: 'sub-2',
    name: 'Mobile & Cloud Computing',
    code: 'CS302',
    credits: 3,
    department: 'Computer Science',
    assignedFacultyIds: ['fac-2'],
    assignedClassIds: ['cls-1']
  },
  {
    id: 'sub-3',
    name: 'Embedded IoT Systems',
    code: 'CS304',
    credits: 4,
    department: 'Computer Science',
    assignedFacultyIds: ['fac-1'],
    assignedClassIds: ['cls-1']
  },
  {
    id: 'sub-4',
    name: 'Deep Learning & Vision',
    code: 'AI203',
    credits: 4,
    department: 'AI & Data Science',
    assignedFacultyIds: ['fac-3'],
    assignedClassIds: ['cls-3']
  }
];

export const initialClassSections: ClassSection[] = [
  {
    id: 'cls-1',
    name: 'CSE - 3rd Year - Section A',
    department: 'Computer Science',
    year: 3,
    section: 'A',
    studentCount: 45,
    subjectFacultyMap: [
      { subjectId: 'sub-1', facultyId: 'fac-1' },
      { subjectId: 'sub-2', facultyId: 'fac-2' },
      { subjectId: 'sub-3', facultyId: 'fac-1' }
    ]
  },
  {
    id: 'cls-2',
    name: 'CSE - 3rd Year - Section B',
    department: 'Computer Science',
    year: 3,
    section: 'B',
    studentCount: 42,
    subjectFacultyMap: [
      { subjectId: 'sub-1', facultyId: 'fac-1' }
    ]
  },
  {
    id: 'cls-3',
    name: 'AI&DS - 2nd Year - Section A',
    department: 'AI & Data Science',
    year: 2,
    section: 'A',
    studentCount: 38,
    subjectFacultyMap: [
      { subjectId: 'sub-4', facultyId: 'fac-3' }
    ]
  }
];

export const initialTimetable: TimetableSlot[] = [
  {
    id: 'slot-1',
    day: 'Mon',
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 'sub-1',
    facultyId: 'fac-1',
    classSectionId: 'cls-1',
    room: 'LH-204',
    color: '#4F46E5'
  },
  {
    id: 'slot-2',
    day: 'Mon',
    startTime: '10:15',
    endTime: '11:15',
    subjectId: 'sub-2',
    facultyId: 'fac-2',
    classSectionId: 'cls-1',
    room: 'LH-204',
    color: '#7C3AED'
  },
  {
    id: 'slot-3',
    day: 'Tue',
    startTime: '09:00',
    endTime: '10:00',
    subjectId: 'sub-3',
    facultyId: 'fac-1',
    classSectionId: 'cls-1',
    room: 'IoT Lab 102',
    color: '#10B981'
  },
  {
    id: 'slot-4',
    day: 'Wed',
    startTime: '11:30',
    endTime: '12:30',
    subjectId: 'sub-1',
    facultyId: 'fac-1',
    classSectionId: 'cls-1',
    room: 'LH-204',
    color: '#4F46E5'
  },
  {
    id: 'slot-5',
    day: 'Thu',
    startTime: '14:00',
    endTime: '15:30',
    subjectId: 'sub-2',
    facultyId: 'fac-2',
    classSectionId: 'cls-1',
    room: 'Cloud Lab 304',
    color: '#7C3AED'
  },
  {
    id: 'slot-6',
    day: 'Fri',
    startTime: '10:00',
    endTime: '11:00',
    subjectId: 'sub-1',
    facultyId: 'fac-1',
    classSectionId: 'cls-2',
    room: 'LH-208',
    color: '#F59E0B'
  }
];

export const initialBookings: BookingSlot[] = [
  {
    id: 'book-1',
    subjectName: 'Advanced GPU Lab: PyTorch CUDA',
    facultyName: 'Dr. Vikramaditya Sen',
    room: 'GPU Cluster Lab 401',
    date: '2026-09-05',
    time: '10:00 AM - 12:00 PM',
    totalSeats: 30,
    bookedSeats: 27, // 3 seats left (amber alert!)
    studentIds: ['std-1', 'std-2']
  },
  {
    id: 'book-2',
    subjectName: 'Embedded IoT Hardware Workshop',
    facultyName: 'Dr. Rajesh Kumar',
    room: 'IoT Center 102',
    date: '2026-09-06',
    time: '02:00 PM - 04:30 PM',
    totalSeats: 25,
    bookedSeats: 16,
    studentIds: ['std-4']
  },
  {
    id: 'book-3',
    subjectName: 'AWS Cloud Architecture Hands-on',
    facultyName: 'Prof. Shalini Gupta',
    room: 'Virtual Sandbox 2',
    date: '2026-09-08',
    time: '11:00 AM - 01:00 PM',
    totalSeats: 40,
    bookedSeats: 38, // 2 seats left
    studentIds: ['std-1', 'std-6']
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Attendance Confirmed: CS301',
    body: 'Your attendance for Machine Learning (Room 204) was marked via BLE + Face ID.',
    category: 'today',
    read: false,
    accentColor: 'emerald',
    timestamp: '10:02 AM'
  },
  {
    id: 'notif-2',
    title: 'Low Attendance Alert: CS303',
    body: 'Your attendance in Distributed Systems dropped to 68%. Minimum required is 75%.',
    category: 'this_week',
    read: false,
    accentColor: 'amber',
    timestamp: 'Yesterday, 4:15 PM'
  },
  {
    id: 'notif-3',
    title: 'Mid-term Timetable Released',
    body: 'The Fall 2026 examination timetable has been published by the academic office.',
    category: 'earlier',
    read: true,
    accentColor: 'indigo',
    timestamp: '3 days ago'
  }
];

export const defaultSettings: AdminSettings = {
  bleSignalRange: 15,
  bleRssiThreshold: -75,
  faceConfidenceThreshold: 85,
  livenessCheckEnabled: true,
  autoSyncOffline: true,
  facultyManualOverrideAllowed: true
};
