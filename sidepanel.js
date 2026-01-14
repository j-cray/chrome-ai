// Chrome AI Sidebar - Main Application Logic
// Integrates with Chrome's built-in AI APIs (Prompt API, Summarizer, etc.)

class ChromeAIApp {
  constructor() {
    this.session = null;
    this.includeContext = false;
    this.messages = [];
    this.initializeApp();
  }

  async initializeApp() {
    this.setupDOMReferences();
    this.setupEventListeners();
    await this.initializeAI();
    this.checkForPendingPrompt();
    this.autoResizeTextarea();
  }

  setupDOMReferences() {
    this.elements = {
      chatContainer: document.getElementById('chatContainer'),
      messages: document.getElementById('messages'),
      welcomeScreen: document.getElementById('welcomeScreen'),
      promptInput: document.getElementById('promptInput'),
      sendBtn: document.getElementById('sendBtn'),
      contextBtn: document.getElementById('contextBtn'),
      statusBar: document.getElementById('statusBar'),
      statusIcon: document.getElementById('statusIcon'),
      statusText: document.getElementById('statusText'),
      modelInfo: document.getElementById('modelInfo'),
      modelName: document.getElementById('modelName')
    };
  }

  setupEventListeners() {
    // Send message on button click
    this.elements.sendBtn.addEventListener('click', () => this.handleSendMessage());
    
    // Send message on Enter (Shift+Enter for new line)
    this.elements.promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Auto-resize textarea
    this.elements.promptInput.addEventListener('input', () => this.autoResizeTextarea());

    // Toggle context inclusion
    this.elements.contextBtn.addEventListener('click', () => this.toggleContext());

    // Focus input on load
    this.elements.promptInput.focus();
  }

  async initializeAI() {
    try {
      // Check for Chrome AI availability
      if (!window.ai || !window.ai.languageModel) {
        throw new Error('Chrome AI not available. Please ensure you are using Chrome Canary with AI features enabled.');
      }

      // Check capabilities
      const capabilities = await window.ai.languageModel.capabilities();
      console.log('AI Capabilities:', capabilities);

      if (capabilities.available === 'no') {
        throw new Error('AI model is not available on this device.');
      }

      if (capabilities.available === 'after-download') {
        this.showStatus('Downloading AI model... This may take a while.', 'info');
      }

      // Create AI session
      this.session = await window.ai.languageModel.create({
        systemPrompt: 'You are a helpful AI assistant integrated into Chrome. Provide concise, accurate, and helpful responses. When given page context, use it to provide more relevant answers.'
      });

      this.showStatus('AI ready! Start chatting below.', 'success');
      this.elements.modelName.textContent = 'Gemini Nano';
      
      // Auto-hide status after 3 seconds
      setTimeout(() => this.hideStatus(), 3000);

    } catch (error) {
      console.error('AI initialization error:', error);
      this.showStatus(error.message, 'error');
      this.elements.modelName.textContent = 'Unavailable';
      this.elements.sendBtn.disabled = true;
    }
  }

  async checkForPendingPrompt() {
    const result = await chrome.storage.local.get(['pendingPrompt', 'sourceUrl']);
    if (result.pendingPrompt) {
      this.elements.promptInput.value = result.pendingPrompt;
      this.autoResizeTextarea();
      
      // Clear pending prompt
      await chrome.storage.local.remove(['pendingPrompt', 'sourceUrl']);
      
      // Auto-focus and optionally auto-send
      this.elements.promptInput.focus();
    }
  }

  autoResizeTextarea() {
    const textarea = this.elements.promptInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  toggleContext() {
    this.includeContext = !this.includeContext;
    this.elements.contextBtn.classList.toggle('active', this.includeContext);
    
    if (this.includeContext) {
      this.showStatus('Page context will be included in next message', 'info');
      setTimeout(() => this.hideStatus(), 2000);
    }
  }

  async handleSendMessage() {
    const prompt = this.elements.promptInput.value.trim();
    if (!prompt || !this.session) return;

    // Clear input
    this.elements.promptInput.value = '';
    this.autoResizeTextarea();

    // Hide welcome screen
    this.elements.welcomeScreen.style.display = 'none';

    // Get page context if enabled
    let context = null;
    if (this.includeContext) {
      context = await this.getPageContext();
      this.includeContext = false;
      this.elements.contextBtn.classList.remove('active');
    }

    // Add user message to UI
    this.addMessage('user', prompt, context);

    // Add loading message
    const loadingMessage = this.addLoadingMessage();

    try {
      // Prepare full prompt with context
      let fullPrompt = prompt;
      if (context && context.text) {
        fullPrompt = `Context from page "${context.title}" (${context.url}):\n\n${context.text.substring(0, 5000)}\n\n---\n\nUser question: ${prompt}`;
      }

      // Stream response from AI
      const stream = this.session.promptStreaming(fullPrompt);
      let fullResponse = '';

      // Remove loading message
      loadingMessage.remove();

      // Add assistant message that will be updated
      const assistantMessage = this.addMessage('assistant', '');

      for await (const chunk of stream) {
        fullResponse = chunk.trim();
        this.updateMessage(assistantMessage, fullResponse);
      }

      // Store in messages history
      this.messages.push({ role: 'user', content: prompt, context });
      this.messages.push({ role: 'assistant', content: fullResponse });

    } catch (error) {
      console.error('Error getting AI response:', error);
      loadingMessage.remove();
      this.addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
      this.showStatus('Error generating response', 'error');
    }
  }

  async getPageContext() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getPageContext' }, (response) => {
        if (response && response.context) {
          resolve(response.context);
        } else {
          resolve(null);
        }
      });
    });
  }

  addMessage(role, text, context = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = role === 'user' ? 'person' : 'smart_toy';
    avatar.appendChild(icon);

    const content = document.createElement('div');
    content.className = 'message-content';

    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = text;

    content.appendChild(messageText);

    if (context && role === 'user') {
      const contextInfo = document.createElement('div');
      contextInfo.className = 'message-context';
      contextInfo.textContent = `📄 Including context from: ${context.title}`;
      content.appendChild(contextInfo);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    this.elements.messages.appendChild(messageDiv);
    this.scrollToBottom();

    return messageDiv;
  }

  addLoadingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant loading';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = 'smart_toy';
    avatar.appendChild(icon);

    const content = document.createElement('div');
    content.className = 'message-content';

    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'typing-dot';
      typingIndicator.appendChild(dot);
    }
    
    messageText.appendChild(typingIndicator);
    content.appendChild(messageText);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    this.elements.messages.appendChild(messageDiv);
    this.scrollToBottom();

    return messageDiv;
  }

  updateMessage(messageElement, text) {
    const messageText = messageElement.querySelector('.message-text');
    messageText.textContent = text;
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
  }

  showStatus(message, type = 'info') {
    this.elements.statusText.textContent = message;
    this.elements.statusBar.classList.remove('error');
    
    if (type === 'error') {
      this.elements.statusBar.classList.add('error');
      this.elements.statusIcon.textContent = 'error';
    } else if (type === 'success') {
      this.elements.statusIcon.textContent = 'check_circle';
    } else {
      this.elements.statusIcon.textContent = 'info';
    }
    
    this.elements.statusBar.classList.add('active');
  }

  hideStatus() {
    this.elements.statusBar.classList.remove('active');
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ChromeAIApp());
} else {
  new ChromeAIApp();
}
