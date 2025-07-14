from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os

app = FastAPI(title="Recruiter.AI Backend")

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

# Import other routes and setup here
# We'll add more functionality in subsequent updates 