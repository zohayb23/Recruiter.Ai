# Recruiter.AI

Recruiter.AI is an intelligent recruitment platform that leverages AI to streamline the hiring process. It combines resume parsing, job description generation, and candidate matching capabilities to help recruiters find the best candidates efficiently.

## 🌟 **NEW: Company GCP Deployment Available!**
- **🌐 Production Frontend**: Deployed on Netlify with HTTPS
- **☁️ Production Backend**: Deployed on Google Cloud Platform (GCP) VM in TAQForce project
- **🔄 Hybrid Setup**: Maintains local development while providing cloud access
- **📱 Access Anywhere**: Use the application from any device, anywhere
- **🔗 Smart Proxy**: Netlify automatically routes API calls to cloud backend
- **⚡ Production Ready**: Full backend connectivity with 14 resumes and 6 job descriptions
- **🏢 Company Infrastructure**: Running on TAQForce GCP project with personal Milvus database

## 🚀 Features

### Working Features

#### Job Management
- ✅ AI-powered job description generation from minimal input
- ✅ Support for multiple job types (Remote/In-Person/Hybrid)
- ✅ Job listing page with status tracking and company name display
- ✅ Job detail view with formatted sections
- ✅ Job publishing workflow
- ✅ Job status management (Draft/Published)
- ✅ Intelligent company name extraction from job descriptions
- ✅ **NEW**: Company and location display in job listings table

#### Resume Processing
- ✅ Resume parsing from multiple formats (PDF, DOCX, DOC, TXT, RTF)
- ✅ GPT-4 powered intelligent resume parsing with high accuracy
- ✅ Automatic information extraction:
  - Contact details (email, phone, location)
  - Professional summary
  - Work experience with detailed responsibilities
  - Education history with GPA and majors
  - Categorized skills (programming, cloud, frameworks, etc.)
  - Professional certifications
  - Links (LinkedIn, GitHub, Portfolio)
  - Languages and proficiency levels
- ✅ Content-based caching system for faster repeat processing
- ✅ Parsed resume display with collapsible sections
- ✅ Vector storage in Milvus for efficient searching
- ✅ Sentence transformer embeddings for semantic search
- ✅ Intelligent categorization validation to prevent misclassification
- ✅ Local model caching for improved startup performance
- ✅ **NEW**: Robust skills parsing for complex data structures

#### Candidate Management
- ✅ Candidate listing page with real-time data
- ✅ Basic candidate search functionality
- ✅ Candidate information display
- ✅ Resume data persistence in Milvus
- ✅ **NEW**: Automatic candidate data population from backend
- ✅ **NEW**: Skills and education display from parsed resumes

#### **NEW: Advanced Search & Analytics**
- ✅ **Keyword Generator**: Create boolean search queries for job searches
  - Job title-based keyword generation
  - Required and preferred skills integration
  - Experience level and industry targeting
  - Search suggestions and optimization tips
- ✅ **Enhanced Search**: Categorize results by skill, location, and experience
  - Multi-dimensional filtering system
  - Skill-based categorization
  - Location-based grouping
  - Experience level filtering
  - Interactive filter toggles
  - Real-time result counting

#### **NEW: Company Cloud Infrastructure**
- ✅ **GCP VM Deployment**: Backend running on Google Cloud Platform (TAQForce project)
- ✅ **Netlify Frontend**: Production frontend with automatic deployments
- ✅ **Smart Environment Detection**: Automatic dev/prod switching
- ✅ **API Proxy**: Seamless backend connectivity through Netlify
- ✅ **Production Database**: 14 resumes and 6 job descriptions live
- ✅ **Service Management**: Systemd service with automatic restarts
- ✅ **Personal Milvus Integration**: Connected to personal GCP Milvus database

### Features in Development

#### Candidate-Job Matching System
- 🔄 Semantic similarity scoring
- 🔄 Configurable matching criteria
- 🔄 Weighted scoring algorithm
- 🔄 Location and work-type preferences
- 🔄 Match percentage visualization

#### Enhanced Candidate Profiles
- 🔄 Dynamic profile data integration
- 🔄 Interactive experience timeline
- 🔄 Skills matrix with proficiency levels
- 🔄 Candidate status tracking
- 🔄 Document management system

#### AI Recruitment Assistant
- 🔄 Intelligent chatbot integration
- 🔄 Candidate screening flows
- 🔄 Multi-language support
- 🔄 Context-aware responses
- 🔄 Human handoff system

#### UI/UX Improvements
- 🔄 Responsive design implementation
- 🔄 Design system creation
- 🔄 Dark/light mode support
- 🔄 Enhanced data visualizations
- 🔄 Accessibility compliance

#### Analytics Dashboard
- 🔄 Recruitment metrics tracking
- 🔄 Interactive visualizations
- 🔄 Customizable layouts
- 🔄 Predictive analytics
- 🔄 Report generation

## 🛠 Tech Stack

### Frontend
- React (TypeScript)
- Vite
- Material-UI & Bootstrap
- React Query v5
- React Router v6
- Axios

### Backend
- FastAPI (Python)
- OpenAI API (GPT-4 Turbo) for intelligent parsing and generation
- Sentence Transformers (all-MiniLM-L6-v2) for embeddings
- PyPDF2, python-docx, textract for multi-format parsing
- Pydantic for data validation and serialization
- Content-based caching system for performance
- Asynchronous processing with asyncio
- Local model caching for improved startup

### Database
- Milvus (Vector Database)

### Cloud Infrastructure
- **Google Cloud Platform**: VM hosting for backend (TAQForce project)
- **Netlify**: Frontend hosting with automatic deployments
- **Nginx**: Reverse proxy on GCP VM
- **Systemd**: Service management for backend
- **Personal Milvus**: Connected to personal GCP Milvus database

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- Python (3.9 or higher)
- Docker & Docker Compose
- Git
- Google Cloud CLI (for cloud deployment)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Recruiter.AI.git
cd Recruiter.AI
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend-full
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

#### Environment Variables
Create a `.env` file in the `backend-full` directory:
```env
# OpenAI Configuration (required for resume parsing and job description generation)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-1106-preview  # Required for JSON response format

# Milvus Configuration (Company GCP Setup)
MILVUS_HOST=35.223.26.176  # Personal GCP Milvus database
MILVUS_PORT=19530

# Optional Performance Tuning
CACHE_ENABLED=true  # Enable/disable resume parsing cache
SUPPRESS_HF_WARNINGS=true  # Suppress Hugging Face warnings during startup
```

#### Start Milvus
```bash
docker-compose up -d
```

#### Run Backend Server
```bash
uvicorn src.main:app --reload --port 8804
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend-v2
npm install
```

#### Environment Variables
Create a `.env` file in the `frontend-v2` directory:
```env
VITE_API_BASE_URL=http://localhost:8804
```

#### Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## ☁️ Cloud Deployment

### Production Access
- **Frontend**: https://playful-biscuit-e5d6e1-recruiter-ai.netlify.app
- **Backend**: http://34.121.146.153:8804 (Company GCP VM)
- **Personal Milvus**: http://35.223.26.176:8000 (Attu Web UI)

### View Cloud Backend Logs
```bash
gcloud compute ssh taqforce-recruiter-ai-vm --zone=us-central1-a --command="sudo journalctl -u recruiter-ai.service -f --no-pager"
```

### Backend Service Management
```bash
# Check service status
gcloud compute ssh taqforce-recruiter-ai-vm --zone=us-central1-a --command="sudo systemctl status recruiter-ai.service"

# Restart service
gcloud compute ssh taqforce-recruiter-ai-vm --zone=us-central1-a --command="sudo systemctl restart recruiter-ai.service"

# View real-time logs
gcloud compute ssh taqforce-recruiter-ai-vm --zone=us-central1-a --command="sudo journalctl -u recruiter-ai.service -f"
```

## 📁 Project Structure

```
Recruiter.AI/
├── backend-full/                # Backend application
│   ├── src/
│   │   ├── main.py             # FastAPI application entry
│   │   ├── routers/            # API route handlers
│   │   │   ├── search_utils.py # NEW: Keyword generator & enhanced search
│   │   │   └── resume_parser.py # Enhanced resume processing
│   │   └── services/           # Business logic
│   │       ├── resume_parser/  # Resume parsing services
│   │       └── vector_store/   # Milvus integration
│   └── requirements.txt        # Python dependencies
├── frontend-v2/                # Frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/             # Page components
│   │   │   ├── KeywordGeneratorPage.tsx # NEW: Keyword generator
│   │   │   └── EnhancedSearchPage.tsx   # NEW: Enhanced search
│   │   ├── services/          # API services
│   │   └── contexts/          # React contexts
│   ├── netlify.toml           # Netlify configuration
│   └── package.json           # Node.js dependencies
└── docker-compose.yml         # Docker services config
```

## 🔑 API Keys Required
- OpenAI API Key (for resume parsing and job description generation)

## 🧪 Testing

### Backend Tests
```bash
cd backend-full
pytest
```

### Frontend Tests
```bash
cd frontend-v2
npm test
```

## 🚨 Common Issues & Solutions

1. **Milvus Connection Issues**
   - Ensure Docker is running
   - Check if Milvus containers are up: `docker ps`
   - Verify Milvus port (19530) is not in use
   - If schema errors occur, drop the collection and restart

2. **OpenAI API Errors**
   - Verify API key is correctly set in `.env`
   - Check API key has sufficient credits
   - Ensure using GPT-4 Turbo (gpt-4-1106-preview) for JSON responses
   - Handle rate limits with exponential backoff

3. **Frontend Build Issues**
   - Clear node_modules: `rm -rf node_modules`
   - Reinstall dependencies: `npm install`
   - Clear Vite cache: `npm run clean`

4. **Resume Processing Performance**
   - First-time processing takes ~1 minute (GPT-4 analysis)
   - Subsequent processing of same file is instant (cache hit)
   - Cache is content-based (changing file content triggers reprocessing)
   - Cache persists between server restarts
   - Check cache directory: `backend-full/cache/resumes`
   - Local model caching improves startup time

5. **Import and Path Issues**
   - Always run server from project root: `uvicorn src.main:app --reload --port 8804`
   - Ensure Python path includes project root
   - Check for correct relative vs absolute imports

6. **Cloud Deployment Issues**
   - Verify backend service is running: `sudo systemctl status recruiter-ai.service`
   - Check backend logs for errors: `sudo journalctl -u recruiter-ai.service -f`
   - Ensure `netlify.toml` is included in deployment
   - Verify proxy rules point to correct backend port (8804)

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Milvus Documentation](https://milvus.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Netlify Documentation](https://docs.netlify.com/)
- [Google Cloud Documentation](https://cloud.google.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.