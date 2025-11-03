#!/bin/bash

# Gmail Agent Startup Script for Recruiter.AI
# This script starts the automated Gmail monitoring agent

echo "=========================================="
echo "🤖 GMAIL AGENT FOR RECRUITER.AI"
echo "=========================================="
echo ""

# Check if environment variables are set
if [ -z "$GMAIL_USER" ]; then
    echo "❌ GMAIL_USER not set"
    echo "💡 Run: export GMAIL_USER='your-email@gmail.com'"
    exit 1
fi

if [ -z "$GMAIL_APP_PASSWORD" ]; then
    echo "❌ GMAIL_APP_PASSWORD not set"
    echo "💡 Generate an App Password at: https://myaccount.google.com/apppasswords"
    echo "💡 Then run: export GMAIL_APP_PASSWORD='your-16-char-password'"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set"
    echo "💡 Agent will use basic parsing instead of AI"
    echo "💡 For better results, run: export OPENAI_API_KEY='your-key'"
    echo ""
fi

echo "✅ Gmail User: $GMAIL_USER"
echo "✅ Gmail App Password: ${GMAIL_APP_PASSWORD:0:4}************"
echo "✅ OpenAI API Key: ${OPENAI_API_KEY:0:7}..." 
echo ""

# Check if Milvus is running
echo "🔍 Checking Milvus connection..."
if ! docker ps | grep -q milvus; then
    echo "⚠️  Warning: Milvus doesn't appear to be running"
    echo "💡 Start Milvus with: docker-compose up -d milvus"
    echo ""
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
pip list | grep -q sentence-transformers || {
    echo "📥 Installing sentence-transformers..."
    pip install sentence-transformers
}

echo ""
echo "=========================================="
echo "🚀 Starting Gmail Agent..."
echo "=========================================="
echo ""
echo "💡 The agent will:"
echo "   - Check for new emails every 60 seconds"
echo "   - Parse emails with AI"
echo "   - Store them in Milvus database"
echo "   - Log all activity"
echo ""
echo "🛑 Press Ctrl+C to stop"
echo ""

# Change to project directory
cd "$(dirname "$0")"

# Run the agent
python3 -m backend.services.gmail_agent

