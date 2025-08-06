import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

@customElement('simple-chat')
export class SimpleChat extends LitElement {
  @property({ type: String }) endpoint = '';
  @property({ type: String }) apiKey = '';
  @state() private messages: Message[] = [];
  @state() private isLoading = false;
  @state() private error: string | null = null;

  async send(input: HTMLInputElement) {
    const content = input.value.trim();
    if (!content || !this.endpoint || this.isLoading) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content,
      id: Date.now().toString()
    };

    this.messages = [...this.messages, userMessage];
    this.isLoading = true;
    this.error = null;
    input.value = '';
    this.requestUpdate();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: this.messages
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      let assistantContent = '';
      if (data.content) {
        assistantContent = data.content;
      } else if (data.response) {
        assistantContent = data.response;
      } else if (typeof data === 'string') {
        assistantContent = data;
      } else {
        assistantContent = JSON.stringify(data);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent,
        id: (Date.now() + 1).toString()
      };

      this.messages = [...this.messages, assistantMessage];

    } catch (err) {
      this.error = err instanceof Error ? err.message : 'An error occurred';
      console.error('Chat error:', err);
    } finally {
      this.isLoading = false;
      this.requestUpdate();
    }
  }

  private clearError() {
    this.error = null;
    this.requestUpdate();
  }

  private clearChat() {
    this.messages = [];
    this.error = null;
    this.requestUpdate();
  }

  static styles = css`
    :host { 
      display: block; 
      font: 14px system-ui; 
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }
    
    .header h3 {
      margin: 0;
      color: #333;
    }
    
    .clear-btn {
      background: #f44336;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .clear-btn:hover {
      background: #d32f2f;
    }
    
    .messages {
      max-height: 500px;
      overflow-y: auto;
      padding: 16px 0;
      margin-bottom: 16px;
      border-bottom: 1px solid #eee;
    }
    
    .msg { 
      padding: 12px 16px; 
      border-radius: 18px; 
      margin: 8px 0; 
      max-width: 80%;
      word-wrap: break-word;
      line-height: 1.4;
    }
    
    .user { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      align-self: flex-end; 
      margin-left: auto;
      margin-right: 0;
    }
    
    .assistant { 
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      color: #333;
    }
    
    .loading { 
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      font-style: italic;
      opacity: 0.8;
    }
    
    .error-banner {
      background: #ffebee;
      border: 1px solid #e57373;
      color: #c62828;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .error-close {
      background: none;
      border: none;
      color: #c62828;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
    }
    
    .input-container {
      display: flex;
      gap: 12px;
      align-items: center;
      background: #f8f9fa;
      padding: 12px;
      border-radius: 24px;
      border: 2px solid #e9ecef;
      transition: border-color 0.2s;
    }
    
    .input-container:focus-within {
      border-color: #667eea;
    }
    
    .input-container.loading {
      opacity: 0.6;
      pointer-events: none;
    }
    
    #in {
      flex: 1;
      border: none;
      background: none;
      outline: none;
      font-size: 16px;
      padding: 8px 12px;
      color: #333;
    }
    
    #in::placeholder {
      color: #999;
    }
    
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 500;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .empty-state {
      text-align: center;
      color: #666;
      padding: 40px 20px;
      font-style: italic;
    }
    
    .status {
      font-size: 12px;
      color: #666;
      text-align: center;
      margin-bottom: 8px;
    }
    
    .status.connected {
      color: #4caf50;
    }
    
    .status.error {
      color: #f44336;
    }
    
    @media (max-width: 600px) {
      :host {
        margin: 0;
        border-radius: 0;
        padding: 16px;
      }
      
      .msg {
        max-width: 90%;
      }
      
      .input-container {
        padding: 10px;
      }
      
      #in {
        font-size: 16px;
      }
    }
  `;

  render() {
    return html`
      <div class="header">
        <h3>🤖 AI Assistant</h3>
        <button class="clear-btn" @click=${this.clearChat}>Clear Chat</button>
      </div>
      
      <div class="status ${this.endpoint ? 'connected' : 'error'}">
        ${this.endpoint ? `Connected to: ${this.endpoint}` : 'No endpoint configured'}
      </div>
      
      ${this.error ? html`
        <div class="error-banner">
          <span>Error: ${this.error}</span>
          <button class="error-close" @click=${this.clearError}>×</button>
        </div>
      ` : ''}
      
      <div class="messages">
        ${this.messages.length === 0 ? 
          html`<div class="empty-state">Start a conversation with your AI assistant</div>` :
          this.messages.map(m => html`<div class="msg ${m.role}">${m.content}</div>`)
        }
        ${this.isLoading ? html`<div class="msg assistant loading">AI is thinking...</div>` : ''}
      </div>
      
      <div class="input-container ${this.isLoading ? 'loading' : ''}">
        <input 
          id="in" 
          @keydown=${(e: KeyboardEvent) => {
            const el = e.target as HTMLInputElement;
            if (e.key === 'Enter' && !this.isLoading) this.send(el);
          }} 
          placeholder="Ask your AI assistant..." 
          ?disabled=${this.isLoading}
        />
        <button 
          @click=${() => this.send(this.shadowRoot!.getElementById('in') as HTMLInputElement)}
          ?disabled=${this.isLoading}
        >
          ${this.isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    `;
  }
}