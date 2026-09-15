import React, { useState } from 'react';
import { X, Check, Users, GraduationCap, Briefcase, Shield, Mail, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { OFFICIAL_ROSTER_ACCOUNTS, RosterAccount } from '../../lib/rosterAccounts';

interface RosterAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: RosterAccount) => void;
}

export const RosterAccountsModal: React.FC<RosterAccountsModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [filterRole, setFilterRole] = useState<'all' | 'faculty' | 'student' | 'admin'>('all');

  if (!isOpen) return null;

  const filtered = OFFICIAL_ROSTER_ACCOUNTS.filter(
    (acc) => filterRole === 'all' || acc.role === filterRole
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Institutional Roster Accounts</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Excel Sheet
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Only these verified email IDs are permitted to log in. Click any card to auto-fill credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-3 pb-2 flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterRole === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users size={13} />
            <span>All ({OFFICIAL_ROSTER_ACCOUNTS.length})</span>
          </button>
          <button
            onClick={() => setFilterRole('student')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterRole === 'student'
                ? 'bg-teal-50 text-teal-800 shadow-xs border border-teal-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap size={13} />
            <span>Students (5)</span>
          </button>
          <button
            onClick={() => setFilterRole('faculty')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterRole === 'faculty'
                ? 'bg-indigo-50 text-indigo-800 shadow-xs border border-indigo-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase size={13} />
            <span>Faculty (4)</span>
          </button>
          <button
            onClick={() => setFilterRole('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterRole === 'admin'
                ? 'bg-purple-50 text-purple-800 shadow-xs border border-purple-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield size={13} />
            <span>Admin (1)</span>
          </button>
        </div>

        {/* Scrollable Accounts List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filtered.map((acc) => {
            const isStu = acc.role === 'student';
            const isFac = acc.role === 'faculty';
            const roleColor = isStu
              ? 'border-teal-200 hover:border-teal-400 bg-teal-50/20'
              : isFac
              ? 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/20'
              : 'border-purple-200 hover:border-purple-400 bg-purple-50/20';

            const badgeBg = isStu
              ? 'bg-teal-50 text-teal-700 border-teal-200'
              : isFac
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-purple-50 text-purple-700 border-purple-200';

            return (
              <div
                key={acc.email}
                className={`p-4 rounded-2xl border transition group hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${roleColor}`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {acc.name}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      {acc.role}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {acc.identifier}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 text-teal-700 font-semibold font-mono">
                      <Mail size={12} className="text-teal-600 shrink-0" />
                      <span>{acc.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone size={12} className="shrink-0" />
                      <span>{acc.phone}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="font-medium text-slate-700">{acc.department}</span>
                    <span>&bull;</span>
                    <span className="text-slate-600">{acc.designationOrSemester}</span>
                    {acc.mentorOrGroup && (
                      <>
                        <span>&bull;</span>
                        <span className="text-indigo-600 font-medium">{acc.mentorOrGroup}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => {
                      onSelectAccount(acc);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-teal-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>Use Account</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Excel Sheet Roster: 5 Students &bull; 4 Faculty &bull; 1 Super Admin</span>
          <button
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
