from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import resume_parser_router, job_description_router, matching_router

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