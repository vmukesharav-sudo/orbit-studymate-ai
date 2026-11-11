import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlowingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cyan' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const GlowingButton: React.FC<GlowingButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center font-medium font-heading transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-cosmic-violet via-cosmic-purple to-cosmic-blue text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:brightness-110 border border-violet-400/30',
    cyan: 'bg-gradient-to-r from-cosmic-blue via-cosmic-cyan to-teal-400 text-space-950 font-semibold shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.7)] hover:brightness-110 border border-cyan-300/40',
    secondary: 'bg-space-700/80 hover:bg-space-600/90 text-ui-textPrimary border border-white/10 hover:border-white/20 backdrop-blur-md shadow-lg',
    outline: 'bg-transparent hover:bg-white/[0.06] text-ui-textPrimary border border-white/20 hover:border-cosmic-cyan/60 hover:text-cosmic-cyan',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Subtle shine sweep */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
      
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="transition-transform group-hover:scale-110">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default GlowingButton;

