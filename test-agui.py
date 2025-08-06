#!/usr/bin/env python3
"""
Test script to validate AG-UI protocol implementation
"""

import requests
import json
import time
from datetime import datetime

def test_ag_ui_protocol():
    """Test the AG-UI protocol endpoint"""
    
    print("🧪 Testing AG-UI Protocol Implementation")
    print("=" * 50)
    
    # Test health endpoint first
    print("1. Testing health endpoint...")
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            health = response.json()
            print(f"   ✅ Health check passed: {health}")
            if health.get('protocol') == 'AG-UI':
                print("   ✅ AG-UI protocol confirmed")
            else:
                print("   ⚠️  AG-UI protocol not confirmed")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
        return False
    
    # Test AG-UI streaming endpoint
    print("\n2. Testing AG-UI streaming endpoint...")
    
    test_request = {
        "threadId": "test_thread_123",
        "runId": "test_run_456", 
        "messages": [
            {
                "id": "msg_1",
                "role": "user",
                "content": "Hello, can you help me with a simple test?"
            }
        ],
        "state": {},
        "tools": [],
        "context": []
    }
    
    try:
        print("   📤 Sending AG-UI request...")
        response = requests.post(
            "http://localhost:8000/agno-agent",
            json=test_request,
            headers={
                "Content-Type": "application/json",
                "Accept": "text/event-stream"
            },
            stream=True
        )
        
        if response.status_code != 200:
            print(f"   ❌ Request failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        print("   📡 Receiving AG-UI events...")
        events_received = []
        
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event_data = line[6:]  # Remove 'data: ' prefix
                    event = json.loads(event_data)
                    events_received.append(event)
                    
                    event_type = event.get('type', 'UNKNOWN')
                    print(f"   📨 {event_type}: {event}")
                    
                    # Stop after RUN_FINISHED or RUN_ERROR
                    if event_type in ['RUN_FINISHED', 'RUN_ERROR']:
                        break
                        
                except json.JSONDecodeError as e:
                    print(f"   ⚠️  Failed to parse event: {event_data}")
                    
        # Validate received events
        print("\n3. Validating AG-UI events...")
        
        required_events = ['RUN_STARTED', 'TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END', 'MESSAGES_SNAPSHOT', 'RUN_FINISHED']
        received_types = [e.get('type') for e in events_received]
        
        for required in required_events:
            if required in received_types:
                print(f"   ✅ {required} event received")
            else:
                print(f"   ❌ {required} event missing")
        
        # Check for content
        content_events = [e for e in events_received if e.get('type') == 'TEXT_MESSAGE_CONTENT']
        if content_events:
            total_content = ''.join([e.get('delta', '') for e in content_events])
            print(f"   📝 Total content received: '{total_content.strip()}'")
            
            if len(total_content.strip()) > 0:
                print("   ✅ Content streaming working")
            else:
                print("   ❌ No content received")
        else:
            print("   ❌ No content events received")
        
        print(f"\n📊 Summary:")
        print(f"   Events received: {len(events_received)}")
        print(f"   Event types: {list(set(received_types))}")
        
        # Check if all required events were received
        if all(req in received_types for req in required_events):
            print("   🎉 AG-UI protocol implementation: PASSED")
            return True
        else:
            print("   ❌ AG-UI protocol implementation: FAILED")
            return False
            
    except Exception as e:
        print(f"   ❌ Streaming test error: {e}")
        return False

def test_simple_request():
    """Test a simple HTTP request (fallback)"""
    print("\n4. Testing simple HTTP request (fallback)...")
    
    simple_request = {
        "messages": [
            {"role": "user", "content": "Hello, simple test"}
        ]
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/agno-agent",
            json=simple_request,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        print(f"   Content Type: {response.headers.get('content-type')}")
        
        if response.status_code == 200:
            print("   ✅ Simple request working")
            return True
        else:
            print("   ❌ Simple request failed")
            return False
            
    except Exception as e:
        print(f"   ❌ Simple request error: {e}")
        return False

if __name__ == "__main__":
    print(f"🕐 Test started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    success = test_ag_ui_protocol()
    
    if not success:
        print("\n🔄 Trying fallback test...")
        test_simple_request()
    
    print(f"\n🕐 Test completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")