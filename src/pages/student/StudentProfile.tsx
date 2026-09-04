import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Camera, 
  ScanFace, 
  Bell, 
  FileText, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  ShieldCheck,
  ArrowLeft 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface StudentProfileProps {
  onReEnrollFace?: () => void;
  onLogout?: () => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ onReEnrollFace, onLogout }) => {
  const navigate = useNavigate();
  const { selectedStudent } = useAppStore();

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/student/login');
    }
  };

  const settingsRows = [
    {
      label: 'My Face ID Biometrics',
      sub: 'Enrolled & Verified (Cosine 98%)',
      icon: <ScanFace size={16} className="text-teal-600" />,
      action: onReEnrollFace || (() => alert('Face ID re-enrollment flow')),
    },
    {
      label: 'Notification Preferences',
      sub: 'Class alerts & reminders',
      icon: <Bell size={16} className="text-indigo-600" />,
      action: () => alert('Notification settings'),
    },
    {
      label: 'Semester Attendance Report',
      sub: 'Download PDF Transcript',
      icon: <FileText size={16} className="text-emerald-600" />,
      action: () => alert('Downloading Attendance Transcript PDF...'),
    },
    {
      label: 'Help & Campus Support',
      sub: 'IT desk & beacon issues',
      icon: <HelpCircle size={16} className="text-slate-500" />,
      action: () => alert('Campus IT Desk: support@attendease.edu'),
    },
  ];

  return (
    <div className="flex-1 p-4 space-y-6 overflow-y-auto pb-24 bg-white text-slate-900">
      {/* Top action header */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleLogoutAction}
          className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 transition font-medium cursor-pointer"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
        <span className="text-[10px] font-mono text-slate-400">Student Profile</span>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center pt-1">
        <div className="relative">
          <img
            src={selectedStudent.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
            alt={selectedStudent.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-teal-500 shadow-md"
          />
          <button
            onClick={onReEnrollFace}
            title="Update Face Profile"
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-teal-600 text-white shadow-md border-2 border-white hover:scale-105 transition"
          >
            <Camera size={13} />
          </button>
        </div>

        <h3 className="font-extrabold text-base text-slate-900 mt-3">{selectedStudent.name}</h3>
        <span className="text-xs font-mono font-bold text-teal-600">
          {selectedStudent.rollNumber}
        </span>
        <span className="text-xs text-slate-500 mt-0.5">
          {selectedStudent.department} • Year {selectedStudent.year} (Sec {selectedStudent.section})
        </span>

        <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
          <ShieldCheck size={13} />
          <span>Face ID Status: Enrolled</span>
        </div>
      </div>

      {/* Settings Rows with Soft Dividers & Card Elevation in Light Mode */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {settingsRows.map((row, idx) => (
          <button
            key={idx}
            onClick={row.action}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100">{row.icon}</div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">{row.label}</span>
                <span className="text-[10px] text-slate-500">{row.sub}</span>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-400" />
          </button>
        ))}

        {/* Logout Row in Red */}
        <button
          onClick={handleLogoutAction}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50 transition text-rose-600 font-bold cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <LogOut size={16} />
            </div>
            <span className="text-xs">Sign Out to Login (/student/login)</span>
          </div>
          <ChevronRight size={15} className="text-rose-400" />
        </button>
      </div>
    </div>
  );
};
