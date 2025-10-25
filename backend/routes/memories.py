from fastapi import APIRouter, HTTPException
from models.memory import MemoryCreate, MemoryUpdate
from db import db, is_mongodb_available
import uuid

router = APIRouter(prefix="/memories", tags=["Memories"])

# ----------- HELPERS -----------

def generate_memory_id():
    return str(uuid.uuid4().int)[:8]

# ----------- ENDPOINTS -----------

# Add a memory
@router.post("/{secret_code}")
async def add_memory(secret_code: str, payload: MemoryCreate):
    memory_obj = {
        "memory_id": generate_memory_id(),
        "memory": payload.memory
    }
    
    if not is_mongodb_available():
        # localStorage mode - frontend handles persistence
        return {"message": "Memory added (localStorage mode)", "data": memory_obj}
    
    await db.memories.update_one(
        {"secret_code": secret_code},
        {"$push": {"memories": memory_obj}},
        upsert=True
    )
    return {"message": "Memory added", "data": memory_obj}

# Get all memories
@router.get("/{secret_code}")
async def get_memories(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - return empty (frontend manages data)
        raise HTTPException(404, "No memories found (localStorage mode)")
    
    doc = await db.memories.find_one({"secret_code": secret_code}, {"_id": 0})
    if not doc or "memories" not in doc:
        raise HTTPException(404, "No memories found")
    return {"memories": doc["memories"]}

# Update a memory
@router.put("/{secret_code}/{memory_id}")
async def update_memory(secret_code: str, memory_id: str, payload: MemoryUpdate):
    if not is_mongodb_available():
        # localStorage mode - frontend handles updates
        return {"message": "Memory updated (localStorage mode)"}
    
    result = await db.memories.update_one(
        {"secret_code": secret_code, "memories.memory_id": memory_id},
        {"$set": {"memories.$.memory": payload.memory}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Memory not found")
    return {"message": "Memory updated"}

# Delete a memory
@router.delete("/{secret_code}/{memory_id}")
async def delete_memory(secret_code: str, memory_id: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles deletion
        return {"message": "Memory deleted (localStorage mode)"}
    
    result = await db.memories.update_one(
        {"secret_code": secret_code},
        {"$pull": {"memories": {"memory_id": memory_id}}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Memory not found")
    return {"message": "Memory deleted"}

# Delete all memories
@router.delete("/{secret_code}")
async def delete_all_memories(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles deletion
        return {"message": "All memories deleted (localStorage mode)"}
    
    result = await db.memories.delete_one({"secret_code": secret_code})
    if result.deleted_count == 0:
        raise HTTPException(404, "No memories found for user")
    return {"message": "All memories deleted"}
