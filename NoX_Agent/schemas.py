"""Pydantic models used by the NoX conversational agent and tools."""

from pydantic import BaseModel, Field
from datetime import datetime

class Message(BaseModel):
    """Inbound user message with optional file references."""
    source: str = Field(..., description="Origin of the message, e.g., 'user' or 'system'")
    message: str = Field(..., description="Message text content")
    files: list[str] = Field(default_factory=list, description="Paths or identifiers of attached files")

class Reminder(BaseModel):
    """Reminder instruction produced by the agent for later scheduling."""
    datetime_created: datetime = Field(..., description="When the reminder was created")
    reminder_description: str = Field(..., description="User-facing description of the reminder")
    reminder_end_time: datetime = Field(..., description="Time after which the reminder is no longer relevant")

class MessageResponse(BaseModel):
    """Agent response with extracted information and optional reminders."""
    response: str = Field(..., description="Assistant's reply text")
    all_important_information: list[str] = Field(default_factory=list, description="Key facts extracted from the conversation")
    reminder_to_setup: list[Reminder] = Field(default_factory=list, description="Reminders to create based on the conversation")

class RAGResponse(BaseModel):
    """Ontology classification for RAG lookup (Type/SubType/SubSubType)."""
    Type: str = Field(..., description="Top-level category")
    SubType: str = Field(..., description="Second-level category")
    SubSubType: str = Field(..., description="Third-level category")