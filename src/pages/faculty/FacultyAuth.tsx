import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Fingerprint, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface FacultyAuthProps {
  onLoginSuccess?: () => void;
}

export const FacultyAuth: React.FC<FacultyAuthProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { selectedFaculty } = useAppStore();

  const [isSplashing, setIsSplashing] = useState(true);
  const [employeeId, setEmployeeId] = useState('faculty');
  const [password, setPassword] = useState('faculty123');

  // Animated splash reveal
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashing(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      navigate('/faculty');
    }
  };

  const handleBiometric = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      navigate('/faculty');
    }
  };

  if (isSplashing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center animate-in fade-in duration-500 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-600/25 animate-bounce">
          <Sparkles size={38} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-6 tracking-tight">AttendEase</h1>
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mt-1">
          Faculty Edition
        </span>
        <div className="w-12 h-1 rounded-full bg-slate-100 mt-8 overflow-hidden">
          <div className="w-full h-full bg-indigo-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-white text-slate-900 relative overflow-hidden">
      {/* Top Back Link */}
      <div className="flex justify-between items-center pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition font-medium"
        >
          <ArrowLeft size={13} />
          <span>Main Login</span>
        </Link>
        <span className="text-[10px] font-mono font-bold text-slate-400">/faculty/login</span>
      </div>

      {/* Centered Logo & Title */}
      <div className="pt-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 mb-3">
          <Sparkles size={24} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Login</h2>
        <p className="text-xs text-slate-500 mt-1">
          Sign in to initiate classroom BLE attendance broadcasts
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4 my-auto">
        <div>
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
            Employee ID
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 font-mono transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
            Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
              required
            />
          </div>
        </div>

        {/* Gradient Sign In Button */}
        <button
          type="submit"
          className="w-full py-3.5 mt-2 rounded-full font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
          <span>Sign In to Faculty Portal</span>
          <ArrowRight size={14} />
        </button>

        {/* Biometric Login */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleBiometric}
            className="flex flex-col items-center mx-auto text-slate-500 hover:text-indigo-600 transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-1 hover:border-indigo-400 transition shadow-xs">
              <Fingerprint size={24} className="text-indigo-600" />
            </div>
            <span className="text-[11px] font-medium">Quick Biometric Touch</span>
          </button>
        </div>
      </form>

      {/* Wave-shaped subtle gradient background at bottom */}
      <div className="h-14 relative overflow-hidden pointer-events-none opacity-20">
        <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0.00,49.98 C149.99,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
            fill="url(#waveGradientLight)"
          />
          <defs>
            <linearGradient id="waveGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
