import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StudyPlan, StudyTask } from '../types';
import GlassCard from '../components/ui/GlassCard';
import GlowingButton from '../components/ui/GlowingButton';
import Badge from '../components/ui/Badge';
import ThinkingIndicator from '../components/ui/ThinkingIndicator';
import {
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Trash2,
  Sparkles,
  BookOpen,
  RotateCcw,
  Target,
  Flame,
  AlertCircle
} from 'lucide-react';

export const StudyPlannerPage: React.FC = () => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // New Plan Form State
  const [subjectName, setSubjectName] = useState<string>('');
  const [examDate, setExamDate] = useState<string>('');
  const [dailyHours, setDailyHours] = useState<number>(2.0);
  const [unitsCount, setUnitsCount] = useState<number>(5);
  const [topicsList, setTopicsList] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  useEffect(() => {
    loadStudyPlans();
  }, []);

  const loadStudyPlans = async () => {
    try {
      const data = await api.getStudyPlans();
      setPlans(data);
      if (data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading study plans:', err);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !examDate) {
      alert('Please provide a subject name and examination date.');
      return;
    }

    setIsGenerating(true);
    try {
      const newPlan = await api.generateStudyPlan({
        subject_name: subjectName.trim(),
        exam_date: examDate,
        daily_hours: dailyHours,
        units_count: unitsCount,
        topics_list: topicsList.trim() || undefined,
        difficulty,
      });

      setPlans((prev) => [newPlan, ...prev]);
      setSelectedPlanId(newPlan.id);
      setShowCreateModal(false);

      // Reset form
      setSubjectName('');
      setExamDate('');
      setTopicsList('');
    } catch (err: any) {
      alert(err.message || 'Failed to generate study timetable.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: number, currentStatus: boolean) => {
    try {
      const updated = await api.toggleTask(taskId, !currentStatus);
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id === selectedPlanId) {
            return {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? updated : t)),
            };
          }
          return p;
        })
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update task.');
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this study timetable?')) return;
    try {
      await api.deleteStudyPlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      if (selectedPlanId === planId) {
        const remaining = plans.filter((p) => p.id !== planId);
        setSelectedPlanId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete plan.');
    }
  };

  const activePlan = plans.find((p) => p.id === selectedPlanId);

  // Countdown days
  const getDaysLeft = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <span className="text-xs font-mono text-cosmic-cyan tracking-wider uppercase block">
            Strategic Curriculum Roadmap
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-1">
            AI Exam Preparation Planner
          </h1>
          <p className="text-xs sm:text-sm text-ui-textSecondary mt-0.5">
            Gemini-engineered day-by-day timetables designed around your exam dates and daily study bandwidth.
          </p>
        </div>

        <GlowingButton
          variant="cyan"
          size="md"
          icon={<Plus className="w-4 h-4 text-space-950" />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Study Plan
        </GlowingButton>
      </div>

      {/* Plan Creation Modal or Inline Toggle */}
      {showCreateModal && (
        <GlassCard glow="cyan" className="p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-cosmic-cyan" />
              <span>Configure Examination Timetable</span>
            </h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-xs font-mono text-ui-textSecondary hover:text-white"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                  Subject / Course Name
                </label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Distributed Systems & Cloud Computing"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white focus:border-cosmic-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                  Examination Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white focus:border-cosmic-cyan focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                  Daily Bandwidth
                </label>
                <select
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white focus:border-cosmic-cyan focus:outline-none"
                >
                  <option value={1.0}>1.0 hour / day</option>
                  <option value={2.0}>2.0 hours / day</option>
                  <option value={3.0}>3.0 hours / day</option>
                  <option value={4.0}>4.0 hours / day</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                  Syllabus Units
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={unitsCount}
                  onChange={(e) => setUnitsCount(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white focus:border-cosmic-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white focus:border-cosmic-cyan focus:outline-none"
                >
                  <option value="easy">Introductory</option>
                  <option value="medium">Standard University</option>
                  <option value="hard">Intensive Engineering</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                Topics or Syllabus Breakdown (Optional)
              </label>
              <textarea
                rows={3}
                value={topicsList}
                onChange={(e) => setTopicsList(e.target.value)}
                placeholder="List topics e.g. Unit 1: RPC & Sockets, Unit 2: Raft Consensus, Unit 3: Distributed Transactions..."
                className="w-full p-3 rounded-xl bg-space-900 border border-white/10 text-xs text-white placeholder-ui-textMuted focus:border-cosmic-cyan focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-ui-textSecondary hover:text-white"
              >
                Cancel
              </button>
              <GlowingButton
                type="submit"
                variant="cyan"
                size="md"
                isLoading={isGenerating}
                icon={<Sparkles className="w-4 h-4 text-space-950" />}
              >
                Generate Timetable
              </GlowingButton>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Plans Navigation & Active View */}
      {plans.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl bg-space-900/40 border border-dashed border-white/10">
          <CalendarCheck className="w-12 h-12 text-ui-textMuted mx-auto mb-3" />
          <h3 className="text-lg font-heading font-semibold text-white">
            No Exam Plans Configured
          </h3>
          <p className="text-xs text-ui-textSecondary mt-1 max-w-sm mx-auto">
            Click 'Create Study Plan' above to generate an intelligent timetable for your upcoming examinations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Active Subject Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-ui-textSecondary">
              Your Subjects ({plans.length})
            </h3>

            {plans.map((p) => {
              const isSelected = p.id === selectedPlanId;
              const daysLeft = getDaysLeft(p.exam_date);
              const doneTasks = p.tasks.filter((t) => t.is_completed).length;
              const totalTasks = p.tasks.length;
              const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

              return (
                <GlassCard
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  glow={isSelected ? 'cyan' : 'none'}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected ? 'bg-space-800/90' : 'bg-space-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-heading font-semibold text-white text-sm truncate">
                        {p.subject_name}
                      </h4>
                      <span className="text-[11px] font-mono text-cosmic-cyan mt-0.5 block">
                        {daysLeft} Days Until Exam
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(p.id);
                      }}
                      className="p-1 hover:text-red-400 text-ui-textMuted transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-mono text-ui-textSecondary mb-1">
                      <span>Tasks: {doneTasks}/{totalTasks}</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-space-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cosmic-cyan to-cosmic-violet rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Right: Tasks & Day-by-Day Calendar (8 cols) */}
          <div className="lg:col-span-8">
            {activePlan && (
              <GlassCard glow="violet" className="p-6 sm:p-8 space-y-6">
                {/* Subject Overview Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="cyan" size="sm">
                        {activePlan.difficulty.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-mono text-ui-textMuted">
                        Exam: {new Date(activePlan.exam_date).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-white">
                      {activePlan.subject_name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 bg-space-950/80 px-4 py-2 rounded-2xl border border-white/10 shrink-0">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-[10px] font-mono text-ui-textMuted block">COUNTDOWN</span>
                      <span className="text-base font-heading font-bold text-white">
                        {getDaysLeft(activePlan.exam_date)} Days Left
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Overview Strategic Notes */}
                {activePlan.overview && (
                  <div className="p-4 rounded-2xl bg-space-950/60 border border-white/[0.06] text-xs leading-relaxed text-ui-textSecondary">
                    <span className="font-heading font-semibold text-white block mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cosmic-cyan" />
                      <span>Academic Strategy Overview:</span>
                    </span>
                    <span>{activePlan.overview}</span>
                  </div>
                )}

                {/* Day-by-Day Scheduled Tasks */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-ui-textSecondary">
                    Scheduled Milestones & Tasks ({activePlan.tasks.length})
                  </h3>

                  {activePlan.tasks.map((task) => {
                    const taskColors = {
                      study: 'text-cosmic-cyan border-cosmic-cyan/20 bg-cosmic-cyan/10',
                      revision: 'text-cosmic-violet border-cosmic-violet/20 bg-cosmic-violet/10',
                      practice: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
                      mock: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
                    };
                    const colorBadge = taskColors[task.task_type] || taskColors.study;

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                          task.is_completed
                            ? 'bg-space-950/40 border-white/[0.04] opacity-70'
                            : 'bg-space-900/60 border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id, task.is_completed)}
                          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            task.is_completed
                              ? 'bg-emerald-500 border-emerald-400 text-space-950'
                              : 'border-white/20 hover:border-cosmic-cyan'
                          }`}
                        >
                          {task.is_completed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className={`text-sm font-heading font-semibold text-white ${task.is_completed ? 'line-through text-ui-textMuted' : ''}`}>
                              {task.title}
                            </h4>
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${colorBadge}`}>
                              {task.task_type}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-xs text-ui-textSecondary mt-0.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[10px] font-mono text-ui-textMuted mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-cosmic-cyan" />
                              <span>{new Date(task.scheduled_date).toLocaleDateString()}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cosmic-violet" />
                              <span>{task.duration_minutes} Minutes</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlannerPage;

