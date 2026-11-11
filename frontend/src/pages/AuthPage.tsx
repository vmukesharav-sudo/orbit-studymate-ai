import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Eye, EyeOff, Lock, Mail, User as UserIcon, ArrowLeft, AlertCircle } from 'lucide-react';
import GlowingButton from '../components/ui/GlowingButton';
import CosmicCanvas from '../components/3d/CosmicCanvas';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [isRegister, setIsRegister] = useState<boolean>(initialMode === 'register');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setIsRegister(searchParams.get('mode') === 'register');
    setError(null);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (isRegister && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, fullName.trim());
      } else {
        await login(email.trim(), password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-space-950 text-ui-textPrimary flex items-center justify-center p-4">
      <CosmicCanvas />

      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-xs font-mono text-ui-textSecondary hover:text-white transition-colors px-3 py-2 rounded-xl bg-space-900/60 border border-white/10 backdrop-blur-md"
      >
        <ArrowLeft className="w-4 h-4 text-cosmic-cyan" />
        <span>Return to Universe</span>
      </Link>

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-space-900/75 border border-cosmic-cyan/30 backdrop-blur-2xl shadow-2xl p-8 sm:p-10 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-cosmic-cyan via-cosmic-violet to-cosmic-magenta" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-cosmic-violet to-cosmic-cyan p-0.5 mb-3 shadow-neon-cyan/40">
            <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cosmic-cyan" />
            </div>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white tracking-tight">
            {isRegister ? 'Join the ORBIT Universe' : 'Welcome back to ORBIT'}
          </h2>
          <p className="text-xs text-ui-textSecondary mt-1.5">
            {isRegister
              ? 'Initialize your personal AI learning environment'
              : 'Sign in to access your study materials & insights'}
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ui-textSecondary mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ui-textMuted">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  required={isRegister}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-space-800/80 border border-white/10 focus:border-cosmic-cyan focus:outline-none focus:ring-1 focus:ring-cosmic-cyan text-sm text-white placeholder-ui-textMuted transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ui-textSecondary mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ui-textMuted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-space-800/80 border border-white/10 focus:border-cosmic-cyan focus:outline-none focus:ring-1 focus:ring-cosmic-cyan text-sm text-white placeholder-ui-textMuted transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ui-textSecondary mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ui-textMuted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-space-800/80 border border-white/10 focus:border-cosmic-cyan focus:outline-none focus:ring-1 focus:ring-cosmic-cyan text-sm text-white placeholder-ui-textMuted transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ui-textMuted hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <GlowingButton
              type="submit"
              variant="cyan"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {isRegister ? 'Create Account' : 'Authenticate'}
            </GlowingButton>
          </div>
        </form>

        {/* Mode Toggle Switch */}
        <div className="mt-6 pt-6 border-t border-white/[0.08] text-center text-xs text-ui-textSecondary">
          {isRegister ? (
            <p>
              Already have an ORBIT account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="font-semibold text-cosmic-cyan hover:underline ml-1"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New to ORBIT?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="font-semibold text-cosmic-cyan hover:underline ml-1"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

