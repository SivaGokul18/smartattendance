import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Bell, 
  Radio, 
  KeyRound, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Mail,
  User,
  Phone,
  Briefcase,
  Award,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface FacultyProfileProps {
  onLogout?: () => void;
}

const getInitials = (name: string) => {
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 0) return 'FC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const FacultyProfile: React.FC<FacultyProfileProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { selectedFaculty, currentUser } = useAppStore();

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  const facultyName = currentUser?.name || selectedFaculty.name;
  const facultyEmail = currentUser?.email || selectedFaculty.email;
  const employeeId = currentUser?.employeeId || selectedFaculty.employeeId;
  const department = currentUser?.department || selectedFaculty.department;
  const designation = currentUser?.designation || selectedFaculty.designation || 'Faculty';
  const phone = currentUser?.phone || selectedFaculty.phone || 'Not Provided';
  const isMentor = currentUser?.isMentor ?? selectedFaculty.isMentor ?? false;
  const mentorGroup = currentUser?.mentorGroup || selectedFaculty.mentorGroup || 'Unassigned';

  const settingsRows = [
    { label: 'Assigned Subjects & Lectures', icon: <BookOpen size={16} className="text-indigo-600" /> },
    { label: 'Notifications & Alerts', icon: <Bell size={16} className="text-violet-600" /> },
    { label: 'Beacon Transmitter Settings', icon: <Radio size={16} className="text-emerald-600" /> },
    { label: 'Security & Password', icon: <KeyRound size={16} className="text-amber-600" /> },
    { label: 'Campus Support & Helpdesk', icon: <HelpCircle size={16} className="text-slate-500" /> },
  ];

  return (
    <div className="flex-1 p-4 space-y-5 overflow-y-auto pb-24 bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Top action header */}
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faculty Portal</span>
        <button
          onClick={handleLogoutAction}
          className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 transition font-medium cursor-pointer"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center pt-1">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white flex items-center justify-center text-2xl font-black shadow-lg border-2 border-indigo-400 ring-4 ring-indigo-50 overflow-hidden">
            {selectedFaculty.photoUrl ? (
              <img src={selectedFaculty.photoUrl} alt={facultyName} className="w-full h-full object-cover" />
            ) : (
              getInitials(facultyName)
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs shadow-xs font-bold" title="Verified Faculty">
            ✓
          </span>
        </div>

        <div className="mt-3 space-y-0.5">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center justify-center gap-1.5">
            <span>{facultyName}</span>
            <ShieldCheck size={16} className="text-indigo-600 inline" title="Verified Institutional Faculty" />
          </h3>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
            {employeeId}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5 font-medium">
          <Mail size={13} className="text-indigo-600" />
          <span className="font-semibold text-slate-800">{facultyEmail}</span>
        </div>
      </div>

      {/* Official Institutional Excel Roster Record Details Card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-indigo-600" />
            <span>Institutional Profile Details</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
            Roster Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <User size={15} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Full Name</span>
              <span className="font-bold text-slate-800">{facultyName}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <Mail size={15} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Official Email</span>
              <span className="font-bold text-slate-800 truncate block">{facultyEmail}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <Briefcase size={15} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Designation & Dept</span>
              <span className="font-bold text-slate-800">{designation} &bull; {department}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <Phone size={15} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Contact Number</span>
              <span className="font-mono font-bold text-slate-800">{phone}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
            <Award size={15} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Mentorship Assignment</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isMentor ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                  {isMentor ? 'Active Mentor' : 'Faculty Member'}
                </span>
              </div>
              <span className="font-bold text-slate-800 block mt-0.5">
                {isMentor ? `Assigned to: ${mentorGroup}` : 'No active student mentor group assigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Rows */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {settingsRows.map((row, idx) => (
          <button
            key={idx}
            onClick={() => alert(`Opened: ${row.label}`)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
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
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-rose-50 transition text-rose-600 font-bold cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <LogOut size={16} />
            </div>
            <span className="text-xs">Sign Out</span>
          </div>
          <ChevronRight size={15} className="text-rose-400" />
        </button>
      </div>
    </div>
  );
};
