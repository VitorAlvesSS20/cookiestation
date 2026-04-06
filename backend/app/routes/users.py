from fastapi import APIRouter, Depends, HTTPException, Body
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from ..auth import db, get_user_data

router = APIRouter()

@router.get("/me")
async def get_my_profile(user=Depends(get_user_data)):
    user_doc = db.collection('users').document(user['uid']).get()
    if not user_doc.exists:
        return {
            "uid": user['uid'],
            "email": user.get('email'),
            "displayName": user.get('name', "Viajante"),
            "photoURL": user.get('picture', ""),
            "new_user": True
        }
    return {**user_doc.to_dict(), "id": user_doc.id}

@router.post("/sync")
async def sync_user(user=Depends(get_user_data)):
    user_ref = db.collection('users').document(user['uid'])
    doc = user_ref.get()
    
    if not doc.exists:
        user_data = {
            "uid": user['uid'],
            "email": user.get('email'),
            "displayName": user.get('name', "Viajante"),
            "photoURL": user.get('picture', ""),
            "isAdmin": False,
            "isBanned": False,
            "bio": "",
            "createdAt": firestore.SERVER_TIMESTAMP,
            "lastLogin": firestore.SERVER_TIMESTAMP
        }
        user_ref.set(user_data)
        return {"status": "created", "data": user_data}
    
    user_ref.update({"lastLogin": firestore.SERVER_TIMESTAMP})
    return {"status": "synced"}

@router.get("/search")
async def search_users(q: str = "", user=Depends(get_user_data)):
    if not q:
        return []
    
    try:
        users_ref = db.collection('users')
        query = users_ref.where(filter=FieldFilter('displayName', '>=', q))\
                         .where(filter=FieldFilter('displayName', '<=', q + '\uf8ff'))\
                         .limit(10)\
                         .stream()
        
        results = []
        for doc in query:
            u_data = doc.to_dict()
            if doc.id != user['uid']:
                results.append({
                    "id": doc.id,
                    "displayName": u_data.get("displayName"),
                    "photoURL": u_data.get("photoURL"),
                    "username": u_data.get("username")
                })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
async def get_user_public_profile(user_id: str, current_user=Depends(get_user_data)):
    user_doc = db.collection('users').document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    data = user_doc.to_dict()
    
    if current_user['uid'] != user_id and not current_user.get('isAdmin'):
        private_fields = ['email', 'isAdmin', 'isBanned', 'lastLogin']
        for field in private_fields:
            data.pop(field, None)
        
    return {**data, "id": user_id}

@router.patch("/me")
@router.put("/me")
async def update_my_profile(payload: dict = Body(...), user=Depends(get_user_data)):
    try:
        user_ref = db.collection('users').document(user['uid'])
        
        allowed_fields = {'displayName', 'photoURL', 'bio', 'location', 'authorStatus'}
        update_data = {k: v for k, v in payload.items() if k in allowed_fields}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Nenhum campo válido para atualização")

        update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        user_ref.set(update_data, merge=True)
        
        return {"status": "success", "updated": list(update_data.keys())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}")
async def delete_user_account(user_id: str, user=Depends(get_user_data)):
    if user['uid'] != user_id and not user.get('isAdmin'):
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    user_ref = db.collection('users').document(user_id)
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="Usuário não existe")

    user_ref.delete()
    return {"status": "user deleted"}