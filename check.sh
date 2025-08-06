#!/bin/bash

# Agent Sample UI - Status Check Script
echo "🔍 Agent Sample UI Status Check"
echo "==============================="

# Check backend
echo "🐍 Backend Status:"
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ Backend is running at http://localhost:8000"
    echo "   📋 Health check:"
    curl -s http://localhost:8000/health | python3 -m json.tool
else
    echo "   ❌ Backend is NOT running"
fi

echo ""

# Check frontend  
echo "⚡ Frontend Status:"
if curl -s -I http://localhost:3000 > /dev/null; then
    echo "   ✅ Frontend is running at http://localhost:3000"
else
    echo "   ❌ Frontend is NOT running"
fi

echo ""

# Test chat endpoint
echo "💬 Chat Endpoint Test:"
response=$(curl -s -X POST http://localhost:8000/agno-agent \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello, test message"}]}' \
  2>/dev/null)

if [ $? -eq 0 ] && [ -n "$response" ]; then
    echo "   ✅ Chat endpoint is working"
    echo "   📝 Response:"
    echo "$response" | python3 -m json.tool
else
    echo "   ❌ Chat endpoint is NOT working"
fi

echo ""
echo "🔗 Quick Links:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   Backend Health: http://localhost:8000/health"