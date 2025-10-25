from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class UserBase(BaseModel):
    name: str
    email: EmailStr
    bio: Optional[str] = None
    nox_id: str
    contacts: List[str] = []
    photo: Optional[str] = None

class UserCreate(UserBase):
    secret_code: str = Field(..., description="Unique secret code for the user")

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    nox_id: Optional[str] = None
    photo: Optional[str] = None

class UserResponse(UserBase):
    secret_code: str
    is_active: bool = True  # always show status
