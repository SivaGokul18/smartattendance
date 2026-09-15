import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  CalendarRange, 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Mail,
  FileSpreadsheet
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAppStore } from '../store/useAppStore';
import { authApi } from '../api/client';
import { ForcePasswordChangeModal } from '../components/auth/ForcePasswordChangeModal';
import { RosterAccountsModal } from '../components/auth/RosterAccountsModal';
import { getRosterAccount, RosterAccount } from '../lib/rosterAccounts';

export const PortalLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setRole, setAuthUser, setAdminActiveTab, syncWithBackend } = useAppStore();

  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);


  // Admin form input states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Loading error states
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ identifier?: boolean; password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isForcePasswordOpen, setIsForcePasswordOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<number>(0);

  // Validation functions
  const validateIdentifier = (val: string): string | undefined => {
    if (!val.trim()) return 'Username or institutional email is required';
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return 'Password is required';
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

  const handleSelectRosterAccount = (account: RosterAccount) => {
    setIdentifier(account.email);
    setPassword(account.password);
    setErrors({});
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
      // Real backend authentication
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
        setIsForcePasswordOpen(true);
        return;
      }

      if (authRes.role === 'admin') {
        setRole('admin');
        setAdminActiveTab('dashboard');
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

      setAuthUser({
        name: rosterAcc.name,
        email: rosterAcc.email,
        role: rosterAcc.role,
        rollNumber: rosterAcc.role === 'student' ? rosterAcc.identifier : undefined,
        employeeId: rosterAcc.role === 'faculty' ? rosterAcc.identifier : undefined,
        department: rosterAcc.department,
        phone: rosterAcc.phone,
        designation: rosterAcc.role === 'faculty' ? rosterAcc.designationOrSemester : undefined,
      });

      if (rosterAcc.role === 'admin') {
        setRole('admin');
        setAdminActiveTab('dashboard');
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

  // Google SSO authentication handler for Admin Portal
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setIsLoading(true);
    setErrors({});
    try {
      const authRes = await authApi.googleLogin({
        credential: credentialResponse.credential,
        target_role: 'admin',
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
      if (authRes.role === 'admin') {
        setRole('admin');
        setAdminActiveTab('dashboard');
        navigate('/admin');
      } else if (authRes.role === 'faculty') {
        setRole('faculty');
        navigate('/faculty');
      } else {
        setRole('student');
        navigate('/student');
      }
    } catch (err: any) {
      console.error('Google Admin Sign-In failed:', err);
      setErrors({
        identifier: err?.response?.data?.detail || 'Google sign-in access restricted. Email must exist in institutional roster.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full flex flex-col lg:flex-row bg-slate-50 selection:bg-indigo-600 selection:text-white font-sans lg:overflow-hidden">
      {/* ========================================================
          LEFT PANEL: Executive Light Indigo & Porcelain
          ======================================================== */}
      <div 
        className="lg:w-1/2 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 relative bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white text-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto lg:overflow-y-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      >
        {/* Subtle indigo radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Brand */}
        <div className="relative z-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none block">
                Smart Attendance
              </span>
              <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase mt-1 block">
                Admin Console
              </span>
            </div>
          </div>
        </div>

        {/* Center Section: Icon + Title + 3 Modules */}
        <div className="relative z-10 my-auto py-4 xl:py-6 max-w-md mx-auto w-full flex flex-col justify-center shrink-0">
          {/* Executive Icon Squircle */}
          <div className="w-16 h-16 xl:w-20 xl:h-20 rounded-2xl xl:rounded-3xl bg-white border border-indigo-200/80 mx-auto flex items-center justify-center shadow-md shadow-indigo-500/10 mb-4 shrink-0">
            <Lock size={26} className="text-indigo-600" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight text-center mb-2">
            Admin Portal
          </h1>

          {/* Subtitle */}
          <p className="text-xs xl:text-sm text-slate-500 text-center leading-relaxed mb-6 max-w-sm mx-auto">
            Manage academic departments, faculty schedules, and student attendance records.
          </p>

          {/* 3 Dedicated Modules (Cards) */}
          <div className="space-y-3">
            {/* Card 1: Attendance Analytics */}
            <div
              onClick={() => setActiveCard(0)}
              className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-3.5 cursor-pointer ${
                activeCard === 0
                  ? 'bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-500/20'
                  : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
                <BarChart3 size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center justify-between">
                  <span>Attendance Analytics</span>
                  {activeCard === 0 && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  Real-time attendance rates, student summaries, and alerts
                </div>
              </div>
            </div>

            {/* Card 2: Faculty & Schedules */}
            <div
              onClick={() => setActiveCard(1)}
              className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-3.5 cursor-pointer ${
                activeCard === 1
                  ? 'bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-500/20'
                  : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
                <CalendarRange size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center justify-between">
                  <span>Faculty & Schedules</span>
                  {activeCard === 1 && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  Classroom timetables and beacon allocations
                </div>
              </div>
            </div>

            {/* Card 3: Student Records */}
            <div
              onClick={() => setActiveCard(2)}
              className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-3.5 cursor-pointer ${
                activeCard === 2
                  ? 'bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-500/20'
                  : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center justify-between">
                  <span>Student Records</span>
                  {activeCard === 2 && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  Biometric enrollment and verified attendance logs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-indigo-600" />
            <span>Smart Attendance</span>
          </div>
          <span className="text-xs text-slate-400">
            Secure Admin Access
          </span>
        </div>
      </div>

      {/* ========================================================
          RIGHT PANEL: Admin Sign-In Card
          ======================================================== */}
      <div className="lg:w-1/2 h-full flex items-center justify-center p-4 sm:p-8 lg:p-8 xl:p-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-8 xl:p-9 shadow-lg shadow-slate-200/60 border border-slate-200/80 flex flex-col my-auto">
          {/* Card Header */}
          <div className="mb-5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Admin Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-normal">
              Enter your credentials to access the admin portal.
            </p>
          </div>

          {/* Quick Credential Banner */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                <FileSpreadsheet size={13} className="text-indigo-600" />
                <span>Official Excel Roster</span>
              </span>
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(true)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Accounts →</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin@campus.edu');
                  setPassword('admin123');
                  setErrors({});
                }}
                className={`py-2 px-2.5 rounded-xl text-left border transition cursor-pointer ${
                  identifier === 'admin@campus.edu'
                    ? 'bg-purple-50 border-purple-400 text-purple-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-purple-900 truncate">Administrator</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">Admin</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block truncate">admin@campus.edu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('faculty@campus.edu');
                  setPassword('faculty123');
                  setErrors({});
                }}
                className={`py-2 px-2.5 rounded-xl text-left border transition cursor-pointer ${
                  identifier === 'faculty@campus.edu'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-indigo-900 truncate">Dr. Ramesh Kumar</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">Faculty</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block truncate">faculty@campus.edu</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

            {/* Field 1: Institutional Email ID */}
            <div className="space-y-1.5">
              <label 
                htmlFor="admin-identifier" 
                className="text-xs font-bold text-slate-700 select-none block"
              >
                Institutional Email ID (or Roll / Staff ID)
              </label>

              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors">
                  <Mail size={17} />
                </div>
                <input
                  id="admin-identifier"
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
                  placeholder="name@campus.edu or registered email"
                  autoComplete="username"
                  disabled={isLoading}
                  className={`w-full py-3 pl-10 pr-4 bg-slate-50 border rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                    errors.identifier
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                      : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 hover:border-slate-300'
                  }`}
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="admin-password" 
                  className="text-xs font-bold text-slate-700 select-none block"
                >
                  Password
                </label>

                <a
                  href="#help"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Please contact your administrator to reset your password.');
                  }}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer transition"
                >
                  Forgot password?
                </a>
              </div>

              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={17} />
                </div>
                <input
                  id="admin-password"
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
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={`w-full py-3 pl-10 pr-10 bg-slate-50 border rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                    errors.password
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                      : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 hover:border-slate-300'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {errors.password && (
                <div role="alert" className="flex items-center gap-1.5 text-xs text-rose-500 font-medium pt-0.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-5 mt-2 rounded-2xl font-bold text-sm tracking-wide text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                isLoading ? 'opacity-80 cursor-wait' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative px-2.5 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
              OR
            </span>
          </div>

          {/* Google Sign-In for Admin */}
          <div className="flex justify-center w-full min-h-[44px]">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setErrors({ identifier: 'Google sign-in was cancelled or failed.' });
              }}
              shape="pill"
              size="large"
              width="360"
              text="signin_with"
              theme="outline"
            />
          </div>

          {/* Direct Switch to Student & Faculty App */}
          <div className="mt-5 text-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-flex items-center gap-1 transition"
            >
              <span>Student & Faculty Login →</span>
            </button>
          </div>
        </div>
      </div>

      <ForcePasswordChangeModal
        isOpen={isForcePasswordOpen}
        onSuccess={() => {
          setIsForcePasswordOpen(false);
          setRole('admin');
          setAdminActiveTab('dashboard');
          navigate('/admin');
        }}
      />

      <RosterAccountsModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        onSelectAccount={handleSelectRosterAccount}
      />
    </div>
  );
};

export default PortalLogin;
