from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from db import db, is_mongodb_available
from models.nox import NoxCreate, NoxUpdate, NoxResponse
import random

router = APIRouter(prefix="/nox", tags=["Nox"])


# 🔑 Generate unique nox_id
async def generate_unique_nox_id() -> str:
    if not is_mongodb_available():
        # localStorage mode - just generate random ID
        return str(random.randint(100000, 999999))
    
    while True:
        candidate = str(random.randint(100000, 999999))  # 6-digit id
        exists = await db.nox.find_one({"nox_id": candidate})
        if not exists:
            return candidate


# ✅ Create Nox document
@router.post("/", response_model=NoxResponse, status_code=status.HTTP_201_CREATED)
async def create_nox(nox: NoxCreate):
    nox_data = nox.dict()
    nox_data["nox_id"] = await generate_unique_nox_id()

    if not is_mongodb_available():
        # localStorage mode - return nox data (frontend handles persistence)
        return nox_data

    result = await db.nox.insert_one(nox_data)
    if result.inserted_id:
        return nox_data
    raise HTTPException(status_code=500, detail="Failed to create Nox document")


# ✅ Get Nox by id
@router.get("/{nox_id}", response_model=NoxResponse)
async def get_nox(nox_id: str):
    if not is_mongodb_available():
        # localStorage mode - return 404 (frontend manages data)
        raise HTTPException(status_code=404, detail="Nox not found (localStorage mode)")
    
    nox = await db.nox.find_one({"nox_id": nox_id})
    if not nox:
        raise HTTPException(status_code=404, detail="Nox not found")
    return NoxResponse(**nox)


# ✅ Update Nox
@router.put("/{nox_id}", response_model=NoxResponse)
async def update_nox(nox_id: str, update: NoxUpdate):
    if not is_mongodb_available():
        # localStorage mode - return updated data (frontend handles persistence)
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        update_data["nox_id"] = nox_id
        return NoxResponse(**update_data)
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    result = await db.nox.find_one_and_update(
        {"nox_id": nox_id},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Nox not found")
    return NoxResponse(**result)


# ✅ Delete Nox
@router.delete("/{nox_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_nox(nox_id: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles deletion
        return {"message": "Nox deleted successfully (localStorage mode)"}
    
    result = await db.nox.delete_one({"nox_id": nox_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nox not found")
    return {"message": "Nox deleted successfully"}


# ✅ List all Nox docs (paginated)
@router.get("/", response_model=List[NoxResponse])
async def list_nox(skip: int = 0, limit: int = Query(default=10, le=100)):
    if not is_mongodb_available():
        # localStorage mode - return empty list (frontend manages data)
        return []
    
    cursor = db.nox.find().skip(skip).limit(limit)
    noxes = await cursor.to_list(length=limit)
    return [NoxResponse(**nox) for nox in noxes]
