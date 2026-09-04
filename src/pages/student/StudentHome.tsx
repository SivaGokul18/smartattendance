import React, { useState } from 'react';
import { 
  Radio, 
  Clock, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Wifi, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  ScanFace
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useSessionStore } from '../../store/useSessionStore';

interface StudentHomeProps {
  onMarkAttendance: () => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ onMarkAttendance }) => {
  const { selectedStudent } = useAppStore();
  const { activeSession } = useSessionStore();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(3); // Default: Friday 4 (Today)

  const weekDays = [
    { id: 'd-1', day: 'TUE', date: 1, fullDate: 'Tuesday, September 1', isToday: false, status: 'present', attendanceText: '3 of 3 Lectures Attended • 100% Verified' },
    { id: 'd-2', day: 'WED', date: 2, fullDate: 'Wednesday, September 2', isToday: false, status: 'present', attendanceText: '4 of 4 Lectures Attended • 100% Verified' },
    { id: 'd-3', day: 'THU', date: 3, fullDate: 'Thursday, September 3', isToday: false, status: 'present', attendanceText: '3 of 3 Lectures Attended • 100% Verified' },
    { id: 'd-4', day: 'FRI', date: 4, fullDate: 'Friday, September 4', isToday: true, status: 'today', attendanceText: 'Today • 3 Enrolled Sessions • Beacon Live' },
    { id: 'd-5', day: 'SAT', date: 5, fullDate: 'Saturday, September 5', isToday: false, status: 'weekend', attendanceText: 'Weekend Recess • AI Lab Open for Study' },
    { id: 'd-6', day: 'SUN', date: 6, fullDate: 'Sunday, September 6', isToday: false, status: 'weekend', attendanceText: 'Weekend Recess • University Campus Holiday' },
    { id: 'd-7', day: 'MON', date: 7, fullDate: 'Monday, September 7', isToday: false, status: 'upcoming', attendanceText: 'Upcoming Schedule • 3 Lectures Scheduled' },
  ];

  const [filter, setFilter] = useState<'all' | 'morning' | 'afternoon'>('all');

  const isBleSessionLive = activeSession && activeSession.status === 'broadcasting';
  const isAlreadyCheckedIn =
    activeSession && activeSession.checkedInStudentIds.includes(selectedStudent.id);

  const timetableCards = [
    {
      id: 'tt-1',
      code: 'CS301',
      name: 'Machine Learning',
      time: '09:00 AM - 10:00 AM',
      period: 'morning',
      room: 'LH-204',
      wing: 'North Academic Wing, Floor 2',
      faculty: 'Dr. Sarah Jenkins',
      active: true,
      unit: 'Unit 4: Supervised Learning'
    },
    {
      id: 'tt-2',
      code: 'CS302',
      name: 'Cloud Computing & DevOps',
      time: '11:15 AM - 12:15 PM',
      period: 'morning',
      room: 'LH-208',
      wing: 'South Academic Wing, Floor 2',
      faculty: 'Prof. Mark Davis',
      active: false,
      unit: 'Unit 3: Container Orchestration'
    },
    {
      id: 'tt-3',
      code: 'CS304',
      name: 'Embedded IoT & Sensors Lab',
      time: '02:00 PM - 04:00 PM',
      period: 'afternoon',
      room: 'IoT Lab 102',
      wing: 'Hardware Innovation Block, Floor 1',
      faculty: 'Dr. Alan Vance',
      active: false,
      unit: 'Practical: BLE Mesh Networks'
    },
  ];

  const scheduleByDay: Record<number, typeof timetableCards> = {
    // 0: Tue Sep 1
    0: [
      {
        id: 'tt-tue-1',
        code: 'CS301',
        name: 'Machine Learning',
        time: '09:00 AM - 10:00 AM',
        period: 'morning',
        room: 'LH-204',
        wing: 'North Academic Wing, Floor 2',
        faculty: 'Dr. Sarah Jenkins',
        active: false,
        unit: 'Unit 3: Gradient Descent Optimization'
      },
      {
        id: 'tt-tue-2',
        code: 'CS303',
        name: 'Database Management Systems',
        time: '11:15 AM - 12:15 PM',
        period: 'morning',
        room: 'LH-101',
        wing: 'Main Tech Block, Floor 1',
        faculty: 'Prof. Rajesh Kumar',
        active: false,
        unit: 'Unit 4: Transaction Isolation & ACID'
      },
      {
        id: 'tt-tue-3',
        code: 'CS305',
        name: 'Computer Networks & Security',
        time: '02:00 PM - 03:00 PM',
        period: 'afternoon',
        room: 'LH-206',
        wing: 'South Academic Wing, Floor 2',
        faculty: 'Dr. Elena Rostova',
        active: false,
        unit: 'Unit 2: TCP Flow Control & BLE Tokens'
      }
    ],
    // 1: Wed Sep 2
    1: [
      {
        id: 'tt-wed-1',
        code: 'CS302',
        name: 'Cloud Computing & DevOps',
        time: '09:00 AM - 10:00 AM',
        period: 'morning',
        room: 'LH-208',
        wing: 'South Academic Wing, Floor 2',
        faculty: 'Prof. Mark Davis',
        active: false,
        unit: 'Unit 2: Docker Multi-Stage Builds'
      },
      {
        id: 'tt-wed-2',
        code: 'CS306',
        name: 'Full-Stack Web Engineering',
        time: '10:15 AM - 11:15 AM',
        period: 'morning',
        room: 'Lab 304',
        wing: 'Innovation Block, Floor 3',
        faculty: 'Dr. Anita Roy',
        active: false,
        unit: 'Unit 3: Realtime WebSockets & Edge State'
      },
      {
        id: 'tt-wed-3',
        code: 'CS304',
        name: 'Embedded IoT & Sensors Lab',
        time: '01:30 PM - 03:30 PM',
        period: 'afternoon',
        room: 'IoT Lab 102',
        wing: 'Hardware Innovation Block, Floor 1',
        faculty: 'Dr. Alan Vance',
        active: false,
        unit: 'Practical: BLE Advertising & RSSI Filtering'
      }
    ],
    // 2: Thu Sep 3
    2: [
      {
        id: 'tt-thu-1',
        code: 'CS301',
        name: 'Machine Learning',
        time: '09:00 AM - 10:00 AM',
        period: 'morning',
        room: 'LH-204',
        wing: 'North Academic Wing, Floor 2',
        faculty: 'Dr. Sarah Jenkins',
        active: false,
        unit: 'Unit 4: Supervised Classification Foundations'
      },
      {
        id: 'tt-thu-2',
        code: 'CS303',
        name: 'Database Management Systems',
        time: '11:15 AM - 12:15 PM',
        period: 'morning',
        room: 'LH-101',
        wing: 'Main Tech Block, Floor 1',
        faculty: 'Prof. Rajesh Kumar',
        active: false,
        unit: 'Unit 4: Concurrency & B-Tree Indexing'
      },
      {
        id: 'tt-thu-3',
        code: 'CS307',
        name: 'Cyber Physical Systems',
        time: '02:00 PM - 03:30 PM',
        period: 'afternoon',
        room: 'LH-205',
        wing: 'North Academic Wing, Floor 2',
        faculty: 'Dr. Vikram Seth',
        active: false,
        unit: 'Unit 3: Sensor Fusion & Gateway Relays'
      }
    ],
    // 3: Fri Sep 4 (Today)
    3: timetableCards,
    // 4: Sat Sep 5 (Weekend)
    4: [],
    // 5: Sun Sep 6 (Weekend)
    5: [],
    // 6: Mon Sep 7 (Upcoming)
    6: [
      {
        id: 'tt-mon-1',
        code: 'CS301',
        name: 'Machine Learning',
        time: '09:00 AM - 10:00 AM',
        period: 'morning',
        room: 'LH-204',
        wing: 'North Academic Wing, Floor 2',
        faculty: 'Dr. Sarah Jenkins',
        active: false,
        unit: 'Unit 5: Neural Networks & Backpropagation'
      },
      {
        id: 'tt-mon-2',
        code: 'CS302',
        name: 'Cloud Computing & DevOps',
        time: '11:15 AM - 12:15 PM',
        period: 'morning',
        room: 'LH-208',
        wing: 'South Academic Wing, Floor 2',
        faculty: 'Prof. Mark Davis',
        active: false,
        unit: 'Unit 4: Kubernetes Pod Autoscaling'
      },
      {
        id: 'tt-mon-3',
        code: 'CS304',
        name: 'Embedded IoT & Sensors Lab',
        time: '02:00 PM - 04:00 PM',
        period: 'afternoon',
        room: 'IoT Lab 102',
        wing: 'Hardware Innovation Block, Floor 1',
        faculty: 'Dr. Alan Vance',
        active: false,
        unit: 'Practical: BLE Mesh Sensor Telemetry'
      }
    ]
  };

  const currentSchedule = scheduleByDay[selectedDayIndex] ?? timetableCards;
  const filteredSchedule = currentSchedule.filter(item => {
    if (filter === 'morning') return item.period === 'morning';
    if (filter === 'afternoon') return item.period === 'afternoon';
    return true;
  });

  return (
    <div className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-32 md:pb-8 bg-[#F8FAFC] text-slate-900 overflow-y-auto space-y-6">
      {/* ========================================================
          1. CLEAN LIGHT PLATINUM / WHITE SEMICONDUCTOR DASHBOARD CARD
          - Layer 1: Clean Light Platinum / White background (#FFFFFF / #F8FAFC)
          - Lift: Soft cool-slate radial glow behind chip
          - Layer 2 & 3: Detailed dark titanium/slate microchip in TOP-RIGHT quadrant + outward circuit traces
          - Layer 4: Light gradient shield overlay ONLY on left two-thirds to protect text readability
          - Layer 5: Foreground UI text and frosted glass status panel
          ======================================================== */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-4 sm:p-7 text-slate-900 shadow-xl shadow-slate-200/60">
        
        {/* Layer 1b: Soft radial lift glow directly behind the chip in top-right quadrant */}
        <div 
          className="absolute -top-3 -right-3 sm:top-0 sm:right-0 w-[180px] sm:w-[320px] md:w-[420px] h-[150px] sm:h-[240px] md:h-[300px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 75% 35%, rgba(148, 163, 184, 0.16) 0%, rgba(203, 213, 225, 0.06) 45%, transparent 70%)'
          }}
        />

        {/* ========================================================
            LAYERS 2 & 3: DETAILED DARK TITANIUM MICROCHIP & TRACES
            - Mobile-responsive sizing: w-[150px] on mobile, scaling up to w-[420px] on desktop
            - Positioned in top-right quadrant without overlapping text
            ======================================================== */}
        <div className="absolute -top-2 -right-2 sm:top-0 sm:right-0 w-[150px] sm:w-[280px] md:w-[420px] h-[130px] sm:h-[200px] md:h-[260px] pointer-events-none select-none opacity-45 sm:opacity-75 md:opacity-80 transition-all duration-300">
          <svg
            viewBox="0 0 430 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              {/* Stepped Heat Spreader (IHS) Dark Titanium Gradient */}
              <linearGradient id="stuIhsTitaniumGrad" x1="220" y1="30" x2="360" y2="170" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              {/* Central Silicon Die Gradient */}
              <linearGradient id="stuDieTitaniumGrad" x1="250" y1="60" x2="330" y2="140" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>

            {/* Layer 2: Circuit Traces (Dark Slate #475569, Crisp Trace Paths) */}
            <g stroke="#475569" strokeOpacity="0.45" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              {/* Bus traces radiating leftward across the card */}
              <path d="M 208 65 L 150 65 L 115 30 L 15 30" />
              <path d="M 208 82 L 160 82 L 130 52 L 35 52" />
              <path d="M 208 98 L 140 98 L 105 133 L 10 133" />
              <path d="M 208 115 L 130 115 L 95 150 L 15 150" />
              <path d="M 208 132 L 155 132 L 120 168 L 25 168" />
              <path d="M 208 148 L 170 148 L 140 185 L 50 185" />
              <path d="M 208 165 L 185 165 L 150 205 L 70 205" />

              {/* Traces radiating downward toward bottom status bar */}
              <path d="M 252 195 L 252 225 L 225 252 L 160 252" />
              <path d="M 284 195 L 284 235 L 305 255 L 355 255" />
              <path d="M 316 195 L 316 228 L 340 252 L 400 252" />

              {/* Traces radiating upward & rightward toward card border */}
              <path d="M 252 15 L 252 6 L 240 2 L 180 2" />
              <path d="M 316 15 L 316 6 L 330 2 L 390 2" />
              <path d="M 392 65 L 425 65" />
              <path d="M 392 98 L 428 98" />
              <path d="M 392 132 L 425 132" />
              <path d="M 392 165 L 428 165" />
            </g>

            {/* Solder Trace Junction Nodes */}
            <g fill="#475569" fillOpacity="0.55">
              <circle cx="150" cy="65" r="2" />
              <circle cx="115" cy="30" r="2" />
              <circle cx="160" cy="82" r="2" />
              <circle cx="140" cy="98" r="2" />
              <circle cx="105" cy="133" r="2" />
              <circle cx="130" cy="115" r="2" />
              <circle cx="155" cy="132" r="2" />
              <circle cx="252" cy="225" r="2" />
              <circle cx="284" cy="235" r="2" />
              <circle cx="316" cy="228" r="2" />
            </g>

            {/* Layer 3: Chip Illustration */}
            {/* Pins / Leads along 4 perimeters (Titanium Steel #475569) */}
            <g fill="#475569" fillOpacity="0.9">
              {/* Left perimeter pins */}
              {[48, 65, 82, 98, 115, 132, 148, 165].map((y, i) => (
                <rect key={`sl-${i}`} x="208" y={y} width="12" height="5" rx="1" />
              ))}
              {/* Right perimeter pins */}
              {[48, 65, 82, 98, 115, 132, 148, 165].map((y, i) => (
                <rect key={`sr-${i}`} x="380" y={y} width="12" height="5" rx="1" />
              ))}
              {/* Top perimeter pins */}
              {[236, 252, 268, 284, 300, 316, 332, 348].map((x, i) => (
                <rect key={`st-${i}`} x={x} y="15" width="5" height="12" rx="1" />
              ))}
              {/* Bottom perimeter pins */}
              {[236, 252, 268, 284, 300, 316, 332, 348].map((x, i) => (
                <rect key={`sb-${i}`} x={x} y="187" width="5" height="12" rx="1" />
              ))}
            </g>

            {/* Silicon Substrate Base Package */}
            <rect
              x="220"
              y="27"
              width="160"
              height="160"
              rx="12"
              fill="#1E2430"
              stroke="#64748B"
              strokeWidth="1.5"
            />

            {/* Pin 1 Index Notch (Top-Left Bevel + Silver Marker Dot) */}
            <polygon points="222,29 238,29 222,45" fill="#64748B" fillOpacity="0.5" />
            <circle cx="236" cy="43" r="3" fill="#E2E8F0" />

            {/* Integrated Heat Spreader (IHS) - Dark Titanium Metal */}
            <rect
              x="238"
              y="45"
              width="124"
              height="124"
              rx="9"
              fill="url(#stuIhsTitaniumGrad)"
              stroke="#64748B"
              strokeWidth="1.2"
            />
            {/* IHS Chamfer Inner Contour */}
            <rect
              x="244"
              y="51"
              width="112"
              height="112"
              rx="6"
              fill="none"
              stroke="#0F172A"
              strokeWidth="1.5"
            />

            {/* Central Silicon Die Core */}
            <rect
              x="258"
              y="65"
              width="84"
              height="84"
              rx="5"
              fill="url(#stuDieTitaniumGrad)"
              stroke="#64748B"
              strokeWidth="1.2"
            />

            {/* Laser-Etched Markings (Silver / White on Dark Die) */}
            <text
              x="300"
              y="93"
              fill="#FFFFFF"
              fontSize="8.5"
              fontFamily="monospace"
              fontWeight="800"
              textAnchor="middle"
              letterSpacing="2"
            >
              BLE-5300
            </text>
            <text
              x="300"
              y="107"
              fill="#CBD5E1"
              fontSize="6"
              fontFamily="monospace"
              fontWeight="600"
              textAnchor="middle"
              letterSpacing="1"
            >
              TOUCHLESS ENGINE
            </text>
            <text
              x="300"
              y="119"
              fill="#94A3B8"
              fontSize="5"
              fontFamily="monospace"
              textAnchor="middle"
              letterSpacing="0.8"
            >
              TOKEN ENCLAVE
            </text>

            {/* Micro-Circuit Logic Core Grid inside the Die */}
            <g stroke="#94A3B8" strokeOpacity="0.7" strokeWidth="0.8" fill="rgba(255, 255, 255, 0.08)">
              <rect x="272" y="126" width="16" height="11" rx="1.5" />
              <rect x="292" y="126" width="16" height="11" rx="1.5" />
              <rect x="312" y="126" width="16" height="11" rx="1.5" />
            </g>
          </svg>
        </div>

        {/* ========================================================
            LAYER 4: LIGHT GRADIENT OVERLAY ONLY ON LEFT TWO-THIRDS
            - Protects text readability with smooth light shield
            - Leaves top-right chip area crisp and completely unobstructed
            ======================================================== */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, #FFFFFF 0%, rgba(255, 255, 255, 0.98) 50%, rgba(255, 255, 255, 0.7) 72%, rgba(255, 255, 255, 0.15) 85%, transparent 100%)'
          }}
        />

        {/* ========================================================
            LAYER 5: FOREGROUND UI TEXT (FULLY OPAQUE, RESPONSIVE)
            ======================================================== */}
        <div className="relative z-10 space-y-3 sm:space-y-4 max-w-[80%] sm:max-w-[70%] md:max-w-none pr-2 sm:pr-0">
          {/* Top-Left: Date Badge */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-slate-100/90 text-slate-600 border border-slate-200/80 backdrop-blur-md">
              <Calendar size={11} className="text-slate-500 shrink-0" />
              <span>Friday, September 4</span>
            </span>
          </div>

          {/* Mid-Section: Bold Greeting & Subtext */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>Hello, {selectedStudent?.name || 'Student'}</span>
              <span className="text-xl sm:text-2xl">👋</span>
            </h1>

            <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-normal leading-relaxed">
              Roll No: <span className="font-mono text-slate-800 font-semibold">{selectedStudent?.rollNumber || '22CSE041'}</span> •{' '}
              <span>{selectedStudent?.department || 'Computer Science & Engineering'} • Year {selectedStudent?.year || 3}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          7-DAY WEEKLY CALENDAR STRIP (BELOW PROFILE CARD)
          - Rounded day pills matching the reference design
          - Friday 4 active by default in vibrant purple with white text & white centered dot
          - Clean unselected day cards with crisp white background, subtle border & shadow
          - Interactive day selection with instant contextual status updates
          ======================================================== */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#F2F4FD] border border-slate-200/80 p-3.5 sm:p-5 shadow-xs">
        {/* Calendar Header: Month + Week + Today Action */}
        <div className="flex items-center justify-between mb-3.5 px-0.5">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-[#7052F2] shadow-2xs">
              <Calendar size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  September 2026
                </h3>
                <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 hidden sm:inline-block">
                  Week 1
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Weekly attendance tracking & lecture roster
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedDayIndex !== 3 && (
              <button
                type="button"
                onClick={() => setSelectedDayIndex(3)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white text-[#7052F2] border border-[#7052F2]/30 hover:bg-[#7052F2]/5 transition cursor-pointer shadow-2xs"
              >
                Back to Today
              </button>
            )}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 text-xs shadow-2xs">
              <span className="px-2 py-0.5 font-bold text-[11px] text-slate-700">
                7 Days View
              </span>
            </div>
          </div>
        </div>

        {/* 7 Days Row */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {weekDays.map((item, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`group flex flex-col items-center justify-center py-3 sm:py-4 px-1 sm:px-2 rounded-2xl sm:rounded-[20px] transition-all duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#7052F2] text-white shadow-md shadow-[#7052F2]/30 -translate-y-0.5 ring-2 ring-[#7052F2]/20'
                    : 'bg-white text-slate-800 border border-slate-100 hover:border-slate-300 hover:bg-slate-50/90 shadow-2xs'
                }`}
              >
                {/* Day Abbreviation */}
                <span
                  className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                    isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {item.day}
                </span>

                {/* Date Number */}
                <span
                  className={`text-base sm:text-xl font-bold mt-1 ${
                    isSelected ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {item.date}
                </span>

                {/* Dot Indicator under the number (matching reference image) */}
                <div className="h-2 flex items-center justify-center mt-1 sm:mt-1.5">
                  {isSelected ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-fade-in" />
                  ) : item.status === 'present' ? (
                    <span className="w-1 h-1 rounded-full bg-emerald-500/70" title="Present" />
                  ) : (
                    <span className="w-1.5 h-1.5 opacity-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Status Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs px-1">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="font-semibold text-slate-900">{weekDays[selectedDayIndex].fullDate}:</span>
            <span className="text-slate-500">{weekDays[selectedDayIndex].attendanceText}</span>
          </div>

          {selectedDayIndex === 3 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Active Lecture Day
            </span>
          ) : weekDays[selectedDayIndex].status === 'present' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-emerald-700 border border-emerald-200 shadow-2xs">
              <CheckCircle2 size={11} className="text-emerald-600" />
              Verified Present
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-600 border border-slate-200/80 shadow-2xs">
              {weekDays[selectedDayIndex].status === 'weekend' ? 'Campus Recess' : 'Scheduled'}
            </span>
          )}
        </div>
      </div>

      {/* ========================================================
          2. COMPACT LIGHT SPOTLIGHT CURRENT / NEXT CLASS CARD
          - Light delicate border: border-slate-200/50
          - Lesser compact size: streamlined padding p-4 sm:p-5, compact pills & badges
          - Bespoke light RF beacon wave pattern & tech lattice
          ======================================================== */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#F8FAFE] via-[#FFFFFF] to-[#F1F5FD] border border-slate-200/50 p-4 sm:p-5 shadow-xs transition-all duration-300">
        {/* Layer 1: Subtle Ambient Radial Soft Glow */}
        <div 
          className="absolute -top-10 -right-10 sm:top-0 sm:right-0 w-[200px] sm:w-[280px] h-[160px] sm:h-[200px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(99, 102, 241, 0.08) 0%, rgba(56, 189, 248, 0.05) 45%, transparent 70%)'
          }}
        />

        {/* Layer 2: Unique Bespoke SVG Background Pattern */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <svg
            viewBox="0 0 900 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-cover"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="spotWaveGradLight" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.16" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.01" />
              </linearGradient>

              <linearGradient id="spotSineGradLight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.0" />
                <stop offset="30%" stopColor="#6366F1" stopOpacity="0.10" />
                <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.0" />
              </linearGradient>

              <pattern id="spotGridPatternLight" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="11" cy="11" r="0.9" fill="#6366F1" fillOpacity="0.045" />
                <path d="M 22 0 L 22 22 M 0 22 L 22 22" fill="none" stroke="#6366F1" strokeWidth="0.4" strokeOpacity="0.018" />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#spotGridPatternLight)" />

            {/* Dynamic RF Sine Waves */}
            <path
              d="M 0 110 Q 150 60, 300 95 T 600 85 T 900 110"
              fill="none"
              stroke="url(#spotSineGradLight)"
              strokeWidth="1.4"
            />
            <path
              d="M 0 125 Q 200 80, 400 115 T 800 100 T 1000 130"
              fill="none"
              stroke="url(#spotSineGradLight)"
              strokeWidth="1.0"
              strokeDasharray="5 4"
              opacity="0.5"
            />

            {/* Radiating Concentric Beacon Waves from Right Beacon Node */}
            <g transform="translate(780, 80)" stroke="url(#spotWaveGradLight)" fill="none">
              <circle r="32" strokeWidth="1" strokeOpacity="0.3" />
              <circle r="68" strokeWidth="1" strokeOpacity="0.22" strokeDasharray="4 4" />
              <circle r="115" strokeWidth="1.1" strokeOpacity="0.18" />
              <circle r="170" strokeWidth="0.9" strokeOpacity="0.12" strokeDasharray="6 5" />
              <circle r="235" strokeWidth="0.8" strokeOpacity="0.08" />
              <circle r="310" strokeWidth="0.7" strokeOpacity="0.05" strokeDasharray="10 6" />
            </g>

            {/* Technical Framing Corner Accents */}
            <path d="M 14 24 L 14 14 L 24 14" stroke="#6366F1" strokeWidth="1.2" strokeOpacity="0.2" strokeLinecap="round" />
            <path d="M 14 176 L 14 186 L 24 186" stroke="#6366F1" strokeWidth="1.2" strokeOpacity="0.2" strokeLinecap="round" />
            <circle cx="17" cy="17" r="1" fill="#6366F1" fillOpacity="0.25" />
          </svg>
        </div>

        {/* Layer 3: Light Gradient Soft Shield */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.90) 50%, rgba(255, 255, 255, 0.55) 80%, rgba(255, 255, 255, 0.2) 100%)'
          }}
        />

        {/* Foreground Content - Compact Spacing */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5">
          {/* Session Details */}
          <div className="space-y-2.5 flex-1 min-w-0">
            {/* Top Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#6366F1] text-white shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                CURRENT SESSION
              </span>

              {isAlreadyCheckedIn ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-slate-200/50 shadow-2xs backdrop-blur-sm">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  VERIFIED TODAY
                </span>
              ) : isBleSessionLive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-slate-200/50 shadow-2xs backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  BEACON IN RANGE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-white/90 text-slate-700 border border-slate-200/50 shadow-2xs backdrop-blur-sm">
                  <Radio size={11} className="text-indigo-600" />
                  STANDBY • STARTS AT 09:00 AM
                </span>
              )}

              {/* Telemetry Tag */}
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono text-indigo-600/70 bg-indigo-50/50 border border-slate-200/40">
                BLE-5.3 // LH-204
              </span>
            </div>

            {/* Subject Title & Instructor */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {isBleSessionLive ? activeSession.subjectName : 'Machine Learning (CS301)'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span>Instructor:</span>
                <strong className="text-slate-800 font-semibold">
                  {isBleSessionLive ? activeSession.facultyName : 'Dr. Sarah Jenkins'}
                </strong>
                <span className="text-slate-400 hidden sm:inline">• Unit 4: Supervised Classification</span>
              </p>
            </div>

            {/* Badges & Coordinates */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Time */}
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-2xs">
                <div className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Clock size={11} />
                </div>
                <span className="font-mono text-xs font-semibold text-slate-800">09:00 AM - 10:00 AM</span>
              </div>

              {/* Room & Wing */}
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-2xs">
                <div className="w-5 h-5 rounded bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <MapPin size={11} />
                </div>
                <span className="font-semibold text-xs text-slate-800">
                  {isBleSessionLive ? activeSession.room : 'LH-204'}
                </span>
                <span className="text-slate-400 hidden sm:inline text-[11px]">(North Wing)</span>
              </div>

              {/* Security Verification Protocol */}
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-2xs">
                <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={11} />
                </div>
                <span className="font-medium text-xs text-emerald-900">Touchless BLE + Face</span>
              </div>
            </div>
          </div>

          {/* Action / Beacon Status Box - Compact */}
          <div className="lg:w-64 shrink-0 flex flex-col justify-center">
            {isAlreadyCheckedIn ? (
              <div className="p-3 sm:p-4 rounded-xl bg-white/90 border border-slate-200/50 text-center space-y-1 shadow-2xs backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 size={16} />
                </div>
                <div className="text-emerald-800 font-bold text-xs sm:text-sm">Marked Present</div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Verified today at 09:04 AM via BLE 5.3.
                </p>
              </div>
            ) : isBleSessionLive ? (
              <button
                onClick={onMarkAttendance}
                className="group w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:from-[#4F46E5] hover:to-[#6D28D9] flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                <ScanFace size={16} className="group-hover:scale-110 transition-transform" />
                <span>Mark Attendance</span>
                <ArrowRight size={14} className="ml-auto group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <div className="p-3 sm:p-3.5 rounded-xl bg-white/85 border border-slate-200/50 text-center space-y-1.5 shadow-2xs backdrop-blur-md relative overflow-hidden group hover:border-slate-300 transition">
                {/* Micro Antenna Wave Radar */}
                <div className="w-9 h-9 rounded-xl bg-indigo-50/80 border border-indigo-100/60 flex items-center justify-center mx-auto text-indigo-600 relative">
                  <Radio size={16} className="relative z-10" />
                  <span className="absolute inset-0 rounded-xl bg-indigo-400/20 animate-ping" />
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1">
                    <span>Awaiting Lecture Beacon</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    Faculty transmits in LH-204 at start.
                  </p>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-center gap-1 text-[9px] font-mono text-indigo-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>LISTENING ON 2.4 GHz</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          3. TIMETABLE SCHEDULE (FULL-WIDTH)
          ======================================================== */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Class Schedule
            </h3>
            <p className="text-xs text-slate-500">{filteredSchedule.length} enrolled sessions</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({currentSchedule.length})
            </button>
            <button
              onClick={() => setFilter('morning')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'morning' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Morning
            </button>
            <button
              onClick={() => setFilter('afternoon')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'afternoon' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Afternoon
            </button>
          </div>
        </div>

        {/* Cards */}
        {filteredSchedule.length > 0 ? (
          <div className="space-y-3">
            {filteredSchedule.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  item.active
                    ? 'bg-white border-slate-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {item.code}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">{item.unit}</span>
                  </div>

                  {item.active ? (
                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      Current Slot
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Upcoming
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900 tracking-tight">
                  {item.name}
                </h4>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-700">{item.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-medium">{item.room}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Faculty:</span>
                    <span className="text-slate-700 font-medium">{item.faculty}</span>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Location: <strong className="text-slate-700 font-medium">{item.wing}</strong>
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Enrolled
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
            <Calendar size={28} className="mx-auto text-slate-400" />
            <h4 className="text-sm font-bold text-slate-800">No Lectures Scheduled</h4>
            <p className="text-xs text-slate-500">
              Campus research labs and library study halls are open today.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHome;
