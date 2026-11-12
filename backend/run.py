import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn

if __name__ == "__main__":
    try:
        port = int(os.getenv("PORT", 8000))
    except (ValueError, TypeError):
        port = 8000

    host = os.getenv("HOST", "0.0.0.0")
    is_prod = os.getenv("ENVIRONMENT", "development").lower() == "production" or os.getenv("RENDER") == "true"

    print(f"Starting ORBIT Backend on {host}:{port} (Environment: {'Production' if is_prod else 'Development'})", flush=True)
    uvicorn.run("app.main:app", host=host, port=port, reload=not is_prod)
