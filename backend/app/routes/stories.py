from fastapi import APIRouter, Depends, Query, HTTPException
from firebase_admin import firestore
from ..auth import db, get_user_data
from ..models.schemas import StoryCreate, StoryUpdate

router = APIRouter()


@router.get("/me")
async def list_my_stories(user=Depends(get_user_data)):
    docs = db.collection("stories").where("userId", "==", user["uid"]).stream()

    return {
        "success": True,
        "data": [{**doc.to_dict(), "id": doc.id} for doc in docs],
    }


@router.get("/")
async def list_stories(limit: int = Query(20, le=50)):
    docs = db.collection("stories").limit(limit).stream()

    return {
        "success": True,
        "data": [{**doc.to_dict(), "id": doc.id} for doc in docs],
    }


@router.get("/{story_id}")
async def get_story(story_id: str, user=Depends(get_user_data)):
    doc_ref = db.collection("stories").document(story_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(404, "História não encontrada")

    data = doc.to_dict()

    like_doc = doc_ref.collection("likes").document(user["uid"]).get()
    data["isLiked"] = like_doc.exists

    return {"success": True, "data": {**data, "id": doc.id}}


@router.post("/")
async def create_story(story: StoryCreate, user=Depends(get_user_data)):
    data = story.model_dump()

    data.update(
        {
            "userId": user["uid"],
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
            "chapterCount": 0,
            "likesCount": 0,
            "views": 0,
            "totalWords": 0,
        }
    )

    doc_ref = db.collection("stories").document()
    doc_ref.set(data)

    return {"success": True, "data": {"id": doc_ref.id}}


@router.post("/{story_id}/like")
async def toggle_like(story_id: str, user=Depends(get_user_data)):
    story_ref = db.collection("stories").document(story_id)
    story_doc = story_ref.get()

    if not story_doc.exists:
        raise HTTPException(404, "História não encontrada")

    like_ref = story_ref.collection("likes").document(user["uid"])
    like_doc = like_ref.get()

    batch = db.batch()

    if like_doc.exists:
        batch.delete(like_ref)
        batch.update(story_ref, {"likesCount": firestore.Increment(-1)})
        result = "unliked"
    else:
        batch.set(
            like_ref,
            {
                "userId": user["uid"],
                "createdAt": firestore.SERVER_TIMESTAMP,
            },
        )
        batch.update(story_ref, {"likesCount": firestore.Increment(1)})
        result = "liked"

    batch.commit()

    return {"success": True, "data": {"status": result}}


@router.patch("/{story_id}")
@router.put("/{story_id}")
async def update_story(
    story_id: str,
    story_update: StoryUpdate,
    user=Depends(get_user_data),
):
    story_ref = db.collection("stories").document(story_id)
    doc = story_ref.get()

    if not doc.exists:
        raise HTTPException(404, "História não encontrada")

    current_data = doc.to_dict()
    update_data = story_update.model_dump(exclude_unset=True)

    if not update_data:
        return {"success": True, "data": {"status": "no_changes"}}

    is_owner = current_data.get("userId") == user["uid"]
    is_admin = user.get("isAdmin", False)

    public_fields = {"views", "likesCount"}
    is_public_update = all(field in public_fields for field in update_data.keys())

    if not (is_owner or is_admin or is_public_update):
        raise HTTPException(403, "Acesso negado")

    update_data["updatedAt"] = firestore.SERVER_TIMESTAMP

    story_ref.update(update_data)

    return {"success": True}


@router.delete("/{story_id}")
async def delete_story(story_id: str, user=Depends(get_user_data)):
    story_ref = db.collection("stories").document(story_id)
    doc = story_ref.get()

    if not doc.exists:
        raise HTTPException(404, "História não encontrada")

    data = doc.to_dict()

    if data.get("userId") != user["uid"] and not user.get("isAdmin"):
        raise HTTPException(403, "Não autorizado")

    batch = db.batch()

    chapters = story_ref.collection("chapters").stream()
    for chapter in chapters:
        batch.delete(chapter.reference)

    batch.delete(story_ref)
    batch.commit()

    return {"success": True}