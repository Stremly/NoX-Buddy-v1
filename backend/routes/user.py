from fastapi import APIRouter, HTTPException, status, Query, Body
from typing import List, Optional
from pydantic import BaseModel
from db import db, is_mongodb_available
from models.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

# Request model for forgot secret key
class ForgotSecretKeyRequest(BaseModel):
    email: Optional[str] = None
    nox_id: Optional[str] = None

# ✅ Forgot secret key - retrieve by email or nox_id
@router.post("/forgot-secret-key")
async def forgot_secret_key(request: ForgotSecretKeyRequest):
    if not request.email and not request.nox_id:
        raise HTTPException(
            status_code=400,
            detail="Please provide either email or NOX ID"
        )
    
    if not is_mongodb_available():
        # localStorage mode - return 404 (frontend manages data)
        raise HTTPException(
            status_code=404,
            detail="User not found. In localStorage mode, please check your browser's local storage."
        )
    
    # Search by email or nox_id
    query = {}
    if request.email:
        query["email"] = request.email
    elif request.nox_id:
        query["nox_id"] = request.nox_id
    
    user = await db.users.find_one(query)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User does not exist with the provided information"
        )
    
    return {
        "message": "Secret key retrieved successfully",
        "secret_code": user.get("secret_code"),
        "name": user.get("name", "User"),
        "email": user.get("email")
    }

# ✅ Create user
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    if not is_mongodb_available():
        # localStorage mode - return user data (frontend handles persistence)
        user_data = user.dict()
        user_data["is_active"] = True
        return user_data
    
    try:
        user_data = user.dict()
        user_data["is_active"] = True
        result = await db.users.insert_one(user_data)
        if result.inserted_id:
            return user_data
    except Exception as e:
        # Handle duplicate key errors or other database issues
        print(f"[ERROR] Failed to create user: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="User with this secret_code or email already exists",
        )


# ✅ Get user details
@router.get("/{secret_code}", response_model=UserResponse)
async def get_user(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - return 404 (frontend manages data)
        raise HTTPException(status_code=404, detail="User not found (localStorage mode)")
    
    user = await db.users.find_one({"secret_code": secret_code})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["contacts"] = user.get("Contacts", [])
    return UserResponse(**user)


# ✅ Update user info
@router.put("/{secret_code}", response_model=UserResponse)
async def update_user(secret_code: str, update: UserUpdate):
    if not is_mongodb_available():
        # localStorage mode - return updated data (frontend handles persistence)
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        update_data["secret_code"] = secret_code
        update_data["contacts"] = []
        return UserResponse(**update_data)
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    result = await db.users.find_one_and_update(
        {"secret_code": secret_code},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    result["contacts"] = result.get("contacts", [])
    return UserResponse(**result)


# ✅ Hard delete user
@router.delete("/{secret_code}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles deletion
        return {"message": "User deleted successfully (localStorage mode)"}
    
    result = await db.users.delete_one({"secret_code": secret_code})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


# ✅ Soft delete (deactivate user)
@router.patch("/{secret_code}/deactivate")
async def deactivate_user(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles deactivation
        return {"message": f"User {secret_code} deactivated successfully (localStorage mode)"}
    
    result = await db.users.update_one(
        {"secret_code": secret_code}, {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {secret_code} deactivated successfully"}


# ✅ List all users (paginated)
@router.get("/", response_model=List[UserResponse])
async def list_users(skip: int = 0, limit: int = Query(default=10, le=100)):
    if not is_mongodb_available():
        # localStorage mode - return empty list (frontend manages data)
        return []
    
    cursor = db.users.find({"is_active": True}).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    return [UserResponse(**user) for user in users]


# ✅ Search users
@router.get("/search", response_model=List[UserResponse])
async def search_users(
    email: Optional[str] = None,
    name: Optional[str] = None,
    nox_id: Optional[str] = None,
):
    if not is_mongodb_available():
        # localStorage mode - return empty list (frontend manages data)
        return []
    
    query = {"is_active": True}
    if email:
        query["email"] = email
    if name:
        query["name"] = {"$regex": name, "$options": "i"}  # case-insensitive search
    if nox_id:
        query["nox_id"] = nox_id

    cursor = db.users.find(query).limit(20)
    users = await cursor.to_list(length=20)
    return [UserResponse(**user) for user in users]


# ✅ Add a contact
@router.post("/{secret_code}/contacts/{contact_id}")
async def add_contact(secret_code: str, contact_id: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles contact management
        return {"message": "Contact added successfully (localStorage mode)"}
    
    result = await db.users.update_one(
        {"secret_code": secret_code}, {"$addToSet": {"contacts": contact_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Contact added successfully"}


# ✅ Delete a contact
@router.delete("/{secret_code}/contacts/{contact_id}")
async def delete_contact(secret_code: str, contact_id: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles contact management
        return {"message": "Contact removed successfully (localStorage mode)"}
    
    result = await db.users.update_one(
        {"secret_code": secret_code}, {"$pull": {"contacts": contact_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Contact removed successfully"}


# ✅ Get user contacts
@router.get("/{secret_code}/contacts")
async def get_contacts(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - return empty (frontend manages data)
        return {"contacts": []}
    
    user = await db.users.find_one({"secret_code": secret_code})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"contacts": user.get("contacts", [])}
