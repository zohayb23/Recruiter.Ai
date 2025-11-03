# Recruiter.AI - Complete Recruitment Platform

Recruiter.AI is a comprehensive, AI-powered recruitment platform that combines intelligent resume parsing, job description generation, candidate management, mass mailing campaigns, and advanced analytics to streamline the entire hiring process.

## 🌟 **Production Deployment Status**
- **🌐 Production Frontend**: Deployed on Netlify with HTTPS
- **☁️ Production Backend**: Deployed on Google Cloud Platform (GCP) VM in TAQForce project
- **🔄 Multi-Service Architecture**: CRM, Mass Mailing, and Milvus Integration services
- **📱 Access Anywhere**: Use the application from any device, anywhere
- **🔗 Smart Proxy**: Netlify automatically routes API calls to cloud backend
- **⚡ Production Ready**: Full backend connectivity with comprehensive features
- **🏢 Company Infrastructure**: Running on TAQForce GCP project with Milvus database

## 🚀 Complete Feature Set

### 📋 **Job Management System**
- ✅ **AI Job Description Generation**: Create professional job descriptions from minimal input
- ✅ **Job Types Support**: Remote, In-Person, and Hybrid job types
- ✅ **Job Listings Management**: Comprehensive job listing page with status tracking
- ✅ **Job Detail Views**: Formatted job detail pages with all sections
- ✅ **Job Publishing Workflow**: Complete draft to published workflow
- ✅ **Job Status Management**: Draft/Published status tracking
- ✅ **Company Name Extraction**: Intelligent company name detection from descriptions
- ✅ **Location Display**: Company and location information in job listings
- ✅ **Job Matching**: AI-powered candidate-job matching system
- ✅ **External Jobs Integration**: Import and manage external job postings

### 📄 **Advanced Resume Processing & Parsing**
- ✅ **Multi-Format Support**: PDF, DOCX, DOC, TXT, RTF resume parsing
- ✅ **GPT-4 Powered Analysis**: High-accuracy intelligent resume parsing
- ✅ **Comprehensive Data Extraction**:
  - Contact details (email, phone, location)
  - Professional summary and objectives
  - Work experience with detailed responsibilities
  - Education history with GPA and majors
  - Categorized skills (programming, cloud, frameworks, etc.)
  - Professional certifications and licenses
  - Links (LinkedIn, GitHub, Portfolio, websites)
  - Languages and proficiency levels
- ✅ **Content-Based Caching**: Faster repeat processing with intelligent caching
- ✅ **Parsed Resume Display**: Collapsible sections with organized information
- ✅ **Vector Storage**: Milvus integration for efficient searching
- ✅ **Sentence Transformer Embeddings**: Semantic search capabilities
- ✅ **Intelligent Categorization**: Validation to prevent misclassification
- ✅ **Local Model Caching**: Improved startup performance
- ✅ **Robust Skills Parsing**: Complex data structure handling
- ✅ **Resume Import Interface**: User-friendly resume upload system

### 👥 **Candidate Management & CRM System**
- ✅ **Pipeline Management**: Drag-and-drop candidate pipeline (Applied → Offer)
- ✅ **Real-Time Tracking**: Live candidate status updates
- ✅ **Notes & Tagging System**: Recruiter notes and candidate tagging
- ✅ **Engagement History**: Automatic interaction logging and history
- ✅ **Candidate Profiles**: Comprehensive candidate information display
- ✅ **Skills & Education Display**: Data from parsed resumes
- ✅ **Advanced Search & Filter**: Multi-dimensional candidate search
- ✅ **Data Persistence**: Resume data stored in Milvus vector database
- ✅ **Candidate Scoring**: AI-powered candidate scoring system
- ✅ **Batch Scoring**: Score multiple candidates simultaneously
- ✅ **Profile Summary Views**: Quick candidate overview displays
- ✅ **Duplicate Detection**: Identify and manage duplicate candidates

### 📧 **Mass Mailing & Marketing Automation**
- ✅ **Campaign Management**: Create and manage email campaigns
- ✅ **Bulk Email Sending**: Send emails to multiple recipients
- ✅ **Email Templates**: Pre-built and custom email templates
- ✅ **Recipient Management**: Organize and manage recipient lists
- ✅ **Response Tracking**: Track email opens, clicks, and responses
- ✅ **A/B Testing**: Split testing for email campaigns with statistical analysis
- ✅ **Advanced Segmentation**: Rule-based recipient filtering with logical operators
- ✅ **Campaign Automation**: Trigger-based workflows and drip campaigns
- ✅ **Vendor Management**: Vendor submission portal and scoring system
- ✅ **Advanced Analytics**: Comprehensive campaign performance metrics
- ✅ **Advanced Scheduling**: Recurring and time-based campaign scheduling
- ✅ **Security & Compliance**: GDPR compliance and audit logging
- ✅ **Email Service Integration**: SendGrid and SMTP support
- ✅ **Tracking Pixels**: Email open and click tracking
- ✅ **Performance Metrics**: Detailed analytics and reporting

### 🤖 **NEW: Automated Gmail Agents**

#### 📧 General Email Agent
- ✅ **Fully Automated Email Processing**: 24/7 monitoring of Gmail inbox
- ✅ **AI-Powered Parsing**: GPT-4 intelligently categorizes and extracts email data
- ✅ **Zero Manual Intervention**: Automatic processing without clicks
- ✅ **Smart Categorization**: Job applications, inquiries, networking, spam detection
- ✅ **Resume Detection**: Automatically identifies and flags resume submissions
- ✅ **Priority Assignment**: High/medium/low priority based on email content
- ✅ **Candidate Info Extraction**: Extracts names, skills, experience from emails
- ✅ **Milvus Integration**: Stores all emails in searchable "emails" collection
- ✅ **Semantic Search**: Find emails by meaning, not just keywords
- ✅ **Email Analytics**: Track application volumes, trends, and patterns
- ✅ **Duplicate Prevention**: Tracks processed emails to avoid reprocessing
- ✅ **API Endpoints**: Full REST API for email management and search
- 📚 **Documentation**: Complete setup guide in `GMAIL_AGENT_README.md`

#### 💼 Job Description Agent
- ✅ **Automated Job Extraction**: Monitors Gmail for job description emails
- ✅ **Smart Job Detection**: AI identifies if email contains a job posting
- ✅ **Structured Data Extraction**: Extracts job details matching Milvus schema
- ✅ **Complete Field Mapping**: Title, company, department, location, skills, benefits
- ✅ **Location Type Detection**: Automatically determines remote/in-person/hybrid
- ✅ **Experience Level Parsing**: Entry/Mid/Senior/Lead/Executive classification
- ✅ **Skills Array Extraction**: Required and preferred skills as JSON arrays
- ✅ **Company Information**: Extracts company name and description
- ✅ **Sender Tracking**: Captures sender name and contact information
- ✅ **OpenAI Embeddings**: Generates 1536-dim vectors for semantic search
- ✅ **Milvus Storage**: Stores in "job_descriptions" collection
- ✅ **Schema Compliance**: 100% match with existing job_descriptions schema
- 📚 **Documentation**: Complete guide in `GMAIL_JOB_AGENT_README.md`

### 🔍 **Advanced Search & Analytics**
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
- ✅ **Semantic Search**: AI-powered similarity search using Milvus
- ✅ **Gap Detection**: Education and career gap analysis
- ✅ **Performance Analytics**: Comprehensive recruitment metrics
- ✅ **Data Management**: Advanced data management and cleanup tools
- ✅ **Optimized API**: High-performance API endpoints
- ✅ **Simple Search**: Basic search functionality for quick queries

### 🎯 **Candidate Scoring & Matching**
- ✅ **AI-Powered Scoring**: Intelligent candidate scoring algorithms
- ✅ **Job-Candidate Matching**: Semantic similarity scoring
- ✅ **Configurable Criteria**: Customizable matching parameters
- ✅ **Weighted Scoring**: Advanced scoring with configurable weights
- ✅ **Location Preferences**: Geographic matching capabilities
- ✅ **Work-Type Preferences**: Remote/In-Person/Hybrid matching
- ✅ **Match Percentage Visualization**: Clear matching score displays
- ✅ **Batch Processing**: Score multiple candidates at once

### 📊 **Analytics & Reporting**
- ✅ **Recruitment Metrics**: Comprehensive tracking and analytics
- ✅ **Interactive Visualizations**: Dynamic charts and graphs
- ✅ **Customizable Dashboards**: Personalized analytics views
- ✅ **Performance Tracking**: Campaign and system performance metrics
- ✅ **Trend Analysis**: Historical data analysis and trends
- ✅ **Export Capabilities**: Data export for external analysis

### 🏗️ **Production Infrastructure**
- ✅ **GCP VM Deployment**: Backend running on Google Cloud Platform (TAQForce project)
- ✅ **Netlify Frontend**: Production frontend with automatic deployments
- ✅ **Smart Environment Detection**: Automatic dev/prod switching
- ✅ **API Proxy**: Seamless backend connectivity through Netlify
- ✅ **Service Management**: Systemd service with automatic restarts
- ✅ **Milvus Integration**: Connected to GCP Milvus database
- ✅ **Load Balancing**: Multiple backend services for scalability
- ✅ **SSL Certificates**: HTTPS encryption for production

## 🛠 Tech Stack

### Frontend
- **React** (TypeScript) - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Material-UI & Bootstrap** - UI component libraries
- **React Query v5** - Data fetching and caching
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **@dnd-kit** - Drag and drop functionality
- **ReactQuill** - Rich text editor
- **Recharts** - Data visualization

### Backend Services
- **FastAPI** (Python) - High-performance API framework
- **OpenAI API** (GPT-4 Turbo) - AI-powered parsing and generation
- **Sentence Transformers** (all-MiniLM-L6-v2) - Text embeddings
- **PyPDF2, python-docx** - Multi-format document parsing
- **Pydantic** - Data validation and serialization
- **SQLite** - Local database with connection pooling
- **SendGrid** - Email service integration
- **PyTorch** - Machine learning models
- **Asyncio** - Asynchronous processing

### Database & Storage
- **Milvus** - Vector database for semantic search
- **SQLite** - Relational database for structured data
- **Content-based Caching** - Performance optimization

### Cloud Infrastructure
- **Google Cloud Platform** - VM hosting (TAQForce project)
- **Netlify** - Frontend hosting with automatic deployments
- **Docker** - Containerization
- **Systemd** - Service management
- **Nginx** - Reverse proxy (optional)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (3.9 or higher)
- **Docker & Docker Compose**
- **Git**
- **Google Cloud CLI** (for cloud deployment)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Recruiter.AI.git
cd Recruiter.AI
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Environment Variables
Create a `.env` file in the project root:
```env
# OpenAI Configuration (required for AI features)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-1106-preview

# Milvus Configuration (Production GCP Setup)
MILVUS_HOST=34.60.125.249  # GCP Milvus database
MILVUS_PORT=19530

# Email Service Configuration (optional)
SENDGRID_API_KEY=your_sendgrid_api_key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Performance Tuning
CACHE_ENABLED=true
SUPPRESS_HF_WARNINGS=true
```

#### Start Milvus (Local Development)
```bash
docker-compose up -d
```

#### Run Backend Services
```bash
# Mass Mailing Backend (Port 8810)
python3 mass_mailing_backend.py

# CRM Backend (Port 8809)
python3 pipeline_crm_backend.py

# Milvus Integration (Port 8808)
python3 complete_backend_with_milvus.py
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
# Development
VITE_API_BASE_URL=http://localhost:8810

# Production (automatically detected)
VITE_API_BASE_URL=https://your-netlify-app.netlify.app
```

#### Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## ☁️ Production Deployment

### Current Production Endpoints
- **Frontend**: https://playful-biscuit-e5d6e1-recruiter-ai.netlify.app
- **CRM Backend**: http://34.31.224.102:8809 ✅ **OPERATIONAL**
- **Mass Mailing Backend**: http://34.31.224.102:8810
- **Milvus Integration**: http://34.31.224.102:8808
- **Milvus Attu UI**: http://34.60.125.249:3000 ✅ **OPERATIONAL**

### Deploy to GCP
```bash
# Run the production deployment script
./deploy_production_gcp.sh
```

### Service Management
```bash
# Check service status
gcloud compute ssh taqforce-recruiter-ai-vm --zone=us-central1-a --command="sudo systemctl status mass-mailing.service"

# Restart services
gcloud compute ssh taqforce-recruiter-ai-vm --zone=us-central1-a --command="sudo systemctl restart mass-mailing.service"

# View logs
gcloud compute ssh taqforce-recruiter-ai-vm --zone=us-central1-a --command="sudo journalctl -u mass-mailing.service -f"
```

## 📁 Complete Project Structure

```
Recruiter.AI/
├── 📄 Backend Services (8 Services)
│   ├── mass_mailing_backend.py          # Mass Mailing & Marketing Automation (226KB)
│   ├── pipeline_crm_backend.py          # Candidate CRM & Pipeline Management
│   ├── complete_backend_with_milvus.py  # Milvus Integration & Semantic Search
│   ├── gap_detection_backend.py         # Education/Career Gap Analysis
│   ├── enhanced_fallback_backend.py     # Enhanced Fallback Features
│   ├── data_management_backend.py       # Data Management & Cleanup
│   ├── optimized_api_backend.py         # API Optimization & Performance
│   └── simple_search_backend.py         # Basic Search Functionality
│
├── 🎨 Frontend Application (React + TypeScript)
│   ├── frontend-v2/
│   │   ├── src/
│   │   │   ├── components/              # React Components
│   │   │   │   ├── auth/                # Authentication Components
│   │   │   │   │   ├── LoginPage.tsx
│   │   │   │   │   ├── BootstrapLoginPage.tsx
│   │   │   │   │   └── ProtectedRoute.tsx
│   │   │   │   ├── candidates/          # Candidate Management
│   │   │   │   │   ├── CandidateDetailPage.tsx
│   │   │   │   │   ├── CandidateListingView.tsx
│   │   │   │   │   ├── CandidateScoringInterface.tsx
│   │   │   │   │   ├── BatchScoringInterface.tsx
│   │   │   │   │   ├── ScoringWidget.tsx
│   │   │   │   │   ├── ScoreDisplay.tsx
│   │   │   │   │   ├── ProfileSummaryView.tsx
│   │   │   │   │   └── ResumeImportPage.tsx
│   │   │   │   ├── layout/              # Layout Components
│   │   │   │   │   ├── MainLayout.tsx
│   │   │   │   │   ├── BootstrapMainLayout.tsx
│   │   │   │   │   └── EnvironmentStatus.tsx
│   │   │   │   └── resume/              # Resume Components
│   │   │   │       ├── ParsedResumeDisplay.tsx
│   │   │   │       └── ParsedResumeViewer.tsx
│   │   │   ├── pages/                   # Page Components (23 Pages)
│   │   │   │   ├── MassMailingPage.tsx  # Mass Mailing interface
│   │   │   │   ├── PipelineCRMPage.tsx  # CRM & Pipeline management
│   │   │   │   ├── SemanticSearchPage.tsx # Semantic search interface
│   │   │   │   ├── GapAnalysisPage.tsx  # Gap analysis interface
│   │   │   │   ├── ABTestingPage.tsx    # A/B Testing interface
│   │   │   │   ├── SegmentationPage.tsx # Advanced segmentation
│   │   │   │   ├── AutomationPage.tsx   # Campaign automation
│   │   │   │   ├── JobListingsPage.tsx  # Job management
│   │   │   │   ├── JobDetailPage.tsx    # Job detail views
│   │   │   │   ├── JobMatchingPage.tsx  # Job-candidate matching
│   │   │   │   ├── ExternalJobsPage.tsx # External job integration
│   │   │   │   ├── CandidatesPage.tsx   # Candidate listing
│   │   │   │   ├── CandidateDetailPage.tsx # Candidate details
│   │   │   │   ├── CandidateScoringPage.tsx # Candidate scoring
│   │   │   │   ├── DuplicateDetectionPage.tsx # Duplicate detection
│   │   │   │   ├── ResumeParserPage.tsx # Resume parsing
│   │   │   │   ├── KeywordGeneratorPage.tsx # Keyword generation
│   │   │   │   ├── EnhancedSearchPage.tsx # Enhanced search
│   │   │   │   └── AnalyticsPage.tsx    # Analytics dashboard
│   │   │   ├── services/                # API Services
│   │   │   ├── contexts/                # React Contexts
│   │   │   │   └── AuthContext.tsx      # Authentication context
│   │   │   ├── types/                   # TypeScript Types
│   │   │   │   ├── api.ts               # API type definitions
│   │   │   │   ├── resume.ts            # Resume type definitions
│   │   │   │   └── custom.d.ts          # Custom type definitions
│   │   │   ├── config/                  # Configuration
│   │   │   │   └── environment.ts       # Environment configuration
│   │   │   ├── App.tsx                  # Main application component
│   │   │   └── main.tsx                 # Application entry point
│   │   ├── netlify.toml                 # Netlify configuration
│   │   └── package.json                 # Node.js dependencies
│
├── 📚 Documentation (7 Files)
│   ├── README.md                        # This comprehensive guide
│   ├── MANUAL_DEPLOYMENT_GUIDE.md       # Manual deployment instructions
│   ├── CANDIDATE_CRM_USER_GUIDE.md      # CRM user guide
│   ├── COMPREHENSIVE_CRM_TEST_PLAN.md   # CRM testing guide
│   ├── FRONTEND_TESTING_GUIDE.md        # Frontend testing guide
│   ├── QUICK_REFERENCE_CARD.md          # Quick reference
│   └── CONTRIBUTING.md                  # Contribution guidelines
│
├── 🚀 Deployment Scripts
│   ├── deploy_production_gcp.sh         # Production deployment script
│   ├── deploy-to-gcp.sh                 # GCP deployment script
│   └── gcp-startup-script.sh            # VM startup script
│
└── 🐳 Infrastructure
    ├── docker-compose.yml               # Docker services config
    └── requirements.txt                 # Python dependencies
```

## 🔑 API Keys Required

### Required
- **OpenAI API Key** - For resume parsing and job description generation

### Optional
- **SendGrid API Key** - For email service integration
- **SMTP Credentials** - Alternative email service

## 🧪 Testing

### Backend Health Checks
```bash
# Test all backend services
curl http://localhost:8810/health  # Mass Mailing
curl http://localhost:8809/health  # CRM
curl http://localhost:8808/health  # Milvus Integration
```

### Frontend Testing
```bash
cd frontend-v2
npm test
```

## 🚨 Common Issues & Solutions

### 1. **Service Connection Issues**
- Verify all backend services are running on correct ports
- Check firewall rules for GCP VM
- Ensure environment variables are set correctly

### 2. **OpenAI API Errors**
   - Verify API key is correctly set in `.env`
   - Check API key has sufficient credits
- Ensure using GPT-4 Turbo for JSON responses
   - Handle rate limits with exponential backoff

### 3. **Milvus Connection Issues**
- Ensure Milvus VM is running: `gcloud compute instances start milvus-vm`
- Check Milvus Attu UI: http://34.60.125.249:3000
- Verify Milvus port (19530) is accessible

### 4. **Email Service Issues**
- Configure SendGrid API key or SMTP credentials
- Check email service logs for delivery issues
- Verify recipient email addresses are valid

### 5. **Frontend Build Issues**
   - Clear node_modules: `rm -rf node_modules`
   - Reinstall dependencies: `npm install`
   - Clear Vite cache: `npm run clean`

### 6. **Production Deployment Issues**
- Verify GCP authentication: `gcloud auth login`
- Check VM disk space: `df -h`
- Monitor service logs: `sudo journalctl -u mass-mailing.service -f`

## 📊 Complete Feature Status

| Feature Category | Feature | Status | Description |
|------------------|---------|--------|-------------|
| **Job Management** | AI Job Description Generation | ✅ Production | GPT-4 powered job description creation |
| | Job Listings Management | ✅ Production | Comprehensive job listing system |
| | Job Publishing Workflow | ✅ Production | Draft to published workflow |
| | External Jobs Integration | ✅ Production | Import and manage external jobs |
| | Job-Candidate Matching | ✅ Production | AI-powered matching system |
| **Resume Processing** | Multi-Format Parsing | ✅ Production | PDF, DOCX, DOC, TXT, RTF support |
| | GPT-4 Analysis | ✅ Production | High-accuracy intelligent parsing |
| | Vector Storage | ✅ Production | Milvus integration for search |
| | Content Caching | ✅ Production | Performance optimization |
| | Resume Import Interface | ✅ Production | User-friendly upload system |
| **Candidate Management** | Pipeline Management | ✅ Production | Drag-and-drop candidate pipeline |
| | Candidate Scoring | ✅ Production | AI-powered scoring algorithms |
| | Batch Scoring | ✅ Production | Score multiple candidates |
| | Notes & Tagging | ✅ Production | Recruiter notes and tagging |
| | Engagement History | ✅ Production | Interaction logging |
| | Duplicate Detection | ✅ Production | Identify duplicate candidates |
| **Mass Mailing** | Campaign Management | ✅ Production | Create and manage campaigns |
| | A/B Testing | ✅ Production | Split testing with statistics |
| | Advanced Segmentation | ✅ Production | Rule-based filtering |
| | Campaign Automation | ✅ Production | Trigger-based workflows |
| | Vendor Management | ✅ Production | Vendor portal and scoring |
| | Email Service Integration | ✅ Production | SendGrid and SMTP support |
| | Response Tracking | ✅ Production | Open, click, and response tracking |
| **Search & Analytics** | Semantic Search | ✅ Production | AI-powered similarity search |
| | Keyword Generator | ✅ Production | Boolean search query creation |
| | Enhanced Search | ✅ Production | Multi-dimensional filtering |
| | Gap Analysis | ✅ Production | Education/career gap detection |
| | Performance Analytics | ✅ Production | Comprehensive metrics |
| | Data Management | ✅ Production | Advanced data cleanup tools |
| **Infrastructure** | GCP Deployment | ✅ Production | Multi-service cloud architecture |
| | Netlify Frontend | ✅ Production | Automatic deployments |
| | Milvus Database | ✅ Production | Vector database integration |
| | Service Management | ✅ Production | Systemd service management |
| | Load Balancing | ✅ Production | Multiple backend services |

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Milvus Documentation](https://milvus.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Netlify Documentation](https://docs.netlify.com/)
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎯 Quick Start Commands

### Backend Services
```bash
# Start modular backend (recommended)
cd backend
python3 -m main_new

# Start Gmail agents (automated email processing)
# Set environment variables first:
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="your-app-password"
export OPENAI_API_KEY="your-openai-key"
export MILVUS_HOST="34.135.232.156"
export MILVUS_PORT="19530"

# Start general email agent
nohup python3 -m backend.services.gmail_agent > gmail_agent.log 2>&1 &

# Start job description agent
nohup python3 -m backend.services.gmail_job_agent > gmail_job_agent.log 2>&1 &
```

### Frontend
```bash
# Start frontend-v3 (latest)
cd frontend-v3 && npm run dev

# Or frontend-v2
cd frontend-v2 && npm run dev
```

### Deployment
```bash
# Deploy to production
./deploy_production_gcp.sh
```

## 🎯 **Platform Summary**

Recruiter.AI is a **comprehensive, enterprise-grade recruitment platform** that provides:

### **📊 Complete Feature Coverage**
- **8 Backend Services** - Specialized microservices for different functionalities
- **23 Frontend Pages** - Complete user interface for all features
- **50+ Components** - Modular, reusable React components
- **7 Documentation Files** - Comprehensive guides and references

### **🏗️ Enterprise Architecture**
- **Multi-Service Backend** - Scalable microservices architecture
- **Production-Ready Frontend** - Modern React with TypeScript
- **Cloud Infrastructure** - GCP deployment with automatic scaling
- **Vector Database** - Milvus for AI-powered semantic search
- **Email Integration** - SendGrid and SMTP for mass communications

### **🤖 AI-Powered Features**
- **GPT-4 Integration** - Advanced AI for resume parsing and job generation
- **Semantic Search** - AI-powered candidate matching
- **Intelligent Scoring** - Automated candidate evaluation
- **Gap Analysis** - AI-driven career and education gap detection
- **Smart Segmentation** - AI-enhanced recipient targeting

### **📈 Business Value**
- **Complete Recruitment Workflow** - From job posting to candidate placement
- **Marketing Automation** - Email campaigns with A/B testing
- **CRM Integration** - Full candidate relationship management
- **Analytics & Reporting** - Comprehensive performance metrics
- **Compliance Ready** - GDPR compliance and audit logging

**🚀 Your complete, enterprise-grade recruitment platform is ready for production use!**