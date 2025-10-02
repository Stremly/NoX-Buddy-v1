from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
import asyncio
from routes.user import router as user_router
from routes.nox import router as nox_router
from routes.conversations import router as conversations_router
from routes.user_conversations import router as user_conversations_router
from routes.integrations import router as integrations_router
from routes.reminders import router as reminders_router
from routes.memories import router as memories_router
from db import init_indexes
from dotenv import load_dotenv

app = FastAPI()

# Routers
app.include_router(user_router)
app.include_router(nox_router)
app.include_router(conversations_router)
app.include_router(user_conversations_router)
app.include_router(integrations_router)
app.include_router(reminders_router)
app.include_router(memories_router)

load_dotenv()

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
# Startup event
# ------------------------------

@app.on_event("startup")
async def startup_db_client():
    await init_indexes()

@app.get("/")
def read_root():
    return {"message": "Connected to the API"}

# ------------------------------
# Run server
# ------------------------------

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
