@echo off
setlocal enabledelayedexpansion

echo 🚀 Welcome to Recruiter.AI Setup!
echo This script will help you set up the project locally on Windows.
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first:
    echo    https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher first:
    echo    https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.9 or higher first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed!
echo.

REM Start Docker services
echo 🐳 Starting Docker services...
docker-compose up -d

echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if containers are running
docker ps | findstr "milvus-standalone" >nul
if errorlevel 1 (
    echo ❌ Docker services failed to start. Please check Docker Desktop is running.
    pause
    exit /b 1
)

echo ✅ Docker services are running!
echo.

REM Setup backend
echo 🐍 Setting up backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment. Trying alternative method...
    call venv\Scripts\Activate.ps1
    if errorlevel 1 (
        echo ❌ Virtual environment activation failed. Please run manually:
        echo    venv\Scripts\activate.bat
        pause
        exit /b 1
    )
)

REM Install dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Install spaCy model
echo Installing spaCy language model...
python -m spacy download en_core_web_sm

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file for backend...
    (
        echo # OpenAI Configuration ^(required for resume parsing and job description generation^)
        echo OPENAI_API_KEY=your_openai_api_key_here
        echo OPENAI_MODEL=gpt-4-1106-preview
        echo.
        echo # Milvus Configuration
        echo MILVUS_HOST=localhost
        echo MILVUS_PORT=19530
        echo.
        echo # Optional Performance Tuning
        echo CACHE_ENABLED=true
        echo SUPPRESS_HF_WARNINGS=true
    ) > .env
    echo ⚠️  Please update backend\.env with your OpenAI API key!
)

cd ..

REM Setup frontend
echo ⚛️ Setting up frontend...
cd frontend-v2

REM Install dependencies
echo Installing Node.js dependencies...
npm install

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file for frontend...
    echo VITE_API_BASE_URL=http://localhost:8804 > .env
)

cd ..

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Update backend\.env with your OpenAI API key
echo 2. Start the backend server:
echo    cd backend ^&^& venv\Scripts\activate.bat ^&^& uvicorn src.main:app --reload --port 8804
echo 3. Start the frontend server:
echo    cd frontend-v2 ^&^& npm run dev
echo.
echo 🌐 Your application will be available at:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8804
echo    Milvus Attu: http://localhost:8000
echo.
echo 📖 For detailed instructions, see SETUP_GUIDE.md
echo.
pause
