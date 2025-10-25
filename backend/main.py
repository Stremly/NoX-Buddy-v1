from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import asyncio
from db import init_indexes, is_mongodb_available
from routes import user, conversations, integrations, memories, reminders, nox, user_conversations, contacts
from dotenv import load_dotenv

load_dotenv()

# Lifespan event handler for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_indexes()
        if is_mongodb_available():
            print("[INFO] Backend started with MongoDB")
        else:
            print("[INFO] Backend started in localStorage mode")
            print("[INFO] To enable MongoDB, set MONGO_URI in .env file")
    except Exception as e:
        print(f"[WARN] Startup warning: {e}")
        print("[INFO] Continuing in localStorage mode")
    
    yield
    
    # Shutdown (cleanup if needed)
    print("[INFO] Shutting down backend...")

app = FastAPI(lifespan=lifespan)

# Add endpoint to check MongoDB status
@app.get("/health")
def health_check():
    return {
        "status": "running",
        "mongodb_available": is_mongodb_available(),
        "mode": "mongodb" if is_mongodb_available() else "localStorage"
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "electron://app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(user.router)
app.include_router(nox.router)
app.include_router(conversations.router)
app.include_router(user_conversations.router)
app.include_router(integrations.router)
app.include_router(reminders.router)
app.include_router(memories.router)
app.include_router(contacts.router)

# ------------------------------
# Async message queue
# ------------------------------
message_queue = asyncio.Queue()

async def process_queue(websocket: WebSocket):
    """
    Background task: continuously process messages from the queue
    """
    while True:
        message = await message_queue.get()
        # Process the message (replace with your own logic)
        response = f"Processed: {message}"
        await websocket.send_text(response)
        message_queue.task_done()

# ------------------------------
# WebSocket endpoint
# ------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("ack: connected")

    # Start background task for this client
    queue_task = asyncio.create_task(process_queue(websocket))

    try:
        while True:
            # Receive messages from client
            message_text = await websocket.receive_text()
            # Put the message into the queue
            await message_queue.put(message_text)
    except WebSocketDisconnect:
        queue_task.cancel()  # Stop background task when client disconnects

# ------------------------------
# Root endpoint
# ------------------------------

@app.get("/")
def read_root():
    return {"message": "Connected to the API"}

# ------------------------------
# Run server
# ------------------------------

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
