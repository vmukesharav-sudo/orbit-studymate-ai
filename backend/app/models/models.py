import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("LearningActivity", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    page_count = Column(Integer, default=0)
    status = Column(String(50), default="ready")  # processing, ready, error
    error_message = Column(Text, nullable=True)
    extracted_text = Column(Text, nullable=True)  # JSON string of list of {page: int, text: str}
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="documents")
    conversations = relationship("Conversation", back_populates="document")
    summaries = relationship("Summary", back_populates="document")
    quizzes = relationship("Quiz", back_populates="document")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), default="New Study Session")
    study_mode = Column(String(50), default="technical")  # beginner, exam, technical, revision, coding
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="conversations")
    document = relationship("Document", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.timestamp")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(50), nullable=False)  # user or gemini
    content = Column(Text, nullable=False)
    mode = Column(String(50), nullable=True)
    page_references = Column(Text, nullable=True)  # JSON string of [int] or references
    timestamp = Column(DateTime, default=utc_now)

    conversation = relationship("Conversation", back_populates="messages")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    summary_type = Column(String(50), default="detailed")  # short, detailed, chapter, definitions, key_points, exam
    content = Column(Text, nullable=False)
    key_definitions = Column(Text, nullable=True)  # JSON string list
    key_formulas = Column(Text, nullable=True)     # JSON string list
    important_points = Column(Text, nullable=True) # JSON string list
    source_pages = Column(Text, nullable=True)     # JSON string list
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="summaries")
    document = relationship("Document", back_populates="summaries")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    topic = Column(String(255), nullable=False)
    difficulty = Column(String(50), default="medium")  # easy, medium, hard
    question_count = Column(Integer, default=5)
    time_limit_minutes = Column(Integer, default=10)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="quizzes")
    document = relationship("Document", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="mcq")  # mcq, true_false, short_answer
    options = Column(Text, nullable=True)  # JSON string array of 4 options for MCQ, or ["True", "False"]
    correct_answer = Column(String(500), nullable=False)
    explanation = Column(Text, nullable=True)
    topic_tag = Column(String(100), nullable=True)

    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    percentage = Column(Float, default=0.0)
    time_taken_seconds = Column(Integer, default=0)
    answers = Column(Text, nullable=True)        # JSON string of student answers
    weak_topics = Column(Text, nullable=True)    # JSON string array of topics needing improvement
    suggestions = Column(Text, nullable=True)    # AI improvement suggestions
    completed_at = Column(DateTime, default=utc_now)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_name = Column(String(255), nullable=False)
    exam_date = Column(DateTime, nullable=False)
    daily_hours = Column(Float, default=2.0)
    units_count = Column(Integer, default=5)
    topics_list = Column(Text, nullable=True)  # JSON string
    difficulty = Column(String(50), default="medium")
    overview = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="study_plans")
    tasks = relationship("StudyTask", back_populates="study_plan", cascade="all, delete-orphan", order_by="StudyTask.scheduled_date")


class StudyTask(Base):
    __tablename__ = "study_tasks"

    id = Column(Integer, primary_key=True, index=True)
    study_plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    is_completed = Column(Boolean, default=False)
    task_type = Column(String(50), default="study")  # study, revision, practice, mock
    completed_at = Column(DateTime, nullable=True)

    study_plan = relationship("StudyPlan", back_populates="tasks")


class LearningActivity(Base):
    __tablename__ = "learning_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False)  # document_upload, chat_query, quiz_completed, summary_generated, study_session, task_completed
    title = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=15)
    timestamp = Column(DateTime, default=utc_now, index=True)

    user = relationship("User", back_populates="activities")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    default_study_mode = Column(String(50), default="technical")
    daily_study_target_minutes = Column(Integer, default=120)  # 2 hours default
    theme = Column(String(20), default="dark")
    email_notifications = Column(Boolean, default=True)
    sound_effects = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="settings")

