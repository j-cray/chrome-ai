// Background service worker for Chrome AI extension

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
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            return {
              title: document.title,
              url: window.location.href,
              text: document.body.innerText.substring(0, 10000), // Limit context size
              selectedText: window.getSelection().toString()
            };
          }
        }).then((results) => {
          sendResponse({ context: results[0].result });
        }).catch((error) => {
          sendResponse({ error: error.message });
        });
      }
    });
    return true; // Keep message channel open for async response
  }
});

console.log('Chrome AI Sidebar background service worker loaded');
