export interface PromptKitItem {
  id: string;
  category: 'System' | 'Admin' | 'Faculty' | 'Student' | 'Shared';
  title: string;
  code: string;
  prompt: string;
}

export const promptKitItems: PromptKitItem[] = [
  {
    id: 'p0',
    category: 'System',
    title: '0. Global Design System Prompt',
    code: 'SYSTEM-0',
    prompt: `Design a premium, modern attendance-management product called "AttendEase."
Style: Clean SaaS-meets-mobile aesthetic, glassmorphism cards on a soft gradient background, generous whitespace, rounded corners (16-20px radius), subtle shadows.
Color palette: Primary Deep Indigo (#4F46E5) to Violet (#7C3AED) gradient; Accent Emerald (#10B981), Amber (#F59E0B), Rose (#EF4444); Background #F8F9FC (light) / #12131A (dark); Text Slate-900 / Slate-100.
Typography: "Inter" or "Poppins" — bold headlines, medium body.
Components: Pill-shaped buttons with soft gradient fills, floating bottom nav bars (mobile) with raised center button, card-based lists with left-accent color bars, animated progress rings, skeleton loaders, toast notifications.
Micro-interactions: Button press scale (0.97), card hover lift, success checkmark animation, pull-to-refresh.`
  },
  {
    id: 'a1',
    category: 'Admin',
    title: 'A1. Login / Auth Screen',
    code: 'ADMIN-A1',
    prompt: `Split-screen layout: left 55% shows a gradient indigo-violet illustration panel with a floating mockup of the mobile app and tagline "Attendance, Automated." Right 45% is a clean white card with "Welcome back, Admin" heading, email/password fields with floating labels, "Remember me" toggle, gradient "Sign In" pill button, and "Forgot password?" link. Add animated logo and SSO buttons (Google/Microsoft).`
  },
  {
    id: 'a2',
    category: 'Admin',
    title: 'A2. Main Dashboard (Overview)',
    code: 'ADMIN-A2',
    prompt: `Top bar: logo, global search, notification bell with badge, admin avatar. Left sidebar: Dashboard, Students, Faculty, Timetable, Class Mapping, Subject Mapping, Bookings, Reports, Settings.
Main content: 4 KPI cards in a row (Total Students, Total Faculty, Today's Attendance %, Active Sessions) with gradient icon chips, big numbers, and trend sparklines. Below: 30-day attendance trend line chart, department donut chart, and live "Active BLE Sessions" widget with pulsing green dot. Bottom: recent activity table.`
  },
  {
    id: 'a3',
    category: 'Admin',
    title: 'A3. Students Management',
    code: 'ADMIN-A3',
    prompt: `Top: "Students" title, "+ Add Student" gradient button, search bar, filter chips (Department, Year, Section, Status). Table columns: Photo, Name, Roll No, Department, Section, Email, Face-ID Status (Enrolled/Pending), Actions. Bulk-select checkboxes and floating bulk-action bar. Pagination and right-side slide-in drawer for "Add/Edit Student" with photo upload.`
  },
  {
    id: 'a4',
    category: 'Admin',
    title: 'A4. Faculty Management',
    code: 'ADMIN-A4',
    prompt: `Table columns Photo, Name, Employee ID, Department, Subjects Assigned (chip tags), Contact, Status (Active/Inactive toggle switch), Actions. Side drawer "Add/Edit Faculty" with Name, Employee ID, Department, Email, Phone, and multi-select "Assign Subjects" field with searchable chips.`
  },
  {
    id: 'a5',
    category: 'Admin',
    title: 'A5. Timetable Builder',
    code: 'ADMIN-A5',
    prompt: `Visual weekly Timetable builder: grid with days (Mon-Sat) as columns and time slots as rows. Empty drop-zones or filled colored cards showing Subject, Faculty avatar, Room. Top toolbar: Class selector, "+ Add Slot" button. Click opens modal to select Subject, Faculty, Room, Duration. Red conflict-detection banner if faculty is double-booked.`
  },
  {
    id: 'a6',
    category: 'Admin',
    title: 'A6. Class Mapping',
    code: 'ADMIN-A6',
    prompt: `Two-panel layout: left panel lists Classes as expandable accordion cards revealing mapped subjects and faculty mini table. Right panel is mapping form: Class -> Section -> Subjects -> Faculty. "Save Mapping" button and visual tree/flow diagram showing Class -> Section -> Subjects -> Faculty.`
  },
  {
    id: 'a7',
    category: 'Admin',
    title: 'A7. Subject Mapping',
    code: 'ADMIN-A7',
    prompt: `Top: "+ Add Subject" button and search bar. Card grid layout: Subject Name, Code, Credit Hours, Faculty avatars. Detail modal with tabs: Overview, Assigned Classes, Assigned Faculty with editable chip controls.`
  },
  {
    id: 'a8',
    category: 'Admin',
    title: 'A8. Student Booking (Session/Seat)',
    code: 'ADMIN-A8',
    prompt: `Calendar-style week view showing booked slots as colored blocks with student count badges. Left filter panel: Class, Subject, Date range, Status. Table view toggle showing Booking ID, Student, Subject, Session Date/Time, Status badge. "+ New Booking" modal with autocomplete search.`
  },
  {
    id: 'a9',
    category: 'Admin',
    title: 'A9. Reports & Analytics Dashboard',
    code: 'ADMIN-A9',
    prompt: `Top filter bar. 3 summary cards (Overall Attendance %, Total Sessions Held, Students Below 75% in amber/red). Stacked bar chart of attendance by subject, heatmap calendar showing daily attendance density, sortable "Low Attendance Alert" table with "Send Notification" action, "Export Report" button.`
  },
  {
    id: 'a10',
    category: 'Admin',
    title: 'A10. Settings Screen',
    code: 'ADMIN-A10',
    prompt: `Left tab list: General, BLE Configuration (range/threshold sliders), Face Recognition Settings (confidence threshold slider, liveness-check toggle), Notifications, Roles & Permissions, Backup/Export. Sticky "Save Changes" gradient button.`
  },
  {
    id: 'b1',
    category: 'Faculty',
    title: 'B1. Faculty Splash & Login',
    code: 'FACULTY-B1',
    prompt: `Mobile splash screen with animated gradient logo reveal for "AttendEase Faculty." Login screen: centered logo, "Faculty Login", Employee ID and Password rounded pill inputs, gradient "Login" button, biometric fingerprint icon, wave-shaped gradient footer.`
  },
  {
    id: 'b2',
    category: 'Faculty',
    title: 'B2. Faculty Home Dashboard',
    code: 'FACULTY-B2',
    prompt: `Top: "Good Morning, Prof. [Name]" with avatar and bell. Hero card: "Today's Classes" horizontal scroll with "Start Attendance" gradient pill button. Quick stats row (Classes Today, Avg Attendance, Pending Reports). Floating bottom tab bar: Home, Timetable, History, Profile.`
  },
  {
    id: 'b3',
    category: 'Faculty',
    title: 'B3. Start Attendance (Pre-Session)',
    code: 'FACULTY-B3',
    prompt: `Class info card (Subject, Section, Room, student count). Large circular gradient button "Start BLE Broadcast" with pulsing ring animation. Duration slider (5/10/15 min) and "Require Face Verification" switch.`
  },
  {
    id: 'b4',
    category: 'Faculty',
    title: 'B4. Live BLE Broadcasting Monitor',
    code: 'FACULTY-B4',
    prompt: `Large animated radar/pulse graphic (concentric circles emanating from center Bluetooth icon). Live counter "18/45 Students Marked" with progress bar. Real-time scrollable check-in list with slide-in animation, avatar, name, timestamp, "Face Verified / Pending" badge. Red "End Session" pill button.`
  },
  {
    id: 'b5',
    category: 'Faculty',
    title: 'B5. Session Summary',
    code: 'FACULTY-B5',
    prompt: `Success checkmark animation with "Session Completed". Summary card: Present, Absent, %, Duration. Tabbed list "Present" and "Absent" with manual "+ Mark Present" override with reason note. "Save & Submit" and "Export" buttons.`
  },
  {
    id: 'b6',
    category: 'Faculty',
    title: 'B6. Attendance History',
    code: 'FACULTY-B6',
    prompt: `Filter chips (This Week, This Month, Custom, By Subject). List of past sessions with colored progress rings (green/amber/red), tapping opens detailed session view.`
  },
  {
    id: 'b7',
    category: 'Faculty',
    title: 'B7. Faculty Profile',
    code: 'FACULTY-B7',
    prompt: `Profile photo with edit icon, Name, Employee ID, Department. Settings rows: My Subjects, Notifications, BLE Device Settings, Change Password, Help, Logout (red).`
  },
  {
    id: 'c1',
    category: 'Student',
    title: 'C1. Student Splash & Login',
    code: 'STUDENT-C1',
    prompt: `Teal-to-indigo gradient accent. Roll Number/Email + Password fields, gradient "Login" button, "New student? Contact admin" note.`
  },
  {
    id: 'c2',
    category: 'Student',
    title: 'C2. Face Enrollment Onboarding',
    code: 'STUDENT-C2',
    prompt: `3-step onboarding stepper. Step 1: instructions with friendly illustration. Step 2: live camera preview with circular face-guide overlay and corner brackets that turn green on alignment. Step 3: confirmation screen with captured photo and "Confirm & Continue".`
  },
  {
    id: 'c3',
    category: 'Student',
    title: 'C3. Student Home Dashboard',
    code: 'STUDENT-C3',
    prompt: `Greeting with avatar and bell. Hero card "Next Class" with large gradient "Mark Attendance" button (enabled when BLE session detected nearby, otherwise disabled "Waiting for class to start"). Circular semester attendance ring, today's timetable cards, floating tab bar.`
  },
  {
    id: 'c4',
    category: 'Student',
    title: 'C4. BLE Scanning Screen',
    code: 'STUDENT-C4',
    prompt: `Animated searching radar/scanning icon: "Searching for classroom signal...". Status card: "Signal Found: [Subject Name] Room 204" with green check, auto-transitions to Face Recognition. Progress bar and "Cancel" link.`
  },
  {
    id: 'c5',
    category: 'Student',
    title: 'C5. Face Recognition Verification',
    code: 'STUDENT-C5',
    prompt: `Camera preview with soft-edged oval face guide, animated scanning laser line moving up and down. Corner brackets glow green on match. Status text "Hold still... Verifying" -> "Verified!" with confetti burst.`
  },
  {
    id: 'c6',
    category: 'Student',
    title: 'C6. Attendance Confirmation',
    code: 'STUDENT-C6',
    prompt: `Large animated green checkmark with soft glow. "Attendance Marked!" with Subject, Time, Room. Gamified "Streak: 12 days" card. Gradient "Done" button.`
  },
  {
    id: 'c7',
    category: 'Student',
    title: 'C7. Attendance History',
    code: 'STUDENT-C7',
    prompt: `Large circular percentage ring (green >=75%, amber 60-75%, red <60%). Subject filter chips. Session rows with colored badges. Monthly calendar view toggle with color-dotted days.`
  },
  {
    id: 'c8',
    category: 'Student',
    title: 'C8. Session / Lab Booking',
    code: 'STUDENT-C8',
    prompt: `Calendar date picker, selectable pill chips for time slots showing remaining seats (e.g. "3 seats left" in amber). Summary card and "Confirm Booking" button. "My Bookings" tab with QR/reference code cards.`
  },
  {
    id: 'c9',
    category: 'Student',
    title: 'C9. Student Profile',
    code: 'STUDENT-C9',
    prompt: `Profile photo, Name, Roll No, Department/Section. Settings: My Face ID (re-enroll), Notifications, Attendance Report (PDF download), Help, Logout.`
  },
  {
    id: 'd1',
    category: 'Shared',
    title: 'D1. Notifications Screen',
    code: 'SHARED-D1',
    prompt: `Grouped sections: Today, This Week, Earlier. Colored left accent bars (green for attendance, amber for low attendance, indigo for announcements), icon, title, description, timestamp, unread dot.`
  },
  {
    id: 'd2',
    category: 'Shared',
    title: 'D2. Empty & Error States',
    code: 'SHARED-D2',
    prompt: `Line-art illustrations for: "No classes today", "No BLE signal detected", "Face not recognized after 3 attempts", "No attendance history yet". Soft brand gradient colors, headline, supporting message, CTA button.`
  },
  {
    id: 'd3',
    category: 'Shared',
    title: 'D3. Offline / Sync Screen',
    code: 'SHARED-D3',
    prompt: `Top banner in amber with Wi-Fi-off icon: "You're offline — attendance will sync automatically", and "Syncing..." state with small spinner once back online.`
  }
];
