"""Pydantic models describing structured memories for classification/storage."""

from datetime import datetime
from pydantic import BaseModel, Field

class Memory(BaseModel):
    """A single memory item derived from an input information string."""
    Date: datetime = Field(..., description="Timestamp when this memory was recorded")
    Type: str = Field(..., description="High-level category inferred for the memory")
    SubType: str = Field(..., description="Secondary category providing more detail")
    SubSubType: str = Field(..., description="Tertiary category for finer granularity")
    Information: str = Field(..., description="Original information content of the memory")

class Memories(BaseModel):
    """A list of memory items, one per input information."""
    memories: list[Memory] = Field(default_factory=list, description="Collection of structured memories")