export interface RosterAccount {
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  identifier: string; // Roll No or Staff ID
  department: string;
  designationOrSemester: string;
  mentorOrGroup?: string;
  phone: string;
  password: string;
}

export const OFFICIAL_ROSTER_ACCOUNTS: RosterAccount[] = [
  // Faculty Roster
  {
    name: 'Dr. Santhiya M',
    email: 'santhiya.m@campus.edu',
    role: 'faculty',
    identifier: 'STAFF-IT-101',
    department: 'Information Technology',
    designationOrSemester: 'Associate Professor',
    mentorOrGroup: 'Assigned Mentor (Section A)',
    phone: '+91 97873 11111',
    password: 'faculty123',
  },
  {
    name: 'Dr. Ramesh Kumar',
    email: 'faculty@campus.edu',
    role: 'faculty',
    identifier: 'FAC-CSE-001',
    department: 'Computer Science and Engineering',
    designationOrSemester: 'Professor & Head',
    mentorOrGroup: 'Assigned Mentor (Section A)',
    phone: '+91 98765 00002',
    password: 'faculty123',
  },
  {
    name: 'Dr. Anandhi Sundaram',
    email: 'anandhi@campus.edu',
    role: 'faculty',
    identifier: 'FAC-ECE-002',
    department: 'Electronics and Communication Engineering',
    designationOrSemester: 'Associate Professor',
    mentorOrGroup: 'Assigned Mentor (Section B)',
    phone: '+91 98765 00003',
    password: 'faculty123',
  },
  {
    name: 'Prof. Rajesh V',
    email: 'rajesh@campus.edu',
    role: 'faculty',
    identifier: 'FAC-CSE-003',
    department: 'Computer Science and Engineering',
    designationOrSemester: 'Assistant Professor',
    mentorOrGroup: 'Course Instructor',
    phone: '+91 98765 00004',
    password: 'faculty123',
  },

  // Student Roster
  {
    name: 'SIVAGOKUL C',
    email: 'sivagokulc18@gmail.com',
    role: 'student',
    identifier: '7376242IT303',
    department: 'Information Technology',
    designationOrSemester: 'Semester V (Year 3) • Section A',
    mentorOrGroup: 'Mentor: Dr. Santhiya M',
    phone: '+91 97873 80220',
    password: 'student123',
  },
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    role: 'student',
    identifier: '2026CS101',
    department: 'Computer Science and Engineering',
    designationOrSemester: 'Semester V (Year 3) • Section A',
    mentorOrGroup: 'Mentor: Dr. Ramesh Kumar',
    phone: '+91 98765 43210',
    password: 'student123',
  },
  {
    name: 'Devika Nair',
    email: 'devika.n@campus.edu',
    role: 'student',
    identifier: '2026EC204',
    department: 'Electronics and Communication Engineering',
    designationOrSemester: 'Semester V (Year 3) • Section B',
    mentorOrGroup: 'Mentor: Dr. Anandhi Sundaram',
    phone: '+91 98111 22233',
    password: 'student123',
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@campus.edu',
    role: 'student',
    identifier: '2026CS102',
    department: 'Computer Science and Engineering',
    designationOrSemester: 'Semester V (Year 3) • Section A',
    mentorOrGroup: 'Mentor: Dr. Ramesh Kumar',
    phone: '+91 98222 33344',
    password: 'student123',
  },
  {
    name: 'Kavya Iyer',
    email: 'kavya.iyer@campus.edu',
    role: 'student',
    identifier: '2026IT105',
    department: 'Information Technology',
    designationOrSemester: 'Semester V (Year 3) • Section A',
    mentorOrGroup: 'Mentor: Dr. Santhiya M',
    phone: '+91 98333 44455',
    password: 'student123',
  },

  // Institutional Admin
  {
    name: 'Super Admin Administrator',
    email: 'admin@campus.edu',
    role: 'admin',
    identifier: 'ADMIN-01',
    department: 'Institutional Administration',
    designationOrSemester: 'Super Administrator',
    mentorOrGroup: 'System Authority',
    phone: '+91 98765 00001',
    password: 'admin123',
  },
];

export const isAuthorizedRosterEmail = (emailOrId: string): boolean => {
  const clean = emailOrId.trim().toLowerCase();
  return OFFICIAL_ROSTER_ACCOUNTS.some(
    (acc) =>
      acc.email.toLowerCase() === clean ||
      acc.identifier.toLowerCase() === clean
  );
};

export const getRosterAccount = (emailOrId: string): RosterAccount | undefined => {
  const clean = emailOrId.trim().toLowerCase();
  return OFFICIAL_ROSTER_ACCOUNTS.find(
    (acc) =>
      acc.email.toLowerCase() === clean ||
      acc.identifier.toLowerCase() === clean
  );
};
