from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.models import User, UserSettings, LearningActivity
from app.schemas.schemas import UserRegister, UserLogin, UserResponse, Token, UserUpdate
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token, oauth2_scheme

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email.lower(),
        hashed_password=hashed_pw,
        full_name=user_in.full_name.strip()
    )
    db.add(new_user)
    db.flush()

    # Create default settings for user
    settings = UserSettings(user_id=new_user.id)
    db.add(settings)

    # Log initial activity
    welcome_activity = LearningActivity(
        user_id=new_user.id,
        activity_type="account_created",
        title="Joined ORBIT Universe",
        details="Student profile initialized successfully.",
        duration_minutes=5,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(welcome_activity)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(subject=new_user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify your credentials."
        )

    # Log login activity
    login_activity = LearningActivity(
        user_id=user.id,
        activity_type="session_start",
        title="Orbital Learning Session Started",
        details="Student authenticated into ORBIT.",
        duration_minutes=15,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(login_activity)
    db.commit()

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully from ORBIT."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.full_name:
        current_user.full_name = user_update.full_name.strip()
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    if user_update.password:
        if not user_update.current_password or not verify_password(user_update.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )
        current_user.hashed_password = get_password_hash(user_update.password)
    
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    return current_user

