"""FastAPI application hosting the NoX backend services.

Provides a WebSocket endpoint for real-time interaction and runs several
background tasks: main agent processing, memory storage, reminder checks,
screen awareness simulation, and message forwarding. Includes a /health
endpoint for readiness/liveness checks.
"""

import asyncio
import random
import logging
from contextlib import suppress
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import uvicorn
from NoX_Agent.agent import NoXAgent
from Memory_Manager.agent import MemoryManager
from Reminder_Manager.agent import ReminderManager
from utils.ncon_operations import NCONHandler
from utils.nrem_operations import NREMHandler
from utils.nmem_operations import NoxMemoryFile
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
logger = logging.getLogger("nox.server")

app = FastAPI(title="NoX Server", description="NoX Server")

# Global queue to broadcast messages to all connected clients
in_queue = asyncio.Queue()
out_queue = asyncio.Queue()
reminder_queue = asyncio.Queue()
memory_queue = asyncio.Queue()

connected_clients = set()

Agent = NoXAgent()
MemoryManager = MemoryManager()
ReminderManager = ReminderManager()
NCONHandler = NCONHandler()
NREMHandler = NREMHandler()
NMEMHandler = NoxMemoryFile()

# Service 1: AI Agent
async def NoX_agent():
    """Consume user messages, call the agent, and enqueue outputs.

    Reads from in_queue and writes agent responses to out_queue, while also
    routing extracted important information to memory_queue for storage.
    """
    while True:
        try:
            msg = await in_queue.get()
            with suppress(asyncio.CancelledError):
                msg = await Agent.reply(msg)
                response_text = msg.response
                important_information = msg.all_important_information or []
                await memory_queue.put(important_information)
                await out_queue.put(response_text)
        except Exception as exc:
            logger.exception("Agent loop error: %s", exc)
        finally:
            await asyncio.sleep(1)

# Service 2: Memory Manager
async def memory_manager():
    """Persist important information using the memory manager service."""
    while True:
        try:
            informations = await memory_queue.get()
            with suppress(asyncio.CancelledError):
                await MemoryManager.store_information(informations)
        except Exception as exc:
            logger.exception("Memory manager error: %s", exc)
        finally:
            await asyncio.sleep(3)

# Service 3: Reminder Manager
async def reminder_manager():
    """Periodically check reminders and forward messages to clients."""
    while True:
        try:
            reminders = await ReminderManager.check_reminders_to_send()
            for reminder in reminders or []:
                await reminder_queue.put(reminder.reminder_message)
        except Exception as exc:
            logger.exception("Reminder manager error: %s", exc)
        finally:
            await asyncio.sleep(600)

# Service 4: Screen Awareness
async def screen_awareness():
    """Simulate screen awareness sampling at a fixed cadence."""
    while True:
        try:
            _ = f"👀 Screen captured at {random.randint(1000,9999)}px"
        except Exception as exc:
            logger.warning("Screen awareness error: %s", exc)
        finally:
            await asyncio.sleep(4)

async def forward_out_messages():
    """Broadcast normal agent messages to all connected clients."""
    while True:
        try:
            msg = await out_queue.get()
            to_remove = []
            for ws in list(connected_clients):
                try:
                    await ws.send_text(msg)
                except Exception as exc:
                    logger.debug("Removing dead websocket: %s", exc)
                    to_remove.append(ws)
            for ws in to_remove:
                with suppress(KeyError):
                    connected_clients.remove(ws)
        except Exception as exc:
            logger.exception("forward_out_messages error: %s", exc)

async def forward_reminder_messages():
    """Broadcast reminder messages to all connected clients."""
    while True:
        try:
            msg = await reminder_queue.get()
            to_remove = []
            for ws in list(connected_clients):
                try:
                    await ws.send_text(msg)
                except Exception as exc:
                    logger.debug("Removing dead websocket: %s", exc)
                    to_remove.append(ws)
            for ws in to_remove:
                with suppress(KeyError):
                    connected_clients.remove(ws)
        except Exception as exc:
            logger.exception("forward_reminder_messages error: %s", exc)
        finally:
            await asyncio.sleep(1)

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Bi-directional WebSocket endpoint for client communication."""
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info("Incoming message from client")
            await in_queue.put(data)
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as exc:
        logger.exception("WebSocket error: %s", exc)
    finally:
        with suppress(KeyError):
            connected_clients.remove(websocket)  

@app.get("/health")
async def health():
    """Return health status for readiness/liveness probes."""
    try:
        return {"status": "ok", "clients": len(connected_clients)}
    except Exception as exc:
        logger.exception("Health check error: %s", exc)
        return JSONResponse(status_code=500, content={"status": "error"})

@app.get("/get_conversation_history")
async def conversation_history():
    """Return the conversation history."""
    return NCONHandler.read_messages()

@app.get("/get_reminders")
async def get_reminders():
    """Return the reminders."""
    return NREMHandler.read_reminders()

@app.get("/get_memory")
async def get_memory():
    """Return the memory."""
    return NMEMHandler.read_documents()

# Startup: launch all background services
@app.on_event("startup")
async def startup_event():
    """Start all background service tasks on application startup."""
    tasks = [
        NoX_agent(),
        memory_manager(),
        reminder_manager(),
        screen_awareness(),
        forward_out_messages(),
        forward_reminder_messages(),
    ]
    for coro in tasks:
        asyncio.create_task(coro)
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
