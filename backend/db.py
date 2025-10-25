from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "nox_buddy")

# MongoDB connection state
mongodb_available = False
client = None
db = None

# Try to connect to MongoDB
if MONGO_URI:
    try:
        client = AsyncIOMotorClient(
            MONGO_URI, 
            serverSelectionTimeoutMS=5000,
            tlsAllowInvalidCertificates=True  # Fix SSL certificate verification on macOS
        )
        db = client[DB_NAME]
        mongodb_available = True
        print("[INFO] MongoDB connection configured")
    except Exception as e:
        print(f"[WARN] MongoDB connection failed: {e}")
        print("[INFO] Using localStorage fallback mode")
        mongodb_available = False
else:
    print("[WARN] MONGO_URI not found in environment variables")
    print("[INFO] Using localStorage fallback mode")
    mongodb_available = False

# Ensure secret_code is unique (production best practice)
async def init_indexes():
    if mongodb_available and db is not None:
        try:
            await db.users.create_index([("secret_code", ASCENDING)], unique=True)
            print("[INFO] MongoDB indexes created")
        except Exception as e:
            print(f"[WARN] Failed to create indexes: {e}")
    else:
        print("[INFO] Skipping index creation - localStorage mode")

# When inserting user, set is_active=True
async def insert_user(user_data: dict):
    if mongodb_available and db is not None:
        user_data["is_active"] = True
        await db.users.insert_one(user_data)
    else:
        raise Exception("MongoDB not available - use localStorage mode")

# Check if MongoDB is available
def is_mongodb_available():
    return mongodb_available
