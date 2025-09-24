import json
import struct
import uuid
from datetime import datetime
from typing import List, Dict
import os
import paths

MAGIC_NUMBER = b"NCON"


class NCONHandler:
    def __init__(self):
        self.filepath = paths.conversation_file_path()
        if not os.path.exists(self.filepath):
            self.create_file()

    # -----------------------
    # File Management
    # -----------------------
    def create_file(self) -> None:
        """Create a new .ncon file with MAGIC_NUMBER."""
        with open(self.filepath, "wb") as f:
            f.write(MAGIC_NUMBER)

    def _validate_file(self, f) -> None:
        """Check if file starts with NCON magic number."""
        f.seek(0)
        magic = f.read(len(MAGIC_NUMBER))
        if magic != MAGIC_NUMBER:
            raise ValueError("Invalid .ncon file format")

    # -----------------------
    # Conversation Operations
    # -----------------------
    def add_message(self, role: str, message: str) -> str:
        """Add a conversation message. Returns _id."""
        msg_id = str(uuid.uuid4())[:8]
        entry = {
            "_id": msg_id,
            "role": role,
            "timestamp": datetime.utcnow().isoformat(),
            "message": message
        }
        encoded = json.dumps(entry).encode("utf-8")
        with open(self.filepath, "ab") as f:
            f.write(struct.pack("I", len(encoded)))
            f.write(encoded)
        return msg_id

    def read_messages(self) -> List[Dict]:
        """Read all messages from file."""
        messages = []
        with open(self.filepath, "rb") as f:
            self._validate_file(f)
            f.seek(len(MAGIC_NUMBER))
            while True:
                length_bytes = f.read(4)
                if not length_bytes:
                    break
                length = struct.unpack("I", length_bytes)[0]
                data = f.read(length).decode("utf-8")
                messages.append(json.loads(data))
        return messages

    def delete_message(self, msg_id: str) -> bool:
        """Delete a message by _id. Returns True if deleted."""
        messages = self.read_messages()
        new_messages = [m for m in messages if m["_id"] != msg_id]
        deleted = len(messages) != len(new_messages)
        if deleted:
            self._rewrite(new_messages)
        return deleted

    # -----------------------
    # Internal Helpers
    # -----------------------
    def _rewrite(self, messages: List[Dict]) -> None:
        """Rewrite the file with updated messages list."""
        with open(self.filepath, "wb") as f:
            f.write(MAGIC_NUMBER)
            for m in messages:
                encoded = json.dumps(m).encode("utf-8")
                f.write(struct.pack("I", len(encoded)))
                f.write(encoded)