from fastapi import APIRouter, HTTPException
from models.memory import MemoryCreate, MemoryUpdate
from db import db
import uuid

router = APIRouter(prefix="/memories", tags=["Memories"])

# ----------- HELPERS -----------

def generate_memory_id():
    return str(uuid.uuid4().int)[:8]

# ----------- ENDPOINTS -----------

# Add a memory
@router.post("/{secret_code}")
def add_memory(secret_code: str, payload: MemoryCreate):
    memory_obj = {
        "memory_id": generate_memory_id(),
        "memory": payload.memory
    }
    db.memories.update_one(
        {"secret_code": secret_code},
        {"$push": {"memories": memory_obj}},
        upsert=True
    )
    return {"message": "Memory added", "data": memory_obj}

# Get all memories
@router.get("/{secret_code}")
def get_memories(secret_code: str):
    doc = db.memories.find_one({"secret_code": secret_code}, {"_id": 0})
    if not doc or "memories" not in doc:
        raise HTTPException(404, "No memories found")
    return {"memories": doc["memories"]}

# Update a memory
@router.put("/{secret_code}/{memory_id}")
def update_memory(secret_code: str, memory_id: str, payload: MemoryUpdate):
    result = db.memories.update_one(
        {"secret_code": secret_code, "memories.memory_id": memory_id},
        {"$set": {"memories.$.memory": payload.memory}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Memory not found")
    return {"message": "Memory updated"}

# Delete a memory
@router.delete("/{secret_code}/{memory_id}")
def delete_memory(secret_code: str, memory_id: str):
    result = db.memories.update_one(
        {"secret_code": secret_code},
        {"$pull": {"memories": {"memory_id": memory_id}}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Memory not found")
    return {"message": "Memory deleted"}

# Delete all memories
@router.delete("/{secret_code}")
def delete_all_memories(secret_code: str):
    result = db.memories.delete_one({"secret_code": secret_code})
    if result.deleted_count == 0:
        raise HTTPException(404, "No memories found for user")
    return {"message": "All memories deleted"}
