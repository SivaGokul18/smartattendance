import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Fingerprint, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAppStore } from '../../store/useAppStore';
import { authApi } from '../../api/client';
import { getRosterAccount } from '../../lib/rosterAccounts';

interface FacultyAuthProps {
  onLoginSuccess?: () => void;
}

export const FacultyAuth: React.FC<FacultyAuthProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { setAuthUser, syncWithBackend } = useAppStore();

  const [isSplashing, setIsSplashing] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animated splash reveal
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashing(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const trimmed = identifier.trim();
    try {
      const authRes = await authApi.login({ identifier: trimmed, password });
      setAuthUser({
        id: authRes.user_id,
        name: authRes.name,
        email: authRes.email,
        role: authRes.role,
        rollNumber: authRes.rollNumber,
        employeeId: authRes.employeeId,
        phone: authRes.phone,
        year: authRes.year,
        section: authRes.section,
        attendanceRate: authRes.attendanceRate,
        mentorId: authRes.mentorId,
        mentorName: authRes.mentorName,
        designation: authRes.designation,
        isMentor: authRes.isMentor,
        mentorGroup: authRes.mentorGroup,
        photoUrl: authRes.photoUrl,
        department: authRes.department,
      });
      await syncWithBackend();
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/faculty');
      }
    } catch (err: any) {
      console.warn('Backend login fallback/error:', err);
      const backendDetail = err?.response?.data?.detail;
      if (backendDetail) {
        setError(backendDetail);
        setIsLoading(false);
        return;
      }

      // Offline fallback: check Excel roster
      const rosterAcc = getRosterAccount(trimmed);
      if (!rosterAcc) {
        setError('Access Restricted: This email ID is not registered in the institutional Excel roster. Only authorized accounts from the Excel roster are permitted to log in.');
        setIsLoading(false);
        return;
      }
      if (rosterAcc.role !== 'faculty') {
        setError(`Access Restricted: This account belongs to ${rosterAcc.role.toUpperCase()} roster. Please use the appropriate portal.`);
        setIsLoading(false);
        return;
      }
      if (password !== rosterAcc.password) {
        setError('Invalid password. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      setAuthUser({
        name: rosterAcc.name,
        email: rosterAcc.email,
        role: rosterAcc.role,
        employeeId: rosterAcc.identifier,
        department: rosterAcc.department,
        phone: rosterAcc.phone,
        designation: rosterAcc.designationOrSemester,
      });

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/faculty');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setError(null);
    setIsLoading(true);
    try {
      const authRes = await authApi.googleLogin({
        credential: credentialResponse.credential,
        target_role: 'faculty',
      });
      setAuthUser({
        id: authRes.user_id,
        name: authRes.name,
        email: authRes.email,
        role: authRes.role,
        rollNumber: authRes.rollNumber,
        employeeId: authRes.employeeId,
        phone: authRes.phone,
        year: authRes.year,
        section: authRes.section,
        attendanceRate: authRes.attendanceRate,
        mentorId: authRes.mentorId,
        mentorName: authRes.mentorName,
        designation: authRes.designation,
        isMentor: authRes.isMentor,
        mentorGroup: authRes.mentorGroup,
        photoUrl: authRes.photoUrl,
        department: authRes.department,
      });
      await syncWithBackend();
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/faculty');
      }
    } catch (err: any) {
      console.warn('Google faculty login error:', err);
      setError(
        err?.response?.data?.detail || 
        'Access Restricted: Google account is not in the institutional Excel roster.'
      );
    } finally {
      setIsLoading(false);
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
        <h1 className="text-2xl font-black text-slate-900 mt-6 tracking-tight">Smart Attendance</h1>
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
          <span>Back</span>
        </Link>
      </div>

      {/* Centered Logo & Title */}
      <div className="pt-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 mb-3">
          <Sparkles size={24} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Login</h2>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4 my-auto">
        {error && (
          <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>Access Restricted</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-snug">
              {error}
            </p>
          </div>
        )}

        <div>
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
            Institutional Email ID (or Employee ID)
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="santhiya.m@campus.edu or STAFF-IT-101"
              disabled={isLoading}
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
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
              required
            />
          </div>
        </div>

        {/* Gradient Sign In Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3.5 mt-2 rounded-full font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer ${
            isLoading ? 'opacity-75 cursor-wait' : ''
          }`}
        >
          <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
          <ArrowRight size={14} />
        </button>

        {/* OR Divider */}
        <div className="relative my-2 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative px-2 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
            OR
          </span>
        </div>

        {/* Google Sign In */}
        <div className="flex justify-center w-full min-h-[40px]">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            shape="pill"
            size="medium"
            text="signin_with"
            theme="outline"
          />
        </div>

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
            <span className="text-[11px] font-medium">Biometric Login</span>
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
