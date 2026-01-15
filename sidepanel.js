// Chrome AI Sidebar - Main Application Logic
// Integrates with Chrome's built-in AI APIs (Prompt API, Summarizer, etc.) and LM Studio

class ChromeAIApp {
  constructor() {
    this.session = null;
    this.summarizer = null;
    this.includeContext = false;
    this.messages = [];
    this.performanceMetrics = { lastResponseTime: 0 };
    
    // Configuration constants
    this.MAX_CONTEXT_LENGTH = 8000; // Maximum context length for AI queries
    
    // AI mode: 'chrome' or 'lmstudio'
    this.aiMode = 'chrome';
    this.lmstudioUrl = 'http://localhost:1234/v1/chat/completions';
    this.lmstudioModel = '';
    
    this.initializeApp();
  }

  async initializeApp() {
    this.setupDOMReferences();
    this.setupEventListeners();
    await this.loadSettings();
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
      clearBtn: document.getElementById('clearBtn'),
      settingsBtn: document.getElementById('settingsBtn'),
      settingsPanel: document.getElementById('settingsPanel'),
      closeSettingsBtn: document.getElementById('closeSettingsBtn'),
      saveSettingsBtn: document.getElementById('saveSettingsBtn'),
      chromeModeRadio: document.getElementById('chromeModeRadio'),
      lmstudioModeRadio: document.getElementById('lmstudioModeRadio'),
      lmstudioSettings: document.getElementById('lmstudioSettings'),
      lmstudioUrl: document.getElementById('lmstudioUrl'),
      lmstudioModel: document.getElementById('lmstudioModel'),
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

    // Clear chat
    this.elements.clearBtn.addEventListener('click', () => this.clearChat());

    // Settings panel
    this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
    this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
    this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    
    // AI mode radio buttons
    this.elements.chromeModeRadio.addEventListener('change', () => this.updateSettingsUI());
    this.elements.lmstudioModeRadio.addEventListener('change', () => this.updateSettingsUI());
    
    // Close settings on backdrop click
    this.elements.settingsPanel.addEventListener('click', (e) => {
      if (e.target === this.elements.settingsPanel) {
        this.closeSettings();
      }
    });

    // Focus input on load
    this.elements.promptInput.focus();
  }

  async initializeAI() {
    try {
      if (this.aiMode === 'chrome') {
        await this.initializeChromeAI();
      } else if (this.aiMode === 'lmstudio') {
        await this.initializeLMStudio();
      }
    } catch (error) {
      console.error('AI initialization error:', error);
      this.showStatus(error.message, 'error');
      this.elements.modelName.textContent = 'Unavailable';
      this.elements.sendBtn.disabled = true;
    }
  }

  async initializeChromeAI() {
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

    // Create AI session with optimized settings
    this.session = await window.ai.languageModel.create({
      systemPrompt: 'You are a helpful AI assistant integrated into Chrome. Provide concise, accurate, and helpful responses. When given page context, use it to provide more relevant answers.',
      temperature: 0.8,
      topK: 3
    });

    // Try to initialize summarizer API if available
    await this.initializeSummarizer();

    this.showStatus('Chrome AI ready! Start chatting below.', 'success');
    this.elements.modelName.textContent = 'Gemini Nano';
    this.elements.sendBtn.disabled = false;
    
    // Auto-hide status after 3 seconds
    setTimeout(() => this.hideStatus(), 3000);
  }

  async initializeLMStudio() {
    // Test connection to LM Studio
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(this.lmstudioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: this.lmstudioModel || undefined,
          max_tokens: 10,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`LM Studio server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const modelName = data.model || this.lmstudioModel || 'LM Studio';

      this.showStatus('LM Studio connected!', 'success');
      this.elements.modelName.textContent = modelName;
      this.elements.sendBtn.disabled = false;
      
      // Auto-hide status after 3 seconds
      setTimeout(() => this.hideStatus(), 3000);

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Connection to LM Studio timed out. Make sure LM Studio is running and the server is started.');
      }
      throw new Error(`Failed to connect to LM Studio: ${error.message}. Make sure LM Studio is running and the server is started.`);
    }
  }

  async initializeSummarizer() {
    try {
      if (window.ai && window.ai.summarizer) {
        const summarizerCapabilities = await window.ai.summarizer.capabilities();
        if (summarizerCapabilities.available !== 'no') {
          this.summarizer = await window.ai.summarizer.create({
            type: 'key-points',
            format: 'markdown',
            length: 'medium'
          });
          console.log('Summarizer API initialized');
        }
      }
    } catch (error) {
      console.warn('Summarizer not available:', error);
      // Non-critical, continue without summarizer
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
    if (!prompt) return;
    
    // Check if AI is ready
    if (this.aiMode === 'chrome' && !this.session) {
      this.showStatus('Chrome AI not ready. Please check settings.', 'error');
      return;
    }

    // Clear input
    this.elements.promptInput.value = '';
    this.autoResizeTextarea();

    // Hide welcome screen
    this.elements.welcomeScreen.style.display = 'none';

    // Performance tracking
    const startTime = performance.now();

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
      if (this.aiMode === 'chrome') {
        await this.handleChromeAIResponse(prompt, context, loadingMessage);
      } else if (this.aiMode === 'lmstudio') {
        await this.handleLMStudioResponse(prompt, context, loadingMessage);
      }

      // Track performance
      const endTime = performance.now();
      this.performanceMetrics.lastResponseTime = endTime - startTime;
      console.log(`Response generated in ${Math.round(this.performanceMetrics.lastResponseTime)}ms`);

    } catch (error) {
      console.error('Error getting AI response:', error);
      loadingMessage.remove();
      this.addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
      this.showStatus('Error generating response', 'error');
    }
  }

  async handleChromeAIResponse(prompt, context, loadingMessage) {
    // Check if this is a summarization request
    const isSummarizationRequest = this.isSummarizationRequest(prompt);
    
    if (isSummarizationRequest && this.summarizer && context && context.text) {
      await this.handleSummarization(context.text, loadingMessage);
    } else {
      // Prepare full prompt with context
      let fullPrompt = prompt;
      if (context && context.text) {
        // Optimize context by truncating if too long
        const contextText = context.text.length > this.MAX_CONTEXT_LENGTH 
          ? context.text.substring(0, this.MAX_CONTEXT_LENGTH) + '...'
          : context.text;
        
        fullPrompt = `Context from page "${context.title}" (${context.url}):\n\n${contextText}\n\n---\n\nUser question: ${prompt}`;
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
    }
  }

  async handleLMStudioResponse(prompt, context, loadingMessage) {
    // Prepare messages array
    const messages = [...this.messages.map(m => ({ 
      role: m.role === 'user' ? 'user' : 'assistant', 
      content: m.content 
    }))];

    // Add context if provided
    let userMessage = prompt;
    if (context && context.text) {
      const contextText = context.text.length > this.MAX_CONTEXT_LENGTH 
        ? context.text.substring(0, this.MAX_CONTEXT_LENGTH) + '...'
        : context.text;
      userMessage = `Context from page "${context.title}" (${context.url}):\n\n${contextText}\n\n---\n\nUser question: ${prompt}`;
    }

    messages.push({ role: 'user', content: userMessage });

    // Call LM Studio API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(this.lmstudioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages,
          model: this.lmstudioModel || undefined,
          temperature: 0.8,
          max_tokens: 2000,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assistantResponse = data.choices[0].message.content;

      // Remove loading message and add response
      loadingMessage.remove();
      this.addMessage('assistant', assistantResponse);

      // Store in messages history
      this.messages.push({ role: 'user', content: prompt, context });
      this.messages.push({ role: 'assistant', content: assistantResponse });

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request to LM Studio timed out. The model may be taking too long to respond.');
      }
      throw error;
    }
  }

  isSummarizationRequest(prompt) {
    const summarizeKeywords = ['summarize', 'summary', 'tldr', 'tl;dr', 'key points', 'main points'];
    const lowerPrompt = prompt.toLowerCase();
    return summarizeKeywords.some(keyword => lowerPrompt.includes(keyword));
  }

  async handleSummarization(text, loadingMessage) {
    try {
      const summary = await this.summarizer.summarize(text);
      loadingMessage.remove();
      this.addMessage('assistant', `📝 Summary:\n\n${summary}`);
      
      this.messages.push({ role: 'user', content: 'Summarize this page' });
      this.messages.push({ role: 'assistant', content: summary });
    } catch (error) {
      console.error('Summarization error:', error);
      throw error;
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

  clearChat() {
    if (confirm('Clear all messages? This cannot be undone.')) {
      this.messages = [];
      this.elements.messages.innerHTML = '';
      this.elements.welcomeScreen.style.display = 'flex';
      this.showStatus('Chat cleared', 'info');
      setTimeout(() => this.hideStatus(), 2000);
    }
  }

  // Optimized scroll using requestAnimationFrame to prevent layout thrashing
  // and ensure smooth scrolling by batching DOM reads/writes
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
    });
  }

  // Settings management
  async loadSettings() {
    const settings = await chrome.storage.local.get(['aiMode', 'lmstudioUrl', 'lmstudioModel']);
    
    if (settings.aiMode) {
      this.aiMode = settings.aiMode;
    }
    if (settings.lmstudioUrl) {
      this.lmstudioUrl = settings.lmstudioUrl;
    }
    if (settings.lmstudioModel) {
      this.lmstudioModel = settings.lmstudioModel;
    }

    // Update UI
    if (this.aiMode === 'chrome') {
      this.elements.chromeModeRadio.checked = true;
    } else {
      this.elements.lmstudioModeRadio.checked = true;
    }
    this.elements.lmstudioUrl.value = this.lmstudioUrl;
    this.elements.lmstudioModel.value = this.lmstudioModel;
    this.updateSettingsUI();
  }

  async saveSettings() {
    const newMode = this.elements.chromeModeRadio.checked ? 'chrome' : 'lmstudio';
    const newUrl = this.elements.lmstudioUrl.value;
    const newModel = this.elements.lmstudioModel.value;

    // Save to storage
    await chrome.storage.local.set({
      aiMode: newMode,
      lmstudioUrl: newUrl,
      lmstudioModel: newModel
    });

    // Update local state
    const modeChanged = this.aiMode !== newMode;
    this.aiMode = newMode;
    this.lmstudioUrl = newUrl;
    this.lmstudioModel = newModel;

    // Reinitialize AI if mode changed
    if (modeChanged) {
      this.session = null;
      this.summarizer = null;
      this.showStatus('Switching AI provider...', 'info');
      await this.initializeAI();
    }

    this.closeSettings();
    this.showStatus('Settings saved!', 'success');
    setTimeout(() => this.hideStatus(), 2000);
  }

  openSettings() {
    this.elements.settingsPanel.classList.add('active');
  }

  closeSettings() {
    this.elements.settingsPanel.classList.remove('active');
  }

  updateSettingsUI() {
    if (this.elements.lmstudioModeRadio.checked) {
      this.elements.lmstudioSettings.classList.add('active');
    } else {
      this.elements.lmstudioSettings.classList.remove('active');
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ChromeAIApp());
} else {
  new ChromeAIApp();
}
