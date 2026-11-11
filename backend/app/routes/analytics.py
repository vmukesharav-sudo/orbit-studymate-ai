from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.models import User, LearningActivity
from app.schemas.schemas import AnalyticsOverviewResponse, ActivityResponse
from app.routes.auth import get_current_user
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Learning Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    overview_data = analytics_service.get_overview_metrics(db=db, user=current_user)
    return overview_data

@router.get("/activity", response_model=List[ActivityResponse])
def get_learning_activity(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    activities = db.query(LearningActivity).filter(
        LearningActivity.user_id == current_user.id
    ).order_by(desc(LearningActivity.timestamp)).limit(limit).all()
    return activities

