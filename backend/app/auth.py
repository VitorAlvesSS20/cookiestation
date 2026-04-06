import os
import firebase_admin
from firebase_admin import auth, credentials, firestore
from fastapi import HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()
security = HTTPBearer()

async def get_current_user(res: HTTPAuthorizationCredentials = Security(security)):
    try:
        decoded_token = auth.verify_id_token(res.credentials)
        return decoded_token
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_user_data(user=Depends(get_current_user)):
    user_ref = db.collection('users').document(user['uid']).get()
    if not user_ref.exists:
        return {"uid": user['uid'], "isAdmin": False, "isBanned": False}
    data = user_ref.to_dict()
    if data.get('isBanned'):
        raise HTTPException(status_code=403, detail="Banned")
    data['uid'] = user['uid']
    return data

def require_admin(user_data=Depends(get_user_data)):
    if not user_data.get('isAdmin'):
        raise HTTPException(status_code=403, detail="Admin required")
    return user_data