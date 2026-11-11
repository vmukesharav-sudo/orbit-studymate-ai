import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'blue' | 'rose' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  icon,
}) => {
  const variantStyles = {
    cyan: 'bg-cosmic-cyan/10 text-cosmic-cyan border-cosmic-cyan/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]',
    violet: 'bg-cosmic-violet/10 text-cosmic-violet border-cosmic-violet/30 shadow-[0_0_10px_rgba(139,92,246,0.15)]',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.15)]',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.15)]',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    neutral: 'bg-white/[0.06] text-ui-textSecondary border-white/10',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border backdrop-blur-md uppercase tracking-wider ${sizeStyles[size]} ${variantStyles[variant]}`}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;

