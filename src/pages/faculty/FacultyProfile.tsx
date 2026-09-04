import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Camera, 
  BookOpen, 
  Bell, 
  Radio, 
  KeyRound, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  ArrowLeft 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface FacultyProfileProps {
  onLogout?: () => void;
}

export const FacultyProfile: React.FC<FacultyProfileProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { selectedFaculty } = useAppStore();

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/faculty/login');
    }
  };

  const settingsRows = [
    { label: 'My Assigned Subjects', icon: <BookOpen size={16} className="text-indigo-600" /> },
    { label: 'Notification Preferences', icon: <Bell size={16} className="text-violet-600" /> },
    { label: 'BLE Beacon Transmitter Config', icon: <Radio size={16} className="text-emerald-600" /> },
    { label: 'Change Password & Security', icon: <KeyRound size={16} className="text-amber-600" /> },
    { label: 'Help & Faculty Support', icon: <HelpCircle size={16} className="text-slate-500" /> },
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
        <span className="text-[10px] font-mono text-slate-400">Faculty Session Active</span>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center pt-1">
        <div className="relative">
          <img
            src={selectedFaculty.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
            alt={selectedFaculty.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-indigo-500 shadow-md"
          />
          <button
            onClick={() => alert('Profile photo change modal')}
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 text-white shadow-md border-2 border-white hover:scale-105 transition"
          >
            <Camera size={13} />
          </button>
        </div>

        <h3 className="font-extrabold text-base text-slate-900 mt-3">{selectedFaculty.name}</h3>
        <span className="text-xs font-mono font-bold text-indigo-600">
          {selectedFaculty.employeeId}
        </span>
        <span className="text-xs text-slate-500 mt-0.5">{selectedFaculty.department}</span>
      </div>

      {/* Settings Rows with Soft Dividers & Card Elevation in Light Mode */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {settingsRows.map((row, idx) => (
          <button
            key={idx}
            onClick={() => alert(`Opened: ${row.label}`)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100">{row.icon}</div>
              <span className="text-xs font-semibold text-slate-800">{row.label}</span>
            </div>
            <ChevronRight size={15} className="text-slate-400" />
          </button>
        ))}

        {/* Logout Row in Red */}
        <button
          onClick={handleLogoutAction}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50 transition text-rose-600 font-bold"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <LogOut size={16} />
            </div>
            <span className="text-xs">Sign Out to Login (/faculty/login)</span>
          </div>
          <ChevronRight size={15} className="text-rose-400" />
        </button>
      </div>
    </div>
  );
};
