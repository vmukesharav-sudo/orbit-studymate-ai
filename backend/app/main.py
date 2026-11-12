import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import engine, Base
from app.models import (
    User, Document, Conversation, Message, Summary,
    Quiz, QuizQuestion, QuizAttempt, StudyPlan, StudyTask,
    LearningActivity, UserSettings
)
from app.routes import auth, documents, ai, quizzes, study_plans, analytics, settings as user_settings_route

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ORBIT – Next-Generation Gemini StudyMate AI Platform for College Students",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log error internally
    print(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An unexpected server error occurred: {str(exc)}"}
    )

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(quizzes.router, prefix=settings.API_V1_STR)
app.include_router(study_plans.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(user_settings_route.router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    has_key = bool(settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY"))
    db_status = "sqlite_connected" if "sqlite" in engine.url.drivername else "postgresql_connected"
    return {
        "status": "online",
        "service": "ORBIT – Gemini StudyMate AI",
        "gemini_model": settings.GEMINI_MODEL,
        "api_key_configured": has_key,
        "database": db_status
    }

@app.get("/")
def root():
    return {
        "product": "ORBIT – Gemini StudyMate AI",
        "tagline": "Explore Knowledge. Understand Everything. Learn Beyond Limits.",
        "api_docs": "/api/docs"
    }

