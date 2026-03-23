import os

UPLOAD_DIR = "uploads"

# Create folder if missing
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Session expiry (seconds)
SESSION_EXPIRY_SECONDS = 3600  # 1 hour