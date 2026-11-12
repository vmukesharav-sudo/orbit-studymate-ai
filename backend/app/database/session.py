import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Normalize Render/Heroku/Supabase postgres:// or postgresql:// to postgresql+psycopg2:// for SQLAlchemy
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif database_url.startswith("postgresql://") and not database_url.startswith("postgresql+"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# SQLite connection args vs PostgreSQL connection pooling
connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}

engine_kwargs = {
    "connect_args": connect_args,
    "pool_pre_ping": True,
    "echo": False
}

if not database_url.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20
    })

engine = create_engine(
    database_url,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
