from fastapi import APIRouter, HTTPException
from models.integration import IntegrationBase, IntegrationUpdate
from db import db

router = APIRouter(prefix="/integrations", tags=["Integrations"])


# Add or update an integration
@router.put("/{secret_code}/{integration_name}")
async def add_or_update_integration(secret_code: str, integration_name: str, payload: IntegrationUpdate):
    """Add or update integration for a user."""
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
    doc = await db.integrations.find_one({"secret_code": secret_code}, {integration_name: 1, "_id": 0})
    if not doc or integration_name not in doc:
        raise HTTPException(404, "Integration not found")
    return {integration_name: doc[integration_name]}


# Delete an integration
@router.delete("/{secret_code}/{integration_name}")
async def delete_integration(secret_code: str, integration_name: str):
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
    doc = await db.integrations.find_one({"secret_code": secret_code}, {"_id": 0})
    if not doc:
        return {"integrations": {}}
    # remove secret_code from output
    integrations = {k: v for k, v in doc.items() if k != "secret_code"}
    return {"integrations": integrations}
