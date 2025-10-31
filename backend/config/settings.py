import os
from typing import Optional

class Settings:
    """Application settings and configuration"""
    
    # API Settings
    API_TITLE: str = "Recruiter.AI Backend"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "Complete recruitment platform backend with AI features"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8804
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # OpenAI Settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = "gpt-4-1106-preview"
    OPENAI_MAX_TOKENS: int = 4000
    OPENAI_TEMPERATURE: float = 0.1
    
    # Milvus Database Settings
    MILVUS_HOST: str = os.getenv("MILVUS_HOST", "34.135.232.156")
    MILVUS_PORT: str = os.getenv("MILVUS_PORT", "19530")
    MILVUS_COLLECTION_RESUMES: str = "resumes"
    MILVUS_COLLECTION_JOBS: str = "job_descriptions"
    
    # CORS Settings
    CORS_ORIGINS: list = ["*"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list = ["*"]
    CORS_HEADERS: list = ["*"]
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: list = [".pdf", ".docx", ".doc", ".txt"]
    UPLOAD_FOLDER: str = "uploads"
    
    # Database Settings (for non-Milvus data)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./recruiter_ai.db")
    
    # Email Settings (for Mass Mailing)
    SENDGRID_API_KEY: Optional[str] = os.getenv("SENDGRID_API_KEY")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    
    # Logging Settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Feature Flags
    ENABLE_RESUME_PARSING: bool = True
    ENABLE_AI_JOB_DESCRIPTIONS: bool = True
    ENABLE_SEMANTIC_SEARCH: bool = True
    ENABLE_MASS_MAILING: bool = True
    ENABLE_CRM_PIPELINE: bool = True

# Global settings instance
settings = Settings()
