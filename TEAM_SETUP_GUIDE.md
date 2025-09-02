# 🚀 Team Setup Guide: Local Frontend + Cloud Backend

This guide will help your teammates clone the repository and set up the frontend locally while connecting to your cloud backend. This setup gives you the best of both worlds: fast local development with production data.

## 📋 Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** (recommended) or your preferred editor
- **Chrome DevTools** or similar for debugging

## 🚀 Quick Start (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Recruiter.AI.git
cd Recruiter.AI
```

### 2. Frontend Setup
```bash
cd frontend-v2
npm install
npm run dev
```

### 3. Access Your App
- **Frontend**: http://localhost:5173 (running locally)
- **Backend**: http://35.223.26.176:8804 (cloud backend)
- **Production Frontend**: https://playful-biscuit-e5d6e1-recruiter-ai.netlify.app

That's it! 🎉 Your frontend is now running locally and connected to the cloud backend.

## 🔧 Detailed Setup

### Frontend Dependencies Installation
```bash
cd frontend-v2
npm install
```

**Note**: The first `npm install` might take a few minutes as it downloads all dependencies.

### Environment Configuration
The frontend automatically detects your environment and connects to the appropriate backend:

- **Local Development** (localhost:5173) → **Cloud Backend** (35.223.26.176:8804)
- **Production** (Netlify) → **Cloud Backend** (via Netlify proxy)

No manual configuration needed! The app automatically detects if you're running locally and connects to the cloud backend.

### Start Development Server
```bash
npm run dev
```

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

## 🌐 How the Connection Works

### Smart Environment Detection
The frontend automatically detects your environment:

```typescript
// From frontend-v2/src/config/environment.ts
isDevelopment: () => {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '5173' || // Vite dev server
    // ... other dev indicators
  );
}
```

### API Routing
- **Local Development**: Direct connection to cloud backend
- **Production**: Uses Netlify proxy for security

```typescript
getApiBaseUrl: () => {
  if (ENV.isDevelopment()) {
    // Development: use cloud backend directly
    return 'http://35.223.26.176:8804';
  } else {
    // Production: use relative URLs for Netlify proxy
    return '';
  }
}
```

## 🧪 Testing Your Setup

### 1. Check Frontend is Running
- Open http://localhost:5173
- You should see the Recruiter.AI dashboard

### 2. Verify Backend Connection
- Open browser DevTools (F12)
- Check Console for environment info:
  ```
  🚀 Environment Configuration: {
    hostname: "localhost",
    port: "5173",
    isDevelopment: true,
    apiBaseUrl: "http://35.223.26.176:8804"
  }
  ```

### 3. Test API Calls
- Navigate to any page that makes API calls (e.g., Jobs, Candidates)
- Check Network tab in DevTools
- API calls should go to `35.223.26.176:8804`

## 🔍 Troubleshooting

### Common Issues & Solutions

#### 1. Frontend Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### 2. Backend Connection Issues
- Check if cloud backend is running:
  ```bash
  curl http://35.223.26.176:8804/health
  ```
- If backend is down, contact the team lead

#### 3. Port Already in Use
```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9
npm run dev
```

#### 4. Environment Detection Issues
Check the console for environment info:
```typescript
console.log('🚀 Environment Configuration:', ENV.getInfo());
```

### Debug Mode
Enable detailed logging in browser console:
```typescript
// All API calls are logged with full details
console.log('🌐 API Configuration:', {
  environment: 'Development',
  baseURL: 'http://35.223.26.176:8804'
});
```

## 🚀 Development Workflow

### 1. Make Changes
- Edit files in `frontend-v2/src/`
- Changes automatically reload in browser

### 2. Test Locally
- Frontend runs on localhost:5173
- Connected to production backend
- Real data, fast development

### 3. Commit & Push
```bash
git add .
git commit -m "Your feature description"
git push origin main
```

### 4. Automatic Deployment
- Changes automatically deploy to Netlify
- Production frontend updates in ~2 minutes

## 📁 Project Structure for Frontend Development

```
frontend-v2/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   │   ├── KeywordGeneratorPage.tsx    # Keyword generator
│   │   ├── EnhancedSearchPage.tsx      # Enhanced search
│   │   ├── JobsPage.tsx               # Job management
│   │   ├── CandidatesPage.tsx         # Candidate listing
│   │   └── ResumeUploadPage.tsx       # Resume upload
│   ├── services/           # API services
│   │   ├── api/
│   │   │   ├── config.ts   # API configuration
│   │   │   ├── jobs.ts     # Job API calls
│   │   │   ├── candidates.ts # Candidate API calls
│   │   │   └── auth.ts     # Authentication
│   │   └── index.ts        # Service exports
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── config/             # Configuration files
│       └── environment.ts  # Environment detection
├── public/                 # Static assets
├── package.json            # Dependencies
└── vite.config.ts         # Vite configuration
```

## 🎯 Key Development Files

### Environment Configuration
- **File**: `src/config/environment.ts`
- **Purpose**: Automatically detects dev/prod and sets API URLs
- **Key Function**: `ENV.getApiBaseUrl()`

### API Configuration
- **File**: `src/services/api/config.ts`
- **Purpose**: Sets up axios with correct base URL
- **Features**: Automatic error logging, timeout handling

### Main Pages
- **Jobs**: `src/pages/JobsPage.tsx`
- **Candidates**: `src/pages/CandidatesPage.tsx`
- **Search**: `src/pages/EnhancedSearchPage.tsx`
- **Keyword Generator**: `src/pages/KeywordGeneratorPage.tsx`

## 🔐 Security Notes

### Development Mode
- Frontend connects directly to cloud backend
- No authentication required for development
- All API calls go to `35.223.26.176:8804`

### Production Mode
- Frontend uses Netlify proxy
- API calls go through secure proxy
- Backend protected by firewall rules

## 📱 Available Features

### ✅ Working Features
- **Job Management**: Create, edit, publish jobs
- **Resume Processing**: Upload and parse resumes
- **Candidate Search**: Find candidates by skills
- **Keyword Generator**: Create search queries
- **Enhanced Search**: Multi-dimensional filtering

### 🔄 In Development
- Candidate-job matching
- AI recruitment assistant
- Analytics dashboard

## 🆘 Getting Help

### Team Resources
- **Backend Issues**: Check if cloud backend is running
- **Frontend Issues**: Check browser console and network tab
- **Deployment Issues**: Check Netlify deployment logs

### Useful Commands
```bash
# Check backend status
curl http://35.223.26.176:8804/health

# View backend logs (if you have GCP access)
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a --command="sudo journalctl -u recruiter-ai.service -f"

# Clear frontend cache
rm -rf node_modules package-lock.json
npm install
```

### Debug Information
The frontend automatically logs helpful debug info:
- Environment detection
- API configuration
- Network requests
- Error details

## 🎉 You're All Set!

Your local development environment is now:
- ✅ Connected to production backend
- ✅ Using real data (16 resumes, 4 jobs)
- ✅ Fast local development
- ✅ Automatic hot reloading
- ✅ Production-ready features

Start building amazing features! 🚀

---

**Need help?** Check the browser console for debug info or ask the team lead about backend connectivity.

## 🔧 Backend Development Options

If your teammates want to make **backend changes** (Python, API endpoints, business logic), they have several options:

### 🚀 **Option 1: Local Backend + Local Frontend (Recommended for Backend Devs)**

This gives you full control over both frontend and backend:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/Recruiter.AI.git
cd Recruiter.AI

# 2. Set up local backend
cd backend-full
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# 3. Set up local frontend
cd ../frontend-v2
npm install

# 4. Start local backend (in one terminal)
cd ../backend-full
uvicorn src.main:app --reload --port 8804

# 5. Start local frontend (in another terminal)
cd ../frontend-v2
npm run dev
```

**Result**: 
- Frontend: http://localhost:5173
- Backend: http://localhost:8804
- **Full local development environment**

### 🌐 **Option 2: Local Backend + Cloud Frontend**

Develop backend locally, test with production frontend:

```bash
# 1. Set up local backend only
cd backend-full
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Start local backend
uvicorn src.main:app --reload --port 8804

# 3. Test with production frontend
# Open: https://playful-biscuit-e5d6e1-recruiter-ai.netlify.app
# But change API calls to point to localhost:8804
```

**Result**: 
- Backend: http://localhost:8804 (local)
- Frontend: Production (Netlify)
- **Note**: You'll need to modify frontend environment config temporarily

### ☁️ **Option 3: Cloud Backend Development (Advanced)**

Make changes directly on the cloud backend:

```bash
# 1. Get GCP access from team lead
gcloud auth login
gcloud config set project your-project-id

# 2. SSH into the cloud VM
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a

# 3. Edit files directly on the server
sudo nano /opt/recruiter-ai/src/main.py

# 4. Restart the service
sudo systemctl restart recruiter-ai.service
```

**Result**: 
- Direct cloud development
- **Warning**: More complex, riskier for development

## 🔄 **Recommended Backend Development Workflow**

### **For Most Backend Changes (Option 1)**

1. **Local Development**: Use local backend + local frontend
2. **Test Changes**: Make API calls to localhost:8804
3. **Commit & Push**: Push changes to GitHub
4. **Deploy**: Changes automatically deploy to cloud via CI/CD

### **Backend Environment Setup**

Create `.env` file in `backend-full/`:

```env
# OpenAI Configuration (required)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-1106-preview

# Milvus Configuration (local)
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Performance Tuning
CACHE_ENABLED=true
SUPPRESS_HF_WARNINGS=true
```

### **Start Local Milvus**

```bash
# Start Milvus and dependencies
docker-compose up -d

# Check if running
docker ps
```

## 🚨 **Important Backend Development Notes**

### **API Key Requirements**
- **OpenAI API Key**: Required for resume parsing and job generation
- **Cost**: Each resume parse costs ~$0.01-0.03
- **Rate Limits**: Be mindful of API usage during development

### **Data Considerations**
- **Local Milvus**: Starts empty (no resumes/jobs)
- **Cloud Backend**: Has 16 resumes and 4 jobs
- **Development**: You can upload test resumes locally

### **Testing Backend Changes**

1. **API Testing**: Use FastAPI docs at http://localhost:8804/docs
2. **Frontend Testing**: Connect local frontend to local backend
3. **Integration Testing**: Test full flow locally before deploying

### **Deployment Process**

```bash
# 1. Test locally
# 2. Commit changes
git add .
git commit -m "Backend feature: description"
git push origin main

# 3. Changes automatically deploy to cloud
# 4. Test production deployment
```

## 🔍 **Backend Development Troubleshooting**

### **Common Issues**

#### 1. **Milvus Connection Issues**
```bash
# Check if Milvus is running
docker ps | grep milvus

# Restart Milvus
docker-compose down
docker-compose up -d
```

#### 2. **OpenAI API Errors**
- Verify API key in `.env`
- Check API credits
- Handle rate limits

#### 3. **Import Path Issues**
```bash
# Always run from backend-full directory
cd backend-full
uvicorn src.main:app --reload --port 8804
```

#### 4. **Port Conflicts**
```bash
# Check if port 8804 is in use
lsof -ti:8804

# Kill process if needed
lsof -ti:8804 | xargs kill -9
```

## 📊 **Development vs Production Data**

| Aspect | Local Development | Cloud Production |
|--------|------------------|------------------|
| **Backend** | localhost:8804 | 35.223.26.176:8804 |
| **Frontend** | localhost:5173 | Netlify |
| **Database** | Empty local Milvus | 16 resumes, 4 jobs |
| **API Keys** | Your OpenAI key | Team OpenAI key |
| **Performance** | Fast local | Network latency |

## 🎯 **When to Use Each Option**

### **Use Option 1 (Local Both) When:**
- ✅ Making backend API changes
- ✅ Adding new endpoints
- ✅ Modifying business logic
- ✅ Testing full integration
- ✅ Working on backend features

### **Use Option 2 (Local Backend + Cloud Frontend) When:**
- ✅ Testing backend changes with production UI
- ✅ Quick backend fixes
- ✅ Don't want to set up local frontend

### **Use Option 3 (Cloud Development) When:**
- ✅ Emergency hotfixes
- ✅ Simple configuration changes
- ✅ You have GCP access and experience

## 🚀 **Quick Backend Development Start**

For teammates who want to jump into backend development:

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/Recruiter.AI.git
cd Recruiter.AI

# 2. Backend setup (5 minutes)
cd backend-full
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Start services
docker-compose up -d  # Start Milvus
uvicorn src.main:app --reload --port 8804  # Start backend

# 4. Frontend setup (2 minutes)
cd ../frontend-v2
npm install
npm run dev

# 5. Test your setup
# Backend: http://localhost:8804/docs
# Frontend: http://localhost:5173
```

## 🔐 **Security for Backend Development**

### **Local Development**
- ✅ No external access
- ✅ Your OpenAI API key
- ✅ Local database

### **Cloud Development**
- ⚠️ Requires GCP access
- ⚠️ Team API keys
- ⚠️ Production data

### **Best Practice**
- Develop locally first
- Test thoroughly
- Deploy via CI/CD pipeline
- Never commit API keys

---

**Backend developers**: Start with Option 1 for the best development experience!
**Frontend-only developers**: Stick with the original setup guide above.
