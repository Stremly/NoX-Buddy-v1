"""Reminder Manager: decides which reminders to send at any given time.

Async method `check_reminders_to_send` offloads LLM calls and file IO.
Builds human-friendly context and applies a simple policy via the LLM.
"""

from datetime import datetime
from datetime import timezone
import asyncio
from agno.agent import Agent
from agno.models.google import Gemini
from dotenv import load_dotenv
from Reminder_Manager.schemas import RemindersToSend
from utils.nrem_operations import NREMHandler
from utils.paths import reminders_file_path
import os
from env_loader import get_base_path
load_dotenv(get_base_path())

class ReminderManager:
    def __init__(self, name: str = "NoX"):
        """Initialize LLM agent and reminder file handler."""
        self.model = Gemini(id="gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY"))
        self.agent = Agent(
            name=name,
            model=self.model,
            description="You are a NoX. You are responsible for creating reminders for the user.",
            role="Reminder Manager",
            introduction= f"I'm {name}, your quiet desktop buddy who lives in the tray, watches the context of your work, remembers what you tell me, and steps in exactly when you need help; I grab screenshots or files you share, hold your notes and reminders locally and securely, surface the right memory at the right moment, suggest drafts or next steps when you’re stuck, and learn your rhythms so I can automate the boring stuff over time — I won’t interrupt, I won’t leak your data, and I’m always here to take the small, repetitive tasks off your plate so you can focus on the work that matters.",
            instructions=[f"You always speak in the first person, like I'm {name}.",
            "You always respond in conversational tone, like a human would.",
            "You are balanced and friendly. You sometimes fun with users and you sometimes serious."
            "You can also do serious tasks like writing emails, reports, etc.",
            "You do given work wholeheartedly and you are always ready to help the user.",
            "You can also create reminders for the user. Reminders"],
            output_schema=RemindersToSend
        )
        self.reminder_file = NREMHandler(str(reminders_file_path()))

    def format_datetime_to_natural_language(self, datetime: datetime):
        """Format a datetime to a friendly string used in model prompts."""
        date  = datetime.strftime("%d/%B/%Y")
        time = datetime.strftime("%I:%M %p")
        day = datetime.strftime("%A")
        return f"{day}, {date} at {time}"
    
    async def check_reminders_to_send(self):
        """Compute reminders to send now; update their last_sent timestamps."""
        reminders = await asyncio.to_thread(self.reminder_file.read_reminders)
        reminder_to_send = []
        for reminder in reminders:
            end_time_str = reminder.get("reminder_end_time")
            if end_time_str:
                try:
                    end_time = datetime.fromisoformat(end_time_str)
                except Exception:
                    end_time = None
            else:
                end_time = None

            if end_time and end_time <= datetime.now(timezone.utc):
                await asyncio.to_thread(self.reminder_file.delete_reminder, reminder.get("_id"))
            else:
                # Build rich context per reminder for intelligent scheduling
                created_at = datetime.fromisoformat(reminder.get("date_created"))
                now = datetime.now(timezone.utc)
                last_sent_list = reminder.get("last_sent") or []
                if last_sent_list:
                    last_sent_dt = max(datetime.fromisoformat(s) for s in last_sent_list)
                    minutes_since_last = int((now - last_sent_dt).total_seconds() // 60)
                else:
                    last_sent_dt = None
                    minutes_since_last = None
                info = (
                    f"The reminder with id {reminder.get('_id')}, was created at {self.format_datetime_to_natural_language(created_at)} is about '{reminder.get('description')}'. "
                    f"The last reminder was sent {minutes_since_last} minutes ago "
                    if minutes_since_last is not None else
                    f"The reminder with id {reminder.get('_id')}, was created at {self.format_datetime_to_natural_language(created_at)} is about '{reminder.get('description')}'. "
                    f"No reminder has been sent yet. "
                )
                info += f"So far, {len(last_sent_list)} reminders have been sent for this."

                reminder_to_send.append(info)

        # Decision policy for when to send reminders again based on proximity and last send time
        policy = (
            "Properly decide which reminders to send NOW using this policy:"+ "\n\n"+
            "If a reminder is not to be sent now, do not include it in the response."+ "\n\n"+
            "Do not send very similar reminders in a short interval."+ "\n\n"+
            "Properly understand the reminder and whether it says when to send the reminder or when is the event."+ "\n\n"+
            "We do not send the reminder if the event is already happened."+ "\n\n"+
            "We do not send the reminder just after some of its creation time." + "\n\n"+
            "Properly check the meaining of the reminder and when it is to understand whether to send the reminder or not." + "\n\n"+
            "We only send the reminder for those which are on priority." + "\n\n"+
            "If an event is far, maybe we should not send the reminder for that event"
        )

        model_input = (
            "Current time: " + self.format_datetime_to_natural_language(datetime.now(timezone.utc))+"\n\n" +
            "Active reminders (one per line):\n" + "\n".join(reminder_to_send) + "\n\n" +
            policy + "\n\n" +
            "Return the id of each reminder to send now and a short message for the user. "+ "\n\n"+
            "You must strictly follow the policy and return the response in the response schema."
            
        )
        response = await asyncio.to_thread(self.agent.run, model_input)
        reminderstosend =  response.content.reminders_to_send
        if reminderstosend is None:
            return []
        for reminder in reminderstosend:
            await asyncio.to_thread(self.reminder_file.update_last_sent, reminder.reminder_id, datetime.now(timezone.utc).isoformat())
        return reminderstosend
        

                    