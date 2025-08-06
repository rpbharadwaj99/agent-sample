#!/usr/bin/env python3
"""
Setup script for Agent Sample UI backend
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout.strip():
            print(f"Output: {result.stdout.strip()}")
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        print(f"Error: {e.stderr.strip()}")
        return False
    return True

def check_ollama():
    """Check if Ollama is running"""
    print("\n🦙 Checking Ollama...")
    try:
        result = subprocess.run("curl -s http://localhost:11434/api/tags", shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Ollama is running")
            return True
        else:
            print("❌ Ollama is not running")
            print("Please start Ollama with: ollama serve")
            return False
    except Exception as e:
        print(f"❌ Error checking Ollama: {e}")
        return False

def main():
    print("🚀 Setting up Agent Sample UI Backend")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} detected")
    
    # Install requirements
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        sys.exit(1)
    
    # Check Ollama
    if not check_ollama():
        print("\n📝 Next steps:")
        print("1. Install Ollama from https://ollama.ai")
        print("2. Start Ollama: ollama serve")
        print("3. Pull a model: ollama pull llama3.2")
        print("4. Run the backend: python backend.py")
        sys.exit(1)
    
    # Check if llama3.2 model is available
    print("\n🤖 Checking for llama3.2 model...")
    try:
        result = subprocess.run("ollama list | grep llama3.2", shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ llama3.2 model found")
        else:
            print("⚠️  llama3.2 model not found")
            print("Pulling llama3.2 model...")
            if not run_command("ollama pull llama3.2", "Pulling llama3.2 model"):
                print("❌ Failed to pull model. You can try manually with: ollama pull llama3.2")
    except Exception as e:
        print(f"❌ Error checking models: {e}")
    
    print("\n🎉 Backend setup complete!")
    print("\n📝 Next steps:")
    print("1. Start the backend: python backend.py")
    print("2. In another terminal, start the frontend: npm run dev")
    print("3. Open http://localhost:3000 in your browser")

if __name__ == "__main__":
    main()