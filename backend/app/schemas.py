from pydantic import BaseModel, EmailStr
from datetime import datetime


# ── Auth ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    username: str
    email: str

    class Config:
        from_attributes = True


# ── Conversations ─────────────────────────────────────
class ConversationCreate(BaseModel):
    title: str = "New Conversation"


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    type: str
    media_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut] = []

    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    id: str
    title: str
    last_message: str = ""
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Chat ──────────────────────────────────────────────
class TextChatRequest(BaseModel):
    conversation_id: str
    query: str
