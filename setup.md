# Quick Setup Guide 🚀

## Prerequisites Check

Before you start, verify you have:

- [ ] Chrome Canary installed
- [ ] Chrome version 127 or higher
- [ ] AI flags enabled

## Step-by-Step Setup

### 1. Enable Chrome AI Features

Open Chrome Canary and paste these URLs one by one:

```
chrome://flags/#optimization-guide-on-device-model
chrome://flags/#prompt-api-for-gemini-nano
```

Set both to **Enabled** and restart Chrome.

### 2. Download the AI Model

1. Go to `chrome://components/`
2. Find "Optimization Guide On Device Model"
3. Click "Check for update"
4. Wait for the download to complete (this might take several minutes)

### 3. Install the Extension

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome Canary
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select this folder

### 4. Test It Out!

1. Click the extension icon (or press `Ctrl+Shift+Y`)
2. Type a message and hit Enter
3. Enjoy instant AI responses! ✨

## Troubleshooting

### "Chrome AI not available" error

- Make sure you're using Chrome Canary (not stable Chrome)
- Verify both flags are enabled at `chrome://flags`
- Check if the model is downloaded at `chrome://components/`
- Restart Chrome after enabling flags

### Model not downloading

- Check your internet connection
- Some regions may not have access yet
- Try updating Chrome Canary to the latest version

### Extension not loading

- Make sure Developer mode is enabled
- Check for errors in `chrome://extensions/`
- Try reloading the extension

## Need Help?

Open an issue on GitHub with:
- Your Chrome Canary version
- Error messages (if any)
- Steps to reproduce the problem
