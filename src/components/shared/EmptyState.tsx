import React from 'react';
import { CalendarX, Radio, AlertCircle, History } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-classes' | 'no-ble' | 'face-failed' | 'no-history';
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, actionLabel }) => {
  const configs = {
    'no-classes': {
      icon: <CalendarX size={36} className="text-indigo-400" />,
      title: 'No classes scheduled today',
      desc: 'You are all caught up! Enjoy your free time or check your upcoming weekly timetable.',
      btn: actionLabel || 'View Full Timetable',
    },
    'no-ble': {
      icon: <Radio size={36} className="text-amber-400 animate-pulse" />,
      title: 'No BLE beacon detected',
      desc: 'Make sure your instructor has started attendance broadcast and you are within classroom range.',
      btn: actionLabel || 'Retry Scan',
    },
    'face-failed': {
      icon: <AlertCircle size={36} className="text-rose-400" />,
      title: 'Face not recognized after 3 attempts',
      desc: 'Please ensure adequate lighting and align your face inside the oval, or contact your faculty for manual check-in.',
      btn: actionLabel || 'Request Faculty Override',
    },
    'no-history': {
      icon: <History size={36} className="text-slate-400" />,
      title: 'No attendance history yet',
      desc: 'Attendance logs will appear here once you check into your first scheduled classroom session.',
      btn: actionLabel || 'Check Timetable',
    },
  };

  const current = configs[type];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass-panel border border-white/5 max-w-md mx-auto my-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center mb-4 shadow-lg">
        {current.icon}
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{current.title}</h3>
      <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">{current.desc}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 shadow-md transition-all active:scale-95"
        >
          {current.btn}
        </button>
      )}
    </div>
  );
};
