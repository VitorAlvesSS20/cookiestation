from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from ..auth import db, get_user_data
from ..models.schemas import CommentCreate

router = APIRouter()

@router.post("/{story_id}")
async def add_comment(story_id: str, comment: CommentCreate, user=Depends(get_user_data)):
    comment_data = {
        "userId": user["uid"],
        "userName": user.get("displayName", "Anônimo"),
        "userPhoto": user.get("photoURL", ""),
        "content": comment.content,
        "storyId": story_id,
        "createdAt": firestore.SERVER_TIMESTAMP
    }

    try:
        story_ref = db.collection("stories").document(story_id)
        if not story_ref.get().exists:
            raise HTTPException(status_code=404, detail="História não encontrada")

        new_comment_ref = story_ref.collection("comments").document()
        new_comment_ref.set(comment_data)
        
        return {"id": new_comment_ref.id}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{story_id}")
async def list_comments(story_id: str):
    try:
        comments_ref = db.collection("stories").document(story_id).collection("comments")
        docs = comments_ref.order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
        
        return [{**doc.to_dict(), "id": doc.id} for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))