import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.models import User, UserSettings
from app.schemas.schemas import SettingsResponse, SettingsUpdate
from app.routes.auth import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["User Settings"])

@router.get("", response_model=SettingsResponse)
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
        db.commit()
        db.refresh(user_settings)

    has_key = bool(settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY"))

    return {
        "default_study_mode": user_settings.default_study_mode,
        "daily_study_target_minutes": user_settings.daily_study_target_minutes,
        "theme": user_settings.theme,
        "email_notifications": user_settings.email_notifications,
        "sound_effects": user_settings.sound_effects,
        "api_key_configured": has_key
    }

@router.patch("", response_model=SettingsResponse)
def update_user_settings(
    update_data: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)

    if update_data.default_study_mode:
        user_settings.default_study_mode = update_data.default_study_mode
    if update_data.daily_study_target_minutes is not None:
        user_settings.daily_study_target_minutes = update_data.daily_study_target_minutes
    if update_data.theme:
        user_settings.theme = update_data.theme
    if update_data.email_notifications is not None:
        user_settings.email_notifications = update_data.email_notifications
    if update_data.sound_effects is not None:
        user_settings.sound_effects = update_data.sound_effects

    if update_data.gemini_api_key is not None and update_data.gemini_api_key.strip():
        # Update runtime settings and environment
        settings.GEMINI_API_KEY = update_data.gemini_api_key.strip()
        os.environ["GEMINI_API_KEY"] = update_data.gemini_api_key.strip()

    user_settings.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user_settings)

    has_key = bool(settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY"))

    return {
        "default_study_mode": user_settings.default_study_mode,
        "daily_study_target_minutes": user_settings.daily_study_target_minutes,
        "theme": user_settings.theme,
        "email_notifications": user_settings.email_notifications,
        "sound_effects": user_settings.sound_effects,
        "api_key_configured": has_key
    }

