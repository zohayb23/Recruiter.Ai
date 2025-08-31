#!/bin/bash

# Recruiter.AI Local Development Setup Script
# This script automates the setup process for Mac/Linux users

set -e  # Exit on any error

echo "🚀 Welcome to Recruiter.AI Setup!"
echo "This script will help you set up the project locally."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher first:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher first."
    exit 1
fi

echo "✅ Prerequisites check passed!"
echo ""

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if containers are running
if ! docker ps | grep -q "milvus-standalone"; then
    echo "❌ Docker services failed to start. Please check Docker Desktop is running."
    exit 1
fi

echo "✅ Docker services are running!"
echo ""

# Setup backend
echo "🐍 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install spaCy model
echo "Installing spaCy language model..."
python -m spacy download en_core_web_sm

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file for backend..."
    cat > .env << EOF
# OpenAI Configuration (required for resume parsing and job description generation)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-1106-preview

# Milvus Configuration
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Optional Performance Tuning
CACHE_ENABLED=true
SUPPRESS_HF_WARNINGS=true
EOF
    echo "⚠️  Please update backend/.env with your OpenAI API key!"
fi

cd ..

# Setup frontend
echo "⚛️  Setting up frontend..."
cd frontend-v2

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file for frontend..."
    cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8804
EOF
fi

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your OpenAI API key"
echo "2. Start the backend server:"
echo "   cd backend && source venv/bin/activate && uvicorn src.main:app --reload --port 8804"
echo "3. Start the frontend server:"
echo "   cd frontend-v2 && npm run dev"
echo ""
echo "🌐 Your application will be available at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8804"
echo "   Milvus Attu: http://localhost:8000"
echo ""
echo "📖 For detailed instructions, see SETUP_GUIDE.md"
