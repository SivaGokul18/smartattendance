import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Building2, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Radio,
  Sliders,
  ChevronRight,
  Bell,
  KeyRound,
  HelpCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface AdminProfileProps {
  onSignOut?: () => void;
}

const getInitials = (name?: string) => {
  if (!name) return 'AD';
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 0) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const AdminProfile: React.FC<AdminProfileProps> = ({ onSignOut }) => {
  const { currentUser } = useAppStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const privileges = [
    { title: 'Roster Management', desc: 'Add, update, or remove student and faculty records.', active: true },
    { title: 'Beacon Transmitter Range', desc: 'Adjust Bluetooth beacon power levels across classrooms.', active: true },
    { title: 'Leave Approvals', desc: 'Authorize or reject pending leave requests.', active: true },
    { title: 'Registrar Sync', desc: 'Sync attendance data directly with institutional database.', active: true },
    { title: 'Audit Trail', desc: 'Review immutable system logs and activity records.', active: true },
  ];

  const recentLogins = [
    { timestamp: 'Today, 09:00 AM', device: 'Admin Console (Windows 11)', status: 'Active' },
    { timestamp: 'Yesterday, 08:45 AM', device: 'Admin Console (Windows 11)', status: 'Ended' },
    { timestamp: '05 Sep 2026, 02:10 PM', device: 'Mobile Browser (iOS 18)', status: 'Ended' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xl flex items-center justify-center shrink-0 overflow-hidden">
              {currentUser?.photoUrl ? (
                <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(currentUser?.name)
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Administrator</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {currentUser?.name || 'Academic Administration'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {currentUser?.email || 'admin@institution.edu'} &bull; {currentUser?.department || 'Office of Academic Affairs'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onSignOut) {
                onSignOut();
              } else {
                showToast('Signed out of admin console');
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-bold transition active:scale-95 self-start md:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Status badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Security Level</span>
            <div className="font-bold text-emerald-700 mt-0.5">MFA Active</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Session Status</span>
            <div className="font-bold text-slate-800 mt-0.5">Verified</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Access Scope</span>
            <div className="font-bold text-amber-700 mt-0.5">Full Access</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Role</span>
            <div className="font-bold text-slate-900 mt-0.5">Super Admin</div>
          </div>
        </div>
      </div>

      {/* Grid: Granted Privileges & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Privileges (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">
              System Permissions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Access permissions associated with your administrator role.
            </p>
          </div>

          <div className="space-y-2.5">
            {privileges.map((p, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{p.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Logins (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Recent Logins</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Recent device access for this account.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              {recentLogins.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{item.device}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{item.timestamp}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => showToast('Encryption keys updated')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Rotate Beacon Security Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
