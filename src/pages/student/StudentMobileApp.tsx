import React, { useState } from 'react';
import { 
  Home, 
  Calendar, 
  History, 
  User, 
  Radio, 
  Sparkles, 
  Bell, 
  CheckCircle2, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StudentEnrollment } from './StudentEnrollment';
import { StudentHome } from './StudentHome';
import { StudentBleScan } from './StudentBleScan';
import { StudentFaceVerify } from './StudentFaceVerify';
import { StudentConfirmation } from './StudentConfirmation';
import { StudentHistory } from './StudentHistory';
import { StudentBooking } from './StudentBooking';
import { StudentProfile } from './StudentProfile';
import { useAppStore } from '../../store/useAppStore';
import { useSessionStore } from '../../store/useSessionStore';

export const StudentMobileApp: React.FC = () => {
  const navigate = useNavigate();
  const { selectedStudent, setNotificationOpen } = useAppStore();
  const { activeSession } = useSessionStore();

  const [activeTab, setActiveTab] = useState<'home' | 'booking' | 'history' | 'profile'>('home');
  const [flowState, setFlowState] = useState<
    'normal' | 'enrollment' | 'ble_scan' | 'face_verify' | 'confirmation'
  >('normal');

  const isBleLive = activeSession && activeSession.status === 'broadcasting';

  const handleLogout = () => {
    navigate('/login');
  };

  // Flow handlers
  const handleStartAttendanceFlow = () => {
    setFlowState('ble_scan');
  };

  const handleSignalFound = () => {
    setFlowState('face_verify');
  };

  const handleVerified = () => {
    setFlowState('confirmation');
  };

  const handleConfirmationDone = () => {
    setFlowState('normal');
    setActiveTab('home');
  };

  const handleEnrollmentComplete = () => {
    setFlowState('normal');
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ========================================================
          DESKTOP TOP NAVIGATION BAR (Visible on md and above)
          ======================================================== */}
      <header className="hidden md:flex sticky top-0 z-50 bg-white border-b border-slate-200 px-6 lg:px-10 py-3.5 items-center justify-between shadow-xs">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#04140D] border border-emerald-500/30 flex items-center justify-center shadow-xs">
            <Radio size={18} className="text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 tracking-tight leading-none">
                AttendEase
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-bold">
                Student App
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Roll: {selectedStudent.rollNumber || '2026CS101'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'home'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home size={15} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'booking'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar size={15} />
            <span>Lab Booking</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History size={15} />
            <span>Attendance History</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={15} />
            <span>My Profile</span>
          </button>
        </nav>

        {/* Desktop Quick Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Active BLE Radar Pill */}
          {isBleLive ? (
            <button
              onClick={handleStartAttendanceFlow}
              className="px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 hover:bg-emerald-200 transition cursor-pointer animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Beacon Detected: Mark Attendance</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium flex items-center gap-1.5">
              <Radio size={13} />
              <span>BLE Standby</span>
            </span>
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
              src={selectedStudent.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-teal-500 shadow-xs"
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
              src={selectedStudent.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
              alt={selectedStudent.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-teal-500 shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-900 truncate leading-none">
                {selectedStudent.name}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-[9px] font-bold shrink-0 leading-none">
                Student
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
              Roll: {selectedStudent.rollNumber || '2026CS101'} • Year {selectedStudent.year || 3}
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
          {flowState === 'enrollment' ? (
            <StudentEnrollment onComplete={handleEnrollmentComplete} />
          ) : flowState === 'ble_scan' ? (
            <StudentBleScan
              onSignalFound={handleSignalFound}
              onCancel={() => setFlowState('normal')}
            />
          ) : flowState === 'face_verify' ? (
            <StudentFaceVerify
              onVerified={handleVerified}
              onCancel={() => setFlowState('normal')}
            />
          ) : flowState === 'confirmation' ? (
            <StudentConfirmation onDone={handleConfirmationDone} />
          ) : activeTab === 'booking' ? (
            <StudentBooking />
          ) : activeTab === 'history' ? (
            <StudentHistory />
          ) : activeTab === 'profile' ? (
            <StudentProfile
              onReEnrollFace={() => setFlowState('enrollment')}
            />
          ) : (
            <StudentHome onMarkAttendance={handleStartAttendanceFlow} />
          )}
        </div>
      </main>

      {/* ========================================================
          MOBILE FLOATING BOTTOM NAV BAR (Fixed & perfectly centered)
          ======================================================== */}
      {flowState === 'normal' && (
        <div className="md:hidden fixed bottom-3 left-0 right-0 z-40 px-4 max-w-sm mx-auto w-full pointer-events-none">
          <div className="pointer-events-auto px-4 py-2 rounded-full border border-slate-200/90 bg-white/95 shadow-xl backdrop-blur-md flex items-center justify-between">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                activeTab === 'home' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Home size={18} />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('booking')}
              className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                activeTab === 'booking' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar size={18} />
              <span className="text-[10px]">Labs</span>
            </button>

            {/* Raised Center Action Button */}
            <div className="-mt-6">
              <button
                onClick={handleStartAttendanceFlow}
                title="Quick Attendance"
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 text-white shadow-lg shadow-teal-500/35 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ring-4 ring-white cursor-pointer"
              >
                <Radio size={20} className="animate-pulse" />
              </button>
            </div>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                activeTab === 'history' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <History size={18} />
              <span className="text-[10px]">History</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                activeTab === 'profile' ? 'text-teal-600 font-bold' : 'text-slate-500 hover:text-slate-900'
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

export default StudentMobileApp;
