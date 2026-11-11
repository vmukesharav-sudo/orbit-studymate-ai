import React from 'react';
import { OrbitAiOrb } from '../3d/OrbitAiOrb';
import { FileText, HelpCircle, MessageSquare, Clock, Zap } from 'lucide-react';

interface KnowledgeCoreProps {
  documentsCount: number;
  quizzesCount: number;
  questionsCount: number;
  studyHours: number;
  streakDays: number;
}

export const KnowledgeCore: React.FC<KnowledgeCoreProps> = ({
  documentsCount,
  quizzesCount,
  questionsCount,
  studyHours,
  streakDays,
}) => {
  const metrics = [
    { label: 'Documents', value: documentsCount, icon: FileText, color: 'text-cosmic-cyan', border: 'border-cosmic-cyan/30' },
    { label: 'Quizzes Taken', value: quizzesCount, icon: HelpCircle, color: 'text-cosmic-violet', border: 'border-cosmic-violet/30' },
    { label: 'AI Queries', value: questionsCount, icon: MessageSquare, color: 'text-blue-400', border: 'border-blue-400/30' },
    { label: 'Study Hours', value: `${studyHours}h`, icon: Clock, color: 'text-cosmic-magenta', border: 'border-cosmic-magenta/30' },
    { label: 'Day Streak', value: `${streakDays}d`, icon: Zap, color: 'text-amber-400', border: 'border-amber-400/30' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-space-800/80 to-space-900/90 border border-cosmic-violet/20 p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
      {/* Background ambient circular rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <div className="w-[500px] h-[500px] rounded-full border border-dashed border-cosmic-violet/40 animate-orbit-spin" />
        <div className="absolute w-[360px] h-[360px] rounded-full border border-cosmic-cyan/30 animate-pulse-slow" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left: Introduction & Live Metric Rings */}
        <div className="max-w-md text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cosmic-cyan/10 border border-cosmic-cyan/30 text-[11px] font-mono text-cosmic-cyan mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cosmic-cyan animate-ping" />
            SYNCHRONIZED LEARNING CORE
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
            ORBIT Knowledge Core
          </h2>
          <p className="text-sm text-ui-textSecondary mt-2 leading-relaxed">
            Your live academic cognitive sphere. Every document synthesized, question answered, and quiz completed powers your orbital intelligence.
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className={`p-3 rounded-2xl bg-space-950/60 border ${m.border} backdrop-blur-md flex flex-col items-center sm:items-start`}
                >
                  <div className="flex items-center gap-1.5 text-xs text-ui-textSecondary mb-1 font-mono">
                    <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                    <span className="truncate">{m.label}</span>
                  </div>
                  <span className={`text-xl font-heading font-bold ${m.color}`}>
                    {m.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Signature 3D AI Orb */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="relative">
            {/* Glowing background aura */}
            <div className="absolute inset-0 bg-gradient-to-r from-cosmic-violet/30 via-cosmic-cyan/20 to-cosmic-magenta/30 rounded-full blur-3xl" />
            <OrbitAiOrb state="idle" size="lg" />
          </div>
          <span className="text-[11px] font-mono text-ui-textMuted mt-2 tracking-widest uppercase">
            Orbital Engine v2.5 Online
          </span>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCore;

