from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Message(BaseModel):
    message_id: str
    direction: str  # "sent" or "received"
    message: str
    datetime: datetime

class MessageUpdate(BaseModel):
    message: str

class Conversation(BaseModel):
    peer_id: str
    messages: List[Message]

class NoxBase(BaseModel):
    NoX_name: str
    Bio: Optional[str] = None
    instructions: List[str] = []

class NoxCreate(NoxBase):
    pass  # no nox_id in create request

class NoxUpdate(BaseModel):
    NoX_name: Optional[str] = None
    Bio: Optional[str] = None
    instructions: Optional[List[str]] = None

class NoxResponse(NoxBase):
    nox_id: str
