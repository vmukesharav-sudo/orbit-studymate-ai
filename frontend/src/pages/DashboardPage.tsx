import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  DocumentItem,
  AnalyticsOverview,
  LearningActivityItem,
  StudyPlan
} from '../types';
import KnowledgeCore from '../components/dashboard/KnowledgeCore';
import LearningConstellation from '../components/dashboard/LearningConstellation';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import {
  MessageSquare,
  FileText,
  HelpCircle,
  CalendarCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activities, setActivities] = useState<LearningActivityItem[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(120);
  const [todayStudiedMinutes, setTodayStudiedMinutes] = useState<number>(45);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overviewData, docsData, activityData, plansData, settingsData] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getDocuments(),
          api.getLearningActivity(),
          api.getStudyPlans(),
          api.getSettings(),
        ]);

        setAnalytics(overviewData);
        setDocuments(docsData);
        setActivities(activityData);
        setStudyPlans(plansData);

        if (settingsData.daily_study_target_minutes) {
          setDailyGoalMinutes(settingsData.daily_study_target_minutes);
        }

        // Calculate today's studied minutes from weekly activity
        const todayStr = new Date().toISOString().split('T')[0];
        const todayItem = overviewData.weekly_activity.find(w => w.date === todayStr);
        if (todayItem) {
          setTodayStudiedMinutes(todayItem.minutes);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const studentFirstName = user?.full_name ? user.full_name.split(' ')[0] : 'Scholar';
  const goalProgressPercent = Math.min(100, Math.round((todayStudiedMinutes / (dailyGoalMinutes || 120)) * 100));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Greeting & Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <span className="text-xs font-mono text-cosmic-cyan tracking-wider uppercase block">
            {currentDateFormatted}
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-1">
            Welcome back, {studentFirstName}
          </h1>
          <p className="text-xs sm:text-sm text-ui-textSecondary mt-0.5">
            Ready to expand your universe of knowledge today?
          </p>
        </div>

        {/* Daily Goal Quick Tracker Card */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-space-900/60 border border-white/10 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-cosmic-cyan/10 border border-cosmic-cyan/20 flex items-center justify-center text-cosmic-cyan">
            <Target className="w-5 h-5" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-ui-textSecondary justify-end">
              <span>Daily Target:</span>
              <span className="font-bold text-white">{todayStudiedMinutes}/{dailyGoalMinutes}m</span>
            </div>
            <div className="w-28 sm:w-36 h-2 rounded-full bg-space-950 mt-1.5 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-cosmic-cyan to-cosmic-violet transition-all duration-500 rounded-full"
                style={{ width: `${goalProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Signature Knowledge Core */}
      <KnowledgeCore
        documentsCount={analytics?.total_documents || documents.length}
        quizzesCount={analytics?.total_quizzes_completed || 0}
        questionsCount={analytics?.total_questions_asked || 0}
        studyHours={analytics?.total_study_hours || 0}
        streakDays={analytics?.study_streak_days || 1}
      />

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-white">
            Quick Modules
          </h3>
          <span className="text-xs font-mono text-ui-textSecondary">
            Active Study Tools
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Ask ORBIT"
            description="Converse with Gemini across 5 academic study modes."
            icon={MessageSquare}
            path="/ask"
            color="cyan"
          />
          <QuickActionCard
            title="Upload PDF Notes"
            description="Ingest lecture slides, textbooks, and syllabus notes."
            icon={FileText}
            path="/documents"
            color="violet"
          />
          <QuickActionCard
            title="Generate Quiz"
            description="Create adaptive recall problem sets and test mastery."
            icon={HelpCircle}
            path="/quiz"
            color="magenta"
          />
          <QuickActionCard
            title="Exam Timetable"
            description="Build a realistic countdown roadmap for semester tests."
            icon={CalendarCheck}
            path="/planner"
            color="emerald"
          />
        </div>
      </div>

      {/* Split Section: Continue Learning & Learning Constellation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Continue Learning Recent Docs & Plans (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cosmic-cyan" />
                <h3 className="font-heading font-semibold text-white text-base">
                  Recent Study Materials
                </h3>
              </div>
              <Link to="/documents" className="text-xs font-mono text-cosmic-cyan hover:underline flex items-center gap-1">
                <span>View Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/10 bg-space-950/40">
                <FileText className="w-8 h-8 text-ui-textMuted mx-auto mb-2" />
                <p className="text-sm font-heading text-white">No documents uploaded yet</p>
                <p className="text-xs text-ui-textSecondary mt-1">
                  Upload your syllabus or lecture slides to enable grounded AI Q&A.
                </p>
                <Link to="/documents" className="inline-block mt-4 text-xs font-mono text-cosmic-cyan hover:underline">
                  + Upload First PDF
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.slice(0, 4).map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/workspace?docId=${doc.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-space-950/50 border border-white/[0.06] hover:border-cosmic-cyan/40 hover:bg-white/[0.03] transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-cosmic-cyan/10 border border-cosmic-cyan/20 flex items-center justify-center text-cosmic-cyan shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-white truncate group-hover:text-cosmic-cyan transition-colors">
                          {doc.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-ui-textSecondary mt-0.5">
                          <span>{doc.page_count} Pages</span>
                          <span>•</span>
                          <span>{roundSize(doc.file_size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="cyan" size="sm">Open in AI Workspace</Badge>
                      <ArrowRight className="w-4 h-4 text-ui-textMuted group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Upcoming Exam Preparation Schedule */}
          {studyPlans.length > 0 && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-heading font-semibold text-white text-base">
                    Active Exam Preparation
                  </h3>
                </div>
                <Link to="/planner" className="text-xs font-mono text-emerald-400 hover:underline">
                  Open Planner →
                </Link>
              </div>

              <div className="space-y-3">
                {studyPlans.slice(0, 2).map((plan) => {
                  const tasksDone = plan.tasks?.filter(t => t.is_completed).length || 0;
                  const totalTasks = plan.tasks?.length || 1;
                  const pct = Math.round((tasksDone / totalTasks) * 100);

                  return (
                    <div key={plan.id} className="p-4 rounded-xl bg-space-950/60 border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-heading font-semibold text-white">
                          {plan.subject_name}
                        </h4>
                        <span className="text-xs font-mono text-cosmic-cyan">
                          Exam on {new Date(plan.exam_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-ui-textSecondary mb-1 font-mono">
                        <span>Milestones: {tasksDone}/{totalTasks}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-space-900 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-cosmic-cyan rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Column: Learning Constellation & Recent Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <LearningConstellation
            documentsCount={documents.length}
            quizzesCount={analytics?.total_quizzes_completed || 0}
            tasksCompleted={analytics?.completed_tasks_count || 0}
            subjectProgress={analytics?.subject_progress}
          />

          {/* Recent Activity Feed */}
          <GlassCard className="p-6">
            <h3 className="font-heading font-semibold text-white text-base mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cosmic-cyan" />
              <span>Recent Activity</span>
            </h3>

            {activities.length === 0 ? (
              <p className="text-xs text-ui-textSecondary py-4 text-center">
                Your activity history will appear here as you interact with ORBIT.
              </p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activities.slice(0, 6).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-space-950/40 border border-white/[0.04] text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-cosmic-cyan shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{act.title}</p>
                      {act.details && (
                        <p className="text-[11px] text-ui-textSecondary truncate mt-0.5">{act.details}</p>
                      )}
                      <span className="text-[10px] font-mono text-ui-textMuted mt-1 block">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

function roundSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default DashboardPage;

