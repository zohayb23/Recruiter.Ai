from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import sys

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.routers import external_jobs, resume_parser, job_description

app = FastAPI(title="Recruiter.AI Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Default Vite port
        "http://localhost:5174",  # Alternative Vite port
        "http://localhost:5175",  # Current frontend port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(external_jobs.router)
app.include_router(resume_parser.router)
app.include_router(job_description.router, prefix="/api")

@app.get("/health")
async def health_check():
    """Health check endpoint required by Kubernetes probes"""
    return {"status": "healthy"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Recruiter.AI Backend API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }