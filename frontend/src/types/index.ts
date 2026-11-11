// Frontend Types matching backend models & schemas

export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DocumentItem {
  id: number;
  title: string;
  original_filename: string;
  file_size: number;
  page_count: number;
  status: 'processing' | 'ready' | 'error';
  error_message?: string;
  summary?: string;
  created_at: string;
  extracted_text?: string;
}

export type StudyMode = 'beginner' | 'exam' | 'technical' | 'revision' | 'coding';

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender: 'user' | 'gemini';
  content: string;
  mode?: StudyMode;
  page_references?: number[];
  timestamp: string;
}

export interface Conversation {
  id: number;
  title: string;
  study_mode: StudyMode;
  document_id?: number;
  created_at: string;
  updated_at: string;
  message_count?: number;
  messages?: ChatMessage[];
}

export interface SummaryItem {
  id: number;
  title: string;
  summary_type: string;
  document_id?: number;
  content: string;
  key_definitions?: string[];
  key_formulas?: string[];
  important_points?: string[];
  source_pages?: number[];
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer';
  options?: string[];
  topic_tag?: string;
  correct_answer?: string;
  explanation?: string;
}

export interface QuizItem {
  id: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_count: number;
  time_limit_minutes: number;
  document_id?: number;
  created_at: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  attempt_id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  weak_topics: string[];
  suggestions: string;
  completed_at: string;
  detailed_questions: QuizQuestion[];
  user_answers: Record<number, string>;
}

export interface QuizHistoryItem {
  attempt_id: number;
  quiz_id: number;
  topic: string;
  difficulty: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

export interface StudyTask {
  id: number;
  title: string;
  description?: string;
  scheduled_date: string;
  duration_minutes: number;
  is_completed: boolean;
  task_type: 'study' | 'revision' | 'practice' | 'mock';
  completed_at?: string;
}

export interface StudyPlan {
  id: number;
  subject_name: string;
  exam_date: string;
  daily_hours: number;
  units_count: number;
  difficulty: string;
  overview?: string;
  created_at: string;
  tasks: StudyTask[];
}

export interface WeeklyActivityItem {
  day: string;
  date: string;
  minutes: number;
  hours: number;
  quizzes: number;
}

export interface SubjectProgressItem {
  subject: string;
  completed: number;
  total: number;
  progress: number;
  exam_date: string;
}

export interface QuizScoreTrendItem {
  attempt: string;
  topic: string;
  score: number;
  date: string;
}

export interface AnalyticsOverview {
  total_documents: number;
  total_quizzes_completed: number;
  average_quiz_score: number;
  total_study_hours: number;
  total_questions_asked: number;
  study_streak_days: number;
  completed_tasks_count: number;
  total_tasks_count: number;
  weekly_activity: WeeklyActivityItem[];
  subject_progress: SubjectProgressItem[];
  quiz_score_trend: QuizScoreTrendItem[];
  ai_insights: string[];
}

export interface LearningActivityItem {
  id: number;
  activity_type: string;
  title: string;
  details?: string;
  duration_minutes: number;
  timestamp: string;
}

export interface UserSettings {
  default_study_mode: StudyMode;
  daily_study_target_minutes: number;
  theme: string;
  email_notifications: boolean;
  sound_effects: boolean;
  api_key_configured: boolean;
}

