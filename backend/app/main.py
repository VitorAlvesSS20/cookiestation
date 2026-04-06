from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os

from .routes import stories, chapters, users, chats, comments

app = FastAPI(
    title="CookieStation API",
    description="Backend oficial do CookieStation",
    version="1.0.0"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://cookiestation.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(stories.router, prefix="/stories", tags=["Stories"])
app.include_router(
    chapters.router,
    prefix="/stories/{story_id}/chapters",
    tags=["Chapters"],
)
app.include_router(chats.router, prefix="/chats", tags=["Chats"])
app.include_router(comments.router, prefix="/comments", tags=["Comments"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "success": True,
        "data": {
            "status": "online",
            "service": "CookieStation API",
            "timestamp": datetime.utcnow().isoformat(),
        },
    }


@app.get("/system/stats", tags=["System"])
async def get_stats():
    return {
        "success": True,
        "data": {
            "version": "1.0.0",
            "environment": os.getenv("ENV", "production"),
            "features": ["auth", "stories", "chapters", "messages", "comments"],
        },
    }