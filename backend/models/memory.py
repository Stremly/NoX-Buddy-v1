from pydantic import BaseModel
from typing import List

class MemoryCreate(BaseModel):
    memory: str

class MemoryUpdate(BaseModel):
    memory: str
