from fastapi import APIRouter, HTTPException
from models.reminder import ReminderCreate, ReminderUpdate
from datetime import datetime
import uuid
from db import db, is_mongodb_available

router = APIRouter(prefix="/reminders", tags=["Reminders"])

# ----------- HELPERS -----------

def generate_reminder_id():
    return str(uuid.uuid4().int)[:8]


# ----------- ENDPOINTS -----------

# Add a new reminder
@router.post("/{secret_code}")
def add_reminder(secret_code: str, payload: ReminderCreate):
    reminder = {
        "reminder_id": generate_reminder_id(),
        "reminder_description": payload.reminder_description,
        "reminder_time": payload.reminder_time.isoformat(),
        "reminder_created_at": datetime.utcnow().isoformat(),
        "number_of_reminders_sent": 0,
        "last_reminder_sent_at": None,
        "current_state": "Active"
    }

    if not is_mongodb_available():
        # localStorage mode - frontend handles persistence
        return {"message": "Reminder added (localStorage mode)", "data": reminder}

    db.reminders.update_one(
        {"secret_code": secret_code},
        {"$push": {"reminders": reminder}},
        upsert=True
    )

    return {"message": "Reminder added", "data": reminder}


# Get all reminders for a user
@router.get("/{secret_code}")
def get_reminders(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - return empty (frontend manages data)
        raise HTTPException(404, "No reminders found (localStorage mode)")
    
    doc = db.reminders.find_one({"secret_code": secret_code}, {"_id": 0})
    if not doc or "reminders" not in doc:
        raise HTTPException(404, "No reminders found")
    return {"reminders": doc["reminders"]}


# Update a reminder
@router.put("/{secret_code}/{reminder_id}")
def update_reminder(secret_code: str, reminder_id: str, payload: ReminderUpdate):
    if not is_mongodb_available():
        # localStorage mode - frontend handles updates
        return {"message": "Reminder updated (localStorage mode)"}
    
    update_fields = {f"reminders.$.{k}": v for k, v in payload.dict(exclude_none=True).items()}
    result = db.reminders.update_one(
        {"secret_code": secret_code, "reminders.reminder_id": reminder_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Reminder not found")
    return {"message": "Reminder updated"}


# Delete a reminder
@router.delete("/{secret_code}/{reminder_id}")
def delete_reminder(secret_code: str, reminder_id: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles deletion
        return {"message": "Reminder deleted (localStorage mode)"}
    
    result = db.reminders.update_one(
        {"secret_code": secret_code},
        {"$pull": {"reminders": {"reminder_id": reminder_id}}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Reminder not found")
    return {"message": "Reminder deleted"}


# Delete all reminders for a user
@router.delete("/{secret_code}")
def delete_all_reminders(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles deletion
        return {"message": "All reminders deleted (localStorage mode)"}
    
    result = db.reminders.delete_one({"secret_code": secret_code})
    if result.deleted_count == 0:
        raise HTTPException(404, "No reminders found for user")
    return {"message": "All reminders deleted"}
