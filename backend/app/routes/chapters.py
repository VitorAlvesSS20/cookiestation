from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from ..auth import db, get_user_data
from ..models.schemas import ChapterCreate, ChapterUpdate

router = APIRouter()


@router.post("/")
async def create_chapter(
    story_id: str,
    chapter: ChapterCreate,
    user=Depends(get_user_data)
):
    story_ref = db.collection("stories").document(story_id)
    story_doc = story_ref.get()

    if not story_doc.exists:
        raise HTTPException(404, "História não encontrada")

    story_data = story_doc.to_dict()

    if story_data.get("userId") != user["uid"]:
        raise HTTPException(403, "Acesso negado")

    data = chapter.model_dump()
    data["userId"] = user["uid"]
    data["createdAt"] = firestore.SERVER_TIMESTAMP
    data["wordCount"] = len(data.get("content", "").split())

    new_chapter_ref = story_ref.collection("chapters").document()

    batch = db.batch()
    batch.set(new_chapter_ref, data)
    batch.update(
        story_ref,
        {
            "chapterCount": firestore.Increment(1),
            "totalWords": firestore.Increment(data["wordCount"]),
        },
    )
    batch.commit()

    return {"success": True, "data": {"id": new_chapter_ref.id}}


@router.get("/")
async def list_chapters(story_id: str):
    story_ref = db.collection("stories").document(story_id)
    story_doc = story_ref.get()

    if not story_doc.exists:
        raise HTTPException(404, "História não encontrada")

    chapters = (
        story_ref.collection("chapters")
        .order_by("createdAt", direction=firestore.Query.ASCENDING)
        .stream()
    )

    return {
        "success": True,
        "data": [{**c.to_dict(), "id": c.id} for c in chapters],
    }


@router.get("/{chapter_id}")
async def get_chapter(story_id: str, chapter_id: str):
    chapter_ref = (
        db.collection("stories")
        .document(story_id)
        .collection("chapters")
        .document(chapter_id)
    )

    doc = chapter_ref.get()

    if not doc.exists:
        raise HTTPException(404, "Capítulo não encontrado")

    return {"success": True, "data": {**doc.to_dict(), "id": doc.id}}


@router.patch("/{chapter_id}")
@router.put("/{chapter_id}")
async def update_chapter(
    story_id: str,
    chapter_id: str,
    payload: ChapterUpdate,
    user=Depends(get_user_data),
):
    story_ref = db.collection("stories").document(story_id)
    story_doc = story_ref.get()

    if not story_doc.exists:
        raise HTTPException(404, "História não encontrada")

    story_data = story_doc.to_dict()

    if story_data.get("userId") != user["uid"]:
        raise HTTPException(403, "Não autorizado")

    chapter_ref = story_ref.collection("chapters").document(chapter_id)
    chapter_doc = chapter_ref.get()

    if not chapter_doc.exists:
        raise HTTPException(404, "Capítulo não encontrado")

    update_data = payload.model_dump(exclude_unset=True)

    if "content" in update_data:
        update_data["wordCount"] = len(update_data["content"].split())

    update_data["updatedAt"] = firestore.SERVER_TIMESTAMP

    chapter_ref.update(update_data)

    return {"success": True}


@router.delete("/{chapter_id}")
async def delete_chapter(
    story_id: str,
    chapter_id: str,
    user=Depends(get_user_data),
):
    story_ref = db.collection("stories").document(story_id)
    story_doc = story_ref.get()

    if not story_doc.exists:
        raise HTTPException(404, "História não encontrada")

    story_data = story_doc.to_dict()

    if story_data.get("userId") != user["uid"] and not user.get("isAdmin"):
        raise HTTPException(403, "Acesso negado")

    chapter_ref = story_ref.collection("chapters").document(chapter_id)
    chapter_doc = chapter_ref.get()

    if not chapter_doc.exists:
        raise HTTPException(404, "Capítulo não encontrado")

    chapter_data = chapter_doc.to_dict()
    word_count = chapter_data.get("wordCount", 0)

    batch = db.batch()
    batch.delete(chapter_ref)
    batch.update(
        story_ref,
        {
            "chapterCount": firestore.Increment(-1),
            "totalWords": firestore.Increment(-word_count),
        },
    )
    batch.commit()

    return {"success": True}