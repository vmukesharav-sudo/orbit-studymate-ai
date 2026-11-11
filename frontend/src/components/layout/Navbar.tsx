import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Compass, LogIn, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GlowingButton from '../ui/GlowingButton';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-space-950/70 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Spinning orbital ring */}
            <div className="absolute inset-0 rounded-full border border-cosmic-cyan/60 animate-orbit-spin group-hover:border-cosmic-cyan transition-colors" />
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cosmic-violet via-cosmic-blue to-cosmic-cyan shadow-neon-cyan/50" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-heading font-bold tracking-wider text-white group-hover:text-cosmic-cyan transition-colors">
              ORBIT
            </span>
            <span className="text-[10px] font-mono tracking-widest text-cosmic-cyan -mt-1 uppercase">
              Gemini StudyMate AI
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ui-textSecondary">
          <a href="#features" className="hover:text-cosmic-cyan transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-cosmic-cyan transition-colors">How It Works</a>
          <a href="#capabilities" className="hover:text-cosmic-cyan transition-colors">AI Engine</a>
          <a href="#faq" className="hover:text-cosmic-cyan transition-colors">FAQ</a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <GlowingButton variant="cyan" size="sm" icon={<LayoutDashboard className="w-4 h-4" />}>
                  Dashboard
                </GlowingButton>
              </Link>
              <button
                onClick={logout}
                className="text-xs font-mono text-ui-textSecondary hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/auth?mode=login">
                <GlowingButton variant="secondary" size="sm" icon={<LogIn className="w-4 h-4" />}>
                  Sign In
                </GlowingButton>
              </Link>
              <Link to="/auth?mode=register">
                <GlowingButton variant="primary" size="sm" icon={<Sparkles className="w-4 h-4 text-cosmic-cyan" />}>
                  Get Started
                </GlowingButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

