import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HttpAgent, Message } from '@ag-ui/client';

@customElement('copilot-chat')
export class CopilotChat extends LitElement {
  @property({ type: String }) endpoint = ''; // e.g. your Copilot Runtime/Cloud/agent URL
  @property({ type: String }) apiKey = '';   // Copilot Cloud public key or your proxy token
  @state() private messages: Message[] = [];
  @state() private typing = '';
  @state() private waitingForResponse = false;

  private agent: HttpAgent | null = null;
  private thinkingTimeout: number | null = null;

  private getTimestamp() {
    return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm format
  }

  private subscriber = {
    onTextMessageContentEvent: ({ textMessageBuffer }: { textMessageBuffer: string }) => {
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onTextMessageContentEvent - typing: "${textMessageBuffer}"`);
      this.typing = textMessageBuffer;
      this.waitingForResponse = false; // Agent has started responding
      if (this.thinkingTimeout) {
        clearTimeout(this.thinkingTimeout);
        this.thinkingTimeout = null;
      }
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onTextMessageContentEvent - final state: typing="${this.typing}", waitingForResponse=${this.waitingForResponse}`);
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onTextMessageContentEvent - calling requestUpdate()`);
      this.requestUpdate();
    },
    onMessagesChanged: ({ messages }: { messages: Message[] }) => {
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onMessagesChanged - messages: ${messages.length}, current typing: "${this.typing}", waitingForResponse: ${this.waitingForResponse}`);
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onMessagesChanged - message contents:`, messages.map(m => `${m.role}: "${m.content}"`));
      this.messages = messages;

      // Only clear timeout if we're not actively streaming or waiting
      if (!this.typing && !this.waitingForResponse) {
        if (this.thinkingTimeout) {
          clearTimeout(this.thinkingTimeout);
          this.thinkingTimeout = null;
        }
        console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onMessagesChanged - clearing timeout (not typing or waiting)`);
      } else {
        console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onMessagesChanged - keeping states active`);
      }

      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onMessagesChanged - calling requestUpdate()`);
      this.requestUpdate();
    },
    onRunStartedEvent: ({ event }: { event: any }) => {
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onRunStartedEvent - setting typing to empty for thinking indicator`);
      this.typing = ''; // Empty typing shows thinking indicator
      this.waitingForResponse = true; // Ensure we're waiting for response
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onRunStartedEvent - final state: waitingForResponse=${this.waitingForResponse}, typing="${this.typing}"`);
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onRunStartedEvent - calling requestUpdate()`);
      this.requestUpdate();
    },
    onRunFinishedEvent: ({ event }: { event: any }) => {
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onRunFinishedEvent - clearing typing`);
      this.typing = '';
      this.waitingForResponse = false; // Agent has finished
      if (this.thinkingTimeout) {
        clearTimeout(this.thinkingTimeout);
        this.thinkingTimeout = null;
      }
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onRunFinishedEvent - calling requestUpdate()`);
      this.requestUpdate();
    },
    onRunErrorEvent: ({ event }: { event: any }) => {
      console.error(`[${this.getTimestamp()}] TYPING_DEBUG: onRunErrorEvent - setting error typing: ${event.message || 'Unknown error'}`);
      this.typing = `Error: ${event.message || 'Unknown error'}`;
      this.waitingForResponse = false; // Agent has finished (with error)
      if (this.thinkingTimeout) {
        clearTimeout(this.thinkingTimeout);
        this.thinkingTimeout = null;
      }
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onRunErrorEvent - calling requestUpdate()`);
      this.requestUpdate();
    },
    onTextMessageStartEvent: ({ event }: { event: any }) => {
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onTextMessageStartEvent - keeping typing: "${this.typing}", waitingForResponse: ${this.waitingForResponse}`);
      // Don't change any state here - let the content event handle it
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onTextMessageStartEvent - calling requestUpdate()`);
      this.requestUpdate();
    },
    onTextMessageEndEvent: ({ event }: { event: any }) => {
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onTextMessageEndEvent - clearing typing`);
      this.typing = '';
      this.waitingForResponse = false; // Agent has finished
      if (this.thinkingTimeout) {
        clearTimeout(this.thinkingTimeout);
        this.thinkingTimeout = null;
      }
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: onTextMessageEndEvent - calling requestUpdate()`);
      this.requestUpdate();
    },
  };

  connectedCallback() {
    super.connectedCallback();
    this.updateAgent();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.thinkingTimeout) {
      clearTimeout(this.thinkingTimeout);
      this.thinkingTimeout = null;
    }
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

    // Set thinking state immediately when sending
    console.log(`[${this.getTimestamp()}] TYPING_DEBUG: send() - setting waitingForResponse to true`);
    this.waitingForResponse = true; // User has sent message, waiting for agent
    this.typing = ''; // Empty typing shows thinking indicator
    console.log(`[${this.getTimestamp()}] TYPING_DEBUG: send() - calling requestUpdate()`);
    this.requestUpdate();

    // Set a fallback timeout to ensure thinking indicator shows up
    if (this.thinkingTimeout) {
      clearTimeout(this.thinkingTimeout);
    }
    this.thinkingTimeout = window.setTimeout(() => {
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: fallback timeout - ensuring waitingForResponse is true`);
      if (this.waitingForResponse) {
        this.requestUpdate();
      }
    }, 50); // Shorter timeout for more responsive UI

    try {
      // Add user message to the agent and run
      this.agent.addMessage({
        id: Date.now().toString(),
        role: 'user',
        content
      });

      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: send() - about to run agent`);
      // Run the agent - this will trigger the subscribers
      await this.agent.runAgent();
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: send() - agent.runAgent() completed`);

    } catch (error) {
      console.error(`[${this.getTimestamp()}] TYPING_DEBUG: send() error - setting error typing`);
      // Show error to user
      this.typing = `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
      console.log(`[${this.getTimestamp()}] TYPING_DEBUG: send() error - calling requestUpdate()`);
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
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      border: 1px solid #e9ecef;
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
      background: #333;
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
      background: #f1f3f4;
      border-left: 4px solid #666;
    }
    
    .thinking {
      background: transparent;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
    }
    
    .thinking-text {
      color: #666;
      font-style: italic;
      font-size: 14px;
    }

    .typing-dots {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;    
      width: fit-content;
      animation: bounce-in 0.3s ease;
    }

    .typing-dots .dot {
      width: 6px;
      height: 6px;
      background-color: #888;
      border-radius: 50%;
      animation: bounce 1.2s infinite ease-in-out;
    }

    .typing-dots .dot:nth-child(1) {
      animation-delay: 0s;
    }

    .typing-dots .dot:nth-child(2) {
      animation-delay: 0.3s;
    }

    .typing-dots .dot:nth-child(3) {
      animation-delay: 0.6s;
    }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-6px);
      }
    }

    @keyframes bounce-in {
      from {
        transform: scale(0.5);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
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
      border-color: #666;
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
      background: #333;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    button:hover {
      background: #555;
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


  private renderTypingIndicator() {
    console.log(`[${this.getTimestamp()}] TYPING_DEBUG: renderTypingIndicator() called`);
    return html`
      <div class="typing-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    `;
  }

  render() {
    console.log(`[${this.getTimestamp()}] TYPING_DEBUG: render() - typing: "${this.typing}", waitingForResponse: ${this.waitingForResponse}`);

    // Debug the conditional rendering
    const filteredMessages = this.messages.filter(m => m.content && m.content.trim() !== '');
    const shouldShowThinking = this.waitingForResponse && !this.typing;
    const shouldShowTyping = this.typing;
    console.log(`[${this.getTimestamp()}] TYPING_DEBUG: render() - shouldShowThinking: ${shouldShowThinking}, shouldShowTyping: ${shouldShowTyping}`);
    console.log(`[${this.getTimestamp()}] TYPING_DEBUG: render() - waitingForResponse: ${this.waitingForResponse}, typing: "${this.typing}"`);
    console.log(`[${this.getTimestamp()}] TYPING_DEBUG: render() - total messages: ${this.messages.length}, filtered: ${filteredMessages.length}`);

    // Debug the exact conditions
    if (shouldShowThinking && shouldShowTyping) {
      console.error(`[${this.getTimestamp()}] TYPING_DEBUG: ERROR - Both thinking and typing would show! waitingForResponse: ${this.waitingForResponse}, typing: "${this.typing}"`);
    }

    return html`
      <div class="messages">
        ${filteredMessages.length === 0 ?
        html`<div class="empty-state">Start a conversation with your AI assistant</div>` :
        filteredMessages.map(m => html`<div class="msg ${m.role}">${m.content || ''}</div>`)
      }
        ${this.waitingForResponse ?
        html`<div class="thinking">${this.renderTypingIndicator()}</div>` :
        ''
      }
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