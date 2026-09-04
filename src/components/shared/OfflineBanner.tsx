import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const OfflineBanner: React.FC = () => {
  const { isOffline, setOffline } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    if (!isOffline && isSyncing) {
      const timer = setTimeout(() => {
        setIsSyncing(false);
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 2500);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOffline, isSyncing]);

  const handleReconnect = () => {
    setIsSyncing(true);
    setOffline(false);
  };

  if (!isOffline && !isSyncing && !justSynced) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {isOffline && (
        <div className="bg-amber-500/95 text-amber-950 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md backdrop-blur">
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="text-amber-950 animate-pulse" />
            <span>You're offline — attendance records will sync automatically when reconnected.</span>
          </div>
          <button
            onClick={handleReconnect}
            className="px-2.5 py-1 bg-amber-900/20 hover:bg-amber-900/30 text-amber-950 rounded font-semibold text-xs transition cursor-pointer"
          >
            Reconnect Now
          </button>
        </div>
      )}

      {isSyncing && (
        <div className="bg-indigo-600/95 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-md backdrop-blur">
          <RefreshCw size={15} className="animate-spin text-white" />
          <span>Back online — Syncing encrypted attendance logs to cloud...</span>
        </div>
      )}

      {justSynced && (
        <div className="bg-emerald-600/95 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-md backdrop-blur">
          <span>✓ Attendance synchronized successfully with college server.</span>
        </div>
      )}
    </div>
  );
};
