# Recruiter.AI - AI-Powered Recruitment Platform

Recruiter.AI is a modern recruitment platform that leverages artificial intelligence to streamline the hiring process. The platform includes resume parsing, job matching, external job search, and vector-based candidate search capabilities.

## Features

### Core Features
- 🤖 AI-powered resume parsing with structured data extraction
- 🔍 External job search integration with Adzuna API
- 📊 Vector-based candidate search using Milvus
- 💼 Job requisition management
- 👥 Candidate relationship management
- 🔄 High availability with load balancer setup

### Technical Stack
- **Backend**: FastAPI, Python 3.12
- **Frontend**: React, TypeScript, Bootstrap
- **Vector Store**: Milvus 2.3.4
- **ML/AI**: 
  - Sentence Transformers
  - spaCy
  - OpenAI API
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Docker Compose

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Recruiter.AI.git
cd Recruiter.AI
```

2. Set up Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd frontend-v2
npm install
```

4. Start Milvus instances (Primary and Load Balancer):
```bash
# Start primary Milvus instance
docker-compose up -d

# Start load balancer Milvus instance
docker-compose -f docker-compose.loadbalancer.yml up -d
```

5. Start the backend server:
```bash
# Set PYTHONPATH and start FastAPI server
PYTHONPATH=/path/to/Recruiter.AI python -m uvicorn src.main:app --host 0.0.0.0 --port 8804 --reload
```

6. Start the frontend development server:
```bash
cd frontend-v2
npm run dev
```

### Accessing the Services

#### Frontend Application
- Main application: http://localhost:5173

#### Backend API
- FastAPI server: http://localhost:8804
- API documentation: http://localhost:8804/docs

#### Milvus Vector Stores

Primary Instance:
- Milvus server: localhost:19530
- Attu UI: http://localhost:8000
  - Connect using:
    - Milvus Address: localhost:19530
    - Database: default

Load Balancer Instance:
- Milvus server: localhost:19532
- Attu UI: http://localhost:8001
  - Connect using:
    - Milvus Address: localhost:19532
    - Database: default

## Architecture

### Backend Components

1. Resume Parser Service
- Supports PDF, DOCX, TXT, and RTF files
- Extracts structured information:
  - Contact details
  - Work experience
  - Education
  - Skills (with proficiency levels)
  - Projects
- Stores parsed data in Milvus for vector search

2. External Job Search
- Integration with Adzuna API
- Supports filters:
  - Keywords
  - Location
  - Employment type (full-time, part-time, contract, permanent)
  - Results pagination

3. Vector Store Service
- Dual Milvus setup for high availability
- Vector embeddings using Sentence Transformers
- Collections:
  - resumes: Primary collection
  - resumes_lb: Load balancer collection
  - document_store: For document embeddings
  - jobs: For job embeddings
  - skills: For skill embeddings

### Frontend Components

1. Resume Management
- Drag-and-drop resume upload
- Structured resume viewer
- Resume parsing status tracking

2. Job Search Interface
- External job search with filters
- Job details view
- Apply now functionality

3. Admin Dashboard
- Resume analytics
- Job posting management
- Candidate tracking

## API Documentation

### Resume Parser Endpoints

```typescript
POST /api/resume-parser/parse
- Accepts multipart/form-data with file
- Returns parsed resume data

GET /api/resume-parser/stored-resumes
- Returns list of stored resumes
```

### External Jobs Endpoints

```typescript
GET /api/external-jobs/search
- Query parameters:
  - query: string
  - location: string
  - page: number
  - full_time: boolean
  - part_time: boolean
  - contract: boolean
  - permanent: boolean
  - results_per_page: number

GET /api/external-jobs/{job_id}
- Returns detailed job information
```

## Docker Configuration

### Primary Milvus Instance (docker-compose.yml)
```yaml
services:
  etcd:
    # Etcd configuration
  minio:
    # MinIO configuration
  standalone:
    # Milvus standalone configuration
  attu:
    # Attu UI configuration
```

### Load Balancer Instance (docker-compose.loadbalancer.yml)
```yaml
services:
  etcd-lb:
    # Etcd configuration
  minio-lb:
    # MinIO configuration
  standalone-lb:
    # Milvus standalone configuration
  attu-lb:
    # Attu UI configuration
```

## Development Guidelines

1. Code Style
- Python: Follow PEP 8
- TypeScript: Use ESLint and Prettier
- Use type hints and interfaces

2. Git Workflow
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`
- Pull requests for all changes

3. Testing
- Write unit tests for new features
- Run tests before committing
- Maintain test coverage

## Troubleshooting

### Common Issues

1. Milvus Connection Issues
```bash
# Check if Milvus containers are running
docker ps

# Check Milvus logs
docker logs milvus-standalone
docker logs milvus-standalone-lb
```

2. Resume Parser Issues
```bash
# Check upload directory permissions
ls -la uploads/resumes

# Check FastAPI logs
docker logs fastapi-server
```

3. Frontend Issues
```bash
# Clear npm cache
npm clean-cache

# Rebuild node modules
rm -rf node_modules
npm install
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Milvus](https://milvus.io/) for vector database
- [FastAPI](https://fastapi.tiangolo.com/) for backend framework
- [React](https://reactjs.org/) for frontend framework
- [Adzuna](https://www.adzuna.com/) for job search API
