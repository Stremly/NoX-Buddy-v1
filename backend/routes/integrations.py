from fastapi import APIRouter, HTTPException
from models.integration import IntegrationBase, IntegrationUpdate
from db import db, is_mongodb_available

router = APIRouter(prefix="/integrations", tags=["Integrations"])


# Add or update an integration
@router.put("/{secret_code}/{integration_name}")
async def add_or_update_integration(secret_code: str, integration_name: str, payload: IntegrationUpdate):
    """Add or update integration for a user."""
    if not is_mongodb_available():
        # localStorage mode - frontend handles persistence
        return {"message": f"{integration_name} integration added/updated (localStorage mode)", "data": payload.data}
    
    update_data = {integration_name: payload.data}
    result = await db.integrations.update_one(
        {"secret_code": secret_code},
        {"$set": update_data},
        upsert=True  # create document if not exists
    )
    return {"message": f"{integration_name} integration added/updated", "data": payload.data}


# Get integration details
@router.get("/{secret_code}/{integration_name}")
async def get_integration(secret_code: str, integration_name: str):
    if not is_mongodb_available():
        # localStorage mode - return empty (frontend manages data)
        raise HTTPException(404, "Integration not found (localStorage mode)")
    
    doc = await db.integrations.find_one({"secret_code": secret_code}, {integration_name: 1, "_id": 0})
    if not doc or integration_name not in doc:
        raise HTTPException(404, "Integration not found")
    return {integration_name: doc[integration_name]}


# Delete an integration
@router.delete("/{secret_code}/{integration_name}")
async def delete_integration(secret_code: str, integration_name: str):
    if not is_mongodb_available():
        # localStorage mode - frontend handles deletion
        return {"message": f"{integration_name} integration deleted (localStorage mode)"}
    
    result = await db.integrations.update_one(
        {"secret_code": secret_code},
        {"$unset": {integration_name: ""}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Integration not found")
    return {"message": f"{integration_name} integration deleted"}


# List all integrations for a user
@router.get("/{secret_code}")
async def list_integrations(secret_code: str):
    if not is_mongodb_available():
        # localStorage mode - return empty (frontend manages data)
        return {"integrations": {}}
    
    doc = await db.integrations.find_one({"secret_code": secret_code}, {"_id": 0})

    if not doc:
        return {"integrations": {}}

    # If you stored everything under "integrations", return that
    if "integrations" in doc:
        return {"integrations": doc["integrations"]}

    # Otherwise, remove secret_code and return top-level keys
    integrations = {k: v for k, v in doc.items() if k != "secret_code"}
    return {"integrations": integrations}

