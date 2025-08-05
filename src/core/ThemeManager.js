/**
 * Theme Manager for Day/Night mode switching
 * Handles theme persistence and UI updates
 */
export class ThemeManager {
    constructor() {
        this.currentTheme = 'dark'; // Default to dark theme (night mode)
        this.themeToggleButton = null;
        this.themeIcon = null;
        this.eventListeners = new Map();

        this.init();
    }

    /**
     * Initialize the theme manager
     */
    init() {
        // Get theme toggle elements
        this.themeToggleButton = document.getElementById('theme-toggle');
        this.themeIcon = document.querySelector('.theme-icon');

        if (!this.themeToggleButton || !this.themeIcon) {
            console.warn('Theme toggle elements not found');
            return;
        }

        // Load saved theme preference
        this.loadThemePreference();

        // Setup event listeners
        this.setupEventListeners();

        // Apply initial theme
        this.applyTheme(this.currentTheme);

        console.log('ThemeManager initialized with theme:', this.currentTheme);
    }

    /**
     * Setup event listeners for theme toggle
     */
    setupEventListeners() {
        this.themeToggleButton.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Handle keyboard accessibility
        this.themeToggleButton.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Set a specific theme
     * @param {string} theme - 'light' or 'dark'
     */
    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.warn('Invalid theme:', theme);
            return;
        }

        const previousTheme = this.currentTheme;
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveThemePreference(theme);

        // Emit theme change event
        this.emit('themeChanged', {
            newTheme: theme,
            previousTheme: previousTheme
        });

        console.log('Theme changed to:', theme);
    }

    /**
     * Apply theme to the document
     * @param {string} theme - 'light' or 'dark'
     */
    applyTheme(theme) {
        const root = document.documentElement;

        if (theme === 'light') {
            root.classList.add('light-theme');
            this.themeIcon.textContent = '☀️';
            this.themeToggleButton.title = 'Switch to Night Mode';
        } else {
            root.classList.remove('light-theme');
            this.themeIcon.textContent = '🌙';
            this.themeToggleButton.title = 'Switch to Day Mode';
        }

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
    }

    /**
     * Update meta theme-color for mobile browser UI
     * @param {string} theme - 'light' or 'dark'
     */
    updateMetaThemeColor(theme) {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            if (theme === 'light') {
                metaThemeColor.setAttribute('content', '#2E7D32'); // Light theme accent
            } else {
                metaThemeColor.setAttribute('content', '#4CAF50'); // Dark theme accent
            }
        }
    }

    /**
     * Save theme preference to localStorage
     * @param {string} theme - 'light' or 'dark'
     */
    saveThemePreference(theme) {
        try {
            localStorage.setItem('hoverAssistant_theme', theme);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }

    /**
     * Load theme preference from localStorage
     */
    loadThemePreference() {
        try {
            const savedTheme = localStorage.getItem('hoverAssistant_theme');
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                this.currentTheme = savedTheme;
            } else {
                // Auto-detect based on system preference if no saved preference
                this.currentTheme = this.detectSystemTheme();
            }
        } catch (error) {
            console.warn('Failed to load theme preference:', error);
            this.currentTheme = this.detectSystemTheme();
        }
    }

    /**
     * Detect system theme preference
     * @returns {string} 'light' or 'dark'
     */
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark'; // Default to dark for helicopter operations
    }

    /**
     * Get current theme
     * @returns {string} Current theme ('light' or 'dark')
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if current theme is dark
     * @returns {boolean} True if dark theme is active
     */
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    /**
     * Check if current theme is light
     * @returns {boolean} True if light theme is active
     */
    isLightTheme() {
        return this.currentTheme === 'light';
    }

    /**
     * Listen for system theme changes
     */
    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const savedTheme = localStorage.getItem('hoverAssistant_theme');
                if (!savedTheme) {
                    const systemTheme = e.matches ? 'light' : 'dark';
                    this.setTheme(systemTheme);
                }
            });
        }
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to all listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ThemeManager event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Cleanup theme manager resources
     */
    destroy() {
        if (this.themeToggleButton) {
            this.themeToggleButton.removeEventListener('click', this.toggleTheme);
        }
        this.eventListeners.clear();
        console.log('ThemeManager destroyed');
    }
}
