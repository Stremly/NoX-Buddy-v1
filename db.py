from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "stremly")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Ensure secret_code is unique (production best practice)
async def init_indexes():
    await db.users.create_index([("secret_code", ASCENDING)], unique=True)

# When inserting user, set is_active=True
async def insert_user(user_data: dict):
    user_data["is_active"] = True
    await db.users.insert_one(user_data)
