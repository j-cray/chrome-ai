// Background service worker for Chrome AI extension

// Configuration constants
const MAX_CONTEXT_LENGTH = 10000; // Maximum characters to extract from page
const CACHE_DURATION = 30000; // 30 seconds
const MAX_CACHE_ENTRIES = 20; // Maximum number of cached contexts

// Performance optimization: cache for page contexts
const contextCache = new Map();

// Open side panel when extension icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Create context menu for quick access
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'openAISidebar',
    title: 'Ask Chrome AI',
    contexts: ['selection', 'page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openAISidebar') {
    // Open side panel
    chrome.sidePanel.open({ windowId: tab.windowId });
    
    // Send selected text to side panel
    if (info.selectionText) {
      chrome.storage.local.set({
        pendingPrompt: info.selectionText,
        sourceUrl: info.pageUrl
      });
    }
  }
});

// Listen for messages from content scripts or sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContext') {
    // Get page context from active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tabId = tabs[0].id;
        const cacheKey = `${tabId}_${tabs[0].url}`;
        
        // Check cache first for performance
        const cached = contextCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          sendResponse({ context: cached.data });
          return;
        }
        
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (maxLength) => {
            return {
              title: document.title,
              url: window.location.href,
              text: document.body.innerText.substring(0, maxLength),
              selectedText: window.getSelection().toString()
            };
          },
          args: [MAX_CONTEXT_LENGTH]
        }).then((results) => {
          const contextData = results[0].result;
          
          // Cache the result
          contextCache.set(cacheKey, {
            data: contextData,
            timestamp: Date.now()
          });
          
          // Clean old cache entries
          if (contextCache.size > MAX_CACHE_ENTRIES) {
            const oldestKey = contextCache.keys().next().value;
            contextCache.delete(oldestKey);
          }
          
          sendResponse({ context: contextData });
        }).catch((error) => {
          sendResponse({ error: error.message });
        });
      }
    });
    return true; // Keep message channel open for async response
  }
});

console.log('Chrome AI Sidebar background service worker loaded');
