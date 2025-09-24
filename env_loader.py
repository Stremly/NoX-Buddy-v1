import os
import sys

def get_base_path() -> str:
    if getattr(sys, 'frozen', False):  
        # Running as .exe
        return os.path.join(os.path.dirname(sys.executable),".env")
    else:
        # Running as script
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)),".env")
        return path