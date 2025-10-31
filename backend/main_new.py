"""
Main FastAPI application - Modular version
This consolidates the monolithic complete_backend_with_milvus.py into a modular structure
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import openai
import logging

from .config.settings import settings
from .routes import (
    resume_routes, job_routes, milvus_routes, candidate_routes, 
    crm_routes, chat_routes, evaluation_routes, search_routes,
    interview_routes, job_category_routes, analytics_routes,
    all_remaining_routes
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Initialize OpenAI
openai.api_key = settings.OPENAI_API_KEY
openai_client = openai.OpenAI(api_key=openai.api_key) if openai.api_key else None

if openai.api_key:
    logger.info(f"🔑 [OpenAI] API Key loaded: Yes")
else:
    logger.warning("❌ [OpenAI] No API key found in environment variables")

# Initialize Milvus connection on startup
from .services.milvus_service import test_milvus_connection, milvus_connected

# Create FastAPI application
app = FastAPI(
    title="Recruiter.AI Complete Backend",
    version="1.0.0",
    description="Complete recruitment platform backend with AI features"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

# Include routers
app.include_router(resume_routes.router)
app.include_router(job_routes.router)
app.include_router(job_routes.router_jobs)
app.include_router(milvus_routes.router)
app.include_router(candidate_routes.router)
app.include_router(crm_routes.router)
app.include_router(chat_routes.router)
app.include_router(evaluation_routes.router)
app.include_router(search_routes.router)
app.include_router(interview_routes.router)
app.include_router(job_category_routes.router)
app.include_router(analytics_routes.router)
app.include_router(all_remaining_routes.mass_mailing_router)
app.include_router(all_remaining_routes.ab_testing_router)
app.include_router(all_remaining_routes.segmentation_router)
app.include_router(all_remaining_routes.automation_router)
app.include_router(all_remaining_routes.engagement_router)
app.include_router(all_remaining_routes.realtime_router)
app.include_router(all_remaining_routes.evaluation_router_extra)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Recruiter.AI Complete Backend with Milvus Integration",
        "status": "healthy",
        "milvus_connected": milvus_connected,
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "recruiter-ai-complete-backend",
        "milvus_connected": milvus_connected
    }

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("🚀 Starting Recruiter.AI Backend API")
    
    # Test Milvus connection
    test_milvus_connection()
    
    # Create collections if Milvus is connected
    if milvus_connected:
        from .services.milvus_service import (
            create_resumes_collection,
            create_job_descriptions_collection,
            create_interview_results_collection,
            create_job_categories_collection
        )
        logger.info("Creating Milvus collections...")
        create_resumes_collection()
        create_job_descriptions_collection()
        create_interview_results_collection()
        create_job_categories_collection()

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("🛑 Shutting down Recruiter.AI Backend API")

if __name__ == "__main__":
    uvicorn.run(
        "backend.main_new:app",
        host="0.0.0.0",  # Use same host as monolithic version
        port=8804,  # Use same port as monolithic version
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

