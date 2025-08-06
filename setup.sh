#!/bin/bash

# Agent Sample UI - Setup Script
# Run this after cloning the repository

set -e  # Exit on any error

echo "🚀 Agent Sample UI - Setup"
echo "=========================="

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo "✅ Node.js: $NODE_VERSION"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ from https://python.org/"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo "✅ Python: $PYTHON_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js with npm."
    exit 1
fi
NPM_VERSION=$(npm --version)
echo "✅ npm: $NPM_VERSION"

echo ""

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create Python virtual environment
echo "🐍 Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt

# Check if Ollama is installed
echo ""
echo "🦙 Checking Ollama installation..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is installed"
    
    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama is running"
        
        # Check if llama3.2 model is available
        if ollama list | grep -q "llama3.2"; then
            echo "✅ llama3.2 model is available"
        else
            echo "⚠️  llama3.2 model not found"
            echo "📥 Pulling llama3.2 model (this may take a few minutes)..."
            ollama pull llama3.2
            echo "✅ llama3.2 model downloaded"
        fi
    else
        echo "⚠️  Ollama is not running"
        echo "🔧 Please start Ollama in another terminal:"
        echo "   ollama serve"
        echo ""
        echo "📥 Then pull the required model:"
        echo "   ollama pull llama3.2"
    fi
else
    echo "❌ Ollama is not installed"
    echo "📥 Please install Ollama from: https://ollama.ai"
    echo "🔧 After installation, run:"
    echo "   ollama serve"
    echo "   ollama pull llama3.2"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 What was installed:"
echo "   ✅ Node.js dependencies (lit, @ag-ui/client, vite, etc.)"
echo "   ✅ Python virtual environment (venv/)"
echo "   ✅ Python dependencies (agno, fastapi, uvicorn, etc.)"
echo ""
echo "🚀 Next steps:"
echo "   1. Make sure Ollama is running: ollama serve"
echo "   2. Make sure llama3.2 model is available: ollama pull llama3.2"
echo "   3. Start the project: ./start.sh"
echo "   4. Open http://localhost:3000"
echo ""
echo "🔧 Useful commands:"
echo "   ./start.sh           # Start both frontend and backend"
echo "   ./check.sh           # Check if everything is running"
echo "   python test-agui.py  # Test the AG-UI protocol"
echo ""