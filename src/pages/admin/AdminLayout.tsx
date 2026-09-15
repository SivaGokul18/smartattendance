import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  Layers, 
  BookOpen, 
  BookmarkCheck, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Sparkles, 
  LogOut, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useThemeStore } from '../../store/useThemeStore';
import { AdminDashboard } from './AdminDashboard';
import { AdminStudents } from './AdminStudents';
import { AdminFaculty } from './AdminFaculty';
import { AdminTimetable } from './AdminTimetable';
import { AdminClassMapping } from './AdminClassMapping';
import { AdminSubjectMapping } from './AdminSubjectMapping';
import { AdminBookings } from './AdminBookings';
import { AdminReports } from './AdminReports';
import { AdminSettings } from './AdminSettings';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { 
    adminActiveTab, 
    setAdminActiveTab, 
    notifications, 
    setNotificationOpen
  } = useAppStore();
  const { theme, toggleTheme } = useThemeStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'students', label: 'Students', icon: <GraduationCap size={18} /> },
    { id: 'faculty', label: 'Faculty', icon: <Users size={18} /> },
    { id: 'timetable', label: 'Timetable', icon: <Calendar size={18} /> },
    { id: 'class-mapping', label: 'Class Mapping', icon: <Layers size={18} /> },
    { id: 'subject-mapping', label: 'Subject Mapping', icon: <BookOpen size={18} /> },
    { id: 'bookings', label: 'Bookings', icon: <BookmarkCheck size={18} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  const handleSignOut = () => {
    navigate('/admin/login');
  };

  const renderActiveScreen = () => {
    switch (adminActiveTab) {
      case 'students': return <AdminStudents />;
      case 'faculty': return <AdminFaculty />;
      case 'timetable': return <AdminTimetable />;
      case 'class-mapping': return <AdminClassMapping />;
      case 'subject-mapping': return <AdminSubjectMapping />;
      case 'bookings': return <AdminBookings />;
      case 'reports': return <AdminReports />;
      case 'settings': return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300">
      {/* Collapsible Left Sidebar with Fixed Viewport Height & Pinned Logout */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between p-4 transition-all duration-300 relative z-30 shadow-xs h-screen sticky top-0`}
      >
        {/* Top Header & Scrollable Nav Area */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
                <Sparkles size={18} />
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-slate-900">Smart Attendance</h1>
                  <span className="text-[10px] text-indigo-600 font-semibold tracking-wider uppercase block">
                    Admin Console
                  </span>
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Toggle Sidebar"
            >
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Links (Scrollable if viewport is compact) */}
          <nav className="space-y-1 overflow-y-auto flex-1 pr-0.5 py-1 min-h-0">
            {navItems.map((item) => {
              const isActive = adminActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAdminActiveTab(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Fixed Pinned Logout Button & Admin Profile */}
        <div className="pt-3 border-t border-slate-100 space-y-2 shrink-0 bg-white mt-auto">
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3.5'
            } py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200/70 cursor-pointer shadow-xs active:scale-[0.98] group`}
            title="Log Out"
          >
            <LogOut size={16} className="text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
            {!isSidebarCollapsed && <span>Log Out</span>}
          </button>

          {!isSidebarCollapsed && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                AD
              </div>
              <div className="flex-1 truncate">
                <span className="text-xs font-bold text-slate-900 block truncate">Administrator</span>
                <span className="text-[10px] text-slate-500 font-mono">admin@smartattendance.edu</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area with Top Bar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Global search (students, faculty, classes, rooms)..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Switch to Faculty or Student App */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 mr-2">
              <Link to="/faculty" className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">
                Faculty App
              </Link>
              <Link to="/student" className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">
                Student App
              </Link>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setNotificationOpen(true)}
              className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition relative"
              title="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1"></div>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center text-xs font-black shadow-xs ring-2 ring-indigo-100 shrink-0">
                SA
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-none">Super Admin</span>
                <span className="text-[10px] text-emerald-600 font-medium">Active Session</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Screen Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-white">
          {renderActiveScreen()}
        </main>
      </div>
    </div>
  );
};
