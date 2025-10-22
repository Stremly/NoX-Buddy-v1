from pydantic import BaseModel
from typing import Optional, Dict, Any

class IntegrationBase(BaseModel):
    """Base integration model."""
    data: Dict[str, Any] = {}

class IntegrationUpdate(BaseModel):
    """Update integration data."""
    data: Dict[str, Any]
