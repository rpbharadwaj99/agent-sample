#!/bin/bash

# Agent Sample UI - Startup Script
echo "🚀 Agent Sample UI Startup Script"
echo "================================="

# Kill any existing processes
echo "🔧 Cleaning up existing processes..."
pkill -f "python backend.py" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Install Python dependencies if needed
if [ ! -f "venv/lib/python*/site-packages/agno/__init__.py" ]; then
    echo "📦 Installing Python dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start backend
echo "🐍 Starting Python backend..."
source venv/bin/activate
python backend.py &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Test backend
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running at http://localhost:8000"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "⚡ Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 3

echo "🎉 Setup complete!"
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   Health:   http://localhost:8000/health"
echo ""
echo "📝 To stop the servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🔧 Manual test command:"
echo "   curl -X POST http://localhost:8000/agno-agent -H 'Content-Type: application/json' -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}'"

# Keep script running until interrupted
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
echo "Press Ctrl+C to stop all servers..."
wait