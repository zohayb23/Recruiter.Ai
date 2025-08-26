from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
from services.resume_parser.resume_parser_service import resume_parser_service

app = FastAPI(title="Recruiter AI Backend", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Recruiter AI Backend",
        "status": "healthy",
        "version": "1.0.0",
        "features": ["resume_parsing", "milvus_storage"]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "milvus_host": os.getenv("MILVUS_HOST", "not-set"),
        "milvus_port": os.getenv("MILVUS_PORT", "not-set")
    }

@app.post("/api/resume-parser/parse")
async def parse_resume(file: UploadFile = File(...)):
    """Parse a resume file and extract structured information"""
    try:
        # Use the actual resume parser service
        return await resume_parser_service.parse_resume(file)
    except Exception as e:
        return {"error": str(e)}
