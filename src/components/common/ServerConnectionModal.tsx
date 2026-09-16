import React, { useState, useEffect } from 'react';
import { Server, Wifi, Cloud, CheckCircle2, XCircle, RefreshCw, ChevronDown, Check, Edit2 } from 'lucide-react';
import axios from 'axios';
import { getActiveBackendBase } from '../../api/client';

interface ServerOption {
  label: string;
  url: string;
  type: 'render' | 'local' | 'custom';
}

export const ServerConnectionModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentBase, setCurrentBase] = useState(getActiveBackendBase());
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [statusDetail, setStatusDetail] = useState<string>('');
  const [customInput, setCustomInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Preset known endpoints
  const presetServers: ServerOption[] = [
    {
      label: 'Cloud Server (Render)',
      url: 'https://smart-attendance-backend-f7vl.onrender.com',
      type: 'render'
    },
    {
      label: 'Local Wi-Fi Server (10.40.43.137)',
      url: 'http://10.40.43.137:8000',
      type: 'local'
    },
    {
      label: 'Localhost (PC Only)',
      url: 'http://127.0.0.1:8000',
      type: 'local'
    }
  ];

  const checkHealth = async (baseUrl: string) => {
    setIsChecking(true);
    setStatus('checking');
    setStatusDetail('Checking connection...');
    try {
      const clean = baseUrl.replace(/\/+$/, '');
      const res = await axios.get(`${clean}/health`, { timeout: 5000 });
      if (res.status === 200) {
        setStatus('online');
        setStatusDetail(`Online (${res.data?.database || 'PostgreSQL'})`);
      } else {
        setStatus('offline');
        setStatusDetail(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      setStatus('offline');
      setStatusDetail(err?.message?.includes('timeout') ? 'Connection timed out' : 'Server unreachable');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth(currentBase);
  }, [currentBase]);

  const selectServer = (url: string) => {
    const clean = url.trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '');
    localStorage.setItem('custom_api_url', clean);
    setCurrentBase(clean);
    setIsCustomMode(false);
    checkHealth(clean);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    let url = customInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    selectServer(url);
  };

  const resetToDefault = () => {
    localStorage.removeItem('custom_api_url');
    const fresh = getActiveBackendBase();
    setCurrentBase(fresh);
    setIsCustomMode(false);
    checkHealth(fresh);
  };

  const isRender = currentBase.includes('onrender.com');

  return (
    <>
      {/* Floating or Inline Pill Badge */}
      <div className="flex items-center justify-center my-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/5 hover:bg-slate-900/10 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition shadow-xs text-slate-700 dark:text-slate-200"
        >
          <span className="relative flex h-2 w-2">
            {status === 'online' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                status === 'online'
                  ? 'bg-emerald-500'
                  : status === 'checking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            ></span>
          </span>
          <span className="font-semibold truncate max-w-[170px] sm:max-w-[240px]">
            {isRender ? 'Cloud Server' : 'Local Wi-Fi Server'}
          </span>
          <span className="text-[10px] opacity-60">({statusDetail || 'Status'})</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </button>
      </div>

      {/* Connection Switcher Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Backend Server Selection</h3>
                  <p className="text-xs text-slate-500">Connect to Cloud (Render) or Local Wi-Fi (Phone testing)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            {/* Current Status Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Backend</div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{currentBase}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  {status === 'online' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{statusDetail}</span>
                </div>
              </div>
              <button
                type="button"
                disabled={isChecking}
                onClick={() => checkHealth(currentBase)}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Ping</span>
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose Server</div>
              {presetServers.map((srv) => {
                const isSelected = currentBase === srv.url;
                return (
                  <button
                    key={srv.url}
                    type="button"
                    onClick={() => selectServer(srv.url)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {srv.type === 'render' ? (
                        <Cloud className="w-4 h-4 text-indigo-500 shrink-0" />
                      ) : (
                        <Wifi className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{srv.label}</div>
                        <div className="text-[11px] text-slate-400 truncate">{srv.url}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom IP Entry */}
            {isCustomMode ? (
              <form onSubmit={handleCustomSubmit} className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enter Custom Server URL / IP</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="http://192.168.1.100:8000"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                  >
                    Apply
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCustomInput(currentBase);
                  setIsCustomMode(true);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 pt-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>Enter custom PC Wi-Fi IP address...</span>
              </button>
            )}

            {/* Reset & Close */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={resetToDefault}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
