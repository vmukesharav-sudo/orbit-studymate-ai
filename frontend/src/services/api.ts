import {
  AuthResponse, User, DocumentItem, Conversation, ChatMessage,
  SummaryItem, QuizItem, QuizResult, QuizHistoryItem,
  StudyPlan, StudyTask, AnalyticsOverview, LearningActivityItem,
  UserSettings, StudyMode
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('orbit_token');
  }

  private getHeaders(isFormData: boolean = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${cleanEndpoint}`;
    const headers = this.getHeaders(options.body instanceof FormData);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch {
        errorMessage = response.statusText || `HTTP Error ${response.status}`;
      }

      if (response.status === 401) {
        // If unauthorized, clear invalid token
        localStorage.removeItem('orbit_token');
        localStorage.removeItem('orbit_user');
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth Endpoints
  async register(data: { email: string; password: string; full_name: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: { full_name?: string; avatar_url?: string; password?: string; current_password?: string }): Promise<User> {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Document Endpoints
  async uploadDocument(file: File, title?: string): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    return this.request<DocumentItem>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getDocuments(): Promise<DocumentItem[]> {
    return this.request<DocumentItem[]>('/documents');
  }

  async getDocument(id: number): Promise<DocumentItem> {
    return this.request<DocumentItem>(`/documents/${id}`);
  }

  async renameDocument(id: number, title: string): Promise<DocumentItem> {
    return this.request<DocumentItem>(`/documents/${id}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  }

  async deleteDocument(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  getDocumentFileUrl(id: number): string {
    return `${API_BASE}/documents/${id}/file`;
  }

  // AI & Ask Orbit Endpoints
  async sendMessage(data: {
    message: string;
    study_mode?: StudyMode;
    conversation_id?: number;
    document_id?: number;
  }): Promise<ChatMessage> {
    return this.request<ChatMessage>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/ai/conversations');
  }

  async getConversation(id: number): Promise<Conversation> {
    return this.request<Conversation>(`/ai/conversations/${id}`);
  }

  async deleteConversation(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/ai/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  // Summaries
  async generateSummary(data: {
    document_id?: number;
    raw_text?: string;
    title?: string;
    summary_type: string;
  }): Promise<SummaryItem> {
    return this.request<SummaryItem>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSummaries(): Promise<SummaryItem[]> {
    return this.request<SummaryItem[]>('/ai/summaries');
  }

  async deleteSummary(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/ai/summaries/${id}`, {
      method: 'DELETE',
    });
  }

  // Quizzes
  async generateQuiz(data: {
    topic?: string;
    document_id?: number;
    difficulty: string;
    question_count: number;
    question_type: string;
  }): Promise<QuizItem> {
    return this.request<QuizItem>('/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQuizzes(): Promise<QuizItem[]> {
    return this.request<QuizItem[]>('/quizzes');
  }

  async getQuiz(id: number): Promise<QuizItem> {
    return this.request<QuizItem>(`/quizzes/${id}`);
  }

  async submitQuiz(quizId: number, answers: { question_id: number; selected_answer: string }[], timeTakenSeconds: number): Promise<QuizResult> {
    return this.request<QuizResult>(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        answers,
        time_taken_seconds: timeTakenSeconds,
      }),
    });
  }

  async getQuizHistory(): Promise<QuizHistoryItem[]> {
    return this.request<QuizHistoryItem[]>('/quizzes/history/all');
  }

  // Study Plans
  async generateStudyPlan(data: {
    subject_name: string;
    exam_date: string;
    daily_hours: number;
    units_count: number;
    topics_list?: string;
    difficulty: string;
  }): Promise<StudyPlan> {
    return this.request<StudyPlan>('/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStudyPlans(): Promise<StudyPlan[]> {
    return this.request<StudyPlan[]>('/study-plans');
  }

  async getStudyPlan(id: number): Promise<StudyPlan> {
    return this.request<StudyPlan>(`/study-plans/${id}`);
  }

  async deleteStudyPlan(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/study-plans/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleTask(taskId: number, isCompleted: boolean): Promise<StudyTask> {
    return this.request<StudyTask>(`/study-plans/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed: isCompleted }),
    });
  }

  // Analytics
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    return this.request<AnalyticsOverview>('/analytics/overview');
  }

  async getLearningActivity(): Promise<LearningActivityItem[]> {
    return this.request<LearningActivityItem[]>('/analytics/activity');
  }

  // Settings
  async getSettings(): Promise<UserSettings> {
    return this.request<UserSettings>('/settings');
  }

  async updateSettings(data: Partial<UserSettings> & { gemini_api_key?: string }): Promise<UserSettings> {
    return this.request<UserSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();

