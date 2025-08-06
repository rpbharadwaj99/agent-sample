# Agent Sample UI

A modern, responsive chat interface built with Lit elements and CopilotKit, designed to work with Ollama backend through Agno.

## Features

- 🎨 Modern, responsive chat UI with gradient styling
- ⚡ Fast Lit-based web components  
- 🔗 **AG-UI Protocol** - Standardized agent communication
- 🤖 **Agno Agent Framework** - Advanced AI agent capabilities
- 🦙 **Ollama Integration** - Local LLM processing via Agno
- 📡 **Server-Sent Events** - Real-time streaming responses
- 📱 Mobile-responsive design
- ⌨️ Enter key to send messages
- 💬 Live typing indicators with streaming
- 🎯 Empty state handling

## Architecture

```
Frontend (Lit + @ag-ui/client) 
    ↓ AG-UI Protocol (SSE streaming)
Backend (FastAPI + Agno Agent)
    ↓ Agent Framework 
Agno Agent (with memory, tools, etc.)
    ↓ Model Provider
Ollama (llama3.2 model)
```

This demonstrates how **ag-ui** can interface with **agent frameworks** like Agno (and by extension LangGraph) to create production-ready AI applications.

## Quick Start

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Set Up Backend (Agno + Ollama)

#### Automated Setup (Recommended)
```bash
python setup.py
```

#### Manual Setup
```bash
# Install Python dependencies
pip install agno-ai

# Install and start Ollama
# Visit https://ollama.ai for installation instructions
ollama serve

# Pull the model
ollama pull llama3.2
```

### 3. Start Development

#### Option A: Automated Startup (Recommended)
```bash
# Start both backend and frontend automatically
./start.sh
```

#### Option B: Manual Startup

##### Terminal 1 - Backend (Python with venv)
```bash
# Create and activate virtual environment (first time only)
python3 -m venv venv
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the Agno backend
python backend.py
```

##### Terminal 2 - Frontend (Node.js)
```bash
# Install dependencies (first time only)
npm install

# Start the frontend development server
npm run dev
```

### 4. Test the Setup

#### Health Checks
```bash
# Test backend health
curl http://localhost:8000/health

# Test backend root endpoint
curl http://localhost:8000/

# Test frontend is running
curl -I http://localhost:3000
```

#### AG-UI Protocol Test
```bash
# Test AG-UI protocol implementation
python test-agui.py

# Manual AG-UI streaming test
curl -X POST http://localhost:8000/agno-agent \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "threadId": "test_123",
    "runId": "run_456", 
    "messages": [
      {"role": "user", "content": "Hello, test the streaming!"}
    ],
    "state": {},
    "tools": [],
    "context": []
  }'
```

### 5. Use the Application
1. Open http://localhost:3000 in your browser
2. The endpoint should be pre-configured to `http://localhost:8000/agno-agent`
3. Start chatting with your AI assistant!

### 6. Troubleshooting

#### Common Issues
- **Port 8000 already in use**: Kill existing processes with `pkill -f "python backend.py"`
- **Port 3000 already in use**: The frontend will automatically find another port
- **Backend connection issues**: Make sure Ollama is running (`ollama serve`)
- **Model not found**: Pull the model with `ollama pull llama3.2`
- **AG-UI client errors**: Fixed by using simple HTTP client instead of complex AG-UI protocol

#### Frontend Components
- **simple-chat**: Direct HTTP-based chat component (current, working)
- **copilot-chat**: AG-UI protocol component (complex, for advanced use cases)

## Project Structure

```
agent-sample/
├── src/
│   └── copilot-chat.ts    # Main Lit component
├── index.html             # Test page
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Build config
├── TODOS.md              # Project tasks
├── BACKEND.md            # Backend setup guide
└── README.md             # This file
```

## Development Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run typecheck  # Check TypeScript types
```

## Component Usage

```html
<copilot-chat 
  endpoint="http://localhost:8000/agno-agent"
  api-key="optional-key">
</copilot-chat>
```

### Properties
- `endpoint`: Backend API URL
- `api-key`: Optional API key for authentication

## Customization

The component is built with Lit and uses CSS custom properties for easy theming. Modify the styles in `src/copilot-chat.ts` to match your design system.

## Backend Integration

This project is designed to work with:
- **Agno** (recommended): Advanced agent framework with built-in CopilotKit support
- **Direct Ollama**: Simple REST API integration
- **Custom backends**: Any backend implementing the AG-UI protocol

See `BACKEND.md` for detailed setup instructions.

## Troubleshooting

### Common Issues

1. **CORS errors**: Make sure your backend allows requests from your frontend origin
2. **Connection refused**: Verify your backend is running on the correct port
3. **TypeScript errors**: Run `npm run typecheck` to identify issues

### Backend Testing
```bash
# Test Ollama directly
curl http://localhost:11434/api/generate \
  -d '{"model": "llama3.2", "prompt": "Hello!", "stream": false}'

# Test your backend
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
```

## License

MIT