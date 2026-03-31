import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas import ConversationCreate, ConversationOut, ConversationListItem
from app.auth import get_current_user

router = APIRouter(prefix="/api/conversations", tags=["conversations"])
logger = logging.getLogger("conversations")


@router.get("", response_model=list[ConversationListItem])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(desc(Conversation.updated_at))
    )
    conversations = result.scalars().all()

    items = []
    for conv in conversations:
        # Get last message
        msg_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        last_msg = msg_result.scalar_one_or_none()
        items.append(
            ConversationListItem(
                id=conv.id,
                title=conv.title,
                last_message=last_msg.content[:60] if last_msg else "",
                updated_at=conv.updated_at,
            )
        )
    return items


@router.post("", response_model=ConversationOut)
async def create_conversation(
    req: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = Conversation(user_id=current_user.id, title=req.title)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    logger.info(f"Conversation created: {conv.id} ('{conv.title}') for user {current_user.id}")
    return ConversationOut(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[],
    )


@router.get("/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        logger.warning(f"Conversation not found: {conversation_id} for user {current_user.id}")
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    logger.info(f"User {current_user.id} retrieved history for conv {conversation_id}")
    return conv


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == current_user.id
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        logger.warning(f"Failed to delete conversation (not found): {conversation_id}")
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()
    logger.info(f"Conversation deleted: {conversation_id} by user {current_user.id}")
    return {"detail": "Conversation deleted"}
