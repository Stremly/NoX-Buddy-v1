"""Pydantic models for reminder decisions sent to the client."""

from pydantic import BaseModel, Field
from typing import Optional
class ReminderToSend(BaseModel):
    """A reminder selected to be sent now, with rationale."""
    reminder_id: str = Field(..., description="Identifier of the source reminder in storage")
    reminder_message: str = Field(..., description="Short message to display to the user")
    reason_to_send_now: str = Field(..., description="Brief rationale for why this should be sent now")

class RemindersToSend(BaseModel):
    """Container of reminders to send at this time."""
    reminders_to_send: Optional[list[ReminderToSend]] = Field(default_factory=list, description="List of reminders to send now (may be empty)")