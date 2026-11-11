import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Layers,
  Sparkles,
  HelpCircle,
  CalendarCheck,
  BarChart3,
  Settings
} from 'lucide-react';

interface DockItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

export const FloatingDock: React.FC = () => {
  const dockItems: DockItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Ask ORBIT', path: '/ask', icon: MessageSquare, badge: 'AI' },
    { name: 'PDF Library', path: '/documents', icon: FileText },
    { name: 'Doc Workspace', path: '/workspace', icon: Layers },
    { name: 'Summaries', path: '/summary', icon: Sparkles },
    { name: 'Quiz Engine', path: '/quiz', icon: HelpCircle },
    { name: 'Exam Planner', path: '/planner', icon: CalendarCheck },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded-2xl bg-space-900/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex items-center gap-1.5 sm:gap-2 select-none max-w-[96vw] overflow-x-auto">
      {dockItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative group flex flex-col items-center justify-center p-2.5 sm:px-3 sm:py-2.5 rounded-xl transition-all duration-300
              ${isActive
                ? 'bg-gradient-to-b from-cosmic-violet/30 to-cosmic-blue/20 text-cosmic-cyan border border-cosmic-cyan/40 shadow-neon-cyan/20'
                : 'text-ui-textSecondary hover:text-white hover:bg-white/[0.06] border border-transparent'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-cosmic-cyan animate-pulse' : ''}`} />
                
                {/* Micro tooltip label */}
                <span className="hidden lg:block text-[10px] font-mono mt-1 opacity-80 group-hover:opacity-100 whitespace-nowrap">
                  {item.name}
                </span>

                {/* Badge if any */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-mono px-1 py-0.2 rounded-full bg-cosmic-cyan text-space-950 font-bold uppercase shadow-sm">
                    {item.badge}
                  </span>
                )}

                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-cosmic-cyan shadow-[0_0_8px_#22D3EE]" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};

export default FloatingDock;

