from pydantic import BaseModel
from typing import List
from datetime import datetime

class Message(BaseModel):
    message_id: str
    from_user: str
    to_user: str
    message: str
    datetime: datetime

class MessageCreate(BaseModel):
    from_user: str
    to_user: str
    message: str

class MessageUpdate(BaseModel):
    message: str
