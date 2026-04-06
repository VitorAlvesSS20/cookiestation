from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    displayName: Optional[str] = None
    photoURL: Optional[str] = None

class UserCreate(UserBase):
    uid: str

class UserUpdate(BaseModel):
    displayName: Optional[str] = None
    photoURL: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[dict] = None

class StoryBase(BaseModel):
    title: str
    synopsis: str
    genre: str = "Geral"
    coverUrl: Optional[str] = None
    status: str = "writing"
    tags: List[str] = []

class StoryCreate(StoryBase):
    pass

class StoryUpdate(BaseModel):
    title: Optional[str] = None
    synopsis: Optional[str] = None
    genre: Optional[str] = None
    status: Optional[str] = None
    coverUrl: Optional[str] = None
    views: Optional[int] = None
    likesCount: Optional[int] = None

class ChapterCreate(BaseModel):
    title: str
    content: str
    chapterCover: Optional[str] = ""
    order: Optional[int] = 0
    wordCount: Optional[int] = 0

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    chapterCover: Optional[str] = None
    order: Optional[int] = None
    wordCount: Optional[int] = None

class ChatInit(BaseModel):
    targetUserId: str

class MessageCreate(BaseModel):
    receiverId: str
    content: str
    chatId: Optional[str] = None

class CommentCreate(BaseModel):
    storyId: str
    content: str
    parentCommentId: Optional[str] = None

class LikeToggle(BaseModel):
    storyId: str

class StoryResponse(StoryBase):
    id: str
    userId: str
    chapterCount: int = 0
    likesCount: int = 0
    views: int = 0
    createdAt: Any

class ChapterResponse(BaseModel):
    id: str
    title: str
    content: str
    chapterCover: Optional[str] = None
    order: int
    wordCount: int
    createdAt: Any