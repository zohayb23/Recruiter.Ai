# Recruiter.AI

Recruiter.AI is an intelligent recruitment platform that leverages AI to streamline the hiring process. It combines resume parsing, job description generation, and candidate matching capabilities to help recruiters find the best candidates efficiently.

## 🚀 Features

### Working Features

#### Job Management
- ✅ AI-powered job description generation from minimal input
- ✅ Support for multiple job types (Remote/In-Person/Hybrid)
- ✅ Job listing page with status tracking
- ✅ Job detail view with formatted sections
- ✅ Job publishing workflow
- ✅ Job status management (Draft/Published)

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

#### Candidate Management
- ✅ Candidate listing page
- ✅ Basic candidate search
- ✅ Candidate information display
- ✅ Resume data persistence

### Features in Development
- 🔄 Candidate-Job Matching Engine
- 🔄 Advanced Search Filters
- 🔄 Email Integration
- 🔄 Analytics Dashboard

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
- OpenAI API (GPT-4) for intelligent parsing and generation
- Sentence Transformers (all-MiniLM-L6-v2) for embeddings
- PyPDF2, python-docx, textract for multi-format parsing
- Pydantic for data validation and serialization
- Content-based caching system for performance
- Asynchronous processing with asyncio

### Database
- Milvus (Vector Database)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- Python (3.9 or higher)
- Docker & Docker Compose
- Git

## 🚀 Getting Started

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/yourusername/Recruiter.AI.git
cd Recruiter.AI
\`\`\`

### 2. Backend Setup

#### Install Python Dependencies
\`\`\`bash
cd backend-full
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
\`\`\`

#### Environment Variables
Create a \`.env\` file in the \`backend-full\` directory:
\`\`\`env
# OpenAI Configuration (required for resume parsing and job description generation)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-1106-preview  # or your preferred GPT-4 model

# Milvus Configuration
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Optional Performance Tuning
CACHE_ENABLED=true  # Enable/disable resume parsing cache
\`\`\`

#### Start Milvus
\`\`\`bash
docker-compose up -d
\`\`\`

#### Run Backend Server
\`\`\`bash
uvicorn src.main:app --reload --port 8804
\`\`\`

### 3. Frontend Setup

#### Install Dependencies
\`\`\`bash
cd frontend-v2
npm install
\`\`\`

#### Environment Variables
Create a \`.env\` file in the \`frontend-v2\` directory:
\`\`\`env
VITE_API_BASE_URL=http://localhost:8804
\`\`\`

#### Run Development Server
\`\`\`bash
npm run dev
\`\`\`

The application will be available at \`http://localhost:5173\`

## 📁 Project Structure

\`\`\`
Recruiter.AI/
├── backend-full/                # Backend application
│   ├── src/
│   │   ├── main.py             # FastAPI application entry
│   │   ├── routers/            # API route handlers
│   │   └── services/           # Business logic
│   └── requirements.txt        # Python dependencies
├── frontend-v2/                # Frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── contexts/          # React contexts
│   └── package.json           # Node.js dependencies
└── docker-compose.yml         # Docker services config
\`\`\`

## 🔑 API Keys Required
- OpenAI API Key (for job description generation)

## 🧪 Testing

### Backend Tests
\`\`\`bash
cd backend-full
pytest
\`\`\`

### Frontend Tests
\`\`\`bash
cd frontend-v2
npm test
\`\`\`

## 🚨 Common Issues & Solutions

1. **Milvus Connection Issues**
   - Ensure Docker is running
   - Check if Milvus containers are up: \`docker ps\`
   - Verify Milvus port (19530) is not in use

2. **OpenAI API Errors**
   - Verify API key is correctly set in \`.env\`
   - Check API key has sufficient credits
   - Ensure requests are properly formatted

3. **Frontend Build Issues**
   - Clear node_modules: \`rm -rf node_modules\`
   - Reinstall dependencies: \`npm install\`
   - Clear Vite cache: \`npm run clean\`

4. **Resume Processing Performance**
   - First-time processing takes ~1 minute (GPT-4 analysis)
   - Subsequent processing of same file is instant (cache hit)
   - Cache is content-based (changing file content triggers reprocessing)
   - Cache persists between server restarts
   - Check cache directory: \`backend-full/cache/resumes\`

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Milvus Documentation](https://milvus.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/AmazingFeature\`
3. Commit your changes: \`git commit -m 'Add some AmazingFeature'\`
4. Push to the branch: \`git push origin feature/AmazingFeature\`
5. Open a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.