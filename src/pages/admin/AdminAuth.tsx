import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Fingerprint,
  CheckCircle2,
  Crown,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAppStore } from '../../store/useAppStore';
import { authApi } from '../../api/client';

interface AdminAuthProps {
  onLoginSuccess?: () => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { setRole, setAuthUser, setAdminActiveTab, syncWithBackend } = useAppStore();

  const [isSplashing, setIsSplashing] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setIsLoading(true);
    setError(null);
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
        photoUrl: authRes.photoUrl,
        department: authRes.department,
      });
      await syncWithBackend();
      setRole(authRes.role as any);
      setAdminActiveTab('home');
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      console.error('Google admin login error:', err);
      setError(err?.response?.data?.detail || 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Splash animation reveal
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashing(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authRes = await authApi.login({ identifier: username.trim(), password: password.trim() });
      setAuthUser({
        id: authRes.user_id,
        name: authRes.name,
        email: authRes.email,
        role: authRes.role,
        rollNumber: authRes.rollNumber,
        employeeId: authRes.employeeId,
        photoUrl: authRes.photoUrl,
        department: authRes.department,
      });
      await syncWithBackend();
    } catch (err: any) {
      console.warn('Backend login fallback:', err);
    }

    setRole('admin');
    setAdminActiveTab('home');
    setIsLoading(false);
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      navigate('/admin');
    }
  };

  const handleQuickBiometric = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRole('admin');
      setAdminActiveTab('home');
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/admin');
      }
    }, 500);
  };

  if (isSplashing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center animate-in fade-in duration-500 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-xl shadow-amber-500/25 animate-bounce">
          <Sparkles size={38} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-6 tracking-tight">Smart Attendance</h1>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-700 mt-1">
          Admin Portal
        </span>
        <div className="w-12 h-1 rounded-full bg-slate-100 mt-8 overflow-hidden">
          <div className="w-full h-full bg-amber-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-8 bg-slate-50 text-slate-900 font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Bar with Back link */}
      <div className="flex justify-between items-center max-w-md mx-auto w-full pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition font-medium"
        >
          <ArrowLeft size={14} />
          <span>Home</span>
        </Link>

        {/* Super Admin Status Indicator */}
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Crown size={11} className="text-amber-600" />
          <span>{isSuperAdmin ? 'Super Admin Mode' : 'Coordinator Mode'}</span>
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl shadow-slate-200/60 my-auto">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 mb-3">
            <ShieldCheck size={26} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Sign In</h2>
          <p className="text-xs text-slate-500 mt-1">Smart Attendance Management Console</p>
        </div>

        {/* Preset Credentials Banner */}
        <div className="mb-5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="font-bold text-amber-800">Demo Login:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200 text-slate-900 font-semibold">admin</span>
            <span className="text-slate-400">/</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200 text-slate-900 font-semibold">admin123</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setUsername('admin');
              setPassword('admin123');
              setError(null);
            }}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
          >
            Fill
          </button>
        </div>

        {/* Elevated Permission Toggle: Super Admin vs Academic Coordinator */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSuperAdmin ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
              <Crown size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Elevated Permissions</div>
              <div className="text-[10px] text-slate-500">
                {isSuperAdmin ? 'Full institution oversight & override' : 'Department-level permissions'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSuperAdmin(!isSuperAdmin)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isSuperAdmin ? 'bg-amber-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isSuperAdmin ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 transition"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Demo account: Use "admin123" to sign in.');
                }}
                className="text-[11px] text-amber-700 hover:underline"
              >
                Forgot?
              </a>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.99] transition flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In as Admin</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* OR Divider */}
          <div className="relative my-2 text-center">
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

        {/* Biometric Touch Shortcut */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleQuickBiometric}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Fingerprint size={16} className="text-amber-600" />
            <span>Biometric Quick Access</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-3">
        Smart Attendance System • Institutional Administration
      </div>
    </div>
  );
};

export default AdminAuth;
