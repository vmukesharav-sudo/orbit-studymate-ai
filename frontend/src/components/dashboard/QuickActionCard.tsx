import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color: 'cyan' | 'violet' | 'magenta' | 'emerald' | 'blue';
}

export const QuickActionCard: React.FC<QuickActionProps> = ({
  title,
  description,
  icon: Icon,
  path,
  color,
}) => {
  const colorSchemes = {
    cyan: {
      border: 'hover:border-cosmic-cyan/50',
      iconBg: 'bg-cosmic-cyan/10 text-cosmic-cyan',
      glow: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    },
    violet: {
      border: 'hover:border-cosmic-violet/50',
      iconBg: 'bg-cosmic-violet/10 text-cosmic-violet',
      glow: 'group-hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]',
    },
    magenta: {
      border: 'hover:border-cosmic-magenta/50',
      iconBg: 'bg-cosmic-magenta/10 text-cosmic-magenta',
      glow: 'group-hover:shadow-[0_0_20px_rgba(217,70,239,0.2)]',
    },
    emerald: {
      border: 'hover:border-emerald-400/50',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]',
    },
    blue: {
      border: 'hover:border-cosmic-blue/50',
      iconBg: 'bg-cosmic-blue/10 text-blue-400',
      glow: 'group-hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]',
    },
  };

  const scheme = colorSchemes[color];

  return (
    <Link to={path} className="group block">
      <GlassCard
        className={`p-5 transition-all duration-300 ${scheme.border} ${scheme.glow} hover:-translate-y-1 h-full flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-11 h-11 rounded-2xl ${scheme.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
              <Icon className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-ui-textSecondary group-hover:text-white transition-colors" />
          </div>

          <h4 className="font-heading font-semibold text-white text-base group-hover:text-cosmic-cyan transition-colors">
            {title}
          </h4>
          <p className="text-xs text-ui-textSecondary mt-1 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] font-mono text-ui-textSecondary group-hover:text-white transition-colors">
          <span>Launch Module</span>
          <span>→</span>
        </div>
      </GlassCard>
    </Link>
  );
};

export default QuickActionCard;

