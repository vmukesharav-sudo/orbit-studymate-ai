import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    is_prod = os.getenv("ENVIRONMENT", "development").lower() == "production"
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=not is_prod)
