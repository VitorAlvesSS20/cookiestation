from fastapi import APIRouter, Depends, HTTPException, Body
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from ..auth import db, get_user_data

router = APIRouter()

@router.post("/init")
async def initialize_chat(payload: dict = Body(...), user=Depends(get_user_data)):
    target_id = payload.get("targetUserId")
    my_id = user['uid']
    
    if not target_id:
        raise HTTPException(status_code=400, detail="ID do alvo necessário")
    
    if my_id == target_id:
        raise HTTPException(status_code=400, detail="Operação inválida")

    uids = sorted([my_id, target_id])
    chat_id = f"{uids[0]}_{uids[1]}"

    chat_ref = db.collection('chats').document(chat_id)
    chat_doc = chat_ref.get()

    if chat_doc.exists:
        return {"id": chat_id, "status": "existing"}

    chat_data = {
        "participants": [my_id, target_id],
        "createdAt": firestore.SERVER_TIMESTAMP,
        "lastUpdate": firestore.SERVER_TIMESTAMP,
        "lastMessage": ""
    }
    
    chat_ref.set(chat_data)
    return {"id": chat_id, "status": "created"}

@router.get("/")
async def list_my_chats(user=Depends(get_user_data)):
    docs = db.collection('chats').where(filter=FieldFilter('participants', 'array_contains', user['uid'])).stream()
    results = []
    for doc in docs:
        results.append({**doc.to_dict(), "id": doc.id})
    
    results.sort(key=lambda x: x.get('lastUpdate') if x.get('lastUpdate') else 0, reverse=True)
    return results

@router.get("/{chat_id}")
async def get_chat_details(chat_id: str, user=Depends(get_user_data)):
    chat_doc = db.collection('chats').document(chat_id).get()
    if not chat_doc.exists:
        raise HTTPException(status_code=404, detail="Chat não encontrado")
    
    data = chat_doc.to_dict()
    if user['uid'] not in data.get('participants', []) and not user.get('isAdmin'):
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    return {**data, "id": chat_id}

@router.post("/{chat_id}/messages")
async def send_message(chat_id: str, payload: dict = Body(...), user=Depends(get_user_data)):
    content = payload.get("text") or payload.get("content")
    if not content:
        raise HTTPException(status_code=400, detail="Conteúdo vazio")

    chat_ref = db.collection('chats').document(chat_id)
    chat_doc = chat_ref.get()
    
    if not chat_doc.exists:
        raise HTTPException(status_code=404, detail="Chat não encontrado")
        
    chat_data = chat_doc.to_dict()
    if user['uid'] not in chat_data.get('participants', []):
        raise HTTPException(status_code=403, detail="Acesso negado")

    message_data = {
        "userId": user['uid'],
        "text": content,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "seen": False
    }

    batch = db.batch()
    new_msg_ref = chat_ref.collection('messages').document()
    
    batch.set(new_msg_ref, message_data)
    batch.update(chat_ref, {
        "lastUpdate": firestore.SERVER_TIMESTAMP,
        "lastMessage": content
    })
    
    batch.commit()
    return {"id": new_msg_ref.id}

@router.get("/{chat_id}/messages")
async def list_messages(chat_id: str, limit: int = 50, user=Depends(get_user_data)):
    chat_ref = db.collection('chats').document(chat_id)
    chat_doc = chat_ref.get()
    
    if not chat_doc.exists:
        raise HTTPException(status_code=404, detail="Chat não encontrado")
    
    if user['uid'] not in chat_doc.to_dict().get('participants', []) and not user.get('isAdmin'):
        raise HTTPException(status_code=403, detail="Acesso negado")

    messages = chat_ref.collection('messages')\
        .order_by('createdAt', direction=firestore.Query.ASCENDING)\
        .limit(limit)\
        .stream()
    
    return [{**m.to_dict(), "id": m.id} for m in messages]

@router.delete("/{chat_id}/messages/{message_id}")
async def delete_message(chat_id: str, message_id: str, user=Depends(get_user_data)):
    msg_ref = db.collection('chats').document(chat_id).collection('messages').document(message_id)
    doc = msg_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Mensagem não encontrada")
        
    data = doc.to_dict()
    if data.get('userId') != user['uid'] and not user.get('isAdmin'):
        raise HTTPException(status_code=403, detail="Não autorizado")
        
    msg_ref.delete()
    return {"status": "deleted"}

@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, user=Depends(get_user_data)):
    chat_ref = db.collection('chats').document(chat_id)
    chat_doc = chat_ref.get()
    
    if not chat_doc.exists:
        raise HTTPException(status_code=404, detail="Chat não encontrado")
    
    data = chat_doc.to_dict()
    if user['uid'] not in data.get('participants', []) and not user.get('isAdmin'):
        raise HTTPException(status_code=403, detail="Acesso negado")

    batch = db.batch()
    messages = chat_ref.collection('messages').stream()
    for msg in messages:
        batch.delete(msg.reference)
        
    batch.delete(chat_ref)
    batch.commit()
    
    return {"status": "deleted"}