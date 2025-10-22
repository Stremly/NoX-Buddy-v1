from fastapi import APIRouter, HTTPException, Query
from models.nox import MessageUpdate
from datetime import datetime
import uuid
from db import db  # your Mongo client wrapper


router = APIRouter(prefix="/conversations", tags=["Conversations"])

# ----------- HELPERS -----------

def generate_message_id():
    return str(uuid.uuid4().int)[:8]


async def check_contact(nox_id: str, peer_id: str, secret_code: str):
    """Ensure peer is in contacts and user is authorized."""
    user = await db.users.find_one({"nox_id": nox_id, "secret_code": secret_code})
    if not user:
        raise HTTPException(403, "Invalid secret code or NoX ID")
    if peer_id not in user.get("contacts", []):
        raise HTTPException(403, "Peer not in contacts")
    return True


# ----------- ENDPOINTS -----------

@router.post("/{nox_id}/start/{peer_id}", response_model=dict)
async def start_conversation(nox_id: str, peer_id: str, secret_code: str = Query(...)):
    await check_contact(nox_id, peer_id, secret_code)

    for nid, pid in [(nox_id, peer_id), (peer_id, nox_id)]:
        db.nox.update_one(
            {"nox_id": nid, f"conversations.{pid}": {"$exists": False}},
            {"$set": {f"conversations.{pid}": []}}
        )

    return {"message": "Conversation started between both NoX bots"}


@router.post("/{nox_id}/{peer_id}/message", response_model=dict)
async def add_message(nox_id: str, peer_id: str, message: str, secret_code: str = Query(...)):
    await check_contact(nox_id, peer_id, secret_code)

    msg_id = generate_message_id()
    timestamp = datetime.utcnow().isoformat()

    sent_msg = {
        "message_id": msg_id,
        "direction": "sent",
        "message": message,
        "datetime": timestamp,
    }
    recv_msg = {**sent_msg, "direction": "received"}

    await db.nox.update_one(
        {"nox_id": nox_id},
        {"$push": {f"conversations.{peer_id}": sent_msg}},
    )
    await db.nox.update_one(
        {"nox_id": peer_id},
        {"$push": {f"conversations.{nox_id}": recv_msg}},
    )

    return {"message": "Message synced", "data": sent_msg}


@router.get("/{nox_id}/{peer_id}", response_model=dict)
async def get_conversation(nox_id: str, peer_id: str, secret_code: str = Query(...)):
    await check_contact(nox_id, peer_id, secret_code)

    doc = await db.nox.find_one(
        {"nox_id": nox_id}, {f"conversations.{peer_id}": 1, "_id": 0}
    )
    if not doc or peer_id not in doc.get("conversations", {}):
        raise HTTPException(404, "Conversation not found")

    return {"messages": doc["conversations"][peer_id]}


@router.put("/{nox_id}/{peer_id}/message/{message_id}", response_model=dict)
async def update_message(
    nox_id: str, peer_id: str, message_id: str, payload: MessageUpdate, secret_code: str = Query(...)
):
    await check_contact(nox_id, peer_id, secret_code)

    for nid, pid in [(nox_id, peer_id), (peer_id, nox_id)]:
        await db.nox.update_one(
            {"nox_id": nid},
            {"$set": {f"conversations.{pid}.$[msg].message": payload.message}},
            array_filters=[{"msg.message_id": message_id}],
        )

    return {"message": "Message updated in both NoX histories"}


@router.delete("/{nox_id}/{peer_id}/message/{message_id}", response_model=dict)
async def delete_message(nox_id: str, peer_id: str, message_id: str, secret_code: str = Query(...)):
    await check_contact(nox_id, peer_id, secret_code)

    for nid, pid in [(nox_id, peer_id), (peer_id, nox_id)]:
        await db.nox.update_one(
            {"nox_id": nid},
            {"$pull": {f"conversations.{pid}": {"message_id": message_id}}},
        )

    return {"message": "Message deleted from both NoX histories"}


@router.delete("/{nox_id}/{peer_id}", response_model=dict)
async def delete_conversation(nox_id: str, peer_id: str, secret_code: str = Query(...)):
    await check_contact(nox_id, peer_id, secret_code)

    for nid, pid in [(nox_id, peer_id), (peer_id, nox_id)]:
        await db.nox.update_one({"nox_id": nid}, {"$unset": {f"conversations.{pid}": ""}})

    return {"message": "Conversation deleted from both NoX bots"}
