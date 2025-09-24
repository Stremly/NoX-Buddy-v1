import json
import struct
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional
import os
import paths

MAGIC_NUMBER = b"NREM"


class NREMHandler:
    def __init__(self):
        self.filepath = paths.reminders_file_path()
        if not os.path.exists(self.filepath):
            self.create_file()

    # -----------------------
    # File Management
    # -----------------------
    def create_file(self) -> None:
        """Create a new .nrem file with MAGIC_NUMBER."""
        with open(self.filepath, "wb") as f:
            f.write(MAGIC_NUMBER)

    def _validate_file(self, f) -> None:
        """Check if file starts with NREM magic number."""
        f.seek(0)
        magic = f.read(len(MAGIC_NUMBER))
        if magic != MAGIC_NUMBER:
            raise ValueError("Invalid .nrem file format")

    # -----------------------
    # Reminder Operations
    # -----------------------
    def add_reminder(
        self, 
        description: str, 
        reminder_end_time: Optional[str] = None
    ) -> str:
        """Add a new reminder. Returns _id."""
        reminder_id = str(uuid.uuid4())[:8]
        reminder = {
            "_id": reminder_id,
            "date_created": datetime.now(timezone.utc).isoformat(),
            "description": description,
            "last_sent": [],
            "reminder_end_time": reminder_end_time
        }
        encoded = json.dumps(reminder).encode("utf-8")
        with open(self.filepath, "ab") as f:
            f.write(struct.pack("I", len(encoded)))
            f.write(encoded)
        return reminder_id

    def read_reminders(self) -> List[Dict]:
        """Read all reminders from file."""
        reminders = []
        with open(self.filepath, "rb") as f:
            self._validate_file(f)
            f.seek(len(MAGIC_NUMBER))
            while True:
                length_bytes = f.read(4)
                if not length_bytes:
                    break
                length = struct.unpack("I", length_bytes)[0]
                data = f.read(length).decode("utf-8")
                reminders.append(json.loads(data))
        return reminders

    def update_last_sent(self, reminder_id: str, timestamp: Optional[str] = None) -> bool:
        """Add a timestamp to last_sent. Keep only last 4. Returns True if updated."""
        reminders = self.read_reminders()
        updated = False
        for r in reminders:
            if r["_id"] == reminder_id:
                ts = timestamp or datetime.now(timezone.utc).isoformat()
                r["last_sent"].append(ts)
                r["last_sent"] = r["last_sent"][-4:]
                updated = True
        if updated:
            self._rewrite(reminders)
        return updated

    def delete_reminder(self, reminder_id: str) -> bool:
        """Delete a reminder by _id. Returns True if deleted."""
        reminders = self.read_reminders()
        new_reminders = [r for r in reminders if r["_id"] != reminder_id]
        deleted = len(reminders) != len(new_reminders)
        if deleted:
            self._rewrite(new_reminders)
        return deleted

    # -----------------------
    # Internal Helpers
    # -----------------------
    def _rewrite(self, reminders: List[Dict]) -> None:
        """Rewrite the file with updated reminders list."""
        with open(self.filepath, "wb") as f:
            f.write(MAGIC_NUMBER)
            for r in reminders:
                encoded = json.dumps(r).encode("utf-8")
                f.write(struct.pack("I", len(encoded)))
                f.write(encoded)