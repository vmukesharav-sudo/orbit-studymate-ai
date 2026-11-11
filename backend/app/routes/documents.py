import os
import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.models import User, Document, LearningActivity
from app.schemas.schemas import DocumentResponse, DocumentDetail, DocumentRename
from app.routes.auth import get_current_user
from app.services.pdf_service import pdf_service
from app.services.analytics_service import analytics_service
from app.core.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate filename and extension
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents (.pdf) are supported at this time."
        )

    # Read content & check size limit
    content = await file.read()
    file_size = len(content)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF file is empty (0 bytes)."
        )

    # User-specific directory
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, f"user_{current_user.id}")
    os.makedirs(user_upload_dir, exist_ok=True)

    # Unique filename
    safe_filename = f"{uuid.uuid4().hex[:12]}_{os.path.basename(file.filename)}"
    file_path = os.path.join(user_upload_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Extract text using PDF service
    page_count, pages_data, error_msg = pdf_service.extract_text_from_pdf(file_path)

    doc_status = "ready"
    if error_msg:
        if page_count == 0:
            doc_status = "error"
        else:
            doc_status = "ready"  # partially extracted or warning

    doc_title = title.strip() if title and title.strip() else os.path.splitext(file.filename)[0]

    document = Document(
        user_id=current_user.id,
        title=doc_title,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        page_count=page_count,
        status=doc_status,
        error_message=error_msg,
        extracted_text=json.dumps(pages_data) if pages_data else None
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # Log learning activity
    analytics_service.log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="document_upload",
        title=f"Uploaded '{doc_title}'",
        details=f"Extracted {page_count} pages ({round(file_size / (1024*1024), 2)} MB).",
        duration_minutes=10
    )

    return document

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    docs = db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.created_at.desc()).all()
    return docs

@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )

    return doc

@router.get("/{document_id}/file")
def get_document_pdf(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file not found on disk."
        )

    return FileResponse(
        doc.file_path,
        media_type="application/pdf",
        filename=doc.original_filename
    )

@router.patch("/{document_id}/rename", response_model=DocumentResponse)
def rename_document(
    document_id: int,
    rename_data: DocumentRename,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    if rename_data.title.strip():
        doc.title = rename_data.title.strip()
        doc.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(doc)

    return doc

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # Remove file from disk
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception as e:
        print(f"Error deleting file from disk: {e}")

    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully."}

