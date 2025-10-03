from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from .config.settings import settings
from .routes import resume_routes, job_routes

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    debug=settings.DEBUG
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

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Recruiter.AI Backend API",
        "version": settings.API_VERSION,
        "status": "running",
        "features": {
            "resume_parsing": settings.ENABLE_RESUME_PARSING,
            "ai_job_descriptions": settings.ENABLE_AI_JOB_DESCRIPTIONS,
            "semantic_search": settings.ENABLE_SEMANTIC_SEARCH,
            "mass_mailing": settings.ENABLE_MASS_MAILING,
            "crm_pipeline": settings.ENABLE_CRM_PIPELINE
        }
    }

@app.get("/health")
async def health_check():
    """Global health check endpoint"""
    return {
        "status": "healthy",
        "service": "recruiter-ai-backend",
        "version": settings.API_VERSION,
        "features_enabled": {
            "resume_parsing": settings.ENABLE_RESUME_PARSING,
            "ai_job_descriptions": settings.ENABLE_AI_JOB_DESCRIPTIONS,
            "semantic_search": settings.ENABLE_SEMANTIC_SEARCH,
            "mass_mailing": settings.ENABLE_MASS_MAILING,
            "crm_pipeline": settings.ENABLE_CRM_PIPELINE
        }
    }

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("🚀 Starting Recruiter.AI Backend API")
    logger.info(f"📊 Features enabled: Resume Parsing={settings.ENABLE_RESUME_PARSING}, AI Jobs={settings.ENABLE_AI_JOB_DESCRIPTIONS}")
    
    # TODO: Initialize database connections
    # TODO: Initialize Milvus connection
    # TODO: Initialize OpenAI client

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("🛑 Shutting down Recruiter.AI Backend API")
    
    # TODO: Close database connections
    # TODO: Close Milvus connection

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
