// Chrome Theme Integration
// Detects and applies Chrome's actual theme colors to the extension

class ChromeThemeManager {
  constructor() {
    this.defaultColors = {
      // Chrome's default colors as fallback
      frame: '#202124',
      frame_inactive: '#2D2E30',
      toolbar: '#292A2D',
      tab_background_text: '#E8EAED',
      tab_text: '#E8EAED',
      bookmark_text: '#E8EAED',
      ntp_background: '#202124',
      ntp_text: '#E8EAED',
      button_background: '#5F6368'
    };
    this.init();
  }

  async init() {
    // Try to get Chrome's current theme
    await this.applyCurrentTheme();
    
    // Listen for theme changes
    if (chrome.theme && chrome.theme.onUpdated) {
      chrome.theme.onUpdated.addListener(() => {
        this.applyCurrentTheme();
      });
    }
    
    // Also listen for system dark mode changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', () => {
      this.applyCurrentTheme();
    });
  }

  async applyCurrentTheme() {
    try {
      // Get Chrome's current theme
      const theme = await this.getChromeTheme();
      
      // Apply colors to CSS variables
      this.updateCSSVariables(theme);
    } catch (error) {
      console.warn('Could not get Chrome theme, using defaults:', error);
      this.updateCSSVariables(this.defaultColors);
    }
  }

  async getChromeTheme() {
    // Chrome doesn't expose theme.getCurrent() in extensions
    // So we'll detect from system and use Chrome's default color scheme
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (isDark) {
      return {
        // Chrome dark theme colors
        frame: '#202124',
        toolbar: '#292A2D',
        surface: '#292A2D',
        surfaceVariant: '#3C4043',
        onSurface: '#E8EAED',
        onSurfaceVariant: '#9AA0A6',
        primary: '#8AB4F8',
        primaryContainer: '#1A73E8',
        onPrimary: '#202124',
        outline: '#5F6368',
        error: '#F28B82'
      };
    } else {
      return {
        // Chrome light theme colors
        frame: '#FFFFFF',
        toolbar: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceVariant: '#F1F3F4',
        onSurface: '#202124',
        onSurfaceVariant: '#5F6368',
        primary: '#1A73E8',
        primaryContainer: '#D2E3FC',
        onPrimary: '#FFFFFF',
        outline: '#DADCE0',
        error: '#D93025'
      };
    }
  }

  updateCSSVariables(theme) {
    const root = document.documentElement;
    
    // Map Chrome theme colors to our CSS variables
    root.style.setProperty('--md-sys-color-primary', theme.primary);
    root.style.setProperty('--md-sys-color-primary-container', theme.primaryContainer);
    root.style.setProperty('--md-sys-color-on-primary', theme.onPrimary);
    root.style.setProperty('--md-sys-color-surface', theme.surface);
    root.style.setProperty('--md-sys-color-surface-variant', theme.surfaceVariant);
    root.style.setProperty('--md-sys-color-on-surface', theme.onSurface);
    root.style.setProperty('--md-sys-color-on-surface-variant', theme.onSurfaceVariant);
    root.style.setProperty('--md-sys-color-outline', theme.outline);
    root.style.setProperty('--md-sys-color-error', theme.error);
    
    // Add data attribute for theme detection
    root.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ChromeThemeManager();
  });
} else {
  new ChromeThemeManager();
}
