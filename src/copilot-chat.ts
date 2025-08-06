import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HttpAgent, Message } from '@ag-ui/client';

@customElement('copilot-chat')
export class CopilotChat extends LitElement {
  @property({ type: String }) endpoint = ''; // e.g. your Copilot Runtime/Cloud/agent URL
  @property({ type: String }) apiKey = '';   // Copilot Cloud public key or your proxy token
  @state() private messages: Message[] = [];
  @state() private typing = '';

  private agent: HttpAgent | null = null;

  private subscriber = {
    onTextMessageContentEvent: ({ textMessageBuffer }: { textMessageBuffer: string }) => { 
      console.log('📝 Text message content:', textMessageBuffer);
      this.typing = textMessageBuffer; 
      this.requestUpdate(); 
    },
    onMessagesChanged: ({ messages }: { messages: Message[] }) => { 
      console.log('💬 Messages changed:', messages);
      this.messages = messages; 
      this.typing = ''; 
      this.requestUpdate();
    },
    onRunStartedEvent: ({ event }: { event: any }) => {
      console.log('🚀 Run started:', event);
      this.typing = 'AI is thinking...';
      this.requestUpdate();
    },
    onRunFinishedEvent: ({ event }: { event: any }) => {
      console.log('✅ Run finished:', event);
      this.typing = '';
      this.requestUpdate();
    },
    onRunErrorEvent: ({ event }: { event: any }) => {
      console.error('❌ Run error:', event);
      this.typing = `Error: ${event.message || 'Unknown error'}`;
      this.requestUpdate();
    },
    onTextMessageStartEvent: ({ event }: { event: any }) => {
      console.log('🎬 Text message start:', event);
    },
    onTextMessageEndEvent: ({ event }: { event: any }) => {
      console.log('🎬 Text message end:', event);
    },
  };

  connectedCallback() {
    super.connectedCallback();
    this.updateAgent();
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('endpoint') || changedProperties.has('apiKey')) {
      this.updateAgent();
    }
  }

  private updateAgent() {
    if (!this.endpoint) return;
    
    this.agent = new HttpAgent({
      url: this.endpoint,
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined,
    });
    
    this.agent.subscribe(this.subscriber);
  }

  async send(input: HTMLInputElement) {
    const content = input.value.trim();
    if (!content || !this.agent) return;
    
    // Clear input immediately for better UX
    input.value = '';
    
    try {
      // Add user message to the agent and run
      this.agent.addMessage({ 
        id: Date.now().toString(), 
        role: 'user', 
        content 
      });
      
      // Run the agent - this will trigger the subscribers
      await this.agent.runAgent();
      
    } catch (error) {
      console.error('Error running agent:', error);
      // Show error to user
      this.typing = `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
      this.requestUpdate();
    }
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
    
    .typing { 
      opacity: 0.7; 
      font-style: italic;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
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
    
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    .empty-state {
      text-align: center;
      color: #666;
      padding: 40px 20px;
      font-style: italic;
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
        font-size: 16px; /* Prevent zoom on iOS */
      }
    }
  `;

  render() {
    return html`
      <div class="messages">
        ${this.messages.length === 0 ? 
          html`<div class="empty-state">Start a conversation with your AI assistant</div>` :
          this.messages.map(m => html`<div class="msg ${m.role}">${m.content || ''}</div>`)
        }
        ${this.typing ? html`<div class="msg assistant typing">${this.typing}</div>` : null}
      </div>
      <div class="input-container">
        <input id="in" @keydown=${(e: KeyboardEvent) => {
          const el = e.target as HTMLInputElement;
          if (e.key === 'Enter') this.send(el);
        }} placeholder="Ask your copilot..." />
        <button @click=${() => this.send(this.shadowRoot!.getElementById('in') as HTMLInputElement)}>Send</button>
      </div>
    `;
  }
}