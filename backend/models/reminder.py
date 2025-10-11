from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReminderBase(BaseModel):
    reminder_description: str
    reminder_time: datetime

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    reminder_description: Optional[str] = None
    reminder_time: Optional[datetime] = None
    current_state: Optional[str] = None
