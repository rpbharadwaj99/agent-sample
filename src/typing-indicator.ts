import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('typing-indicator')
export class TypingIndicator extends LitElement {
    static styles = css`
    :host {
      display: inline-block;
    }

    .typing {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;    
      width: fit-content;
      animation: bounce-in 0.3s ease;
    }

    .dot {
      width: 6px;
      height: 6px;
      background-color: #888;
      border-radius: 50%;
      animation: bounce 1.2s infinite ease-in-out;
    }

    .dot:nth-child(1) {
      animation-delay: 0s;
    }

    .dot:nth-child(2) {
      animation-delay: 0.3s;
    }

    .dot:nth-child(3) {
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
  `;

    render() {
        return html`
      <div class="typing">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    `;
    }
}
