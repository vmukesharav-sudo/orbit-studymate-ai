import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  HelpCircle,
  CalendarCheck,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Layers,
  Zap,
  ShieldCheck,
  Github,
  Cpu,
  GraduationCap,
  Code,
  FileText,
  Clock
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import CosmicCanvas from '../components/3d/CosmicCanvas';
import OrbitAiOrb from '../components/3d/OrbitAiOrb';
import GlowingButton from '../components/ui/GlowingButton';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeModeTab, setActiveModeTab] = useState<'beginner' | 'exam' | 'technical' | 'revision' | 'coding'>('exam');

  const studyModePreviews = {
    beginner: {
      title: 'Beginner Mode (Plain English & Everyday Analogies)',
      query: 'What is a Distributed System and why does the CAP Theorem matter?',
      response: 'Think of a distributed system like a team of cooks in a restaurant. Instead of one chef doing all the work, multiple chefs communicate so orders get served fast.\n\nThe CAP Theorem simply says you can never have it all. Imagine ordering food: you can have consistency (every chef knows the exact same recipe right now) and availability (every chef always answers immediately), but if the intercom breaks (network partition), you have to choose between waiting for everyone to sync or serving what you already know!',
      tag: 'Zero Unexplained Jargon'
    },
    exam: {
      title: 'Exam Mode (Mark-Optimized Academic Format)',
      query: 'Explain the Two-Phase Commit (2PC) Protocol and its failure modes.',
      response: '1. FORMAL DEFINITION: Two-Phase Commit (2PC) is an atomic commitment protocol ensuring all participating database nodes either commit or abort a distributed transaction (Atomicity).\n\n2. PHASE BREAKDOWN:\n• Phase 1 (Prepare): Coordinator broadcasts PREPARE. Cohorts write changes to Write-Ahead Log (WAL) and reply VOTE_COMMIT or VOTE_ABORT.\n• Phase 2 (Commit): If all cohorts vote COMMIT, Coordinator issues GLOBAL_COMMIT. If any vote ABORT or time out, Coordinator broadcasts GLOBAL_ABORT.\n\n3. KEY ADVANTAGES & LIMITATIONS:\n• Guarantees ACID atomicity across heterogeneous nodes.\n• Blocking protocol: If the coordinator crashes during Phase 2, cohorts are blocked indefinitely holding resource locks.',
      tag: 'University Scoring Standard'
    },
    technical: {
      title: 'Technical Mode (Deep Architectural & Algorithmic Rigor)',
      query: 'How does the Raft Consensus Algorithm handle split-vote scenarios?',
      response: 'Raft prevents persistent split votes by introducing randomized election timeouts, typically set between [150ms, 300ms]. When a follower misses heartbeats, it enters Candidate state, increments currentTerm, votes for itself, and broadcasts RequestVote RPCs.\n\nBecause timers are desynchronized, one node usually times out first, gathers a quorum majority (N/2 + 1) before others expire, and transitions to Leader. If two candidates split votes simultaneously, the election times out and the node with the shorter randomized backoff triggers a decisive reelection.',
      tag: 'Systems & Architecture'
    },
    revision: {
      title: 'Quick Revision Mode (High-Density Flash Memory Notes)',
      query: 'Key memory hooks for SQL Indexing & B-Trees.',
      response: '• B-Tree Index: Balanced tree with O(log N) search, insert, delete. High fan-out reduces disk I/O.\n• Clustered vs Non-Clustered: Clustered determines physical order of rows (1 per table). Non-clustered stores pointers to data.\n• Cardinality Rule: Index columns with high selectivity (unique values).\n• Common Pitfall: Function calls on indexed columns (e.g. WHERE UPPER(name)) bypass index scans.',
      tag: 'Rapid Exam Recall'
    },
    coding: {
      title: 'Coding Mode (Syntax Highlighted & Complexity Analysis)',
      query: 'Implement QuickSelect to find the Kth largest element with time complexity.',
      response: '// Average Time: O(N) | Worst Case: O(N^2) | Space: O(1)\nfunction findKthLargest(nums: number[], k: number): number {\n  const targetIdx = nums.length - k;\n  function quickSelect(left: number, right: number): number {\n    const pivot = nums[right];\n    let pIdx = left;\n    for (let i = left; i < right; i++) {\n      if (nums[i] <= pivot) {\n        [nums[i], nums[pIdx]] = [nums[pIdx], nums[i]];\n        pIdx++;\n      }\n    }\n    [nums[pIdx], nums[right]] = [nums[right], nums[pIdx]];\n    if (pIdx === targetIdx) return nums[pIdx];\n    if (pIdx < targetIdx) return quickSelect(pIdx + 1, right);\n    return quickSelect(left, pIdx - 1);\n  }\n  return quickSelect(0, nums.length - 1);\n}',
      tag: 'Production-Grade Implementation'
    }
  };

  const features = [
    {
      title: 'Document Intelligence',
      description: 'Upload complex textbook chapters, research papers, and lecture slides. Query material with verifiable [Page X] citations.',
      icon: BookOpen,
      badge: 'Grounded RAG',
      glow: 'cyan' as const
    },
    {
      title: '5 Adaptive Study Modes',
      description: 'Switch between Beginner, Exam, Technical, Quick Revision, and Coding Modes to match your study objectives.',
      icon: Layers,
      badge: 'Multi-Modal',
      glow: 'violet' as const
    },
    {
      title: 'Active Recall Quiz Engine',
      description: 'Generate high-yield MCQs and conceptual problem sets straight from notes. Instant grading, countdown timer, and weak-topic diagnostics.',
      icon: HelpCircle,
      badge: 'Active Recall',
      glow: 'cyan' as const
    },
    {
      title: 'Strategic Exam Timetable',
      description: 'Input your exam date and daily study bandwidth. ORBIT creates a realistic day-by-day timetable with scheduled revision checkpoints.',
      icon: CalendarCheck,
      badge: 'AI Planner',
      glow: 'violet' as const
    },
    {
      title: 'Cognitive Analytics',
      description: 'Monitor your study streak, topic mastery, and retention curves. Receive personalized Gemini recommendations based on real quiz performance.',
      icon: BarChart3,
      badge: 'Telemetry',
      glow: 'cyan' as const
    },
    {
      title: 'High-Yield Synthesizer',
      description: 'Transform 60-page PDF slides into executive summaries, chapter definitions, key formulas, and downloadable revision cards.',
      icon: Sparkles,
      badge: 'Synthesis',
      glow: 'violet' as const
    }
  ];

  const faqs = [
    {
      q: 'How does ORBIT prevent AI hallucination when answering questions?',
      a: 'ORBIT uses strict document grounding. Our PDF engine extracts text page-by-page, builds targeted semantic chunks, and instructs Google Gemini to answer strictly based on the uploaded material with explicit [Page X] citations. When information is missing from the document, ORBIT clearly labels it as general AI guidance.'
    },
    {
      q: 'Which Google Gemini model powers ORBIT?',
      a: 'ORBIT connects dynamically to the official Google Gen AI Python SDK using currently supported models such as gemini-2.5-flash and gemini-1.5-flash. The model is dynamically configurable via backend environment settings.'
    },
    {
      q: 'Are my uploaded documents private and secure?',
      a: 'Yes. Every document, chat conversation, and quiz attempt is isolated to your authenticated student account. No other user can access your uploaded study notes.'
    },
    {
      q: 'Can I use ORBIT for technical subjects and computer science?',
      a: 'Absolutely. ORBIT features a dedicated Coding Mode and Technical Mode that provide structured algorithmic breakdowns, code syntax highlighting, time/space complexity analysis, and mathematical formulations.'
    }
  ];

  return (
    <div className="relative min-h-screen bg-space-950 text-ui-textPrimary overflow-hidden font-sans selection:bg-cosmic-violet selection:text-white">
      {/* Background Deep Space Starfield Canvas */}
      <CosmicCanvas />

      {/* Top Navbar */}
      <Navbar />

      {/* Hero Section: Split 2-Column Layout */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines, Tagline & CTAs (7 cols) */}
          <div className="lg:col-span-7 text-left space-y-6">
            {/* Release Beacon */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-space-900/80 border border-cosmic-cyan/30 text-xs font-mono text-cosmic-cyan shadow-neon-cyan/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cosmic-cyan animate-ping" />
              <span>POWERED BY GOOGLE GEMINI 2.5 FLASH</span>
            </div>

            {/* Hero Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold text-white tracking-tight leading-[1.08]">
              Your Universe of Learning <br />
              <span className="bg-gradient-to-r from-cosmic-cyan via-cosmic-violet to-cosmic-magenta bg-clip-text text-transparent">
                Starts Here.
              </span>
            </h1>

            {/* Supporting Tagline */}
            <p className="text-base sm:text-lg text-ui-textSecondary max-w-xl leading-relaxed">
              Transform complex lecture slides, textbook PDFs, and semester notes into structured explanations, interactive recall quizzes, and grounded exam preparation.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link to="/auth?mode=register">
                <GlowingButton variant="cyan" size="lg" icon={<Sparkles className="w-5 h-5 text-space-950" />}>
                  Start Learning Free
                </GlowingButton>
              </Link>
              <a href="#demo">
                <GlowingButton variant="outline" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                  Explore Study Modes
                </GlowingButton>
              </a>
            </div>

            {/* Trust Metric Chips */}
            <div className="grid grid-cols-3 gap-3 pt-6 max-w-lg border-t border-white/[0.08]">
              <div>
                <span className="text-xl sm:text-2xl font-heading font-bold text-white block">100%</span>
                <span className="text-xs font-mono text-ui-textSecondary mt-0.5 block">Document Grounded</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-heading font-bold text-cosmic-cyan block">[Page X]</span>
                <span className="text-xs font-mono text-ui-textSecondary mt-0.5 block">Verifiable Citations</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-heading font-bold text-cosmic-violet block">5 Modes</span>
                <span className="text-xs font-mono text-ui-textSecondary mt-0.5 block">Beginner to Coding</span>
              </div>
            </div>
          </div>

          {/* Right Column: Large Interactive 3D AI Orb & Floating Glass Cards (5 cols) */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            {/* Ambient Background Aura */}
            <div className="absolute w-[360px] sm:w-[460px] h-[360px] sm:h-[460px] rounded-full bg-gradient-to-tr from-cosmic-violet/25 via-cosmic-cyan/20 to-cosmic-magenta/25 blur-[120px] pointer-events-none" />

            {/* Interactive 3D AI Orb */}
            <div className="relative z-10">
              <OrbitAiOrb state="idle" size="xl" interactive={true} />
            </div>

            {/* Floating Glassmorphism Badge 1 (Top Right) */}
            <div className="absolute -top-4 right-0 sm:-right-4 px-3.5 py-2 rounded-2xl bg-space-900/85 border border-cosmic-cyan/40 backdrop-blur-xl shadow-neon-cyan/20 flex items-center gap-2.5 z-20 animate-float">
              <div className="w-2.5 h-2.5 rounded-full bg-cosmic-cyan animate-pulse" />
              <div className="text-left">
                <span className="text-[10px] font-mono text-ui-textMuted block">AI COGNITIVE STATUS</span>
                <span className="text-xs font-heading font-bold text-white">ORBIT Core Online</span>
              </div>
            </div>

            {/* Floating Glassmorphism Badge 2 (Bottom Left) */}
            <div className="absolute -bottom-4 left-0 sm:-left-4 px-4 py-2.5 rounded-2xl bg-space-900/85 border border-cosmic-violet/40 backdrop-blur-xl shadow-neon-violet/20 flex items-center gap-2.5 z-20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <span className="text-[10px] font-mono text-ui-textMuted block">GROUNDED REASONING</span>
                <span className="text-xs font-heading font-bold text-cosmic-cyan">Page 2 Cited</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive 5 Study Modes Live Preview Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cosmic-violet/10 border border-cosmic-violet/30 text-xs font-mono text-cosmic-violet mb-3">
            ADAPTIVE ACADEMIC INTELLIGENCE
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white">
            One Material. Five Cognitive Modes.
          </h2>
          <p className="text-ui-textSecondary mt-2.5 text-sm sm:text-base">
            Switch your learning lens instantly. ORBIT adapts its vocabulary, depth, and layout to match your study goal.
          </p>

          {/* Mode Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-8">
            {[
              { id: 'beginner', label: 'Beginner Mode', icon: BookOpen },
              { id: 'exam', label: 'Exam Mode', icon: GraduationCap },
              { id: 'technical', label: 'Technical Mode', icon: Cpu },
              { id: 'revision', label: 'Quick Revision', icon: Zap },
              { id: 'coding', label: 'Coding Mode', icon: Code },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeModeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveModeTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-medium flex items-center gap-2 border transition-all ${
                    isSelected
                      ? 'bg-cosmic-cyan text-space-950 border-cosmic-cyan font-bold shadow-neon-cyan/40 scale-105'
                      : 'bg-space-900/80 border-white/10 text-ui-textSecondary hover:text-white hover:bg-space-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="max-w-4xl mx-auto">
          <GlassCard glow="cyan" className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="text-xs font-mono text-cosmic-cyan uppercase font-semibold">
                {studyModePreviews[activeModeTab].title}
              </span>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-ui-textSecondary">
                {studyModePreviews[activeModeTab].tag}
              </span>
            </div>

            {/* Prompt Question */}
            <div className="p-3.5 rounded-xl bg-space-950/70 border border-white/[0.06] text-xs font-mono text-cosmic-cyan">
              <span className="text-ui-textMuted mr-2">Q:</span>
              <span>{studyModePreviews[activeModeTab].query}</span>
            </div>

            {/* Output Answer */}
            <div className="p-5 rounded-2xl bg-space-950/90 border border-white/[0.06] text-sm text-ui-textPrimary leading-relaxed whitespace-pre-wrap font-sans">
              {studyModePreviews[activeModeTab].response}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cosmic-cyan/10 border border-cosmic-cyan/30 text-xs font-mono text-cosmic-cyan mb-3">
            ARCHITECTED FOR RETENTION
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white">
            Complete Student Learning Ecosystem
          </h2>
          <p className="text-ui-textSecondary mt-2.5 text-sm sm:text-base">
            Engineered to overcome information overload and replace passive reading with active recall.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <GlassCard key={idx} glow={f.glow} hoverEffect className="p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-space-800 border border-white/10 flex items-center justify-center text-cosmic-cyan shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cosmic-cyan bg-cosmic-cyan/10 border border-cosmic-cyan/20 px-2.5 py-1 rounded-full">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="text-sm text-ui-textSecondary mt-2 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center text-xs font-mono text-cosmic-cyan">
                  <span>Available in ORBIT Suite →</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cosmic-violet/10 border border-cosmic-violet/30 text-xs font-mono text-cosmic-violet mb-3">
            THE ORBITAL WORKFLOW
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white">
            How Students Learn with ORBIT
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Upload Study Material',
              desc: 'Drop in your syllabus PDF, professor slides, or textbook chapters. ORBIT extracts page text, formulas, and structural hierarchy.',
              tag: 'Instant Ingestion'
            },
            {
              step: '02',
              title: 'Explore & Ground',
              desc: 'Use the Document Intelligence workspace to query difficult concepts. Gemini generates grounded answers citing specific page numbers.',
              tag: 'Gemini RAG'
            },
            {
              step: '03',
              title: 'Test & Prepare',
              desc: 'Generate interactive quizzes to diagnose weak topics. Follow your tailored exam preparation schedule to achieve top marks.',
              tag: 'Active Recall'
            }
          ].map((item, idx) => (
            <div key={idx} className="relative p-6 rounded-2xl bg-space-900/60 border border-white/[0.08] backdrop-blur-md">
              <span className="text-4xl font-heading font-bold text-cosmic-violet/40 block mb-3">
                {item.step}
              </span>
              <h3 className="text-xl font-heading font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-ui-textSecondary leading-relaxed">
                {item.desc}
              </p>
              <div className="mt-4 inline-block text-[10px] font-mono text-cosmic-cyan bg-cosmic-cyan/10 px-2.5 py-0.5 rounded-full border border-cosmic-cyan/20">
                {item.tag}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10 border-t border-white/[0.08]">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-ui-textSecondary mt-2">
            Clear answers on ORBIT, Gemini integration, and academic study workflows.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-space-900/60 border border-white/[0.08] overflow-hidden transition-colors hover:border-white/20"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-heading font-semibold text-white text-base">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-cosmic-cyan transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-ui-textSecondary leading-relaxed border-t border-white/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10 text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-cosmic-violet/20 via-cosmic-blue/20 to-cosmic-cyan/20 border border-cosmic-cyan/30 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-heading font-bold text-white tracking-tight">
              Ready to learn beyond the limits?
            </h2>
            <p className="text-ui-textSecondary mt-4 max-w-xl mx-auto text-sm sm:text-base">
              Join students preparing for semester examinations with Google Gemini. Create your free account in 30 seconds.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/auth?mode=register">
                <GlowingButton variant="cyan" size="lg" icon={<Sparkles className="w-5 h-5 text-space-950" />}>
                  Create Free Student Account
                </GlowingButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-space-950/80 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-ui-textSecondary relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-white text-base">ORBIT</span>
            <span>— Gemini StudyMate AI</span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span>Built by Mukesh Arav V.</span>
            <span>•</span>
            <a
              href="https://github.com/vmukesharav-sudo"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cosmic-cyan hover:underline"
            >
              <Github className="w-3.5 h-3.5" />
              <span>@vmukesharav-sudo</span>
            </a>
          </div>

          <p className="text-ui-textMuted">
            © {new Date().getFullYear()} ORBIT Platform. MIT License.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
