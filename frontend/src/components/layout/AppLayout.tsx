import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FloatingDock from './FloatingDock';
import { Sparkles, Bell, Search, Flame, LogOut } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'OB';

  return (
    <div className="min-h-screen bg-space-950 text-ui-textPrimary flex flex-col relative selection:bg-cosmic-violet selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[300px] bg-cosmic-violet/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/3 right-1/4 w-[400px] h-[300px] bg-cosmic-cyan/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-space-900/60 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Left: Brand & Page Context */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cosmic-violet to-cosmic-cyan flex items-center justify-center p-0.5 shadow-neon-cyan/30">
              <div className="w-full h-full bg-space-900 rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cosmic-cyan" />
              </div>
            </div>
            <span className="font-heading font-bold text-lg tracking-wider text-white group-hover:text-cosmic-cyan transition-colors">
              ORBIT
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/10 text-xs font-mono text-ui-textSecondary">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gemini Intelligence Core Active</span>
          </div>
        </div>

        {/* Right: Search, Streak, Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/ask"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-space-800/80 border border-white/10 hover:border-cosmic-cyan/40 text-xs text-ui-textSecondary hover:text-white transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-cosmic-cyan" />
            <span className="hidden md:inline">Ask Orbit anything...</span>
            <kbd className="hidden md:inline text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-ui-textMuted">⌘K</kbd>
          </Link>

          {/* User Initials Badge & Logout */}
          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cosmic-violet to-cosmic-blue flex items-center justify-center text-xs font-heading font-bold text-white shadow-md">
                {userInitials}
              </div>
              <span className="hidden lg:inline text-xs font-medium text-ui-textPrimary">
                {user?.full_name?.split(' ')[0]}
              </span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              title="Sign Out"
              className="p-2 rounded-xl text-ui-textSecondary hover:text-red-400 hover:bg-white/[0.06] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-28 pt-4 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Floating Study Dock */}
      <FloatingDock />
    </div>
  );
};

export default AppLayout;

