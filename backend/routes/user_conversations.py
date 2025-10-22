from fastapi import APIRouter, HTTPException
from models.conversation import MessageCreate, MessageUpdate
from datetime import datetime
import uuid
from db import db  # MongoDB client wrapper

router = APIRouter(prefix="/user_conversations", tags=["User Conversations"])

# ----------- HELPERS -----------

def generate_message_id():
    return str(uuid.uuid4().int)[:8]

# ----------- ENDPOINTS -----------

# Add a message
@router.post("/{secret_code}/message")
def add_message(secret_code: str, payload: MessageCreate):
    message = {
        "message_id": generate_message_id(),
        "from_user": payload.from_user,
        "to_user": payload.to_user,
        "message": payload.message,
        "datetime": datetime.utcnow().isoformat()
    }

    result = db.conversations.update_one(
        {"secret_code": secret_code},
        {"$push": {"my_conversation": message}},
        upsert=True  # create document if not exists
    )

    return {"message": "Message added", "data": message}


# Get all messages
@router.get("/{secret_code}")
def get_conversation(secret_code: str):
    doc = db.conversations.find_one({"secret_code": secret_code}, {"_id": 0})
    if not doc or "my_conversation" not in doc:
        raise HTTPException(404, "Conversation not found")
    return {"my_conversation": doc["my_conversation"]}


# Update a message
@router.put("/{secret_code}/message/{message_id}")
def update_message(secret_code: str, message_id: str, payload: MessageUpdate):
    result = db.conversations.update_one(
        {"secret_code": secret_code, "my_conversation.message_id": message_id},
        {"$set": {"my_conversation.$.message": payload.message}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Message not found")
    return {"message": "Message updated"}


# Delete a message
@router.delete("/{secret_code}/message/{message_id}")
def delete_message(secret_code: str, message_id: str):
    result = db.conversations.update_one(
        {"secret_code": secret_code},
        {"$pull": {"my_conversation": {"message_id": message_id}}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Message not found")
    return {"message": "Message deleted"}


# Delete entire conversation
@router.delete("/{secret_code}")
def delete_conversation(secret_code: str):
    result = db.conversations.delete_one({"secret_code": secret_code})
    if result.deleted_count == 0:
        raise HTTPException(404, "Conversation not found")
    return {"message": "Conversation deleted"}
