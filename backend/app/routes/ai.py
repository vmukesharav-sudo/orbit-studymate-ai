import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.models import User, Conversation, Message, Document, Summary
from app.schemas.schemas import (
    ChatMessageRequest, MessageResponse, ConversationResponse, ConversationDetail,
    SummaryGenerateRequest, SummaryResponse
)
from app.routes.auth import get_current_user
from app.services.gemini_service import gemini_service
from app.services.pdf_service import pdf_service
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/ai", tags=["AI Engine"])

@router.post("/chat", response_model=MessageResponse)
def chat_with_orbit(
    req: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat message cannot be empty."
        )

    # 1. Get or create conversation
    conv = None
    if req.conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == req.conversation_id,
            Conversation.user_id == current_user.id
        ).first()

    if not conv:
        # Generate initial title from first 6 words of message
        words = req.message.strip().split()
        title_snippet = " ".join(words[:6])
        if len(words) > 6:
            title_snippet += "..."
        conv = Conversation(
            user_id=current_user.id,
            title=title_snippet or "New Study Session",
            study_mode=req.study_mode,
            document_id=req.document_id
        )
        db.add(conv)
        db.flush()

    # 2. Save user message
    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        content=req.message.strip(),
        mode=req.study_mode,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(user_msg)
    db.flush()

    # 3. Retrieve conversation history for context
    history_records = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.timestamp.asc()).all()

    formatted_history = [
        {"sender": m.sender, "content": m.content}
        for m in history_records[:-1]  # exclude the just added user message from history
    ]

    # 4. Generate AI response (grounded in document if document_id present)
    gemini_reply = ""
    cited_pages = []

    doc_id = req.document_id or conv.document_id
    if doc_id:
        doc = db.query(Document).filter(
            Document.id == doc_id,
            Document.user_id == current_user.id
        ).first()

        if doc and doc.extracted_text:
            try:
                pages_data = json.loads(doc.extracted_text)
                relevant_context, used_pages = pdf_service.get_relevant_chunks(pages_data, req.message)
                gemini_reply, cited_pages = gemini_service.answer_document_question(
                    question=req.message,
                    document_context=relevant_context,
                    study_mode=req.study_mode,
                    conversation_history=formatted_history
                )
            except Exception as e:
                # If document extraction fails, fall back to general explanation
                gemini_reply = gemini_service.explain_topic(
                    topic=req.message,
                    study_mode=req.study_mode,
                    conversation_history=formatted_history
                )
        else:
            gemini_reply = gemini_service.explain_topic(
                topic=req.message,
                study_mode=req.study_mode,
                conversation_history=formatted_history
            )
    else:
        gemini_reply = gemini_service.explain_topic(
            topic=req.message,
            study_mode=req.study_mode,
            conversation_history=formatted_history
        )

    # 5. Save Gemini response
    bot_msg = Message(
        conversation_id=conv.id,
        sender="gemini",
        content=gemini_reply,
        mode=req.study_mode,
        page_references=json.dumps(cited_pages) if cited_pages else None,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(bot_msg)

    # Update conversation
    conv.updated_at = datetime.now(timezone.utc)
    conv.study_mode = req.study_mode
    db.commit()
    db.refresh(bot_msg)

    # Log activity
    analytics_service.log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="chat_query",
        title=f"Studied in {req.study_mode.title()} Mode",
        details=req.message[:80],
        duration_minutes=5
    )

    return {
        "id": bot_msg.id,
        "conversation_id": conv.id,
        "sender": bot_msg.sender,
        "content": bot_msg.content,
        "mode": bot_msg.mode,
        "page_references": cited_pages,
        "timestamp": bot_msg.timestamp
    }

@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convs = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()

    result = []
    for c in convs:
        msg_count = db.query(Message).filter(Message.conversation_id == c.id).count()
        result.append({
            "id": c.id,
            "title": c.title,
            "study_mode": c.study_mode,
            "document_id": c.document_id,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "message_count": msg_count
        })
    return result

@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation_detail(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    msgs = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.timestamp.asc()).all()

    formatted_msgs = []
    for m in msgs:
        pages = []
        if m.page_references:
            try:
                pages = json.loads(m.page_references)
            except Exception:
                pass
        formatted_msgs.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender": m.sender,
            "content": m.content,
            "mode": m.mode,
            "page_references": pages,
            "timestamp": m.timestamp
        })

    return {
        "id": conv.id,
        "title": conv.title,
        "study_mode": conv.study_mode,
        "document_id": conv.document_id,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "message_count": len(formatted_msgs),
        "messages": formatted_msgs
    }

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully."}

@router.post("/summarize", response_model=SummaryResponse)
def generate_summary(
    req: SummaryGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content_to_summarize = ""
    doc_title = req.title or "Academic Material"
    source_pages = []

    if req.document_id:
        doc = db.query(Document).filter(
            Document.id == req.document_id,
            Document.user_id == current_user.id
        ).first()

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        doc_title = req.title or doc.title
        if doc.extracted_text:
            try:
                pages_data = json.loads(doc.extracted_text)
                content_to_summarize = "\n\n".join([f"Page {p['page']}: {p['text']}" for p in pages_data])
                source_pages = [p["page"] for p in pages_data[:10]]
            except Exception:
                content_to_summarize = doc.extracted_text
        else:
            raise HTTPException(status_code=400, detail="Document has no extracted text to summarize.")
    elif req.raw_text and req.raw_text.strip():
        content_to_summarize = req.raw_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please provide either a document_id or text content to summarize.")

    # Call Gemini to generate structured summary
    summary_data = gemini_service.generate_summary(
        text_content=content_to_summarize,
        summary_type=req.summary_type,
        title=doc_title
    )

    # Save to database
    summary_record = Summary(
        user_id=current_user.id,
        document_id=req.document_id,
        title=summary_data.get("title", doc_title),
        summary_type=req.summary_type,
        content=summary_data.get("content", ""),
        key_definitions=json.dumps(summary_data.get("key_definitions", [])),
        key_formulas=json.dumps(summary_data.get("key_formulas", [])),
        important_points=json.dumps(summary_data.get("important_points", [])),
        source_pages=json.dumps(source_pages) if source_pages else None
    )

    db.add(summary_record)
    db.commit()
    db.refresh(summary_record)

    # Log learning activity
    analytics_service.log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="summary_generated",
        title=f"Generated {req.summary_type.title()} Summary",
        details=f"Synthesized notes for '{doc_title}'.",
        duration_minutes=15
    )

    return {
        "id": summary_record.id,
        "title": summary_record.title,
        "summary_type": summary_record.summary_type,
        "document_id": summary_record.document_id,
        "content": summary_record.content,
        "key_definitions": summary_data.get("key_definitions", []),
        "key_formulas": summary_data.get("key_formulas", []),
        "important_points": summary_data.get("important_points", []),
        "source_pages": source_pages,
        "created_at": summary_record.created_at
    }

@router.get("/summaries", response_model=List[SummaryResponse])
def get_summaries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    summaries = db.query(Summary).filter(
        Summary.user_id == current_user.id
    ).order_by(Summary.created_at.desc()).all()

    result = []
    for s in summaries:
        defs = []
        forms = []
        pts = []
        pages = []
        if s.key_definitions:
            try: defs = json.loads(s.key_definitions)
            except Exception: pass
        if s.key_formulas:
            try: forms = json.loads(s.key_formulas)
            except Exception: pass
        if s.important_points:
            try: pts = json.loads(s.important_points)
            except Exception: pass
        if s.source_pages:
            try: pages = json.loads(s.source_pages)
            except Exception: pass

        result.append({
            "id": s.id,
            "title": s.title,
            "summary_type": s.summary_type,
            "document_id": s.document_id,
            "content": s.content,
            "key_definitions": defs,
            "key_formulas": forms,
            "important_points": pts,
            "source_pages": pages,
            "created_at": s.created_at
        })
    return result

@router.delete("/summaries/{summary_id}")
def delete_summary(
    summary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    summary = db.query(Summary).filter(
        Summary.id == summary_id,
        Summary.user_id == current_user.id
    ).first()

    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found.")

    db.delete(summary)
    db.commit()
    return {"message": "Summary deleted successfully."}

