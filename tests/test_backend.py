import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.session import SessionLocal, Base, engine
from app.models.models import User, Document, Quiz, QuizQuestion, StudyPlan, StudyTask
from app.schemas.schemas import UserRegister, UserLogin, QuizSubmitRequest, QuizAnswerItem, StudyTaskUpdate
from app.main import health_check
from app.routes.auth import register, login, get_current_user
from app.routes.quizzes import submit_quiz
from app.routes.study_plans import update_study_task
from app.services.analytics_service import analytics_service
from app.services.pdf_service import pdf_service
from app.services.gemini_service import gemini_service
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

def setup_module():
    """Ensure database tables exist."""
    Base.metadata.create_all(bind=engine)

def test_health_check():
    """Test health check response."""
    data = health_check()
    assert data["status"] == "online"
    assert "gemini_model" in data
    assert data["database"] == "sqlite_connected"
    print("✔ Health Check Endpoint: PASS")

def test_auth_workflow():
    """Test user registration, password hashing, and login."""
    test_email = "alex.tester@orbit.edu"
    test_password = "securePassword123!"

    db = SessionLocal()
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.delete(existing)
        db.commit()

    # 1. Register
    reg_input = UserRegister(email=test_email, password=test_password, full_name="Alex Tester")
    reg_res = register(user_in=reg_input, db=db)
    assert reg_res["user"].email == test_email
    token = reg_res["access_token"]
    assert token is not None

    # 2. Login
    login_res = login(user_in=UserLogin(email=test_email, password=test_password), db=db)
    assert login_res["access_token"] is not None

    # 3. Decode Token & Verify User
    user_id = decode_access_token(token)
    assert user_id == reg_res["user"].id
    user = get_current_user(token=token, db=db)
    assert user.email == test_email

    # 4. Analytics Overview
    overview = analytics_service.get_overview_metrics(db=db, user=user)
    assert "total_study_hours" in overview
    assert "study_streak_days" in overview

    db.close()
    print("✔ Auth Workflow, JWT Token & User Profile: PASS")

def test_unauthorized_access():
    """Test unauthorized token handling."""
    invalid_token = "invalid.token.here"
    sub = decode_access_token(invalid_token)
    assert sub is None, "Invalid token should decode to None"
    print("✔ Unauthorized Access Guard: PASS")

def test_pdf_chunking():
    """Test PDF text chunk extraction and grounded keyword search."""
    sample_pages = [
        {"page": 1, "text": "Operating Systems Overview: Processes and Threads."},
        {"page": 2, "text": "Deadlock prevention involves violating one of Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait."},
        {"page": 3, "text": "Virtual memory paging and TLB translation."}
    ]
    context, pages = pdf_service.get_relevant_chunks(sample_pages, "Coffman deadlock conditions")
    assert 2 in pages
    assert "Deadlock" in context
    print("✔ PDF Relevance Search & Chunking: PASS")

def test_quiz_and_study_plan_flow():
    """Test quiz scoring and study task completion."""
    db = SessionLocal()
    user = db.query(User).filter(User.email == "alex.tester@orbit.edu").first()
    assert user is not None

    # Create Quiz
    quiz = Quiz(user_id=user.id, topic="OS Deadlocks", difficulty="medium", question_count=1, time_limit_minutes=5)
    db.add(quiz)
    db.flush()

    q1 = QuizQuestion(
        quiz_id=quiz.id,
        question_text="How many Coffman conditions must hold for deadlock?",
        question_type="mcq",
        options='["4", "3", "2", "1"]',
        correct_answer="4",
        explanation="All 4 conditions must hold simultaneously.",
        topic_tag="Deadlocks"
    )
    db.add(q1)
    db.commit()

    # Submit Quiz
    sub_res = submit_quiz(
        quiz_id=quiz.id,
        sub_data=QuizSubmitRequest(
            answers=[QuizAnswerItem(question_id=q1.id, selected_answer="4")],
            time_taken_seconds=30
        ),
        current_user=user,
        db=db
    )
    assert sub_res["score"] == 1
    assert sub_res["percentage"] == 100.0

    # Create Study Plan and Task
    plan = StudyPlan(user_id=user.id, subject_name="OS", exam_date=user.created_at, daily_hours=1.5, units_count=2, difficulty="medium", overview="Plan")
    db.add(plan)
    db.flush()

    task = StudyTask(study_plan_id=plan.id, title="Unit 1 Study", scheduled_date=user.created_at, duration_minutes=60, task_type="study")
    db.add(task)
    db.commit()

    up_task = update_study_task(task_id=task.id, task_update=StudyTaskUpdate(is_completed=True), current_user=user, db=db)
    assert up_task.is_completed is True

    db.close()
    print("✔ Quiz Grading & Study Task Lifecycle: PASS")

def test_gemini_cleaner():
    """Test JSON cleaning utility."""
    dirty = "```json\n{\"status\": \"ready\", \"questions\": []}\n```"
    cleaned = gemini_service._clean_json_response(dirty)
    assert cleaned.startswith("{") and cleaned.endswith("}")
    print("✔ Gemini JSON Sanitizer: PASS")

if __name__ == "__main__":
    print("=" * 60)
    print("ORBIT — BACKEND AUTOMATED TEST SUITE")
    print("=" * 60)
    setup_module()
    test_health_check()
    test_auth_workflow()
    test_unauthorized_access()
    test_pdf_chunking()
    test_quiz_and_study_plan_flow()
    test_gemini_cleaner()
    print("=" * 60)
    print("ALL BACKEND TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
