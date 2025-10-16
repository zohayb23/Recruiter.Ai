#!/bin/bash

echo "🚀 Setting up Milvus port forwarding for correct data access"
echo "============================================================="

echo "📋 Current situation:"
echo "   - Your Milvus Attu shows: 1 job description, 7 resumes"
echo "   - Backend shows: 7 job descriptions, 0 resumes"
echo "   - Need to connect to the same Milvus instance as Attu"

echo ""
echo "🔧 Setting up correct port forwarding..."

# Kill any existing port forwarding
echo "🔄 Stopping any existing port forwarding..."
pkill -f "kubectl.*port-forward"

# Set up port forwarding for the Milvus service (not Attu web interface)
echo "🚀 Starting port forwarding for Milvus service..."
echo "   Command: kubectl -n milvus port-forward svc/my-milvus 19530:19530"
echo "   This forwards the Milvus service (port 19530) to localhost:19530"

# Start port forwarding in background
kubectl -n milvus port-forward svc/my-milvus 19530:19530 &
PORT_FORWARD_PID=$!

echo "✅ Port forwarding started with PID: $PORT_FORWARD_PID"
echo "📡 Milvus service is now accessible at localhost:19530"

echo ""
echo "🔄 Now restart the backend to connect to localhost:19530"
echo "   cd /Users/fayzanbhatti/Recruiter.Ai"
echo "   pkill -f 'python3 complete_backend_with_milvus.py'"
echo "   OPENAI_API_KEY='your-key' python3 complete_backend_with_milvus.py"

echo ""
echo "✅ Then test the connection:"
echo "   python3 connect_to_correct_milvus.py"

echo ""
echo "🛑 To stop port forwarding later:"
echo "   kill $PORT_FORWARD_PID"
