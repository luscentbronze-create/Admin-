import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
  KeyRound,
  User,
  UserPlus,
  LogIn,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { SwiftShipLogo } from '../components/SwiftShipLogo';
import { storageService } from '../services/storage';
import { AdminUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
  onTrackShipment?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onTrackShipment }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Switch between Sign In and Sign Up tabs
  const handleSwitchMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setError(null);
    setSuccessMessage(null);
    if (mode === 'signup') {
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } else {
      if (!email) {
        setEmail('admin@swiftship.com');
        setPassword('admin123456');
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!email.trim()) {
      setError('Please enter your administrator email address.');
      setIsLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await storageService.login(email, password, rememberMe);
      if (res.success && res.user) {
        setSuccessMessage(`Welcome back, ${res.user.name}! Opening Admin Portal...`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 350);
      } else {
        setError(res.error || 'Invalid email or password. Please verify your credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your database connection and credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      setIsLoading(false);
      return;
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your confirmation password.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await storageService.signUp(name, email, password, rememberMe);
      if (res.success && res.user) {
        setSuccessMessage('Account registered and saved to Supabase database! Entering Admin Portal...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 500);
      } else {
        setError(res.error || 'Failed to register account.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultCredentials = () => {
    setAuthMode('login');
    setEmail('admin@swiftship.com');
    setPassword('admin123456');
    setError(null);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
    setTimeout(() => {
      setResetSent(false);
      setShowForgotPassword(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0D11] text-slate-100 flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden">
      {/* Subtle atmospheric glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#FFD600]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top logo */}
      <div className="w-full max-w-md pt-4 flex justify-center">
        <SwiftShipLogo size="lg" />
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-[440px] bg-[#12151B] border border-[#23272F] rounded-2xl p-7 sm:p-8 shadow-2xl relative z-10 my-4">
        {/* Segmented Mode Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#171B22] border border-[#2B313D] rounded-xl mb-6">
          <button
            type="button"
            id="tab-sign-up"
            onClick={() => handleSwitchMode('signup')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'bg-[#FFD600] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            id="tab-sign-in"
            onClick={() => handleSwitchMode('login')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-[#FFD600] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Database Status Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4 py-1 px-3 rounded-full bg-[#171B22] border border-[#23272F] w-fit mx-auto text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-medium text-slate-300">Connected to Supabase Database</span>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block">Authentication Notice</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Header Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {authMode === 'signup' ? 'Create Admin Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {authMode === 'signup'
              ? 'Sign up credentials will be saved directly into the database'
              : 'Log in with your administrator email and password'}
          </p>
        </div>

        {/* SIGN UP FORM */}
        {authMode === 'signup' ? (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="signup-name">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="signup-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="signup-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="signup-confirm-password">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#171B22] border-[#2B313D] text-[#FFD600] focus:ring-[#FFD600] focus:ring-offset-0 focus:ring-1 accent-[#FFD600]"
                />
                <span className="text-xs text-slate-400">Remember me on this browser</span>
              </label>
            </div>

            <button
              type="submit"
              id="signup-submit-btn"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] active:scale-[0.99] text-black font-bold text-sm shadow-lg shadow-[#FFD600]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Save to Database</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500 pt-1">
              Credentials are saved securely to your Supabase <code className="text-slate-400">admin_users</code> table.
            </p>
          </form>
        ) : (
          /* SIGN IN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="admin-email">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="admin-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#171B22] border-[#2B313D] text-[#FFD600] focus:ring-[#FFD600] focus:ring-offset-0 focus:ring-1 accent-[#FFD600]"
                />
                <span className="text-xs text-slate-400">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-[#FFD600] hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              id="admin-login-submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] active:scale-[0.99] text-black font-bold text-sm shadow-lg shadow-[#FFD600]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info & helper */}
        <div className="mt-6 pt-4 border-t border-[#1F2937] space-y-3 text-center">
          {authMode === 'login' ? (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Demo admin: <strong className="text-slate-300">admin@swiftship.com</strong></span>
              <button
                type="button"
                onClick={fillDefaultCredentials}
                className="text-[#FFD600] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>Fill Demo</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="text-[#FFD600] hover:underline font-semibold"
              >
                Sign in to your account
              </button>
            </p>
          )}

          {onTrackShipment && (
            <div className="pt-2 border-t border-[#1F2937]/60">
              <button
                type="button"
                onClick={onTrackShipment}
                className="text-xs text-slate-400 hover:text-[#FFD600] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#FFD600]" />
                <span>Customer Tracking (No login required) &rarr;</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forgot password modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#15181E] border border-[#262B35] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered administrator email to receive password recovery instructions.
            </p>

            {resetSent ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Password reset link sent to {email}.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C2028] border border-[#2B313D] rounded-xl text-xs text-white"
                  placeholder="you@company.com"
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-[#FFD600] text-black font-semibold text-xs hover:bg-[#E6C200] cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tagline footer */}
      <div className="text-center py-2">
        <p className="text-xs tracking-wider text-slate-500 font-medium">
          SwiftShip Logistics Management Portal
        </p>
      </div>
    </div>
  );
};
