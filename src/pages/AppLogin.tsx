import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  ScanFace,
  Mail
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAppStore } from '../store/useAppStore';
import { authApi } from '../api/client';
import { ForcePasswordChangeModal } from '../components/auth/ForcePasswordChangeModal';
import { getRosterAccount } from '../lib/rosterAccounts';

interface FormErrors {
  identifier?: string;
  password?: string;
}

export const AppLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setRole, setAuthUser, syncWithBackend } = useAppStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({ identifier: false, password: false });
  const [isForcePasswordOpen, setIsForcePasswordOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<'admin' | 'faculty' | 'student' | null>(null);

  // Validation rules
  const validateIdentifier = (val: string): string | undefined => {
    if (!val.trim()) return 'Institutional Email ID is required';
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return 'Password is required';
    if (val.length < 4) return 'Password must be at least 4 characters';
    return undefined;
  };

  // Blur validation
  const handleBlur = (field: 'identifier' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'identifier') {
      setErrors((prev) => ({ ...prev, identifier: validateIdentifier(identifier) }));
    } else if (field === 'password') {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ identifier: true, password: true });
    const idErr = validateIdentifier(identifier);
    const passErr = validatePassword(password);

    if (idErr || passErr) {
      setErrors({ identifier: idErr, password: passErr });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // Connect to real backend API
      const authRes = await authApi.login({ identifier: identifier.trim(), password: password.trim() });
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
        mustChangePassword: authRes.mustChangePassword,
      });
      await syncWithBackend();

      if (authRes.mustChangePassword) {
        setPendingRole(authRes.role);
        setIsForcePasswordOpen(true);
        return;
      }

      if (authRes.role === 'admin') {
        setRole('admin');
        navigate('/admin');
      } else if (authRes.role === 'faculty') {
        setRole('faculty');
        navigate('/faculty');
      } else {
        setRole('student');
        navigate('/student');
      }
    } catch (err: any) {
      console.warn('Backend login attempt returned error or offline:', err);
      const serverDetail = err?.response?.data?.detail;

      // If backend returned a clear rejection (e.g. 403 Access Restricted or 401 Incorrect password)
      if (serverDetail) {
        setErrors({ identifier: serverDetail });
        return;
      }

      // Offline fallback: Strictly check against official Excel roster accounts
      const rosterAcc = getRosterAccount(identifier);
      if (!rosterAcc) {
        setErrors({
          identifier:
            'Access Restricted: This email ID is not registered in the institutional Excel roster. Only authorized accounts from the Excel roster are permitted to log in.',
        });
        return;
      }

      if (rosterAcc.password !== password.trim()) {
        setErrors({
          password: 'Incorrect password for this institutional roster account.',
        });
        return;
      }

      // Successful offline roster match
      setAuthUser({
        name: rosterAcc.name,
        email: rosterAcc.email,
        role: rosterAcc.role,
        rollNumber: rosterAcc.role === 'student' ? rosterAcc.identifier : undefined,
        employeeId: rosterAcc.role === 'faculty' ? rosterAcc.identifier : undefined,
        department: rosterAcc.department,
        phone: rosterAcc.phone,
        designation: rosterAcc.role === 'faculty' ? rosterAcc.designationOrSemester : undefined,
        section: rosterAcc.role === 'student' ? 'A' : undefined,
      });

      if (rosterAcc.role === 'admin') {
        setRole('admin');
        navigate('/admin');
      } else if (rosterAcc.role === 'faculty') {
        setRole('faculty');
        navigate('/faculty');
      } else {
        setRole('student');
        navigate('/student');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google SSO authentication handler
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setIsLoading(true);
    setErrors({});
    try {
      const targetRole = identifier.toLowerCase().includes('fac') ? 'faculty' : 'student';
      const authRes = await authApi.googleLogin({
        credential: credentialResponse.credential,
        target_role: targetRole,
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
      });
      await syncWithBackend();
      if (authRes.role === 'admin') {
        setRole('admin');
        navigate('/admin');
      } else if (authRes.role === 'faculty') {
        setRole('faculty');
        navigate('/faculty');
      } else {
        setRole('student');
        navigate('/student');
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setErrors({
        identifier: err?.response?.data?.detail || 'Google sign-in access restricted. Email must exist in institutional roster.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full bg-slate-50 flex flex-col justify-between items-center p-3 sm:p-5 lg:p-6 font-sans selection:bg-teal-600 selection:text-white lg:overflow-hidden">
      {/* Top Header Branding (Centered) */}
      <div className="flex flex-col items-center text-center pt-1 xl:pt-4 shrink-0">
        {/* Custom AttendEase Squircle App Icon */}
        <div className="w-14 h-14 xl:w-18 xl:h-18 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex flex-col items-center justify-center p-1.5 shadow-md shadow-teal-500/25 mb-2 relative group hover:scale-105 transition">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-9 h-9 xl:w-11 xl:h-11 rounded-full border border-white/40 animate-ping" />
            <ScanFace size={22} className="text-white z-10" />
          </div>
          <span className="text-[8px] xl:text-[9px] font-extrabold text-teal-100 tracking-wider uppercase mt-1 leading-none">
            Smart Attendance
          </span>
        </div>

        {/* Brand Title */}
        <h1 className="text-2xl xl:text-3xl font-extrabold text-teal-900 tracking-tight">
          Smart Attendance
        </h1>

        {/* Subtitle */}
        <p className="text-[11px] xl:text-xs text-slate-500 font-medium mt-0.5">
          Touchless campus attendance at your fingertips
        </p>
      </div>

      {/* Main Login Card (Centered Floating White Card) */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl xl:rounded-[28px] border border-slate-200/90 p-5 sm:p-6 xl:p-8 shadow-xs my-auto shrink-0">
        {/* Card Header */}
        <div className="mb-5">
          <h2 className="text-xl xl:text-2xl font-black text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-[11px] xl:text-xs text-slate-500 mt-0.5 pb-2.5 border-b border-slate-100">
            Log in to verify class attendance & check academic streak
          </p>
        </div>
        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {/* Prominent Access Restriction Alert Banner */}
          {errors.identifier && (
            <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>Access Restricted</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-snug">
                {errors.identifier}
              </p>
            </div>
          )}

          {/* Field 1: INSTITUTIONAL EMAIL ID */}
          <div className="space-y-1">
            <label 
              htmlFor="app-identifier" 
              className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 block select-none"
            >
              INSTITUTIONAL EMAIL ID (OR ROLL / STAFF ID)
            </label>

            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#0B4A3A] transition-colors">
                <Mail size={16} />
              </div>
              <input
                id="app-identifier"
                name="identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (touched.identifier) {
                    setErrors((prev) => ({ ...prev, identifier: validateIdentifier(e.target.value) }));
                  }
                }}
                onBlur={() => handleBlur('identifier')}
                placeholder="name@campus.edu or roster email"
                autoComplete="username"
                disabled={isLoading}
                className={`w-full py-2.5 xl:py-3 pl-10 pr-3 bg-white border rounded-xl text-xs xl:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                  errors.identifier
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-[#0B4A3A] focus:ring-2 focus:ring-[#0B4A3A]/15 hover:border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Field 2: PASSWORD */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="app-password" 
                className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 select-none block"
              >
                PASSWORD
              </label>

              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset link sent to your registered campus email.');
                }}
                className="text-[11px] font-bold text-[#0B4A3A] hover:underline cursor-pointer transition"
              >
                Forgot Password?
              </a>
            </div>

            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#0B4A3A] transition-colors">
                <Lock size={16} />
              </div>
              <input
                id="app-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) {
                    setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
                  }
                }}
                onBlur={() => handleBlur('password')}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={isLoading}
                className={`w-full py-2.5 xl:py-3 pl-10 pr-10 bg-white border rounded-xl text-xs xl:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                  errors.password
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-[#0B4A3A] focus:ring-2 focus:ring-[#0B4A3A]/15 hover:border-slate-300'
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-0.5"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {errors.password && (
              <div role="alert" className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 xl:py-3 px-5 mt-2 rounded-xl font-extrabold text-xs xl:text-sm tracking-wider uppercase text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
              isLoading ? 'opacity-80 cursor-wait' : ''
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>VERIFYING...</span>
              </>
            ) : (
              <>
                <span>VERIFY & LOG IN</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative my-3.5 xl:my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative px-2.5 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
            OR
          </span>
        </div>

        {/* Google Workspace Sign-In Button */}
        <div className="flex justify-center w-full min-h-[44px]">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setErrors({ identifier: 'Google sign-in was cancelled or failed.' });
            }}
            shape="pill"
            size="large"
            width="360"
            text="continue_with"
            theme="outline"
          />
        </div>
      </div>

      {/* Below Card Links */}
      <div className="text-center pb-1 xl:pb-4 space-y-1.5 shrink-0">
        <p className="text-[11px] text-slate-600 font-medium">
          New to campus?{' '}
          <a
            href="#registrar"
            onClick={(e) => {
              e.preventDefault();
              alert('Student credentials and BLE device authorizations are issued upon academic enrollment.');
            }}
            className="text-[#0B4A3A] font-bold hover:underline cursor-pointer"
          >
            Enroll via Registrar
          </a>
        </p>

        <div>
          <Link
            to="/portal"
            className="text-[11px] font-bold text-[#0B4A3A] hover:underline cursor-pointer inline-flex items-center gap-1 transition"
          >
            <span>Campus Unified Portal (Admin / Faculty Radar) →</span>
          </Link>
        </div>
      </div>

      <ForcePasswordChangeModal
        isOpen={isForcePasswordOpen}
        onSuccess={() => {
          setIsForcePasswordOpen(false);
          const r = pendingRole || 'student';
          if (r === 'admin') {
            setRole('admin');
            navigate('/admin');
          } else if (r === 'faculty') {
            setRole('faculty');
            navigate('/faculty');
          } else {
            setRole('student');
            navigate('/student');
          }
        }}
      />
    </div>
  );
};

export default AppLogin;
