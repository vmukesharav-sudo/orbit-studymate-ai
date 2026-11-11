import React, { useState } from 'react';
import { Sparkles, CheckCircle2, BookOpen, BrainCircuit } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

interface ConstellationNode {
  id: string;
  label: string;
  type: 'document' | 'quiz' | 'plan' | 'mastery';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  status: string;
  score?: string;
}

interface LearningConstellationProps {
  documentsCount: number;
  quizzesCount: number;
  tasksCompleted: number;
  subjectProgress?: { subject: string; progress: number }[];
}

export const LearningConstellation: React.FC<LearningConstellationProps> = ({
  documentsCount,
  quizzesCount,
  tasksCompleted,
  subjectProgress = [],
}) => {
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);

  // Generate dynamic constellation nodes based on real user activity
  const defaultNodes: ConstellationNode[] = [
    { id: '1', label: 'PDF Documents', type: 'document', x: 20, y: 35, status: `${documentsCount} Uploaded` },
    { id: '2', label: 'Active Recall', type: 'quiz', x: 45, y: 20, status: `${quizzesCount} Completed` },
    { id: '3', label: 'Study Milestones', type: 'plan', x: 75, y: 35, status: `${tasksCompleted} Done` },
    { id: '4', label: 'Gemini Synthesis', type: 'mastery', x: 50, y: 70, status: 'Active Guidance' },
  ];

  // If user has actual subjects, add them dynamically as celestial nodes
  subjectProgress.slice(0, 3).forEach((sp, idx) => {
    const positions = [
      { x: 30, y: 55 },
      { x: 65, y: 60 },
      { x: 50, y: 40 },
    ];
    defaultNodes.push({
      id: `subj-${idx}`,
      label: sp.subject,
      type: 'plan',
      x: positions[idx].x,
      y: positions[idx].y,
      status: `${sp.progress}% Mastered`,
      score: `${sp.progress}%`
    });
  });

  return (
    <GlassCard glow="violet" className="p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-cosmic-violet" />
          <h3 className="font-heading font-semibold text-white text-lg">
            Learning Constellation
          </h3>
        </div>
        <span className="text-xs font-mono text-cosmic-cyan bg-cosmic-cyan/10 px-2.5 py-0.5 rounded-full border border-cosmic-cyan/20">
          Knowledge Graph
        </span>
      </div>

      <p className="text-xs text-ui-textSecondary mb-6">
        Interconnected knowledge nodes mapping your academic progress and concept mastery across uploaded materials.
      </p>

      {/* Interactive Constellation SVG Canvas */}
      <div className="relative w-full h-64 sm:h-72 rounded-2xl bg-space-950/70 border border-white/[0.06] overflow-hidden">
        {/* Background stars */}
        <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

        <svg className="w-full h-full">
          {/* Energy Connection Lines */}
          <line x1="20%" y1="35%" x2="45%" y2="20%" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="45%" y1="20%" x2="75%" y2="35%" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="20%" y1="35%" x2="50%" y2="70%" stroke="rgba(37,99,235,0.4)" strokeWidth="1.5" />
          <line x1="75%" y1="35%" x2="50%" y2="70%" stroke="rgba(217,70,239,0.4)" strokeWidth="1.5" />
          {defaultNodes.length > 4 && (
            <line x1="45%" y1="20%" x2="50%" y2="70%" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5" />
          )}

          {/* Render Nodes */}
          {defaultNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <g
                key={node.id}
                className="cursor-pointer transition-transform"
                onClick={() => setSelectedNode(node)}
                onMouseEnter={() => setSelectedNode(node)}
              >
                {/* Outer Pulse Ring */}
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={isSelected ? 16 : 10}
                  fill="none"
                  stroke={node.type === 'document' ? '#22D3EE' : node.type === 'quiz' ? '#8B5CF6' : '#D946EF'}
                  strokeWidth="1.5"
                  className={isSelected ? 'animate-ping opacity-75' : 'opacity-40'}
                />

                {/* Core Center Node */}
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={isSelected ? 8 : 6}
                  fill={node.type === 'document' ? '#22D3EE' : node.type === 'quiz' ? '#8B5CF6' : '#D946EF'}
                  className="shadow-lg transition-all duration-300"
                />

                {/* Node Label Text */}
                <text
                  x={`${node.x}%`}
                  y={`${node.y + 7}%`}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="10"
                  fontFamily="Space Grotesk, sans-serif"
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Status Tooltip */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto px-4 py-2.5 rounded-xl bg-space-900/90 border border-cosmic-cyan/40 backdrop-blur-md text-xs shadow-xl flex items-center justify-between gap-4">
            <div>
              <span className="font-heading font-bold text-white block">
                {selectedNode.label}
              </span>
              <span className="text-[11px] font-mono text-cosmic-cyan">
                {selectedNode.status}
              </span>
            </div>
            <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-ui-textSecondary uppercase">
              {selectedNode.type}
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default LearningConstellation;

