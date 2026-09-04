import React, { useState } from 'react';
import { 
  Radio, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp,
  Calendar,
  Layers,
  FileSpreadsheet,
  Activity,
  ChevronRight,
  Wifi,
  ScanFace
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useSessionStore } from '../../store/useSessionStore';

interface FacultyHomeProps {
  onStartAttendanceClick: (classInfo: any) => void;
}

export const FacultyHome: React.FC<FacultyHomeProps> = ({ onStartAttendanceClick }) => {
  const { selectedFaculty } = useAppStore();
  const { activeSession } = useSessionStore();
  const [filter, setFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [toolkitFeedback, setToolkitFeedback] = useState<string | null>(null);

  const isBroadcasting = activeSession && activeSession.status === 'broadcasting';

  const todayClasses = [
    {
      id: 'cls-today-1',
      code: 'CS301',
      subjectName: 'Machine Learning (CS301)',
      sectionName: 'CSE - 3rd Year - Sec A',
      time: '09:00 AM - 10:00 AM',
      period: 'morning',
      room: 'LH-204',
      wing: 'North Academic Wing, Floor 2',
      expectedStudents: 45,
      isCurrent: true,
      avatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces'
      ]
    },
    {
      id: 'cls-today-2',
      code: 'CS304',
      subjectName: 'Embedded IoT Systems (CS304)',
      sectionName: 'CSE - 3rd Year - Sec A',
      time: '11:15 AM - 12:15 PM',
      period: 'morning',
      room: 'IoT Lab 102',
      wing: 'Hardware Innovation Block, Floor 1',
      expectedStudents: 45,
      isCurrent: false,
      avatars: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=64&h=64&fit=crop&crop=faces'
      ]
    },
    {
      id: 'cls-today-3',
      code: 'CS302',
      subjectName: 'Mobile & Cloud Computing',
      sectionName: 'CSE - 3rd Year - Sec B',
      time: '02:00 PM - 03:00 PM',
      period: 'afternoon',
      room: 'LH-208',
      wing: 'South Academic Wing, Floor 2',
      expectedStudents: 42,
      isCurrent: false,
      avatars: [
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=faces'
      ]
    },
  ];

  const filteredClasses = todayClasses.filter(cls => {
    if (filter === 'morning') return cls.period === 'morning';
    if (filter === 'afternoon') return cls.period === 'afternoon';
    return true;
  });

  const handleToolkitAction = (actionName: string) => {
    setToolkitFeedback(`${actionName} triggered successfully.`);
    setTimeout(() => setToolkitFeedback(null), 3000);
  };

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
              <linearGradient id="facIhsTitaniumGrad" x1="220" y1="30" x2="360" y2="170" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              {/* Central Silicon Die Gradient */}
              <linearGradient id="facDieTitaniumGrad" x1="250" y1="60" x2="330" y2="140" gradientUnits="userSpaceOnUse">
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
                <rect key={`l-${i}`} x="208" y={y} width="12" height="5" rx="1" />
              ))}
              {/* Right perimeter pins */}
              {[48, 65, 82, 98, 115, 132, 148, 165].map((y, i) => (
                <rect key={`r-${i}`} x="380" y={y} width="12" height="5" rx="1" />
              ))}
              {/* Top perimeter pins */}
              {[236, 252, 268, 284, 300, 316, 332, 348].map((x, i) => (
                <rect key={`t-${i}`} x={x} y="15" width="5" height="12" rx="1" />
              ))}
              {/* Bottom perimeter pins */}
              {[236, 252, 268, 284, 300, 316, 332, 348].map((x, i) => (
                <rect key={`b-${i}`} x={x} y="187" width="5" height="12" rx="1" />
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
              fill="url(#facIhsTitaniumGrad)"
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
              fill="url(#facDieTitaniumGrad)"
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
              2.4 GHz ENGINE
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
              SECURITY ENCLAVE
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-slate-100/80 text-slate-600 border border-slate-200/80 backdrop-blur-md">
              <Calendar size={11} className="text-slate-500 shrink-0" />
              <span>Friday, September 4</span>
            </span>
          </div>

          {/* Mid-Section: Bold Greeting & Subtext */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>Good morning, {selectedFaculty?.name || 'Professor'}</span>
              <span className="text-xl sm:text-2xl">👋</span>
            </h1>

            <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-normal leading-relaxed">
              {selectedFaculty?.department || 'Department of Computer Science'} • ID:{' '}
              <span className="font-mono text-slate-800 font-semibold">{selectedFaculty?.employeeId || 'EMP-2041'}</span>
            </p>
          </div>
        </div>

        {/* Feedback Alert Pill */}
        {toolkitFeedback && (
          <div className="relative z-10 mt-3 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center gap-2 shadow-2xs">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span className="font-medium">{toolkitFeedback}</span>
          </div>
        )}
      </div>

      {/* ========================================================
          2. CLEAN METRIC OVERVIEW CARDS (3 METRICS)
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Attendance Quorum */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dept Avg Quorum</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">91.4%</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp size={13} />
              <span>+3.2% vs last semester</span>
            </div>
            <span className="text-[10px] text-slate-400 block">132 / 144 verified today</span>
          </div>

          {/* SVG Circular Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="25"
                stroke="#E2E8F0"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="25"
                stroke="#2563EB"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={157}
                strokeDashoffset={157 - (157 * 91.4) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-900">91%</span>
          </div>
        </div>

        {/* Metric 2: Scheduled Lectures */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scheduled Sessions</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">3 Lectures</div>
            <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
              <Clock size={13} className="text-slate-400" />
              <span>Next starts at 09:00 AM</span>
            </div>
            <span className="text-[10px] text-slate-400 block">132 enrolled students</span>
          </div>

          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Layers size={22} />
          </div>
        </div>

        {/* Metric 3: Biometric Integrity */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Biometric Integrity</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">99.8%</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck size={13} />
              <span>3D Anti-Spoof Active</span>
            </div>
            <span className="text-[10px] text-slate-400 block">0 false positives detected</span>
          </div>

          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <ScanFace size={22} />
          </div>
        </div>
      </div>

      {/* ========================================================
          3. CLEAN SPOTLIGHT NEXT SESSION CARD
          ======================================================== */}
      <div className="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-7 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Session Details */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                Priority Next Session
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                CSE - 3rd Year - Sec A
              </span>
              {isBroadcasting && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  BROADCAST ACTIVE
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Machine Learning (CS301)
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Unit 4: Supervised Ensemble Models & Gradient Boosting
              </p>
            </div>

            {/* Badges & Coordinates */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Clock size={13} className="text-slate-500 shrink-0" />
                <span className="font-mono font-medium text-slate-800">09:00 AM - 10:00 AM</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <MapPin size={13} className="text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-800">LH-204</span>
                <span className="text-slate-400 hidden sm:inline">(North Academic Wing)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Users size={13} className="text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-800">45 Enrolled</span>
              </div>
            </div>

            {/* Student Avatar Overlap Stack */}
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex -space-x-2 overflow-hidden">
                {todayClasses[0].avatars.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Student"
                    className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">
                45 registered students enrolled in section
              </span>
            </div>
          </div>

          {/* Launch Action Button */}
          <div className="lg:w-68 shrink-0 flex flex-col justify-center">
            {isBroadcasting && activeSession?.subjectName.includes('Machine Learning') ? (
              <button
                onClick={() => onStartAttendanceClick(todayClasses[0])}
                className="w-full py-3.5 px-5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.99] transition cursor-pointer"
              >
                <Radio size={16} />
                <span>View Live Session ({activeSession.checkedInStudentIds.length})</span>
                <ArrowRight size={15} className="ml-auto" />
              </button>
            ) : (
              <button
                onClick={() => onStartAttendanceClick(todayClasses[0])}
                className="w-full py-3.5 px-5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.99] transition cursor-pointer"
              >
                <Play size={15} fill="currentColor" />
                <span>Start Attendance Beacon</span>
                <ArrowRight size={15} className="ml-auto" />
              </button>
            )}
            <p className="text-[11px] text-center text-slate-400 mt-2">
              BLE 5.3 beacon enables touchless face verification for students in room
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. TIMELINE & CLASSROOM TOOLKIT (2 COLS)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT (7 Cols): Schedule Timeline */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Teaching Schedule Timeline
              </h3>
              <p className="text-xs text-slate-500">3 sessions registered for today</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All (3)
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
          <div className="space-y-3">
            {filteredClasses.map((cls) => {
              const isThisActive = isBroadcasting && activeSession?.subjectName.includes(cls.code);
              return (
                <div
                  key={cls.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isThisActive
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : cls.isCurrent
                      ? 'bg-white border-slate-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {cls.code}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">{cls.sectionName}</span>
                    </div>

                    {isThisActive ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        <span>Live Now</span>
                      </span>
                    ) : cls.isCurrent ? (
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        Next in Queue
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 tracking-tight">
                    {cls.subjectName}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-700">{cls.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="text-slate-800 font-medium">{cls.room}</span>
                      <span className="text-slate-400">({cls.wing.split(',')[0]})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-slate-400 shrink-0" />
                      <span>{cls.expectedStudents} Students</span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Mode: <strong className="text-slate-700 font-medium">BLE 5.3 + 3D Liveness</strong>
                    </span>

                    {isThisActive ? (
                      <button
                        onClick={() => onStartAttendanceClick(cls)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Radio size={13} />
                        <span>Live Session ({activeSession.checkedInStudentIds.length})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onStartAttendanceClick(cls)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play size={11} fill="currentColor" />
                        <span>Start Beacon</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT (5 Cols): Faculty Classroom Toolkit */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="px-1">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Classroom & Hardware Toolkit
            </h3>
            <p className="text-xs text-slate-500">Quick actions & diagnostics</p>
          </div>

          <div className="space-y-2.5">
            {/* Tool 1: Export Roster */}
            <div 
              onClick={() => handleToolkitAction('Export Roster (PDF/Excel)')}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition cursor-pointer flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900">Export Daily Attendance</h5>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Download certified PDF/CSV roster with cryptographic timestamps.
                </p>
              </div>
            </div>

            {/* Tool 2: Room Sensor Telemetry */}
            <div 
              onClick={() => handleToolkitAction('Classroom Environmental Telemetry')}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition cursor-pointer flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Activity size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900">Room LH-204 Telemetry</h5>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  BLE Signal RSSI: -42 dBm • 22°C • 45/45 capacity nominal.
                </p>
              </div>
            </div>

            {/* Tool 3: Beacon Push */}
            <div 
              onClick={() => handleToolkitAction('Beacon Proximity Ping')}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition cursor-pointer flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Wifi size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900">Broadcast Test Pulse</h5>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Send test signal to student devices in 15-meter range.
                </p>
              </div>
            </div>
          </div>

          {/* Central Registrar Gateway Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Central Registrar Gateway</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                ONLINE • AES-256
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every verified presence records directly to the central university ledger. No paper roll-calls required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyHome;
