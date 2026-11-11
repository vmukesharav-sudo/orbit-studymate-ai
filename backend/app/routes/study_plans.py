import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database.session import get_db
from app.models.models import User, StudyPlan, StudyTask
from app.schemas.schemas import (
    StudyPlanGenerateRequest, StudyPlanResponse, StudyTaskResponse, StudyTaskUpdate
)
from app.routes.auth import get_current_user
from app.services.gemini_service import gemini_service
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/study-plans", tags=["Study Plans"])

@router.post("/generate", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
def generate_study_plan(
    req: StudyPlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        exam_dt = datetime.strptime(req.exam_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid exam_date format. Please use YYYY-MM-DD.")

    now = datetime.now(timezone.utc)
    if exam_dt <= now:
        raise HTTPException(status_code=400, detail="Examination date must be in the future.")

    days_until_exam = max(1, (exam_dt.date() - now.date()).days)

    # Call Gemini to generate realistic curriculum plan
    plan_data = gemini_service.generate_study_plan(
        subject_name=req.subject_name,
        exam_date=req.exam_date,
        daily_hours=req.daily_hours,
        units_count=req.units_count,
        topics_list=req.topics_list,
        difficulty=req.difficulty
    )

    overview = plan_data.get("overview", f"Comprehensive {days_until_exam}-day study roadmap for {req.subject_name}.")
    generated_tasks = plan_data.get("tasks", [])

    # Create StudyPlan in DB
    plan = StudyPlan(
        user_id=current_user.id,
        subject_name=req.subject_name,
        exam_date=exam_dt,
        daily_hours=req.daily_hours,
        units_count=req.units_count,
        topics_list=req.topics_list,
        difficulty=req.difficulty,
        overview=overview
    )
    db.add(plan)
    db.flush()

    saved_tasks = []
    # If no tasks or fewer returned, ensure at least one per unit across days
    if not generated_tasks:
        for u in range(1, req.units_count + 1):
            offset = min(days_until_exam - 1, int((u - 1) * (days_until_exam / req.units_count)))
            task_date = now + timedelta(days=offset)
            t = StudyTask(
                study_plan_id=plan.id,
                title=f"Unit {u}: Core Mastery & Notes",
                description="Study fundamental concepts, definitions and solve practice questions.",
                scheduled_date=task_date,
                duration_minutes=int(req.daily_hours * 60),
                task_type="study"
            )
            db.add(t)
            db.flush()
            saved_tasks.append(t)
    else:
        for item in generated_tasks:
            day_offset = int(item.get("day_offset", 0))
            if day_offset >= days_until_exam:
                day_offset = max(0, days_until_exam - 1)

            task_date = now + timedelta(days=day_offset)
            duration = int(item.get("duration_minutes", req.daily_hours * 60))

            t = StudyTask(
                study_plan_id=plan.id,
                title=item.get("title", "Study Session"),
                description=item.get("description", ""),
                scheduled_date=task_date,
                duration_minutes=duration,
                task_type=item.get("task_type", "study")
            )
            db.add(t)
            db.flush()
            saved_tasks.append(t)

    db.commit()

    # Log learning activity
    analytics_service.log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="study_plan_created",
        title=f"Created Study Plan: {req.subject_name}",
        details=f"{len(saved_tasks)} tasks scheduled up to exam on {req.exam_date}.",
        duration_minutes=15
    )

    return {
        "id": plan.id,
        "subject_name": plan.subject_name,
        "exam_date": plan.exam_date,
        "daily_hours": plan.daily_hours,
        "units_count": plan.units_count,
        "difficulty": plan.difficulty,
        "overview": plan.overview,
        "created_at": plan.created_at,
        "tasks": saved_tasks
    }

@router.get("", response_model=List[StudyPlanResponse])
def get_study_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plans = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id
    ).order_by(StudyPlan.created_at.desc()).all()

    result = []
    for p in plans:
        tasks = db.query(StudyTask).filter(
            StudyTask.study_plan_id == p.id
        ).order_by(StudyTask.scheduled_date.asc()).all()

        result.append({
            "id": p.id,
            "subject_name": p.subject_name,
            "exam_date": p.exam_date,
            "daily_hours": p.daily_hours,
            "units_count": p.units_count,
            "difficulty": p.difficulty,
            "overview": p.overview,
            "created_at": p.created_at,
            "tasks": tasks
        })
    return result

@router.get("/{plan_id}", response_model=StudyPlanResponse)
def get_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found.")

    tasks = db.query(StudyTask).filter(
        StudyTask.study_plan_id == plan.id
    ).order_by(StudyTask.scheduled_date.asc()).all()

    return {
        "id": plan.id,
        "subject_name": plan.subject_name,
        "exam_date": plan.exam_date,
        "daily_hours": plan.daily_hours,
        "units_count": plan.units_count,
        "difficulty": plan.difficulty,
        "overview": plan.overview,
        "created_at": plan.created_at,
        "tasks": tasks
    }

@router.delete("/{plan_id}")
def delete_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found.")

    db.delete(plan)
    db.commit()
    return {"message": "Study plan deleted successfully."}

@router.patch("/tasks/{task_id}", response_model=StudyTaskResponse)
def update_study_task(
    task_id: int,
    task_update: StudyTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(StudyTask).join(StudyPlan).filter(
        StudyTask.id == task_id,
        StudyPlan.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Study task not found.")

    task.is_completed = task_update.is_completed
    if task_update.is_completed:
        task.completed_at = datetime.now(timezone.utc)
        # Log task completion activity
        analytics_service.log_activity(
            db=db,
            user_id=current_user.id,
            activity_type="task_completed",
            title=f"Completed Task: {task.title}",
            details=f"Finished {task.duration_minutes}m study block.",
            duration_minutes=task.duration_minutes
        )
    else:
        task.completed_at = None

    db.commit()
    db.refresh(task)
    return task

