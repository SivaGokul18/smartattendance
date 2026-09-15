import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const NotificationDrawer: React.FC = () => {
  const { 
    isNotificationOpen, 
    setNotificationOpen, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useAppStore();

  if (!isNotificationOpen) return null;

  const categories = [
    { key: 'today', label: 'Today' },
    { key: 'this_week', label: 'This Week' },
    { key: 'earlier', label: 'Earlier' },
  ] as const;

  const getAccentBorder = (color: string) => {
    switch (color) {
      case 'emerald': return 'border-l-4 border-l-emerald-500 bg-emerald-50/60';
      case 'amber': return 'border-l-4 border-l-amber-500 bg-amber-50/60';
      case 'rose': return 'border-l-4 border-l-rose-500 bg-rose-50/60';
      default: return 'border-l-4 border-l-indigo-500 bg-indigo-50/60';
    }
  };

  const getIcon = (color: string) => {
    switch (color) {
      case 'emerald': return <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />;
      case 'amber': return <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />;
      default: return <Info size={16} className="text-indigo-600 mt-0.5 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/25 backdrop-blur-xs transition-opacity duration-300">
      <div className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col p-5 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Notifications</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsRead}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold transition cursor-pointer"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
            <button
              onClick={() => setNotificationOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List of notifications */}
        <div className="flex-1 overflow-y-auto py-3 space-y-5 pr-1">
          {categories.map(({ key, label }) => {
            const items = notifications.filter((n) => n.category === key);
            if (items.length === 0) return null;

            return (
              <div key={key} className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  {label}
                </span>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => markNotificationRead(item.id)}
                      className={`p-3.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer transition-all hover:translate-x-1 ${getAccentBorder(
                        item.accentColor
                      )} ${!item.read ? 'ring-1 ring-indigo-500/20' : 'opacity-85'}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {getIcon(item.accentColor)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                            {!item.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.body}</p>
                          <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                            {item.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
