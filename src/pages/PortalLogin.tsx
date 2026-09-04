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
  ShieldAlert, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const PortalLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setRole, setAdminActiveTab } = useAppStore();

  // Admin form input states (username: admin & password: admin123)
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Loading error states
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ identifier?: boolean; password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeCard, setActiveCard] = useState<number>(0);

  // Validation functions
  const validateIdentifier = (val: string): string | undefined => {
    if (!val.trim()) return 'Admin username is required (use: admin)';
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return 'Administrative password is required (use: admin123)';
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

    const trimmedId = identifier.trim().toLowerCase();
    const trimmedPass = password.trim();

    const isMatch = (trimmedId === 'admin' || trimmedId === 'admin@campus.edu') && trimmedPass === 'admin123';

    if (!isMatch) {
      setErrors({
        identifier: (trimmedId !== 'admin' && trimmedId !== 'admin@campus.edu') ? 'Invalid username (Use: admin)' : undefined,
        password: trimmedPass !== 'admin123' ? 'Invalid password (Use: admin123)' : undefined,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setRole('admin');
      setAdminActiveTab('dashboard');
      // Redirect straight to Admin Console Dashboard
      navigate('/admin');
    }, 700);
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full flex flex-col lg:flex-row bg-[#0A0E1A] selection:bg-indigo-500 selection:text-white font-sans lg:overflow-hidden">
      {/* ========================================================
          LEFT PANEL: Executive Deep Charcoal / Midnight Navy
          (Shows ONLY Admin Portal details & capability modules)
          ======================================================== */}
      <div 
        className="lg:w-1/2 h-full flex flex-col justify-between p-5 sm:p-7 lg:p-8 xl:p-12 relative bg-[#090D18] text-white border-b lg:border-b-0 lg:border-r border-indigo-950/60 overflow-y-auto lg:overflow-y-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      >
        {/* Subtle indigo radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Brand + Restricted Admin Access Badge */}
        <div className="relative z-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-950/50 shrink-0">
              <Lock size={17} className="text-indigo-400" />
            </div>
            <div>
              <span className="font-extrabold text-base xl:text-lg text-white tracking-tight leading-none block">
                AttendEase
              </span>
              <span className="text-[9px] xl:text-[10px] text-indigo-300 font-bold tracking-[0.2em] uppercase mt-0.5 block">
                ADMIN COMMAND PORTAL
              </span>
            </div>
          </div>

          {/* Security Badge */}
          <div className="px-3 py-1.2 rounded-full border border-indigo-500/40 bg-indigo-950/80 text-indigo-300 text-[10px] xl:text-[11px] font-mono font-semibold tracking-wider shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>RESTRICTED ACCESS • TLS 1.3</span>
          </div>
        </div>

        {/* Center Section: Admin Console Squircle + Title + 3 Admin Modules */}
        <div className="relative z-10 my-auto py-3 xl:py-6 max-w-md mx-auto w-full flex flex-col justify-center shrink-0">
          {/* Admin Command Squircle */}
          <div className="w-16 h-16 xl:w-20 xl:h-20 rounded-2xl xl:rounded-3xl bg-[#0E1526] border border-indigo-500/40 mx-auto flex flex-col items-center justify-center p-1.5 shadow-xl shadow-indigo-950/40 relative group hover:border-indigo-400/60 transition shrink-0">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-10 h-10 xl:w-14 xl:h-14 rounded-full border border-indigo-500/30 animate-ping" />
              <div className="absolute w-8 h-8 xl:w-10 xl:h-10 rounded-full border border-indigo-500/50" />
              <Lock size={22} className="text-indigo-300 z-10" />
            </div>
            <span className="text-[8px] xl:text-[9px] font-extrabold text-indigo-300 tracking-wider mt-1 uppercase leading-none font-mono">
              ADMIN
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white tracking-tight text-center mt-3 xl:mt-5 mb-1.5">
            Campus Admin Console
          </h1>

          {/* Subtitle */}
          <p className="text-xs xl:text-sm text-indigo-200/70 text-center leading-relaxed mb-5 xl:mb-7 px-1">
            Centralized quorum telemetry, department timetable scheduling, and campus-wide biometric audit logs.
          </p>

          {/* 3 Dedicated Admin Modules (Cards) */}
          <div className="space-y-2.5 xl:space-y-3">
            {/* Card 1: Campus Quorum Intelligence */}
            <div
              onClick={() => setActiveCard(0)}
              className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3.5 cursor-pointer ${
                activeCard === 0
                  ? 'bg-indigo-950/80 border-indigo-400/80 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/50'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-indigo-500/30'
              }`}
            >
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-[#131B32] border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                <BarChart3 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs xl:text-sm font-bold text-white tracking-tight flex items-center justify-between">
                  <span>Campus Quorum Intelligence</span>
                  {activeCard === 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </div>
                <div className="text-[10px] xl:text-xs text-indigo-200/60 mt-0.5 truncate">
                  Real-time attendance telemetry, cross-department analytics & deficit alerts
                </div>
              </div>
            </div>

            {/* Card 2: Faculty & Timetable Engine */}
            <div
              onClick={() => setActiveCard(1)}
              className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3.5 cursor-pointer ${
                activeCard === 1
                  ? 'bg-indigo-950/80 border-indigo-400/80 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/50'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-indigo-500/30'
              }`}
            >
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-[#131B32] border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                <CalendarRange size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs xl:text-sm font-bold text-white tracking-tight flex items-center justify-between">
                  <span>Faculty & Timetable Engine</span>
                  {activeCard === 1 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </div>
                <div className="text-[10px] xl:text-xs text-indigo-200/60 mt-0.5 truncate">
                  Automated classroom beacon allocation & timetable compliance
                </div>
              </div>
            </div>

            {/* Card 3: Biometric Security & Audit */}
            <div
              onClick={() => setActiveCard(2)}
              className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3.5 cursor-pointer ${
                activeCard === 2
                  ? 'bg-indigo-950/80 border-indigo-400/80 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/50'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-indigo-500/30'
              }`}
            >
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-[#131B32] border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs xl:text-sm font-bold text-white tracking-tight flex items-center justify-between">
                  <span>Biometric Security & Audit</span>
                  {activeCard === 2 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </div>
                <div className="text-[10px] xl:text-xs text-indigo-200/60 mt-0.5 truncate">
                  3D anti-spoofing verification logs & cryptographic hardware status
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left Footer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] xl:text-xs text-indigo-300/70 pt-3 border-t border-indigo-950/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-indigo-400" />
            <span>Secured Connection • TLS 1.3 • SOC2 Type II Certified</span>
          </div>
          <span className="font-mono text-[10px] text-indigo-400/60">
            Admin Gateway v2.4
          </span>
        </div>
      </div>

      {/* ========================================================
          RIGHT PANEL: Floating Admin Sign-In Card
          (Shows ONLY Admin Institutional Email & Password)
          ======================================================== */}
      <div className="lg:w-1/2 h-full flex items-center justify-center p-4 sm:p-8 lg:p-6 xl:p-12 bg-white sm:bg-slate-50 overflow-y-auto">
        {/* Floating Card */}
        <div className="w-full max-w-[430px] xl:max-w-[460px] bg-white rounded-3xl xl:rounded-[32px] p-6 sm:p-8 xl:p-10 shadow-xl sm:shadow-2xl shadow-slate-200/80 border border-slate-100 flex flex-col my-auto">
          {/* Card Header */}
          <div className="mb-4 xl:mb-5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Admin Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-normal">
              Authorized institutional personnel only. Session activity is audited.
            </p>
          </div>

          {/* Quick Credential Banner */}
          <div className="mb-5 p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-950">
              <span className="font-bold text-indigo-700">Admin Login:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-900 font-semibold">admin</span>
              <span className="text-slate-400">/</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-900 font-semibold">admin123</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIdentifier('admin');
                setPassword('admin123');
                setErrors({});
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Fill
            </button>
          </div>

          {/* Form: ONLY Admin Email & Password */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4 xl:space-y-5">
            {/* Field 1: Admin Institutional Email / Username */}
            <div className="space-y-1.5">
              <label 
                htmlFor="admin-identifier" 
                className="text-xs font-bold text-slate-800 select-none block"
              >
                Admin Username / Email
              </label>

              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors">
                  <User size={17} />
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
                  placeholder="admin"
                  autoComplete="username"
                  disabled={isLoading}
                  className={`w-full py-3 xl:py-3.5 pl-10 pr-4 bg-[#F8FAFC] border rounded-2xl text-xs xl:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                    errors.identifier
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                      : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 hover:border-slate-300'
                  }`}
                />
              </div>

              {errors.identifier && (
                <div role="alert" className="flex items-center gap-1.5 text-xs text-rose-500 font-medium pt-0.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{errors.identifier}</span>
                </div>
              )}
            </div>

            {/* Field 2: Administrative Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="admin-password" 
                  className="text-xs font-bold text-slate-800 select-none block"
                >
                  Administrative Password
                </label>

                <a
                  href="#help"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Security protocol: Contact campus IT Operations to reset admin cryptographic hardware tokens.');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer transition"
                >
                  Need help?
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
                  className={`w-full py-3 xl:py-3.5 pl-10 pr-10 bg-[#F8FAFC] border rounded-2xl text-xs xl:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
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

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 xl:py-4 px-5 mt-2 rounded-2xl font-extrabold text-xs xl:text-sm tracking-wide text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] uppercase ${
                isLoading ? 'opacity-80 cursor-wait' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin text-white" />
                  <span>AUTHENTICATING ADMIN TOKEN...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO ADMIN CONSOLE</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Footer Notice & Direct Switch to Student & Faculty App */}
          <div className="mt-6 xl:mt-7 text-center space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldAlert size={14} className="text-amber-500 shrink-0" />
              <span>Restricted to verified campus deans & IT administrators</span>
            </div>

            {/* Direct Switch to Student & Faculty App */}
            <div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-flex items-center gap-1 transition"
              >
                <span>Using mobile device? Open Student & Faculty App →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalLogin;
