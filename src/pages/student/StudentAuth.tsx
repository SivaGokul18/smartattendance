import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAppStore } from '../../store/useAppStore';
import { authApi } from '../../api/client';
import { getRosterAccount } from '../../lib/rosterAccounts';

interface StudentAuthProps {
  onLoginSuccess?: () => void;
}

export const StudentAuth: React.FC<StudentAuthProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { setAuthUser, syncWithBackend } = useAppStore();

  const [isSplashing, setIsSplashing] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        navigate('/student');
      }
    } catch (err: any) {
      console.warn('Backend login response/error:', err);
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
      if (rosterAcc.role !== 'student') {
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
        rollNumber: rosterAcc.identifier,
        department: rosterAcc.department,
        phone: rosterAcc.phone,
      });

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/student');
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
        target_role: 'student',
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
        navigate('/student');
      }
    } catch (err: any) {
      console.warn('Google student login error:', err);
      setError(
        err?.response?.data?.detail || 
        'Access Restricted: Google account is not in the institutional Excel roster.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSplashing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-teal-500/25 animate-bounce">
          <Sparkles size={38} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-6 tracking-tight">Smart Attendance</h1>
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
          <span>Back</span>
        </Link>
      </div>

      {/* Centered Logo & Title with Teal-Indigo Accent */}
      <div className="pt-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 mb-3">
          <Sparkles size={24} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Login</h2>
      </div>

      {/* Form in Light Theme */}
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
            Institutional Email ID (or Roll Number)
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="sivagokulc18@gmail.com or 7376242IT303"
              disabled={isLoading}
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
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 transition"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3.5 mt-2 rounded-full font-bold text-xs text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:brightness-110 shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer ${
            isLoading ? 'opacity-75 cursor-wait' : ''
          }`}
        >
          <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
          <ArrowRight size={14} />
        </button>

        {/* OR Divider */}
        <div className="relative my-3 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative px-2.5 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
