import json
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas import TextChatRequest
from app.auth import get_current_user
from app.services.ai_client import stream_chat, transcribe_audio, extract_image_text

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger("chat")


async def _ensure_conversation(conversation_id: str, user: User, db: AsyncSession) -> Conversation:
    """Validate that the conversation exists and belongs to the user."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == user.id
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


async def _save_message(db: AsyncSession, conversation_id: str, role: str, content: str, msg_type: str = "text") -> Message:
    """Save a message to the database."""
    msg = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        type=msg_type,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def _update_conversation_title(db: AsyncSession, conv: Conversation, content: str):
    """Update conversation title from first AI response if still default."""
    if conv.title == "New Conversation":
        conv.title = content[:50].strip() + ("..." if len(content) > 50 else "")
        await db.commit()


async def _stream_and_save(query: str, conversation_id: str, user_id: str, conv: Conversation, db: AsyncSession):
    """Stream AI response and save the full response to DB when done."""
    # Fetch conversation history (last 5 messages + the current one which was just saved)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(6)
    )
    history = result.scalars().all()
    history.reverse()  # Restore chronological order

    # Format history for OpenAI
    messages = [{"role": "system", "content": "You are a helpful and polite AI assistant."}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    full_response = ""
    saved = False
    try:
        async for chunk in stream_chat(messages, user_id):
            if chunk.startswith("\n__META__:"):
                # Parse metadata but don't yield it to the client
                meta_str = chunk[9:]
                try:
                    meta = json.loads(meta_str)
                    # Ensure we use the full_response from the AI client if provided
                    full_response = meta.get("full_response", full_response)
                except json.JSONDecodeError:
                    pass
                continue

            full_response += chunk
            # Yield SSE event to client
            yield f"data: {json.dumps({'content': chunk})}\n\n"
    finally:
        # Save the full assistant response even if stream was interrupted/closed
        if full_response.strip() and not saved:
            try:
                await _save_message(db, conversation_id, "assistant", full_response, "text")
                await _update_conversation_title(db, conv, full_response)
                saved = True
                logger.info(f"Saved assistant message ({len(full_response)} chars) for conv {conversation_id}")
            except Exception as e:
                logger.error(f"Failed to save assistant message: {str(e)}")

    yield "data: [DONE]\n\n"


@router.post("/text")
async def chat_text(
    req: TextChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await _ensure_conversation(req.conversation_id, current_user, db)

    # Save user message
    await _save_message(db, req.conversation_id, "user", req.query, "text")
    logger.info(f"Text chat: user={current_user.id}, conv={req.conversation_id}, query={req.query[:50]}")
    
    # Pre-yield an empty space and padding to flush buffers
    async def chat_wrapper():
        yield f": {' ' * 4096}\n\n"
        yield f"data: {json.dumps({'content': ''})}\n\n"
        async for chunk in _stream_and_save(req.query, req.conversation_id, current_user.id, conv, db):
            yield chunk

    return StreamingResponse(
        chat_wrapper(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff",
            "Content-Encoding": "identity",
        },
    )


@router.post("/audio")
async def chat_audio(
    conversation_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await _ensure_conversation(conversation_id, current_user, db)

    # Read audio file
    file_bytes = await file.read()
    logger.info(f"Audio chat: user={current_user.id}, file={file.filename}, size={len(file_bytes)}")

    # Transcribe audio
    asr_result = transcribe_audio(file_bytes, file.filename or "audio.wav")
    # Handle both sync and async
    if hasattr(asr_result, "__await__"):
        asr_result = await asr_result

    if not asr_result.get("success"):
        logger.error(f"ASR failed for user {current_user.id}: {asr_result.get('error')}")
        raise HTTPException(status_code=500, detail="Transcription failed")

    transcription = asr_result.get("transcript", "")
    logger.info(f"Audio transcribed successfully for user {current_user.id}: '{transcription[:50]}...'")
    if not transcription:
        raise HTTPException(status_code=502, detail="Empty transcription returned")

    # Save user message with transcription
    await _save_message(db, conversation_id, "user", transcription, "audio")

    # Stream the transcription to the client first, then AI response
    async def audio_stream():
        # Prime the connection with padding
        yield f": {' ' * 4096}\n\n"
        yield f"data: {json.dumps({'content': ''})}\n\n"
        # First, send the transcription so frontend can update the user bubble
        yield f"data: {json.dumps({'transcription': transcription})}\n\n"

        # Then stream AI response
        async for chunk in _stream_and_save(transcription, conversation_id, current_user.id, conv, db):
            yield chunk

    return StreamingResponse(
        audio_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff",
            "Content-Encoding": "identity",
        },
    )


@router.post("/image")
async def chat_image(
    conversation_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await _ensure_conversation(conversation_id, current_user, db)

    # Read image file
    file_bytes = await file.read()
    logger.info(f"Image chat: user={current_user.id}, file={file.filename}, size={len(file_bytes)}")

    # Extract text / generate caption from image
    vision_result = extract_image_text(file_bytes, file.filename or "image.png")
    if hasattr(vision_result, "__await__"):
        vision_result = await vision_result

    if not vision_result.get("success"):
        logger.error(f"Vision API failed for user {current_user.id}: {vision_result.get('error')}")
        raise HTTPException(status_code=500, detail="Image processing failed")

    caption = vision_result.get("extracted_text", "")
    logger.info(f"Image text extracted for user {current_user.id} ({len(caption)} chars)")
    if not caption:
        raise HTTPException(status_code=502, detail="Empty caption returned")

    # Save user message with caption
    await _save_message(db, conversation_id, "user", caption, "image")

    # Stream caption first, then AI response
    async def image_stream():
        # Prime the connection with padding
        yield f": {' ' * 4096}\n\n"
        yield f"data: {json.dumps({'content': ''})}\n\n"
        yield f"data: {json.dumps({'transcription': caption})}\n\n"

        async for chunk in _stream_and_save(caption, conversation_id, current_user.id, conv, db):
            yield chunk

    return StreamingResponse(
        image_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff",
            "Content-Encoding": "identity",
        },
    )
