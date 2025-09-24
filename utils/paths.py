"""Resolve per-user data directory and persistent file paths for NoX Buddy.

Ensures files are written to a writable, stable location regardless of how the
app is packaged (e.g., PyInstaller). Uses platform-appropriate directories.
"""

from pathlib import Path
from platformdirs import user_data_dir

APP_NAME = "NoX Buddy"
APP_AUTHOR = "NoX"


def get_data_dir() -> Path:
    """Return the per-user data directory, creating it if missing."""
    data_dir = Path(user_data_dir(APP_NAME, APP_AUTHOR))
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def memory_file_path() -> Path:
    return get_data_dir() / "memory.nmem"


def embedding_file_path() -> Path:
    return get_data_dir() / "embedding.nemb"


def reminders_file_path() -> Path:
    return get_data_dir() / "reminders.nrem"


def conversation_file_path() -> Path:
    return get_data_dir() / "conversation.ncon"

def models_dir() -> Path:
    path = get_data_dir() / "models"
    path.mkdir(parents=True, exist_ok=True)
    return path


