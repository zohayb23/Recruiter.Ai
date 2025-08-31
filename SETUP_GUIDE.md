# Recruiter.AI Local Development Setup Guide

This guide will help you set up the Recruiter.AI project locally on your machine. Follow these steps carefully to get everything running.

## 📋 Prerequisites

### For Both Mac and Windows:
- **Git** (latest version)
- **Docker Desktop** (latest version)
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **OpenAI API Key** (required for AI features)

### Mac-Specific:
- **Homebrew** (recommended for easy installation)

### Windows-Specific:
- **WSL2** (Windows Subsystem for Linux 2) - recommended
- **Git Bash** or **PowerShell**

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd Recruiter.Ai

# Verify you're in the correct directory
ls -la
```

### Step 2: Install Docker Desktop

#### Mac:
1. Download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Install and start Docker Desktop
3. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

#### Windows:
1. Download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Install Docker Desktop (make sure WSL2 is enabled)
3. Start Docker Desktop
4. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

### Step 3: Start Milvus Database Services

**Important**: Run these commands in your **regular terminal/command prompt**, not in Docker Desktop's terminal.

```bash
# Start Milvus and related services
docker-compose up -d

# Verify all containers are running
docker ps

# You should see these containers running:
# - milvus-etcd
# - milvus-minio
# - milvus-standalone
# - milvus-attu
```

**Note**: Make sure Docker Desktop is running in the background before executing these commands.

**Note:** The first time you run this, it may take several minutes to download the Docker images.

### Step 4: Set Up Backend

#### Install Python Dependencies

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows (Command Prompt):
venv\Scripts\activate.bat
# On Windows (PowerShell):
# .\venv\Scripts\Activate.ps1
# Note: PowerShell may require: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt

# Install spaCy language model
python -m spacy download en_core_web_sm
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# On Mac/Linux:
touch backend/.env

# On Windows:
# echo. > backend\.env
```

Add the following content to `backend/.env`:

```env
# OpenAI Configuration (required for resume parsing and job description generation)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-1106-preview

# Milvus Configuration
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Optional Performance Tuning
CACHE_ENABLED=true
SUPPRESS_HF_WARNINGS=true
```

**Important:** Replace `your_openai_api_key_here` with your actual OpenAI API key.

#### Start Backend Server

```bash
# Make sure you're in the backend directory and virtual environment is activated
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate.bat

# Start the FastAPI server
uvicorn src.main:app --reload --port 8804
```

The backend API will be available at `http://localhost:8804`

### Step 5: Set Up Frontend

#### Install Node.js Dependencies

```bash
# Navigate to frontend directory
cd frontend-v2

# Install dependencies
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `frontend-v2` directory:

```bash
# On Mac/Linux:
touch frontend-v2/.env

# On Windows:
# echo. > frontend-v2\.env
```

Add the following content to `frontend-v2/.env`:

```env
VITE_API_BASE_URL=http://localhost:8804
```

#### Start Frontend Development Server

```bash
# Make sure you're in the frontend-v2 directory
cd frontend-v2

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🧪 Verify Your Setup

### Check All Services Are Running

1. **Docker Services**: `docker ps` should show 4 containers running
2. **Backend**: Visit `http://localhost:8804/docs` to see the API documentation
3. **Frontend**: Visit `http://localhost:5173` to see the application
4. **Milvus Attu**: Visit `http://localhost:8000` to access the Milvus web interface

### Test the Application

1. Open `http://localhost:5173` in your browser
2. Try uploading a resume
3. Check if the backend API responds at `http://localhost:8804/health`

## 🔧 Troubleshooting

### Common Issues

#### Docker Issues
```bash
# If containers fail to start
docker-compose down
docker system prune -f
docker-compose up -d

# Check container logs
docker logs milvus-standalone
docker logs milvus-etcd
docker logs milvus-minio
```

#### Backend Issues
```bash
# If Python dependencies fail to install
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# If spaCy model fails to download
python -m spacy download en_core_web_sm --force
```

#### Frontend Issues
```bash
# If npm install fails
rm -rf node_modules package-lock.json
npm install

# If port 5173 is in use
npm run dev -- --port 5174
```

#### Port Conflicts
If you get port conflicts, you can change the ports:

- **Backend**: Change port in `uvicorn src.main:app --reload --port 8805`
- **Frontend**: Change port in `npm run dev -- --port 5174`
- **Milvus Attu**: Change port in `docker-compose.yml` (line 58)

### Environment Variables Issues

Make sure your `.env` files are in the correct locations:
- `backend/.env` for backend configuration
- `frontend-v2/.env` for frontend configuration

### Windows-Specific Issues

#### PowerShell Execution Policy Error
If you get an error like "The term '.\venv\Scripts\activate' is not recognized":

**Solution 1: Use Command Prompt instead of PowerShell**
```cmd
# Use Command Prompt (cmd.exe) and run:
venv\Scripts\activate.bat
```

**Solution 2: Fix PowerShell execution policy**
```powershell
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then use:
.\venv\Scripts\Activate.ps1
```

#### Virtual Environment Activation Issues
- **Command Prompt**: Use `venv\Scripts\activate.bat`
- **PowerShell**: Use `.\venv\Scripts\Activate.ps1` (note the capital 'A')
- **Git Bash**: Use `source venv/Scripts/activate`

### OpenAI API Key Issues

1. Verify your API key is valid
2. Check your OpenAI account has sufficient credits
3. Ensure the API key is correctly set in `backend/.env`

## 📁 Project Structure

```
Recruiter.Ai/
├── backend/                    # Backend application
│   ├── src/
│   │   ├── main.py            # FastAPI application entry
│   │   ├── routers/           # API route handlers
│   │   └── services/          # Business logic
│   └── requirements.txt       # Python dependencies
├── frontend-v2/               # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   └── services/         # API services
│   └── package.json          # Node.js dependencies
├── docker-compose.yml         # Docker services config
└── uploads/                   # File uploads directory
```

## 🚀 Development Workflow

### Starting Development
```bash
# Terminal 1: Start Docker services
docker-compose up -d

# Terminal 2: Start backend
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate.bat
uvicorn src.main:app --reload --port 8804

# Terminal 3: Start frontend
cd frontend-v2
npm run dev
```

### Stopping Development
```bash
# Stop frontend: Ctrl+C in frontend terminal
# Stop backend: Ctrl+C in backend terminal
# Stop Docker services
docker-compose down
```

## 📞 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Look at the logs: `docker logs <container-name>`
3. Verify all services are running on the correct ports
4. Ensure your `.env` files are properly configured
5. Check that your OpenAI API key is valid and has sufficient credits

## 🔄 Updates

When pulling new changes from the repository:

```bash
# Pull latest changes
git pull origin main

# Update backend dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Update frontend dependencies
cd frontend-v2
npm install

# Restart services if needed
docker-compose down
docker-compose up -d
```

---

**Happy coding! 🎉**
