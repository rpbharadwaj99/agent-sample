from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
from agno.agent import Agent
from agno.models.ollama import Ollama
import uvicorn
import json
import uuid
from datetime import datetime
import time

# Create Agno agent with Ollama
agent = Agent(
    model=Ollama(id="llama3.2"),
    description="AI assistant for chat application",
    markdown=True,
    memory=True
)

# FastAPI app
app = FastAPI(title="Agno Backend with AG-UI Protocol")

# Enable CORS with proper headers for SSE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for AG-UI protocol
class Message(BaseModel):
    role: str
    content: str
    id: Optional[str] = None

class RunAgentRequest(BaseModel):
    threadId: Optional[str] = None
    runId: Optional[str] = None  
    messages: List[Message]
    state: Optional[Dict[str, Any]] = None
    tools: Optional[List[Dict[str, Any]]] = None
    context: Optional[List[Dict[str, Any]]] = None
    forwardedProps: Optional[Dict[str, Any]] = None

@app.get("/")
async def root():
    return {"message": "Agno Backend with AG-UI Protocol is running"}

@app.post("/agno-agent")
async def ag_ui_endpoint(request: RunAgentRequest):
    """
    AG-UI Protocol compliant endpoint that streams events via Server-Sent Events
    """
    
    async def event_generator():
        try:
            # Generate IDs
            run_id = request.runId or str(uuid.uuid4())
            thread_id = request.threadId or str(uuid.uuid4())
            message_id = str(uuid.uuid4())
            
            print(f"🚀 Starting AG-UI run: {run_id}")
            
            # Emit RUN_STARTED event
            yield f"data: {json.dumps({
                'type': 'RUN_STARTED',
                'threadId': thread_id,
                'runId': run_id,
                'timestamp': int(time.time() * 1000)
            })}\n\n"
            
            # Get the latest user message
            if not request.messages:
                # Emit error event
                yield f"data: {json.dumps({
                    'type': 'RUN_ERROR',
                    'threadId': thread_id,
                    'runId': run_id,
                    'error': {'message': 'No messages provided'},
                    'timestamp': int(time.time() * 1000)
                })}\n\n"
                return
            
            latest_message = request.messages[-1]
            
            # Emit TEXT_MESSAGE_START for assistant response
            yield f"data: {json.dumps({
                'type': 'TEXT_MESSAGE_START',
                'messageId': message_id,
                'role': 'assistant',
                'timestamp': int(time.time() * 1000)
            })}\n\n"
            
            # Use Agno agent to get response
            print(f"🤖 Processing with Agno: {latest_message.content}")
            response = agent.run(latest_message.content)
            
            # Stream the response content in chunks
            content = response.content
            words = content.split()
            
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                
                # Emit TEXT_MESSAGE_CONTENT event for each chunk
                yield f"data: {json.dumps({
                    'type': 'TEXT_MESSAGE_CONTENT',
                    'messageId': message_id,
                    'delta': chunk,
                    'timestamp': int(time.time() * 1000)
                })}\n\n"
                
                # Small delay to simulate streaming
                await asyncio.sleep(0.05)
            
            # Emit TEXT_MESSAGE_END
            yield f"data: {json.dumps({
                'type': 'TEXT_MESSAGE_END', 
                'messageId': message_id,
                'timestamp': int(time.time() * 1000)
            })}\n\n"
            
            # Emit MESSAGES_SNAPSHOT with updated message list
            updated_messages = request.messages + [{
                'id': message_id,
                'role': 'assistant', 
                'content': content
            }]
            
            yield f"data: {json.dumps({
                'type': 'MESSAGES_SNAPSHOT',
                'threadId': thread_id,
                'runId': run_id,
                'messages': [msg.dict() if hasattr(msg, 'dict') else msg for msg in updated_messages],
                'timestamp': int(time.time() * 1000)  
            })}\n\n"
            
            # Emit RUN_FINISHED event
            yield f"data: {json.dumps({
                'type': 'RUN_FINISHED',
                'threadId': thread_id,
                'runId': run_id,
                'timestamp': int(time.time() * 1000)
            })}\n\n"
            
            print(f"✅ Completed AG-UI run: {run_id}")
            
        except Exception as e:
            print(f"❌ Error in AG-UI stream: {e}")
            
            # Emit error event
            yield f"data: {json.dumps({
                'type': 'RUN_ERROR',
                'threadId': thread_id,
                'runId': run_id,
                'error': {'message': str(e)},
                'timestamp': int(time.time() * 1000)
            })}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "agent": "ready",
        "protocol": "AG-UI",
        "agno_version": "1.7.7"
    }

if __name__ == "__main__":
    print("🚀 Starting Agno Backend...")
    print("📡 Backend will be available at: http://localhost:8000")
    print("🔗 AG-UI endpoint: http://localhost:8000/agno-agent")
    uvicorn.run(app, host="0.0.0.0", port=8000)