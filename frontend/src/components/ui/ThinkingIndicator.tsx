import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface ThinkingIndicatorProps {
  label?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ label }) => {
  const defaultLabels = [
    'Synthesizing with Gemini Intelligence...',
    'Analyzing academic context...',
    'Formulating structured explanations...',
    'Refining conceptual clarity...'
  ];

  const [currentLabelIdx, setCurrentLabelIdx] = useState(0);

  useEffect(() => {
    if (label) return;
    const interval = setInterval(() => {
      setCurrentLabelIdx((prev) => (prev + 1) % defaultLabels.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [label]);

  const activeText = label || defaultLabels[currentLabelIdx];

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-space-800/80 border border-cosmic-cyan/30 backdrop-blur-md shadow-neon-cyan/20 w-fit">
      {/* Animated Mini Core */}
      <div className="relative w-5 h-5 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-cosmic-cyan animate-ping opacity-60" />
        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cosmic-cyan to-cosmic-violet animate-pulse" />
      </div>

      <div className="flex items-center gap-1.5 text-xs font-mono text-cosmic-cyan tracking-wide">
        <Sparkles className="w-3.5 h-3.5 text-cosmic-violet animate-spin" style={{ animationDuration: '6s' }} />
        <span>{activeText}</span>
      </div>
    </div>
  );
};

export default ThinkingIndicator;

