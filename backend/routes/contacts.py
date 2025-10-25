from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from db import db, is_mongodb_available
import uuid

router = APIRouter(prefix="/contacts", tags=["Contacts"])

# Pydantic models
class ContactCreate(BaseModel):
    name: str
    nox_id: str

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    nox_id: Optional[str] = None

class Contact(BaseModel):
    id: str
    name: str
    nox_id: str
    last_message: Optional[str] = None
    last_message_time: Optional[str] = None

# Add a new contact
@router.post("/{secret_code}")
async def add_contact(secret_code: str, contact: ContactCreate):
    if not is_mongodb_available():
        # localStorage mode - frontend handles persistence
        contact_data = {
            "id": str(uuid.uuid4()),
            "name": contact.name,
            "nox_id": contact.nox_id,
            "last_message": None,
            "last_message_time": None
        }
        return {"message": "Contact added (localStorage mode)", "data": contact_data}

    # Check if contact already exists
    existing = await db.contacts.find_one({
        "secret_code": secret_code,
        "contacts.nox_id": contact.nox_id
    })
    if existing:
        raise HTTPException(400, "Contact with this NOX-ID already exists")

    contact_data = {
        "id": str(uuid.uuid4()),
        "name": contact.name,
        "nox_id": contact.nox_id,
        "last_message": None,
        "last_message_time": None
    }

    await db.contacts.update_one(
        {"secret_code": secret_code},
        {"$push": {"contacts": contact_data}},
        upsert=True
    )

    return {"message": "Contact added", "data": contact_data}

# Get all contacts for a user
@router.get("/{secret_code}")
async def get_contacts(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - return empty (frontend manages data)
        return {"contacts": []}
    
    doc = await db.contacts.find_one({"secret_code": secret_code}, {"_id": 0})
    if not doc or "contacts" not in doc:
        return {"contacts": []}
    return {"contacts": doc["contacts"]}

# Update a contact
@router.put("/{secret_code}/{contact_id}")
async def update_contact(secret_code: str, contact_id: str, update: ContactUpdate):
    if not is_mongodb_available():
        # localStorage mode - frontend handles updates
        return {"message": "Contact updated (localStorage mode)"}
    
    update_fields = {f"contacts.$.{k}": v for k, v in update.dict(exclude_none=True).items()}
    result = await db.contacts.update_one(
        {"secret_code": secret_code, "contacts.id": contact_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Contact not found")
    return {"message": "Contact updated"}

# Delete a contact
@router.delete("/{secret_code}/{contact_id}")
async def delete_contact(secret_code: str, contact_id: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles deletion
        return {"message": "Contact deleted (localStorage mode)"}
    
    result = await db.contacts.update_one(
        {"secret_code": secret_code},
        {"$pull": {"contacts": {"id": contact_id}}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Contact not found")
    return {"message": "Contact deleted"}

# Delete all contacts for a user
@router.delete("/{secret_code}")
async def delete_all_contacts(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles deletion
        return {"message": "All contacts deleted (localStorage mode)"}
    
    result = await db.contacts.delete_one({"secret_code": secret_code})
    if result.deleted_count == 0:
        raise HTTPException(404, "No contacts found for user")
    return {"message": "All contacts deleted"}
