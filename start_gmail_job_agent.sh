#!/bin/bash

# Gmail Job Agent Startup Script for Recruiter.AI
# Monitors Gmail for job description emails and stores them in Milvus

echo "=========================================="
echo "💼 GMAIL JOB DESCRIPTION AGENT"
echo "=========================================="
echo ""

# Check environment variables
if [ -z "$GMAIL_USER" ]; then
    echo "❌ GMAIL_USER not set"
    echo "💡 Run: export GMAIL_USER='your-email@gmail.com'"
    exit 1
fi

if [ -z "$GMAIL_APP_PASSWORD" ]; then
    echo "❌ GMAIL_APP_PASSWORD not set"
    echo "💡 Generate at: https://myaccount.google.com/apppasswords"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not set (required for job extraction)"
    echo "💡 Run: export OPENAI_API_KEY='your-key'"
    exit 1
fi

echo "✅ Gmail User: $GMAIL_USER"
echo "✅ OpenAI API Key: ${OPENAI_API_KEY:0:7}..."
echo ""

echo "=========================================="
echo "🚀 Starting Gmail Job Agent..."
echo "=========================================="
echo ""
echo "💡 The agent will:"
echo "   - Monitor Gmail for job description emails"
echo "   - Extract structured job data with AI"
echo "   - Store in Milvus job_descriptions collection"
echo "   - Match exact schema: title, company, skills, etc."
echo ""
echo "🛑 Press Ctrl+C to stop"
echo ""

# Change to project directory
cd "$(dirname "$0")"

# Run the agent
python3 -m backend.services.gmail_job_agent

