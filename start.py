import uvicorn
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))
load_dotenv(Path(__file__).parent / "config.env")

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 8000))
    print(f"🚀 Starting ARIA Server on port {port}...")
    uvicorn.run("server:app", host="127.0.0.1", port=port, reload=True)
