import logging
import warnings
from fastapi import FastAPI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Suppress huggingface and other noisy warnings
logging.getLogger("huggingface_hub.utils._http").setLevel(logging.ERROR)
logging.getLogger("huggingface_hub.utils._validators").setLevel(logging.ERROR)
warnings.filterwarnings('ignore', category=FutureWarning)

# Suppress specific torch warning about encoder_attention_mask
warnings.filterwarnings('ignore', message='.*encoder_attention_mask.*')
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Try relative imports first (for when running from backend-full directory)
    from .routers.resume_parser import router as resume_parser_router
    from .routers.job_description import router as job_description_router
    from .routers.matching import router as matching_router
except ImportError:
    # Fall back to absolute imports (for when running from project root)
    from src.routers.resume_parser import router as resume_parser_router
    from src.routers.job_description import router as job_description_router
    from src.routers.matching import router as matching_router

app = FastAPI(title="Recruiter.AI Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

print("Available routes:")  # Debug log
for route in resume_parser_router.routes:
    print(f"Resume Parser: {route.path}")
for route in job_description_router.routes:
    print(f"Job Description: {route.path}")
for route in matching_router.routes:
    print(f"Matching: {route.path}")

# Include routers with /api prefix
app.include_router(resume_parser_router, prefix="/api")
app.include_router(job_description_router, prefix="/api")
app.include_router(matching_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to Recruiter.AI API"}

# Print all available routes after registration
print("\nAll registered routes:")
for route in app.routes:
    print(f"{route.methods} {route.path}")