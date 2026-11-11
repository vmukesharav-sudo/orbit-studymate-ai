import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'violet' | 'none';
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = 'none',
  onClick,
  hoverEffect = false,
}) => {
  const glowStyles = {
    none: 'border-white/[0.08] hover:border-white/[0.16]',
    cyan: 'border-cosmic-cyan/30 shadow-[0_0_20px_rgba(34,211,238,0.12)] hover:border-cosmic-cyan/50',
    violet: 'border-cosmic-violet/30 shadow-[0_0_20px_rgba(139,92,246,0.12)] hover:border-cosmic-violet/50',
  };

  const hoverClass = hoverEffect
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-space-800/60 backdrop-blur-xl border ${glowStyles[glow]} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;

