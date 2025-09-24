"""Primary conversational agent (NoX) that orchestrates context, RAG, and LLM.

Exposes async methods that are safe for use in the event loop. Handles
coalescing of in-flight prompts, integrates retrieved context, and persists
conversation along with optional reminder creation requests.
"""

import asyncio
import os
import logging
from contextlib import suppress
from utils.paths import conversation_file_path, reminders_file_path
from typing import Optional
from utils.nrem_operations import NREMHandler
from agno.agent import Agent
from agno.models.google import Gemini
from agno.media import Image
import pyautogui
from dotenv import load_dotenv
from NoX_Agent.schemas import MessageResponse
from datetime import datetime, timezone
from NoX_Agent.Tools.RAG import RAG
from NoX_Agent.Tools.Conversation_Loader import ConversationLoader
from utils.paths import conversation_file_path
from env_loader import get_base_path
import tempfile
load_dotenv(get_base_path())

class NoXAgent:
    def __init__(self, name: str = "NoX") -> None:
        """Initialize model, tools, and state for the NoX agent."""
        self.logger = logging.getLogger("nox.nox_agent")
        self.name = name
        self.model = Gemini(id="gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY"))
        self.agent = Agent(
            name=name,
            model=self.model,
            description=f"I’m {name} — your quiet desktop buddy who lives in the tray, watches the context of your work, remembers what you tell me, and steps in exactly when you need help; I grab screenshots or files you share, hold your notes and reminders locally and securely, surface the right memory at the right moment, suggest drafts or next steps when you’re stuck, and learn your rhythms so I can automate the boring stuff over time — I won’t interrupt, I won’t leak your data, and I’m always here to take the small, repetitive tasks off your plate so you can focus on the work that matters.",
            role="Personal Manager and Buddy",
            introduction= f"I'm {name}, your quiet desktop buddy who lives in the tray, watches the context of your work, remembers what you tell me, and steps in exactly when you need help; I grab screenshots or files you share, hold your notes and reminders locally and securely, surface the right memory at the right moment, suggest drafts or next steps when you’re stuck, and learn your rhythms so I can automate the boring stuff over time — I won’t interrupt, I won’t leak your data, and I’m always here to take the small, repetitive tasks off your plate so you can focus on the work that matters.",
            instructions=[f"Your name is {name}.",
                f"You always speak in the first person, like I'm {name}.",
            "You always respond in conversational tone, like a human would.",
            "You are balanced and friendly. You sometimes fun with users and you sometimes serious."
            "You can also do serious tasks like writing emails, reports, etc.",
            "You do given work wholeheartedly and you are always ready to help the user.",
            "You can also create reminders for the user. Reminders", 
            "You also have the screenshot of the user's screen and you can use it to help the user.",
            "If User ask you for something related to his screen/desktop/windows, you can use the screenshot to help the user. The screenshot shows the current state of the user's screen."],
            system_message=f"The current time is {datetime.now(timezone.utc).isoformat()}. You must extract any important information from the conversation/messages and return it in the response schema.",
            output_schema=MessageResponse

        )
        self.current_task: Optional[asyncio.Task[str]] = None
        self._inflight_text: Optional[str] = None
        self.reminder_file = NREMHandler(str(reminders_file_path()))
        self.rag = RAG()
        self.conversation_loader = ConversationLoader(str(conversation_file_path()))
    async def generate_response(self, user_text: str) -> str:
        """Run the (sync) LLM agent in a worker thread and return output."""
        try:
            screenshot = pyautogui.screenshot()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
                screenshot.save(temp_file.name, format="PNG")
                return await asyncio.to_thread(self.agent.run, input=user_text, images=[Image(filepath=temp_file.name)])
        except Exception as exc:
            self.logger.exception("Model generate_response failed: %s", exc)
            raise

    async def reply(self, user_text: str) -> MessageResponse:
        """Coalesce with any in-flight prompt and (re)generate.

        If a generation task is running, cancel it, combine the prior input
        that was being processed with the new input, and start a new generation.
        """
        # If a task is in flight, cancel it and coalesce inputs
        try:
            if self.current_task is not None and not self.current_task.done():
                prev_text = self._inflight_text or ""
                self.current_task.cancel()
                try:
                    await self.current_task
                except asyncio.CancelledError:
                    pass
                combined = f"{prev_text}\n{user_text}" if prev_text else user_text
            else:
                combined = user_text

        # Start new generation task with combined input
            self._inflight_text = combined

            try:
                relevant_information = await self.rag.k_nearest_neighbors(combined)
            except Exception as exc:
                self.logger.warning("RAG retrieval failed, proceeding without context: %s", exc)
                relevant_information = []

            messages = self.conversation_loader.load_conversation()

            current_message = f"\nUser: {combined}"

            messages = "The conversation history for your reference is: \n" + messages + "\n\n" + "The current message is: " + current_message + "\n\n" + f"The relevant information in memory is: {relevant_information}"

            self.current_task = asyncio.create_task(self.generate_response(messages))

            try:
                result = await self.current_task

                current_dialog = [{"role": "user", "content": combined}, {"role": "assistant", "content": result.content}]

                with suppress(Exception):
                    self.conversation_loader.save_conversation(current_dialog)
                
                try:
                    if result.content.reminder_to_setup:
                        for reminder in result.content.reminder_to_setup:
                            end_time = getattr(reminder, "reminder_end_time", None)
                            end_time_iso = end_time.isoformat() if end_time else None
                            self.reminder_file.add_reminder(reminder.reminder_description, end_time_iso)
                except Exception as exc:
                    self.logger.warning("Failed to persist reminders: %s", exc)
                return result.content
            finally:
                # Clear state after completion/cancellation
                self.current_task = None
                self._inflight_text = None
        except Exception as exc:
            self.logger.exception("reply failed: %s", exc)
            # Fallback empty response to keep pipeline alive
            return MessageResponse(response="I'm having trouble right now. Please try again.")