import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  BookOpen,
  Radio,
  Activity,
  BarChart3,
  FileText,
  Sliders,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminAuth } from './AdminAuth';
import { AdminHome } from './AdminHome';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminCourseSetup } from './AdminCourseSetup';
import { AdminRoomBeacon } from './AdminRoomBeacon';
import { AdminLiveOversight } from './AdminLiveOversight';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminLeaveOversight } from './AdminLeaveOversight';
import { AdminAuditLog } from './AdminAuditLog';
import { AdminSettings } from './AdminSettings';
import { AdminProfile } from './AdminProfile';
import { useAppStore } from '../../store/useAppStore';
import { useSessionStore } from '../../store/useSessionStore';

type AdminTab =
  | 'home'
  | 'users'
  | 'courses'
  | 'beacons'
  | 'live'
  | 'analytics'
  | 'leaves'
  | 'audit'
  | 'settings'
  | 'profile';

export const AdminMobileApp: React.FC = () => {
  const navigate = useNavigate();
  const { setNotificationOpen, leaveRequests, facultyLeaveRequests, setRole, syncWithBackend } = useAppStore();
  const { activeSession } = useSessionStore();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    syncWithBackend();
  }, []);

  // Count pending leaves for badge (both student and faculty leaves)
  const pendingLeavesCount =
    leaveRequests.filter(l => l.status === 'pending').length +
    (facultyLeaveRequests || []).filter(l => l.status === 'pending').length;
  const isBroadcasting = activeSession && activeSession.status === 'broadcasting';

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
  };

  const handleSwitchRole = (role: 'student' | 'faculty') => {
    setRole(role);
    navigate(role === 'student' ? '/student' : '/faculty');
  };

  if (!isAuthenticated) {
    return <AdminAuth onLoginSuccess={handleLoginSuccess} />;
  }

  interface NavItem {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: 'Overview', icon: <Home size={15} /> },
    { id: 'users', label: 'Users', icon: <Users size={15} /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen size={15} /> },
    { id: 'beacons', label: 'Beacons', icon: <Radio size={15} /> },
    {
      id: 'live',
      label: 'Live',
      icon: <Activity size={15} />,
      badge: isBroadcasting ? 'Live' : undefined,
      badgeColor: 'bg-emerald-500 text-white animate-pulse'
    },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
    {
      id: 'leaves',
      label: 'Leaves',
      icon: <FileText size={15} />,
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    { id: 'audit', label: 'Audit', icon: <ShieldCheck size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Sliders size={15} /> },
    { id: 'profile', label: 'Profile', icon: <User size={15} /> },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ========================================================
          DESKTOP TOP NAVIGATION BAR (Visible on md and above)
          ======================================================== */}
      <header className="hidden md:flex sticky top-0 z-50 bg-white border-b border-slate-200 px-6 lg:px-10 py-3.5 items-center justify-between shadow-xs">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs">
            <Radio size={18} className="text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 tracking-tight leading-none">
                Smart Attendance
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                Admin
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Academic Administration
            </span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative ${activeTab === item.id
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Live Status Button */}
          {isBroadcasting ? (
            <button
              onClick={() => setActiveTab('live')}
              className="px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-200 transition cursor-pointer animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Broadcast</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('live')}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Sessions</span>
            </button>
          )}

          {/* Quick Role Switchers */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
            <button
              onClick={() => handleSwitchRole('student')}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
              title="Student App"
            >
              Student
            </button>
            <button
              onClick={() => handleSwitchRole('faculty')}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
              title="Faculty App"
            >
              Faculty
            </button>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setNotificationOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell size={16} />
            {pendingLeavesCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          {/* Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={() => setActiveTab('profile')}
              className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-200 cursor-pointer hover:ring-2 hover:ring-amber-400 transition"
              title="Admin Profile"
            >
              AD
            </button>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          MOBILE TOP APP BAR (Visible on screens below md)
          ======================================================== */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Radio size={16} />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 leading-none">Smart Attendance</h2>
            <span className="text-[10px] text-amber-800 font-bold">
              Admin &bull; {navItems.find(i => i.id === activeTab)?.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingLeavesCount > 0 && (
            <button
              onClick={() => setActiveTab('leaves')}
              className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold"
            >
              {pendingLeavesCount} leaves
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-4 space-y-1.5 max-h-[85vh] overflow-y-auto shadow-xl border-b border-slate-200">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${activeTab === item.id
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'text-slate-700 hover:bg-slate-100'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === item.id ? 'text-amber-700' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  onClick={() => handleSwitchRole('student')}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg"
                >
                  Student
                </button>
                <button
                  onClick={() => handleSwitchRole('faculty')}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg"
                >
                  Faculty
                </button>
              </div>

              <button
                onClick={handleSignOut}
                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MAIN CONTENT CONTAINER
          ======================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8">
        {activeTab === 'home' && <AdminHome onNavigateTab={(tab) => setActiveTab(tab as AdminTab)} />}
        {activeTab === 'users' && <AdminUserManagement />}
        {activeTab === 'courses' && <AdminCourseSetup />}
        {activeTab === 'beacons' && <AdminRoomBeacon />}
        {activeTab === 'live' && <AdminLiveOversight />}
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'leaves' && <AdminLeaveOversight />}
        {activeTab === 'audit' && <AdminAuditLog />}
        {activeTab === 'settings' && <AdminSettings />}
        {activeTab === 'profile' && <AdminProfile onSignOut={handleSignOut} />}
      </main>

      {/* ========================================================
          MOBILE BOTTOM DOCK (Below md)
          ======================================================== */}
      <nav className="md:hidden sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        {[
          { id: 'home', label: 'Overview', icon: <Home size={18} /> },
          { id: 'users', label: 'Users', icon: <Users size={18} /> },
          { id: 'live', label: 'Live', icon: <Activity size={18} />, badge: isBroadcasting },
          { id: 'leaves', label: 'Leaves', icon: <FileText size={18} />, badge: pendingLeavesCount > 0 },
          { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
          { id: 'profile', label: 'Profile', icon: <User size={18} /> },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveTab(btn.id as AdminTab)}
            className={`flex flex-col items-center justify-center p-1 relative rounded-xl transition ${activeTab === btn.id
                ? 'text-amber-800 font-bold'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <div className="relative">
              {btn.icon}
              {btn.badge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <span className="text-[10px] mt-0.5">{btn.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
