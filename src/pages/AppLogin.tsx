import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  ScanFace
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const AppLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useAppStore();

  // Form states (Student: student/student123, Faculty: faculty/faculty123)
  const [identifier, setIdentifier] = useState('student');
  const [password, setPassword] = useState('student123');
  const [showPassword, setShowPassword] = useState(false);

  // Validation error states
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ identifier?: boolean; password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validation functions
  const validateIdentifier = (val: string): string | undefined => {
    if (!val.trim()) return 'Username, Roll No, or Faculty ID is required';
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const handleBlur = (field: 'identifier' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'identifier') {
      setErrors((prev) => ({ ...prev, identifier: validateIdentifier(identifier) }));
    } else if (field === 'password') {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ identifier: true, password: true });
    const idErr = validateIdentifier(identifier);
    const passErr = validatePassword(password);

    if (idErr || passErr) {
      setErrors({ identifier: idErr, password: passErr });
      return;
    }

    const lowerId = identifier.trim().toLowerCase();
    const inputPass = password.trim();

    // 1. Student Check: student / student123
    if (lowerId === 'student' || lowerId === '2026cs101' || lowerId === 'student@campus.edu') {
      if (inputPass !== 'student123') {
        setErrors({ password: 'Incorrect password for Student (Use: student123)' });
        return;
      }
      setErrors({});
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setRole('student');
        navigate('/student');
      }, 700);
      return;
    }

    // 2. Faculty Check: faculty / faculty123
    if (lowerId === 'faculty' || lowerId.includes('fac') || lowerId.includes('prof') || lowerId === 'faculty@campus.edu') {
      if (inputPass !== 'faculty123') {
        setErrors({ password: 'Incorrect password for Faculty (Use: faculty123)' });
        return;
      }
      setErrors({});
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setRole('faculty');
        navigate('/faculty');
      }, 700);
      return;
    }

    // 3. Admin Check: admin / admin123
    if (lowerId === 'admin' || lowerId === 'admin@campus.edu') {
      if (inputPass !== 'admin123') {
        setErrors({ password: 'Incorrect password for Admin (Use: admin123)' });
        return;
      }
      setErrors({});
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setRole('admin');
        navigate('/admin');
      }, 700);
      return;
    }

    // Unrecognized username
    setErrors({
      identifier: 'Unrecognized user. Use "student" or "faculty"',
    });
  };

  // Google SSO simulated login
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRole('student');
      navigate('/student');
    }, 700);
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full bg-white flex flex-col justify-between items-center p-3 sm:p-5 lg:p-6 font-sans selection:bg-[#0B4A3A] selection:text-white lg:overflow-hidden">
      {/* Top Header Branding (Centered) */}
      <div className="flex flex-col items-center text-center pt-1 xl:pt-4 shrink-0">
        {/* Custom AttendEase Squircle App Icon */}
        <div className="w-14 h-14 xl:w-18 xl:h-18 rounded-2xl bg-[#04140D] border border-emerald-500/30 flex flex-col items-center justify-center p-1.5 shadow-lg shadow-emerald-950/20 mb-2 relative group hover:border-emerald-400/50 transition">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-9 h-9 xl:w-11 xl:h-11 rounded-full border border-emerald-400/30 animate-ping" />
            <ScanFace size={22} className="text-emerald-300 z-10" />
          </div>
          <span className="text-[8px] xl:text-[9px] font-extrabold text-emerald-300 tracking-wider uppercase mt-1 leading-none">
            AttendEase
          </span>
        </div>

        {/* Brand Title */}
        <h1 className="text-2xl xl:text-3xl font-extrabold text-[#0B4A3A] tracking-tight">
          AttendEase
        </h1>

        {/* Subtitle */}
        <p className="text-[11px] xl:text-xs text-slate-500 font-medium mt-0.5">
          Touchless campus attendance at your fingertips
        </p>
      </div>

      {/* Main Login Card (Centered Floating White Card) */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl xl:rounded-[28px] border border-slate-200/90 p-5 sm:p-6 xl:p-8 shadow-xs my-auto shrink-0">
        {/* Card Header */}
        <div className="mb-3">
          <h2 className="text-xl xl:text-2xl font-black text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-[11px] xl:text-xs text-slate-500 mt-0.5 pb-2.5 border-b border-slate-100">
            Log in to verify class attendance & check academic streak
          </p>
        </div>

        {/* Classroom Proximity Beacon Sensor Indicator */}
        <div className="mb-3 p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2 text-[11px] text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span className="font-semibold truncate">
            Beacon in Range: <span className="font-bold text-emerald-950">CS301 Machine Learning</span>
          </span>
        </div>

        {/* Quick Fill Credentials Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => {
              setIdentifier('student');
              setPassword('student123');
              setErrors({});
            }}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
              identifier.toLowerCase() === 'student'
                ? 'bg-teal-50 border-teal-400 text-teal-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>Student</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-normal">student / student123</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIdentifier('faculty');
              setPassword('faculty123');
              setErrors({});
            }}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
              identifier.toLowerCase() === 'faculty'
                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Faculty</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-normal">faculty / faculty123</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {/* Field 1: USERNAME, ROLL NO, OR FACULTY ID */}
          <div className="space-y-1">
            <label 
              htmlFor="app-identifier" 
              className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 block select-none"
            >
              USERNAME, ROLL NO, OR FACULTY ID
            </label>

            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#0B4A3A] transition-colors">
                <User size={16} />
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
                placeholder="student or faculty"
                autoComplete="username"
                disabled={isLoading}
                className={`w-full py-2.5 xl:py-3 pl-10 pr-3 bg-white border rounded-xl text-xs xl:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                  errors.identifier
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-[#0B4A3A] focus:ring-2 focus:ring-[#0B4A3A]/15 hover:border-slate-300'
                }`}
              />
            </div>

            {errors.identifier && (
              <div role="alert" className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.identifier}</span>
              </div>
            )}
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
            className={`w-full py-2.5 xl:py-3 px-5 mt-2 rounded-xl font-extrabold text-xs xl:text-sm tracking-wider uppercase text-white bg-[#0B4A3A] hover:bg-[#073529] shadow-md shadow-[#0B4A3A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
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

        {/* Continue with Campus Google Workspace Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center justify-center gap-2.5 transition shadow-2xs active:scale-[0.99] cursor-pointer disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.675-5.17 3.675-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.15C3.25 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.24A7.18 7.18 0 0 1 4.89 12c0-.78.14-1.53.38-2.24V6.61H1.26A11.967 11.967 0 0 0 0 12c0 1.92.45 3.74 1.26 5.39l4.01-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.26 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          <span>Continue with Google Workspace</span>
        </button>
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
    </div>
  );
};

export default AppLogin;
