import React, { useState } from 'react';
import { Wifi, Battery, Smartphone, Maximize2, Minimize2 } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
  roleName: 'Faculty' | 'Student';
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children, roleName }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isMaximized) {
    return (
      <div className="relative w-full max-w-2xl mx-auto p-4 transition-all duration-300">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            {roleName} View (Expanded)
          </span>
          <button
            onClick={() => setIsMaximized(false)}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-3 py-1 rounded-full bg-slate-100 border border-slate-200"
          >
            <Minimize2 size={13} /> Mobile Frame
          </button>
        </div>
        <div className="bg-white overflow-hidden border border-slate-200 shadow-xl rounded-3xl">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 px-2 min-h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between w-full max-w-[395px] mb-2.5 px-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Smartphone size={14} className="text-indigo-600" />
          <span>AttendEase {roleName} Simulator</span>
        </div>
        <button
          onClick={() => setIsMaximized(true)}
          title="Toggle Full View"
          className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <Maximize2 size={13} />
          <span>Expand</span>
        </button>
      </div>

      {/* Modern Device Bezel */}
      <div className="relative w-[385px] h-[780px] rounded-[48px] bg-slate-900 p-3 shadow-2xl ring-1 ring-slate-800 border-4 border-slate-700 transition-all duration-300">
        {/* Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-between px-3">
          <div className="w-2 h-2 rounded-full bg-indigo-950 border border-indigo-500/30"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>

        {/* Device Inner Screen in Crisp Light White */}
        <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-white flex flex-col border border-slate-100 text-slate-900">
          {/* Status Bar */}
          <div className="h-10 pt-2 px-6 flex justify-between items-center text-[11px] font-bold tracking-tight text-slate-700 z-30 select-none bg-white">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-indigo-600 font-bold">5G</span>
              <Wifi size={12} className="text-slate-700" />
              <Battery size={13} className="text-slate-700" />
            </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 overflow-y-auto relative flex flex-col bg-white">
            {children}
          </div>

          {/* iOS-style Home Indicator */}
          <div className="h-4 flex justify-center items-center pb-1 bg-white pointer-events-none">
            <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
