"""Thin adapter over `NCONHandler` to load/save conversational transcripts."""

from utils.ncon_operations import NCONHandler
from dotenv import load_dotenv
from env_loader import get_base_path

load_dotenv(get_base_path())

class ConversationLoader:
    def __init__(self, filepath: str):
        """Bind to a `.ncon` file that stores conversation messages."""
        self.filepath = filepath
        self.ncon = NCONHandler(filepath)

    def load_conversation(self) -> str:
        """Return the conversation as a single newline-joined string."""
        messages = self.ncon.read_messages()
        messages_str = ""
        for message in messages:
            messages_str += f"{message['role']}: {message['message']}\n"
        return messages_str

    def save_conversation(self, messages: list[dict]) -> None:
        """Append a list of messages (role, content) to the `.ncon` file."""
        for message in messages:
            self.ncon.add_message(message["role"], message["content"])