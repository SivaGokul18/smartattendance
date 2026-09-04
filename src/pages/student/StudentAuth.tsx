import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, User, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface StudentAuthProps {
  onLoginSuccess?: () => void;
}

export const StudentAuth: React.FC<StudentAuthProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { selectedStudent } = useAppStore();

  const [isSplashing, setIsSplashing] = useState(true);
  const [rollNumber, setRollNumber] = useState('student');
  const [password, setPassword] = useState('student123');

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
      navigate('/student');
    }
  };

  if (isSplashing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-teal-500/25 animate-bounce">
          <Sparkles size={38} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-6 tracking-tight">AttendEase</h1>
        <span className="text-xs font-bold uppercase tracking-widest text-teal-600 mt-1">
          Student Portal
        </span>
        <div className="w-12 h-1 rounded-full bg-slate-100 mt-8 overflow-hidden">
          <div className="w-full h-full bg-teal-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-white text-slate-900">
      {/* Top Back Link */}
      <div className="flex justify-between items-center pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 transition font-medium"
        >
          <ArrowLeft size={13} />
          <span>Main Login</span>
        </Link>
        <span className="text-[10px] font-mono font-bold text-slate-400">/student/login</span>
      </div>

      {/* Centered Logo & Title with Teal-Indigo Accent */}
      <div className="pt-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 mb-3">
          <Sparkles size={24} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Login</h2>
        <p className="text-xs text-slate-500 mt-1">
          Instant BLE detection & biometric face verification
        </p>
      </div>

      {/* Form in Light Theme */}
      <form onSubmit={handleLogin} className="space-y-4 my-auto">
        <div>
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
            Roll Number or Student Email
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono transition"
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
              className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 transition"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 mt-2 rounded-full font-bold text-xs text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:brightness-110 shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
          <span>Login to Student Portal</span>
          <ArrowRight size={14} />
        </button>
      </form>

      <div className="text-center pb-2">
        <p className="text-xs text-slate-500">
          New student?{' '}
          <span className="text-teal-600 font-bold cursor-pointer hover:underline">
            Contact Registrar
          </span>
        </p>
      </div>
    </div>
  );
};
