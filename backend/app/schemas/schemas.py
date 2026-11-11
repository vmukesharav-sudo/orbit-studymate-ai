from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = None
    current_password: Optional[str] = None

# --- Document Schemas ---
class DocumentResponse(BaseModel):
    id: int
    title: str
    original_filename: str
    file_size: int
    page_count: int
    status: str
    error_message: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentDetail(DocumentResponse):
    extracted_text: Optional[str] = None

class DocumentRename(BaseModel):
    title: str

# --- Chat & Ask Orbit Schemas ---
class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    study_mode: str = "technical"  # beginner, exam, technical, revision, coding
    conversation_id: Optional[int] = None
    document_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    mode: Optional[str] = None
    page_references: Optional[List[int]] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    title: str
    study_mode: str
    document_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ConversationDetail(ConversationResponse):
    messages: List[MessageResponse] = []

# --- Summary Schemas ---
class SummaryGenerateRequest(BaseModel):
    document_id: Optional[int] = None
    raw_text: Optional[str] = None
    title: Optional[str] = None
    summary_type: str = "detailed"  # short, detailed, chapter, definitions, key_points, exam

class SummaryResponse(BaseModel):
    id: int
    title: str
    summary_type: str
    document_id: Optional[int] = None
    content: str
    key_definitions: Optional[List[str]] = None
    key_formulas: Optional[List[str]] = None
    important_points: Optional[List[str]] = None
    source_pages: Optional[List[int]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Quiz Schemas ---
class QuizQuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    topic_tag: Optional[str] = None
    # Note: correct_answer and explanation omitted during quiz attempt for integrity!

class QuizQuestionDetail(QuizQuestionResponse):
    correct_answer: str
    explanation: Optional[str] = None

class QuizGenerateRequest(BaseModel):
    topic: Optional[str] = None
    document_id: Optional[int] = None
    difficulty: str = "medium"  # easy, medium, hard
    question_count: int = Field(5, ge=3, le=20)
    question_type: str = "mcq"   # mcq, true_false, mixed

class QuizResponse(BaseModel):
    id: int
    topic: str
    difficulty: str
    question_count: int
    time_limit_minutes: int
    document_id: Optional[int] = None
    created_at: datetime
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True

class QuizAnswerItem(BaseModel):
    question_id: int
    selected_answer: str

class QuizSubmitRequest(BaseModel):
    answers: List[QuizAnswerItem]
    time_taken_seconds: int

class QuizResultResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    score: int
    total_questions: int
    percentage: float
    time_taken_seconds: int
    weak_topics: List[str] = []
    suggestions: Optional[str] = None
    completed_at: datetime
    detailed_questions: List[QuizQuestionDetail] = []
    user_answers: Dict[int, str] = {}

class QuizHistoryItem(BaseModel):
    attempt_id: int
    quiz_id: int
    topic: str
    difficulty: str
    score: int
    total_questions: int
    percentage: float
    completed_at: datetime

# --- Study Plan Schemas ---
class StudyPlanGenerateRequest(BaseModel):
    subject_name: str
    exam_date: str  # YYYY-MM-DD
    daily_hours: float = 2.0
    units_count: int = 5
    topics_list: Optional[str] = None
    difficulty: str = "medium"

class StudyTaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    scheduled_date: datetime
    duration_minutes: int
    is_completed: bool
    task_type: str
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudyPlanResponse(BaseModel):
    id: int
    subject_name: str
    exam_date: datetime
    daily_hours: float
    units_count: int
    difficulty: str
    overview: Optional[str] = None
    created_at: datetime
    tasks: List[StudyTaskResponse] = []

    class Config:
        from_attributes = True

class StudyTaskUpdate(BaseModel):
    is_completed: bool

# --- Analytics Schemas ---
class AnalyticsOverviewResponse(BaseModel):
    total_documents: int
    total_quizzes_completed: int
    average_quiz_score: float
    total_study_hours: float
    total_questions_asked: int
    study_streak_days: int
    completed_tasks_count: int
    total_tasks_count: int
    weekly_activity: List[Dict[str, Any]]
    subject_progress: List[Dict[str, Any]]
    quiz_score_trend: List[Dict[str, Any]]
    ai_insights: List[str]

class ActivityResponse(BaseModel):
    id: int
    activity_type: str
    title: str
    details: Optional[str] = None
    duration_minutes: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Settings Schemas ---
class SettingsResponse(BaseModel):
    default_study_mode: str
    daily_study_target_minutes: int
    theme: str
    email_notifications: bool
    sound_effects: bool
    api_key_configured: bool = False

    class Config:
        from_attributes = True

class SettingsUpdate(BaseModel):
    default_study_mode: Optional[str] = None
    daily_study_target_minutes: Optional[int] = None
    theme: Optional[str] = None
    email_notifications: Optional[bool] = None
    sound_effects: Optional[bool] = None
    gemini_api_key: Optional[str] = None  # Allow user to update API key directly from Settings!

