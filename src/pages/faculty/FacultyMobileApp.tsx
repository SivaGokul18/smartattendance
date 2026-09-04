import React, { useState } from 'react';
import { 
  Home, 
  Calendar, 
  History, 
  User, 
  Radio, 
  Play, 
  Bell, 
  LogOut, 
  Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FacultyHome } from './FacultyHome';
import { FacultyStartSession } from './FacultyStartSession';
import { FacultyLiveMonitor } from './FacultyLiveMonitor';
import { FacultySummary } from './FacultySummary';
import { FacultyHistory } from './FacultyHistory';
import { FacultyProfile } from './FacultyProfile';
import { useAppStore } from '../../store/useAppStore';
import { useSessionStore } from '../../store/useSessionStore';

export const FacultyMobileApp: React.FC = () => {
  const navigate = useNavigate();
  const { selectedFaculty, setNotificationOpen } = useAppStore();
  const { activeSession } = useSessionStore();

  const [activeTab, setActiveTab] = useState<'home' | 'timetable' | 'history' | 'profile'>('home');
  const [activeScreen, setActiveScreen] = useState<'home' | 'start' | 'monitor' | 'summary'>('home');
  const [selectedClassForSession, setSelectedClassForSession] = useState<any>(null);

  const isBroadcasting = activeSession && activeSession.status === 'broadcasting';

  const handleLogout = () => {
    navigate('/login');
  };

  // Handle flow transitions
  const handleStartAttendanceClick = (classInfo: any) => {
    setSelectedClassForSession(classInfo);
    if (activeSession && activeSession.status === 'broadcasting') {
      setActiveScreen('monitor');
    } else {
      setActiveScreen('start');
    }
  };

  const handleBroadcastStarted = () => {
    setActiveScreen('monitor');
  };

  const handleEndSession = () => {
    setActiveScreen('summary');
  };

  const handleSummaryDone = () => {
    setActiveScreen('home');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ========================================================
          DESKTOP TOP NAVIGATION BAR (Visible on md and above)
          ======================================================== */}
      <header className="hidden md:flex sticky top-0 z-50 bg-white border-b border-slate-200 px-6 lg:px-10 py-3.5 items-center justify-between shadow-xs">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#03130E] border border-indigo-500/30 flex items-center justify-center shadow-xs">
            <Radio size={18} className="text-indigo-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 tracking-tight leading-none">
                AttendEase
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                Faculty Workspace
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Dept: {selectedFaculty.department || 'Computer Science'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => {
              setActiveScreen('home');
              setActiveTab('home');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'home' && activeScreen === 'home'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home size={15} />
            <span>Classes</span>
          </button>

          <button
            onClick={() => {
              setActiveScreen('home');
              setActiveTab('timetable');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'timetable'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar size={15} />
            <span>Weekly Schedule</span>
          </button>

          <button
            onClick={() => {
              setActiveScreen('home');
              setActiveTab('history');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History size={15} />
            <span>Rosters & Logs</span>
          </button>

          <button
            onClick={() => {
              setActiveScreen('home');
              setActiveTab('profile');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={15} />
            <span>Faculty Profile</span>
          </button>
        </nav>

        {/* Desktop Quick Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Active BLE Radar Broadcast Status */}
          {isBroadcasting ? (
            <button
              onClick={() => setActiveScreen('monitor')}
              className="px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 hover:bg-emerald-200 transition cursor-pointer animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Broadcasting Live: View Monitor</span>
            </button>
          ) : (
            <button
              onClick={() =>
                handleStartAttendanceClick({
                  subjectName: 'Machine Learning (CS301)',
                  sectionName: 'CSE - 3rd Year - Sec A',
                  room: 'LH-204',
                  expectedStudents: 45,
                  time: '09:00 AM - 10:00 AM',
                })
              }
              className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Play size={13} fill="currentColor" />
              <span>Start Session</span>
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={() => setNotificationOpen(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <Bell size={16} />
          </button>

          {/* User Avatar + Fixed Logout Button */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <img
              src={selectedFaculty.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-indigo-500 shadow-xs"
            />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
              title="Log Out"
            >
              <LogOut size={14} className="text-rose-600 shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          UNIFIED MOBILE STICKY APP HEADER (Single cohesive bar)
          ======================================================== */}
      <header className="md:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
        {/* Left: Avatar + Greeting & Name + Role Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={selectedFaculty.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
              alt={selectedFaculty.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500 shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-900 truncate leading-none">
                {selectedFaculty.name}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[9px] font-bold shrink-0 leading-none">
                Faculty
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
              {selectedFaculty.department || 'Computer Science'} • {selectedFaculty.employeeId || 'FAC-101'}
            </span>
          </div>
        </div>

        {/* Right: Notifications + Exit Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setNotificationOpen(true)}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 flex items-center justify-center transition cursor-pointer relative"
            title="Notifications"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
          </button>
          <button
            onClick={handleLogout}
            className="h-8 px-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
            title="Log Out"
          >
            <LogOut size={13} className="text-rose-600" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          DYNAMIC VIEWPORT CONTENT (Edge-to-edge on mobile)
          ======================================================== */}
      <main className="flex-1 w-full md:max-w-6xl md:mx-auto md:p-6 lg:p-8 flex flex-col min-h-0">
        <div className="flex-1 bg-white md:rounded-3xl md:border md:border-slate-200/90 md:shadow-sm overflow-hidden flex flex-col">
          {activeScreen === 'start' ? (
            <FacultyStartSession
              classInfo={selectedClassForSession}
              onBack={() => setActiveScreen('home')}
              onBroadcastStarted={handleBroadcastStarted}
            />
          ) : activeScreen === 'monitor' ? (
            <FacultyLiveMonitor onEndSession={handleEndSession} />
          ) : activeScreen === 'summary' ? (
            <FacultySummary onDone={handleSummaryDone} />
          ) : activeTab === 'history' ? (
            <FacultyHistory />
          ) : activeTab === 'profile' ? (
            <FacultyProfile />
          ) : activeTab === 'timetable' ? (
            <FacultyHistory />
          ) : (
            <FacultyHome onStartAttendanceClick={handleStartAttendanceClick} />
          )}
        </div>
      </main>

      {/* ========================================================
          MOBILE FLOATING BOTTOM NAV BAR (Fixed & perfectly centered)
          ======================================================== */}
      {activeScreen === 'home' && (
        <div className="md:hidden fixed bottom-3 left-0 right-0 z-40 px-4 max-w-sm mx-auto w-full pointer-events-none">
          <div className="pointer-events-auto px-4 py-2 rounded-full border border-slate-200/90 bg-white/95 shadow-xl backdrop-blur-md flex items-center justify-between">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                activeTab === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Home size={18} />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                activeTab === 'timetable' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar size={18} />
              <span className="text-[10px]">Schedule</span>
            </button>

            {/* Raised Center Action Button: Quick Start BLE */}
            <div className="-mt-6">
              <button
                onClick={() =>
                  handleStartAttendanceClick({
                    subjectName: 'Machine Learning (CS301)',
                    sectionName: 'CSE - 3rd Year - Sec A',
                    room: 'LH-204',
                    expectedStudents: 45,
                    time: '09:00 AM - 10:00 AM',
                  })
                }
                title="Quick Broadcast"
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/35 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ring-4 ring-white cursor-pointer"
              >
                <Radio size={20} className="animate-pulse" />
              </button>
            </div>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                activeTab === 'history' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <History size={18} />
              <span className="text-[10px]">History</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                activeTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User size={18} />
              <span className="text-[10px]">Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyMobileApp;
