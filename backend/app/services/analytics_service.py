import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.models import (
    User, Document, Quiz, QuizAttempt, StudyPlan, StudyTask, LearningActivity, Conversation, Message
)
from app.services.gemini_service import gemini_service

class AnalyticsService:
    @staticmethod
    def log_activity(db: Session, user_id: int, activity_type: str, title: str, details: str = "", duration_minutes: int = 15):
        """Logs an event to the student's learning activity timeline."""
        try:
            activity = LearningActivity(
                user_id=user_id,
                activity_type=activity_type,
                title=title,
                details=details,
                duration_minutes=duration_minutes,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(activity)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Failed to log activity: {e}")

    @staticmethod
    def get_overview_metrics(db: Session, user: User) -> Dict[str, Any]:
        """Calculates authentic, real-time statistics for user dashboard and analytics page."""
        user_id = user.id

        # 1. Document metrics
        doc_count = db.query(Document).filter(Document.user_id == user_id).count()

        # 2. Quiz metrics
        attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).all()
        quizzes_completed = len(attempts)
        avg_score = 0.0
        if quizzes_completed > 0:
            avg_score = round(sum([a.percentage for a in attempts]) / quizzes_completed, 1)

        # 3. Tasks
        total_tasks = db.query(StudyTask).join(StudyPlan).filter(StudyPlan.user_id == user_id).count()
        completed_tasks = db.query(StudyTask).join(StudyPlan).filter(StudyPlan.user_id == user_id, StudyTask.is_completed == True).count()

        # 4. Total questions asked
        questions_asked = db.query(Message).join(Conversation).filter(
            Conversation.user_id == user_id,
            Message.sender == "user"
        ).count()

        # 5. Total study hours calculated from activities
        total_activity_minutes = db.query(func.sum(LearningActivity.duration_minutes)).filter(
            LearningActivity.user_id == user_id
        ).scalar() or 0
        study_hours = round(total_activity_minutes / 60.0, 1)

        # 6. Study streak calculation (consecutive days with activity)
        activities = db.query(LearningActivity).filter(
            LearningActivity.user_id == user_id
        ).order_by(desc(LearningActivity.timestamp)).all()

        streak_days = 0
        if activities:
            dates = sorted(list(set([a.timestamp.date() for a in activities])), reverse=True)
            today = datetime.now(timezone.utc).date()
            yesterday = today - timedelta(days=1)

            # Check if active today or yesterday
            if dates and (dates[0] == today or dates[0] == yesterday):
                streak_days = 1
                curr = dates[0]
                for d in dates[1:]:
                    if curr - d == timedelta(days=1):
                        streak_days += 1
                        curr = d
                    else:
                        break

        # 7. Weekly activity distribution (last 7 days)
        today = datetime.now(timezone.utc).date()
        weekly_activity = []
        days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        for i in range(6, -1, -1):
            day_date = today - timedelta(days=i)
            day_name = days_of_week[day_date.weekday()]
            day_mins = db.query(func.sum(LearningActivity.duration_minutes)).filter(
                LearningActivity.user_id == user_id,
                func.date(LearningActivity.timestamp) == day_date
            ).scalar() or 0

            # Count quizzes on that day
            day_quizzes = db.query(QuizAttempt).filter(
                QuizAttempt.user_id == user_id,
                func.date(QuizAttempt.completed_at) == day_date
            ).count()

            weekly_activity.append({
                "day": day_name,
                "date": str(day_date),
                "minutes": day_mins,
                "hours": round(day_mins / 60.0, 1),
                "quizzes": day_quizzes
            })

        # 8. Quiz score trends (last 8 attempts)
        recent_attempts = db.query(QuizAttempt).filter(
            QuizAttempt.user_id == user_id
        ).order_by(QuizAttempt.completed_at.asc()).limit(8).all()

        quiz_score_trend = []
        weak_topics_list = []
        for idx, att in enumerate(recent_attempts):
            quiz = db.query(Quiz).filter(Quiz.id == att.quiz_id).first()
            topic_name = quiz.topic if quiz else f"Quiz {idx+1}"
            quiz_score_trend.append({
                "attempt": f"Q{idx+1}",
                "topic": topic_name[:14],
                "score": round(att.percentage, 1),
                "date": att.completed_at.strftime("%b %d")
            })
            if att.weak_topics:
                try:
                    wt = json.loads(att.weak_topics)
                    if isinstance(wt, list):
                        weak_topics_list.extend(wt)
                except Exception:
                    pass

        # 9. Subject progress
        study_plans = db.query(StudyPlan).filter(StudyPlan.user_id == user_id).all()
        subject_progress = []
        for sp in study_plans:
            plan_tasks = db.query(StudyTask).filter(StudyTask.study_plan_id == sp.id).all()
            plan_total = len(plan_tasks)
            plan_done = len([t for t in plan_tasks if t.is_completed])
            pct = round((plan_done / plan_total * 100), 1) if plan_total > 0 else 0
            subject_progress.append({
                "subject": sp.subject_name,
                "completed": plan_done,
                "total": plan_total,
                "progress": pct,
                "exam_date": sp.exam_date.strftime("%Y-%m-%d")
            })

        # 10. AI Insights generated based on genuine metrics
        stats_summary = {
            "total_documents": doc_count,
            "quizzes_completed": quizzes_completed,
            "average_score": avg_score,
            "study_hours": study_hours,
            "weak_topics": list(set(weak_topics_list))[:5],
            "completed_tasks": completed_tasks,
            "total_tasks": total_tasks
        }

        try:
            ai_insights = gemini_service.analyze_learning_progress(user.full_name, stats_summary)
        except Exception:
            ai_insights = [
                f"You have uploaded {doc_count} study materials. Explore the Document Intelligence workspace to extract formulas and chapter breakdowns.",
                f"Your quiz average is {avg_score}%. Regular active recall significantly boosts long-term exam retention.",
                f"Current streak: {streak_days} days. Keep your daily learning momentum going to master semester subjects."
            ]

        return {
            "total_documents": doc_count,
            "total_quizzes_completed": quizzes_completed,
            "average_quiz_score": avg_score,
            "total_study_hours": study_hours,
            "total_questions_asked": questions_asked,
            "study_streak_days": streak_days,
            "completed_tasks_count": completed_tasks,
            "total_tasks_count": total_tasks,
            "weekly_activity": weekly_activity,
            "subject_progress": subject_progress,
            "quiz_score_trend": quiz_score_trend,
            "ai_insights": ai_insights
        }

analytics_service = AnalyticsService()

