import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.session import SessionLocal, Base, engine
from app.models.models import User, Document, Quiz, QuizQuestion, QuizAttempt, StudyPlan, StudyTask, LearningActivity, UserSettings
from app.schemas.schemas import UserRegister, UserLogin, QuizSubmitRequest, QuizAnswerItem, StudyPlanGenerateRequest
from app.routes.auth import register, login
from app.services.pdf_service import pdf_service
from app.services.analytics_service import analytics_service
from app.services.gemini_service import gemini_service
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

def run_all_tests():
    print("=" * 60)
    print("ORBIT — FULL-STACK AUTOMATED TEST SUITE")
    print("=" * 60)

    # 1. Initialize Tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    print("✔ SQLite Schema Initialized successfully.")

    # 2. Test Security & Token Crypto
    pw = "SuperCosmicPass2026!"
    hashed = get_password_hash(pw)
    assert verify_password(pw, hashed) is True, "Password verification failed"
    assert verify_password("wrongPass", hashed) is False, "Security breach: wrong password accepted"
    token = create_access_token(subject=42)
    assert decode_access_token(token) == 42, "JWT decoding failed"
    print("✔ Cryptographic Security & JWT Auth: PASS")

    # 3. Test Registration & Database Isolation
    test_email = "mukesh.tester@orbit.edu"
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.delete(existing)
        db.commit()

    reg_input = UserRegister(email=test_email, password=pw, full_name="Mukesh Arav Tester")
    auth_resp = register(user_in=reg_input, db=db)
    assert auth_resp["user"].email == test_email
    assert auth_resp["access_token"] is not None
    user_id = auth_resp["user"].id
    print("✔ User Registration & Settings Cascade: PASS")

    # 4. Test Login
    login_resp = login(user_in=UserLogin(email=test_email, password=pw), db=db)
    assert login_resp["access_token"] is not None
    print("✔ User Authentication Flow: PASS")

    # 5. Test PDF Extraction and Chunk Retrieval
    dummy_pages = [
        {"page": 1, "text": "Chapter 1: Distributed Consensus. Raft is a consensus algorithm designed for understandability."},
        {"page": 2, "text": "Leader election is held when heartbeats time out. Candidate requests votes from peers."},
        {"page": 3, "text": "Log replication ensures state machine replication across all distributed cluster nodes."}
    ]
    context, pages = pdf_service.get_relevant_chunks(dummy_pages, "leader election heartbeats")
    assert 2 in pages, "Failed to retrieve relevant page 2"
    assert "Leader election" in context, "Context extraction failed"
    print("✔ PDF Chunking & Grounded Relevance Retrieval: PASS")

    # 6. Test Quiz Submission & Evaluation Logic
    user = db.query(User).filter(User.id == user_id).first()
    quiz = Quiz(
        user_id=user.id,
        topic="Distributed Systems",
        difficulty="medium",
        question_count=2,
        time_limit_minutes=5
    )
    db.add(quiz)
    db.flush()

    q1 = QuizQuestion(
        quiz_id=quiz.id,
        question_text="What triggers a leader election in Raft?",
        question_type="mcq",
        options='["Heartbeat timeout", "Memory overflow", "Manual reboot", "Network partition"]',
        correct_answer="Heartbeat timeout",
        explanation="When a follower misses heartbeats, its election timer expires.",
        topic_tag="Leader Election"
    )
    q2 = QuizQuestion(
        quiz_id=quiz.id,
        question_text="Does Raft guarantee linearizable reads?",
        question_type="true_false",
        options='["True", "False"]',
        correct_answer="True",
        explanation="Raft guarantees linearizability with lease read or index check.",
        topic_tag="Linearizability"
    )
    db.add_all([q1, q2])
    db.commit()

    from app.routes.quizzes import submit_quiz
    sub_res = submit_quiz(
        quiz_id=quiz.id,
        sub_data=QuizSubmitRequest(
            answers=[
                QuizAnswerItem(question_id=q1.id, selected_answer="Heartbeat timeout"),
                QuizAnswerItem(question_id=q2.id, selected_answer="False")  # intentional wrong
            ],
            time_taken_seconds=45
        ),
        current_user=user,
        db=db
    )
    assert sub_res["score"] == 1
    assert sub_res["total_questions"] == 2
    assert sub_res["percentage"] == 50.0
    assert "Linearizability" in sub_res["weak_topics"]
    print("✔ Quiz Grading, Weak-Topic Diagnostics & Scoring: PASS")

    # 7. Test Study Plan & Task Completion
    plan = StudyPlan(
        user_id=user.id,
        subject_name="Cloud Computing",
        exam_date=user.created_at,
        daily_hours=2.0,
        units_count=3,
        difficulty="medium",
        overview="Roadmap overview"
    )
    db.add(plan)
    db.flush()

    task1 = StudyTask(
        study_plan_id=plan.id,
        title="Unit 1: Sockets and RPC",
        scheduled_date=user.created_at,
        duration_minutes=90,
        task_type="study"
    )
    db.add(task1)
    db.commit()

    from app.routes.study_plans import update_study_task
    from app.schemas.schemas import StudyTaskUpdate
    up_task = update_study_task(task_id=task1.id, task_update=StudyTaskUpdate(is_completed=True), current_user=user, db=db)
    assert up_task.is_completed is True
    print("✔ Study Plan Timetable & Task Lifecycle: PASS")

    # 8. Test Analytics Overview
    overview_metrics = analytics_service.get_overview_metrics(db=db, user=user)
    assert overview_metrics["total_quizzes_completed"] >= 1
    assert overview_metrics["completed_tasks_count"] >= 1
    assert len(overview_metrics["weekly_activity"]) == 7
    print("✔ Analytics Aggregation & Learning Metrics: PASS")

    # 9. Test Gemini Prompt Cleaners
    dirty_json = "```json\n{\"title\": \"Operating Systems Summary\", \"points\": [\"Process\", \"Thread\"]}\n```"
    cleaned = gemini_service._clean_json_response(dirty_json)
    assert cleaned.startswith("{") and cleaned.endswith("}")
    print("✔ Gemini JSON Extraction & Sanitizer: PASS")

    db.close()
    print("=" * 60)
    print("ALL 9 TEST SUITES PASSED FLAWLESSLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()

