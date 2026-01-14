# Chrome AI Sidebar 🤖

A beautiful, performant Chrome extension that integrates Google's built-in AI models directly into your browser with full page context awareness. Built with Material Design 3 for a stunning user experience.

![Chrome AI Sidebar Preview](https://github.com/user-attachments/assets/14ac0577-2896-4d91-aa06-ad1d4b53cc75)

## ✨ Features

- **🚀 Local & Fast**: Uses Google's on-device Gemini Nano model for instant responses
- **🔒 Private**: All processing happens locally on your device
- **📄 Context-Aware**: Include current page context in your queries
- **🎨 Beautiful UI**: Material Design 3 with smooth animations
- **⌨️ Keyboard Shortcuts**: Quick access with `Ctrl+Shift+Y` (or `Cmd+Shift+Y` on Mac)
- **📱 Side Panel**: Non-intrusive sidebar interface
- **✨ Streaming Responses**: Real-time AI responses as they're generated

## 🎯 Prerequisites

This extension requires **Chrome Canary** (version 127+) with experimental AI features enabled:

1. **Download Chrome Canary**: https://www.google.com/chrome/canary/
2. **Enable AI Features**:
   - Navigate to `chrome://flags/#optimization-guide-on-device-model`
   - Set to **Enabled**
   - Navigate to `chrome://flags/#prompt-api-for-gemini-nano`
   - Set to **Enabled**
   - Restart Chrome Canary

3. **Download AI Model** (if needed):
   - Navigate to `chrome://components/`
   - Find "Optimization Guide On Device Model"
   - Click "Check for update" and wait for download to complete

## 📦 Installation

### Method 1: Developer Mode (Recommended)

1. Clone this repository:
   ```bash
   git clone https://github.com/j-cray/chrome-ai.git
   cd chrome-ai
   ```

2. Open Chrome Canary and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked**

5. Select the `chrome-ai` folder

6. The extension icon should appear in your toolbar! 🎉

### Method 2: Direct Download

1. Download this repository as ZIP
2. Extract the contents
3. Follow steps 2-6 from Method 1

## 🚀 Usage

### Opening the Sidebar

- Click the extension icon in the toolbar
- Use keyboard shortcut: `Ctrl+Shift+Y` (Windows/Linux) or `Cmd+Shift+Y` (Mac)
- Right-click on any selected text and choose "Ask Chrome AI"

### Including Page Context

1. Click the 📄 document icon in the input area
2. Type your question
3. The AI will receive the current page's content for better context-aware answers

### Tips

- Press `Enter` to send messages
- Press `Shift+Enter` for new lines
- The AI remembers conversation context within the same session
- Responses stream in real-time for a smooth experience

## 🛠️ Technical Details

### Architecture

- **Manifest V3**: Latest Chrome extension format
- **Side Panel API**: Modern sidebar interface
- **Chrome AI API**: Built-in Gemini Nano integration
  - Language Model API (Prompt API)
  - Streaming responses for better UX
- **Material Design 3**: Google's latest design system
- **Vanilla JavaScript**: No frameworks needed for maximum performance

### APIs Used

- `chrome.sidePanel`: Side panel interface
- `chrome.contextMenus`: Right-click integration
- `chrome.storage`: Persistent state
- `chrome.scripting`: Page content extraction
- `window.ai.languageModel`: On-device AI

### Performance

- **Zero Network Calls**: Everything runs locally
- **Small Bundle Size**: < 50KB total
- **Instant Responses**: On-device processing
- **Minimal Memory**: Efficient resource usage

## 🎨 Design

Built with Material Design 3 principles:

- Dynamic color theming
- Elevation and shadows
- Smooth animations and transitions
- Accessible color contrast
- Responsive layouts

## 🔧 Development

The extension consists of:

- `manifest.json`: Extension configuration
- `sidepanel.html`: Main UI structure
- `sidepanel.js`: Application logic and AI integration
- `styles.css`: Material Design 3 styling
- `background.js`: Service worker for context menus and messaging
- `icons/`: Extension icons

## ⚠️ Limitations

- **Chrome Canary Only**: Requires latest Canary build with AI features
- **Device Requirements**: Needs compatible hardware for on-device AI
- **Region Restrictions**: Some regions may not have access to AI features yet
- **Model Availability**: Gemini Nano must be downloaded (happens automatically)

## 🤝 Contributing

Contributions are welcome! This extension is designed to be minimal and focused, but improvements to:

- UI/UX enhancements
- Performance optimizations
- Additional AI API integrations (Summarizer, Translator, etc.)
- Bug fixes

are always appreciated.

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Credits

- Google Chrome AI team for the amazing on-device AI capabilities
- Material Design team for the beautiful design system

---

**Note**: This is an experimental extension using preview APIs. Features may change as Chrome's AI capabilities evolve.
