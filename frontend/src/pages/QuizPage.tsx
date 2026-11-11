import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { DocumentItem, QuizItem, QuizResult, QuizHistoryItem } from '../types';
import GlassCard from '../components/ui/GlassCard';
import GlowingButton from '../components/ui/GlowingButton';
import Badge from '../components/ui/Badge';
import ThinkingIndicator from '../components/ui/ThinkingIndicator';
import {
  HelpCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  AlertTriangle,
  BookOpen,
  FileText
} from 'lucide-react';

export const QuizPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDocId = searchParams.get('docId') ? parseInt(searchParams.get('docId')!) : undefined;

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);

  // Generation state
  const [selectedDocId, setSelectedDocId] = useState<number | undefined>(initialDocId);
  const [topicInput, setTopicInput] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<string>('mcq');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Active Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Completed Result state
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Timer countdown while taking quiz
  useEffect(() => {
    if (!activeQuiz || quizResult) return;
    if (secondsRemaining <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, quizResult, secondsRemaining]);

  const loadData = async () => {
    try {
      const [docs, history] = await Promise.all([
        api.getDocuments(),
        api.getQuizHistory(),
      ]);
      setDocuments(docs);
      setQuizHistory(history);
    } catch (err) {
      console.error('Failed to load quiz data:', err);
    }
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId && !topicInput.trim()) {
      alert('Please provide a topic or select an uploaded PDF.');
      return;
    }

    setIsGenerating(true);
    setQuizResult(null);

    try {
      const quiz = await api.generateQuiz({
        topic: topicInput.trim() || undefined,
        document_id: selectedDocId,
        difficulty,
        question_count: questionCount,
        question_type: questionType,
      });

      setActiveQuiz(quiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setSecondsRemaining((quiz.time_limit_minutes || 5) * 60);
    } catch (err: any) {
      alert(err.message || 'Failed to generate quiz with Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: number, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || isSubmitting) return;

    setIsSubmitting(true);
    const answersPayload = activeQuiz.questions.map((q) => ({
      question_id: q.id,
      selected_answer: selectedAnswers[q.id] || '',
    }));

    const totalSeconds = (activeQuiz.time_limit_minutes || 5) * 60;
    const timeTaken = Math.max(1, totalSeconds - secondsRemaining);

    try {
      const result = await api.submitQuiz(activeQuiz.id, answersPayload, timeTaken);
      setQuizResult(result);

      if (result.percentage >= 80) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      // Refresh history
      const history = await api.getQuizHistory();
      setQuizHistory(history);
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.06]">
        <span className="text-xs font-mono text-cosmic-cyan tracking-wider uppercase block">
          Active Recall Assessment
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-1">
          AI Quiz Generator & Engine
        </h1>
        <p className="text-xs sm:text-sm text-ui-textSecondary mt-0.5">
          Challenge your conceptual understanding with adaptive quizzes generated from your syllabus or uploaded PDFs.
        </p>
      </div>

      {/* Case 1: Quiz Taking View */}
      {activeQuiz && !quizResult && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Quiz Top Status Bar */}
          <GlassCard className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-cosmic-cyan uppercase">
                {activeQuiz.difficulty} Assessment • {activeQuiz.topic}
              </span>
              <h3 className="text-sm font-heading font-bold text-white mt-0.5">
                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
              </h3>
            </div>

            <div className="flex items-center gap-2 bg-space-950 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-mono">
              <Clock className={`w-4 h-4 ${secondsRemaining < 60 ? 'text-red-400 animate-pulse' : 'text-cosmic-cyan'}`} />
              <span className={`font-bold ${secondsRemaining < 60 ? 'text-red-400' : 'text-white'}`}>
                {formatTimer(secondsRemaining)}
              </span>
            </div>
          </GlassCard>

          {/* Question Nav Dots */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 justify-center">
            {activeQuiz.questions.map((q, idx) => {
              const isAnswered = !!selectedAnswers[q.id];
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-mono font-medium transition-all ${
                    isCurrent
                      ? 'bg-cosmic-cyan text-space-950 font-bold shadow-neon-cyan/40 scale-110'
                      : isAnswered
                      ? 'bg-cosmic-violet/30 text-cosmic-violet border border-cosmic-violet/40'
                      : 'bg-space-900 border border-white/10 text-ui-textSecondary'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question Card */}
          {(() => {
            const currentQ = activeQuiz.questions[currentQuestionIndex];
            if (!currentQ) return null;
            const currentSelected = selectedAnswers[currentQ.id];

            return (
              <GlassCard glow="cyan" className="p-6 sm:p-8 space-y-6">
                <div>
                  {currentQ.topic_tag && (
                    <span className="text-[10px] font-mono uppercase bg-cosmic-violet/15 text-cosmic-violet border border-cosmic-violet/30 px-2 py-0.5 rounded-md mb-2 inline-block">
                      {currentQ.topic_tag}
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg font-heading font-semibold text-white leading-relaxed">
                    {currentQ.question_text}
                  </h3>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {(currentQ.options || ['True', 'False']).map((opt, optIdx) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const isSelected = currentSelected === opt;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        className={`w-full p-4 rounded-xl text-left text-sm transition-all flex items-center gap-3 border ${
                          isSelected
                            ? 'bg-cosmic-cyan/20 border-cosmic-cyan text-white shadow-neon-cyan/20 font-medium'
                            : 'bg-space-900/60 border-white/[0.08] text-ui-textSecondary hover:bg-space-800 hover:text-white'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-lg text-xs font-mono flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-cosmic-cyan text-space-950 font-bold' : 'bg-space-800 text-ui-textMuted'
                        }`}>
                          {letters[optIdx] || optIdx + 1}
                        </span>
                        <span className="flex-1 leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation & Submit Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-ui-textSecondary hover:text-white disabled:opacity-30 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                    <GlowingButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      Next Question
                    </GlowingButton>
                  ) : (
                    <GlowingButton
                      variant="cyan"
                      size="sm"
                      onClick={handleSubmitQuiz}
                      isLoading={isSubmitting}
                      icon={<CheckCircle2 className="w-4 h-4 text-space-950" />}
                    >
                      Submit Quiz
                    </GlowingButton>
                  )}
                </div>
              </GlassCard>
            );
          })()}
        </div>
      )}

      {/* Case 2: Quiz Result Review View */}
      {quizResult && (
        <div className="max-w-4xl mx-auto space-y-6">
          <GlassCard glow="violet" className="p-8 text-center relative overflow-hidden">
            <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-tr from-cosmic-violet via-cosmic-cyan to-emerald-400 p-0.5 mb-4 shadow-2xl">
              <div className="w-full h-full bg-space-950 rounded-[22px] flex items-center justify-center">
                <Trophy className="w-8 h-8 text-cosmic-cyan" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white">
              Assessment Complete
            </h2>
            <p className="text-xs sm:text-sm text-ui-textSecondary mt-1">
              Your results and detailed explanations have been recorded.
            </p>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 max-w-2xl mx-auto">
              <div className="p-3 rounded-2xl bg-space-950/70 border border-white/10">
                <span className="text-[11px] font-mono text-ui-textSecondary block">Score</span>
                <span className="text-2xl font-heading font-bold text-cosmic-cyan mt-0.5 block">
                  {quizResult.score} / {quizResult.total_questions}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-space-950/70 border border-white/10">
                <span className="text-[11px] font-mono text-ui-textSecondary block">Percentage</span>
                <span className="text-2xl font-heading font-bold text-emerald-400 mt-0.5 block">
                  {quizResult.percentage}%
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-space-950/70 border border-white/10">
                <span className="text-[11px] font-mono text-ui-textSecondary block">Time Taken</span>
                <span className="text-2xl font-heading font-bold text-cosmic-violet mt-0.5 block">
                  {Math.floor(quizResult.time_taken_seconds / 60)}m {quizResult.time_taken_seconds % 60}s
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-space-950/70 border border-white/10">
                <span className="text-[11px] font-mono text-ui-textSecondary block">Weak Areas</span>
                <span className="text-2xl font-heading font-bold text-amber-400 mt-0.5 block">
                  {quizResult.weak_topics.length}
                </span>
              </div>
            </div>

            {/* AI Improvement Guidance */}
            {quizResult.suggestions && (
              <div className="mt-6 p-4 rounded-2xl bg-space-950/80 border border-cosmic-cyan/30 text-left max-w-2xl mx-auto text-xs leading-relaxed text-ui-textPrimary flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-cosmic-cyan shrink-0 mt-0.5" />
                <div>
                  <span className="font-heading font-semibold text-white block mb-0.5">
                    Gemini Diagnostic Analysis:
                  </span>
                  <span>{quizResult.suggestions}</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center gap-3">
              <GlowingButton
                variant="cyan"
                size="md"
                onClick={() => {
                  setActiveQuiz(null);
                  setQuizResult(null);
                }}
                icon={<RotateCcw className="w-4 h-4 text-space-950" />}
              >
                Create Another Quiz
              </GlowingButton>
            </div>
          </GlassCard>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-base font-heading font-semibold text-white">
              Question-by-Question Review & Explanations
            </h3>

            {quizResult.detailed_questions.map((q, idx) => {
              const userChoice = quizResult.user_answers[q.id];
              const isCorrect = String(userChoice || '').trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();

              return (
                <GlassCard
                  key={q.id}
                  className={`p-5 space-y-3 ${
                    isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-space-800 text-xs font-mono flex items-center justify-center text-white">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-heading font-semibold text-white">
                        {q.question_text}
                      </h4>
                    </div>

                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-mono text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-space-950/60 border border-white/5">
                      <span className="text-ui-textMuted block font-mono text-[10px]">Your Answer:</span>
                      <span className={isCorrect ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                        {userChoice || 'No answer selected'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-space-950/60 border border-white/5">
                      <span className="text-ui-textMuted block font-mono text-[10px]">Correct Answer:</span>
                      <span className="text-emerald-400 font-medium">
                        {q.correct_answer}
                      </span>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-space-950/40 border border-white/5 text-xs text-ui-textSecondary leading-relaxed">
                      <span className="text-cosmic-cyan font-mono font-medium block mb-0.5">
                        Explanation:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Case 3: Initial Quiz Generator Form & History */}
      {!activeQuiz && !quizResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Generator Form (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard glow="cyan" className="p-6">
              <h3 className="text-base font-heading font-semibold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cosmic-cyan" />
                <span>Configure New Quiz</span>
              </h3>

              <form onSubmit={handleGenerateQuiz} className="space-y-4">
                {/* Document Selector */}
                <div>
                  <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                    Select Document Source
                  </label>
                  <select
                    value={selectedDocId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      setSelectedDocId(val);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white focus:border-cosmic-cyan focus:outline-none"
                  >
                    <option value="">-- Or enter custom topic below --</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.page_count} pages)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Topic Input */}
                <div>
                  <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                    Or Specific Topic / Syllabus Unit
                  </label>
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => {
                      setTopicInput(e.target.value);
                      if (e.target.value) setSelectedDocId(undefined);
                    }}
                    placeholder="e.g. Operating Systems Deadlocks & Memory"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white placeholder-ui-textMuted focus:border-cosmic-cyan focus:outline-none"
                  />
                </div>

                {/* Difficulty Select */}
                <div>
                  <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`py-2 rounded-xl text-xs font-mono uppercase capitalize border transition-all ${
                          difficulty === d
                            ? 'bg-cosmic-cyan/15 border-cosmic-cyan text-cosmic-cyan font-bold'
                            : 'bg-space-900 border-white/10 text-ui-textSecondary hover:bg-space-800'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                    <span>Number of Questions</span>
                    <span className="text-white font-bold">{questionCount} Qs</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    step={1}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="w-full accent-cosmic-cyan cursor-pointer"
                  />
                </div>

                {/* Question Type */}
                <div>
                  <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                    Question Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuestionType('mcq')}
                      className={`py-2 rounded-xl text-xs font-mono border transition-all ${
                        questionType === 'mcq'
                          ? 'bg-cosmic-cyan/15 border-cosmic-cyan text-cosmic-cyan font-bold'
                          : 'bg-space-900 border-white/10 text-ui-textSecondary'
                      }`}
                    >
                      Multiple Choice (4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionType('true_false')}
                      className={`py-2 rounded-xl text-xs font-mono border transition-all ${
                        questionType === 'true_false'
                          ? 'bg-cosmic-cyan/15 border-cosmic-cyan text-cosmic-cyan font-bold'
                          : 'bg-space-900 border-white/10 text-ui-textSecondary'
                      }`}
                    >
                      True / False
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <GlowingButton
                    type="submit"
                    variant="cyan"
                    size="md"
                    className="w-full"
                    isLoading={isGenerating}
                    icon={<Sparkles className="w-4 h-4 text-space-950" />}
                  >
                    Generate Interactive Quiz
                  </GlowingButton>
                </div>
              </form>
            </GlassCard>
          </div>

          {/* Right: Past Quiz History (7 cols) */}
          <div className="lg:col-span-7">
            <GlassCard glow="violet" className="p-6">
              <h3 className="text-base font-heading font-semibold text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-cosmic-violet" />
                  <span>Previous Assessments History</span>
                </span>
                <span className="text-xs font-mono text-ui-textMuted">
                  {quizHistory.length} Attempts
                </span>
              </h3>

              {quizHistory.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10">
                  <HelpCircle className="w-10 h-10 text-ui-textMuted mx-auto mb-2" />
                  <p className="text-sm font-heading text-white">No quizzes taken yet</p>
                  <p className="text-xs text-ui-textSecondary mt-1">
                    Generate your first active recall assessment using the configuration panel.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {quizHistory.map((item) => (
                    <div
                      key={item.attempt_id}
                      className="p-4 rounded-xl bg-space-950/60 border border-white/[0.06] hover:border-cosmic-cyan/30 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-ui-textSecondary">
                            {item.difficulty}
                          </span>
                          <span className="text-[11px] font-mono text-ui-textMuted">
                            {new Date(item.completed_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-heading font-medium text-white truncate">
                          {item.topic}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-lg font-heading font-bold ${
                          item.percentage >= 80 ? 'text-emerald-400' : item.percentage >= 60 ? 'text-cosmic-cyan' : 'text-amber-400'
                        }`}>
                          {item.percentage}%
                        </span>
                        <span className="text-[10px] font-mono text-ui-textMuted block">
                          {item.score}/{item.total_questions} correct
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;

