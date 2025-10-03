# Recruiter.AI Backend

A modern, modular backend API for the Recruiter.AI platform built with FastAPI, featuring AI-powered resume parsing, job description generation, and semantic search capabilities.

## 🏗️ Architecture

```
backend/
├── config/           # Configuration and settings
├── models/           # Pydantic data models
├── services/         # Business logic services
├── routes/           # API route handlers
├── utils/            # Utility functions
├── main.py           # FastAPI application entry point
├── start_backend.py  # Startup script
└── requirements.txt  # Python dependencies
```

## 🚀 Features

### ✅ Implemented
- **Resume Parsing**: AI-powered extraction of structured data from PDF/DOCX resumes
- **AI Job Descriptions**: GPT-4 powered job description generation
- **Modular Architecture**: Clean separation of concerns with services, models, and routes
- **Type Safety**: Full Pydantic models with validation
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

### 🔄 In Progress
- **Semantic Search**: Milvus vector database integration
- **Database Storage**: Persistent storage for resumes and jobs
- **Mass Mailing**: Email campaign management
- **CRM Pipeline**: Candidate pipeline management

## 🛠️ Setup

### Prerequisites
- Python 3.8+
- OpenAI API key
- Milvus database (optional)

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   ```bash
   export OPENAI_API_KEY="your-openai-api-key"
   export MILVUS_HOST="your-milvus-host"
   export MILVUS_PORT="19530"
   ```

4. **Start the server:**
   ```bash
   python start_backend.py
   ```

## 📚 API Endpoints

### Resume Parser
- `POST /api/resume-parser/parse` - Upload and parse resume file
- `GET /api/resume-parser/stored-resumes` - Get all stored resumes
- `GET /api/resume-parser/resume/{id}` - Get specific resume
- `POST /api/resume-parser/search` - Semantic search resumes
- `POST /api/resume-parser/parse-text` - Parse resume text directly

### Job Descriptions
- `POST /api/job-descriptions/generate` - Generate AI job description
- `POST /api/job-descriptions/` - Create job description
- `GET /api/job-descriptions/` - Get all job descriptions
- `GET /api/job-descriptions/{id}` - Get specific job description
- `PUT /api/job-descriptions/{id}` - Update job description
- `DELETE /api/job-descriptions/{id}` - Delete job description
- `POST /api/job-descriptions/search` - Semantic search jobs
- `POST /api/job-descriptions/match` - Match jobs with resume

### Health Checks
- `GET /` - Root endpoint with service info
- `GET /health` - Global health check
- `GET /api/resume-parser/health` - Resume parser health
- `GET /api/job-descriptions/health` - Job description service health

## 🔧 Configuration

All configuration is managed through `config/settings.py`:

```python
# API Settings
API_TITLE = "Recruiter.AI Backend"
API_VERSION = "1.0.0"

# OpenAI Settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = "gpt-4-1106-preview"

# Milvus Settings
MILVUS_HOST = os.getenv("MILVUS_HOST", "34.60.125.249")
MILVUS_PORT = os.getenv("MILVUS_PORT", "19530")

# Feature Flags
ENABLE_RESUME_PARSING = True
ENABLE_AI_JOB_DESCRIPTIONS = True
ENABLE_SEMANTIC_SEARCH = True
```

## 📊 Data Models

### Resume Models
- `ParsedResume`: Structured resume data
- `ResumeDocument`: Complete resume with metadata
- `ResumeSearchRequest`: Search parameters
- `ResumeUploadResponse`: Upload response

### Job Models
- `JobDescription`: Complete job description
- `JobGenerationRequest`: AI generation parameters
- `JobSearchRequest`: Search parameters
- `JobMatchResult`: Job-resume matching results

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=backend

# Run specific test file
pytest tests/test_resume_service.py
```

## 📈 Development

### Adding New Features

1. **Create model** in `models/`
2. **Create service** in `services/`
3. **Create routes** in `routes/`
4. **Update main.py** to include new routes
5. **Add tests** in `tests/`

### Code Style

```bash
# Format code
black backend/

# Lint code
flake8 backend/
```

## 🔗 Integration

The backend is designed to work with:
- **Frontend**: React/TypeScript frontend (frontend-v3)
- **Database**: Milvus vector database for semantic search
- **AI**: OpenAI GPT-4 for resume parsing and job generation
- **Email**: SendGrid for mass mailing campaigns

## 📝 API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8804/docs`
- **ReDoc**: `http://localhost:8804/redoc`

## 🚀 Deployment

The backend is designed to be deployed as:
- **Standalone**: Direct Python execution
- **Docker**: Containerized deployment
- **Cloud**: GCP, AWS, or Azure deployment

## 📞 Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review the logs for error details
3. Ensure all environment variables are set
4. Verify OpenAI API key is valid
