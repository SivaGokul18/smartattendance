import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  KeyRound, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { FormInput } from '../../components/shared/FormInput';
import { useAppStore } from '../../store/useAppStore';

export const AdminAuth: React.FC = () => {
  const navigate = useNavigate();
  const { setRole, setAdminActiveTab } = useAppStore();

  // Form states
  const [email, setEmail] = useState('admin@attendease.edu');
  const [password, setPassword] = useState('Admin@Secure2026');
  const [twoFactorCode, setTwoFactorCode] = useState('849201');
  const [rememberMe, setRememberMe] = useState(true);

  // Validation error states
  const [errors, setErrors] = useState<{ email?: string; password?: string; twoFactorCode?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; twoFactorCode?: boolean }>({});

  // Loading and rate limiting states
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  // Rate limiting countdown effect
  useEffect(() => {
    let timer: any;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Validation functions
  const validateEmail = (val: string): string | undefined => {
    if (!val.trim()) return 'Admin institutional email or username is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Please enter a valid administrator email address';
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return 'Password is required';
    if (val.length < 8) return 'Admin passwords must be at least 8 characters';
    return undefined;
  };

  const validateTwoFactor = (val: string): string | undefined => {
    const clean = val.replace(/\s+/g, '');
    if (!clean) return '6-digit authenticator security code is required';
    if (!/^\d{6}$/.test(clean)) return 'Must be exactly 6 numeric digits (e.g. 849201)';
    return undefined;
  };

  const handleBlur = (field: 'email' | 'password' | 'twoFactorCode') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password') {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    } else if (field === 'twoFactorCode') {
      setErrors((prev) => ({ ...prev, twoFactorCode: validateTwoFactor(twoFactorCode) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutSeconds > 0) return;

    // Trigger validation on all fields
    setTouched({ email: true, password: true, twoFactorCode: true });

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const tfaErr = validateTwoFactor(twoFactorCode);

    if (emailErr || passErr || tfaErr) {
      setErrors({ email: emailErr, password: passErr, twoFactorCode: tfaErr });
      return;
    }

    setErrors({});
    setServerError(null);
    setIsLoading(true);

    console.log('[ADMIN AUTH API CALL] Submitting authorized admin credentials:', {
      endpoint: '/api/v1/auth/admin-login',
      adminEmail: email,
      passwordLength: password.length,
      twoFactorCodeProvided: Boolean(twoFactorCode),
      rememberDevice: rememberMe,
      ipAudit: '127.0.0.1 (Verified Gateway)',
      timestamp: new Date().toISOString(),
    });

    // Simulate API request
    setTimeout(() => {
      setIsLoading(false);

      // Check credentials (simulate success or failure)
      if (password === 'fail') {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 3) {
          setLockoutSeconds(30);
          setServerError('Too many failed attempts. Admin console is locked for 30 seconds.');
        } else {
          setServerError(`Invalid administrative credentials. Attempt ${nextAttempts} of 3 before lockout.`);
        }
        return;
      }

      // Success
      setRole('admin');
      setAdminActiveTab('dashboard');
      navigate('/admin');
    }, 1400);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Background Subtle Radial Gradient Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Top Nav: Minimal Brand & Return link */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ChevronLeft size={16} />
          <span>User & Student Login</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Restricted Gateway</span>
        </div>
      </header>

      {/* Centered Restricted Card (No Split-Screen, No Marketing Copy) */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col">
          {/* Top Restricted Tool Badge */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 mb-3">
              <Lock size={24} />
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight">
              Admin Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Internal Infrastructure & Quorum Administration
            </p>
          </div>

          {/* Authorized Personnel Notice Banner */}
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block text-amber-200">Authorized Personnel Only</span>
              This portal is restricted to authorized campus staff. All authentication attempts and session IP addresses are audited.
            </div>
          </div>

          {/* Rate Limit Alert Banner if Locked Out */}
          {lockoutSeconds > 0 && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-3 animate-in shake duration-300"
            >
              <Clock size={18} className="text-rose-400 shrink-0 mt-0.5 animate-spin" />
              <div>
                <span className="font-bold block text-rose-200">Security Cooldown Active</span>
                Too many failed attempts. Authentication is temporarily locked for{' '}
                <span className="font-mono font-bold text-white text-sm underline">
                  {lockoutSeconds} seconds
                </span>
                .
              </div>
            </div>
          )}

          {/* Generic Server Error (if failed attempt < 3) */}
          {serverError && lockoutSeconds === 0 && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2"
            >
              <AlertTriangle size={15} className="text-rose-400 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Admin Login Form with Shared FormInput (theme="dark") */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Admin Email / Username */}
            <FormInput
              id="admin-email"
              name="email"
              label="Admin Email or Username"
              type="email"
              theme="dark"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
              }}
              onBlur={() => handleBlur('email')}
              placeholder="admin@attendease.edu"
              error={errors.email}
              icon={<Mail size={16} />}
              required
              autoComplete="username"
              disabled={isLoading || lockoutSeconds > 0}
            />

            {/* Password */}
            <FormInput
              id="admin-password"
              name="password"
              label="Administrative Password"
              type="password"
              theme="dark"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
              }}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••••••"
              error={errors.password}
              icon={<Lock size={16} />}
              required
              autoComplete="current-password"
              disabled={isLoading || lockoutSeconds > 0}
              rightAction={
                <a
                  href="#reset"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Security protocol: Contact the campus IT Security Officer to re-issue admin hardware tokens.');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
                >
                  Need help?
                </a>
              }
            />

            {/* 2FA / OTP Code Field */}
            <FormInput
              id="admin-2fa"
              name="twoFactorCode"
              label="2FA Authenticator Security Code"
              type="text"
              theme="dark"
              value={twoFactorCode}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTwoFactorCode(clean);
                if (touched.twoFactorCode) setErrors((prev) => ({ ...prev, twoFactorCode: validateTwoFactor(clean) }));
              }}
              onBlur={() => handleBlur('twoFactorCode')}
              placeholder="6-digit TOTP code (e.g. 849201)"
              error={errors.twoFactorCode}
              icon={<KeyRound size={16} />}
              required
              maxLength={6}
              autoComplete="one-time-code"
              disabled={isLoading || lockoutSeconds > 0}
            />

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="admin-remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading || lockoutSeconds > 0}
                  className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-400">
                  Remember this workstation
                </span>
              </label>

              <span className="text-[11px] text-slate-500 font-mono">
                IP verified
              </span>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className={`w-full py-3.5 mt-2 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                isLoading || lockoutSeconds > 0 ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Verifying Cryptographic Tokens...</span>
                </>
              ) : lockoutSeconds > 0 ? (
                <span>Locked ({lockoutSeconds}s)</span>
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Test Rate-Limit Simulator Trigger (Demonstration helper) */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setPassword('fail');
                setServerError('Simulated incorrect password inserted.');
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300 font-mono transition underline cursor-pointer"
            >
              [Test Rate Limit]: Click to insert incorrect credentials
            </button>
          </div>
        </div>
      </main>

      {/* Subtle Security Indicator Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 py-3 border-t border-slate-900 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-indigo-400" />
          <span>Secured Connection • TLS 1.3 • SOC2 Type II Certified</span>
        </div>
        <span className="font-mono text-[11px] text-slate-600">
          Hardware Security Module (HSM) Active
        </span>
      </footer>
    </div>
  );
};

export default AdminAuth;
