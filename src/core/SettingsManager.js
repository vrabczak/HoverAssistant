/**
 * SettingsManager - Handles application settings with persistence and validation
 */
export class SettingsManager {
    constructor() {
        this.settings = this.getDefaultSettings();
        this.eventTarget = new EventTarget();
        this.storageKey = 'helicopter-hover-assistant-settings';
        
        this.loadSettings();
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            gps: {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
                updateInterval: 1000 // Minimum time between updates in ms
            },
            display: {
                gridSize: 5, // meters
                gridScale: 1, // meter per unit
                circleCount: 5,
                circleScale: 1, // meter diameter increments
                dotSize: 8,
                animationSpeed: 1.0,
                showGrid: true,
                showCircles: true,
                showCoordinates: true
            },
            ui: {
                theme: 'dark',
                language: 'en',
                vibrationEnabled: true,
                soundEnabled: false,
                keepScreenOn: true
            },
            advanced: {
                debugMode: false,
                logLevel: 'info', // 'debug', 'info', 'warn', 'error'
                coordinateSystem: 'metric', // 'metric', 'imperial'
                bearingFormat: 'degrees', // 'degrees', 'radians'
                positionSmoothing: true,
                smoothingFactor: 0.1
            }
        };
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsedSettings = JSON.parse(stored);
                this.settings = this.mergeSettings(this.getDefaultSettings(), parsedSettings);
                console.log('Settings loaded from storage');
            }
        } catch (error) {
            console.warn('Failed to load settings from storage:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            console.log('Settings saved to storage');
        } catch (error) {
            console.warn('Failed to save settings to storage:', error);
        }
    }

    /**
     * Merge default settings with user settings
     */
    mergeSettings(defaults, userSettings) {
        const merged = { ...defaults };
        
        for (const [category, values] of Object.entries(userSettings)) {
            if (merged[category] && typeof merged[category] === 'object') {
                merged[category] = { ...merged[category], ...values };
            } else {
                merged[category] = values;
            }
        }
        
        return merged;
    }

    /**
     * Get all settings
     */
    getAllSettings() {
        return { ...this.settings };
    }

    /**
     * Get settings for a specific category
     */
    getSettings(category) {
        return this.settings[category] ? { ...this.settings[category] } : {};
    }

    /**
     * Get GPS settings
     */
    getGPSSettings() {
        return this.getSettings('gps');
    }

    /**
     * Get display settings
     */
    getDisplaySettings() {
        return this.getSettings('display');
    }

    /**
     * Get UI settings
     */
    getUISettings() {
        return this.getSettings('ui');
    }

    /**
     * Get advanced settings
     */
    getAdvancedSettings() {
        return this.getSettings('advanced');
    }

    /**
     * Update settings for a category
     */
    updateSettings(category, newSettings) {
        if (!this.settings[category]) {
            this.settings[category] = {};
        }

        const oldSettings = { ...this.settings[category] };
        this.settings[category] = { ...this.settings[category], ...newSettings };
        
        // Validate settings
        if (this.validateSettings(category, this.settings[category])) {
            this.saveSettings();
            this.emit('settings:changed', {
                category,
                oldSettings,
                newSettings: this.settings[category],
                [category]: this.settings[category]
            });
            console.log(`Settings updated for category: ${category}`);
        } else {
            // Revert on validation failure
            this.settings[category] = oldSettings;
            throw new Error(`Invalid settings for category: ${category}`);
        }
    }

    /**
     * Update a specific setting
     */
    updateSetting(category, key, value) {
        this.updateSettings(category, { [key]: value });
    }

    /**
     * Reset settings to defaults
     */
    resetSettings(category = null) {
        const defaults = this.getDefaultSettings();
        
        if (category) {
            this.settings[category] = { ...defaults[category] };
        } else {
            this.settings = { ...defaults };
        }
        
        this.saveSettings();
        this.emit('settings:reset', { category });
        console.log(category ? `Settings reset for category: ${category}` : 'All settings reset to defaults');
    }

    /**
     * Validate settings
     */
    validateSettings(category, settings) {
        switch (category) {
            case 'gps':
                return this.validateGPSSettings(settings);
            case 'display':
                return this.validateDisplaySettings(settings);
            case 'ui':
                return this.validateUISettings(settings);
            case 'advanced':
                return this.validateAdvancedSettings(settings);
            default:
                return true;
        }
    }

    /**
     * Validate GPS settings
     */
    validateGPSSettings(settings) {
        return (
            typeof settings.enableHighAccuracy === 'boolean' &&
            typeof settings.timeout === 'number' && settings.timeout > 0 &&
            typeof settings.maximumAge === 'number' && settings.maximumAge >= 0 &&
            typeof settings.updateInterval === 'number' && settings.updateInterval >= 100
        );
    }

    /**
     * Validate display settings
     */
    validateDisplaySettings(settings) {
        return (
            typeof settings.gridSize === 'number' && settings.gridSize > 0 &&
            typeof settings.gridScale === 'number' && settings.gridScale > 0 &&
            typeof settings.circleCount === 'number' && settings.circleCount > 0 &&
            typeof settings.circleScale === 'number' && settings.circleScale > 0 &&
            typeof settings.dotSize === 'number' && settings.dotSize > 0 &&
            typeof settings.animationSpeed === 'number' && settings.animationSpeed > 0
        );
    }

    /**
     * Validate UI settings
     */
    validateUISettings(settings) {
        const validThemes = ['dark', 'light'];
        const validLanguages = ['en', 'es', 'fr', 'de'];
        
        return (
            validThemes.includes(settings.theme) &&
            validLanguages.includes(settings.language) &&
            typeof settings.vibrationEnabled === 'boolean' &&
            typeof settings.soundEnabled === 'boolean' &&
            typeof settings.keepScreenOn === 'boolean'
        );
    }

    /**
     * Validate advanced settings
     */
    validateAdvancedSettings(settings) {
        const validLogLevels = ['debug', 'info', 'warn', 'error'];
        const validCoordinateSystems = ['metric', 'imperial'];
        const validBearingFormats = ['degrees', 'radians'];
        
        return (
            typeof settings.debugMode === 'boolean' &&
            validLogLevels.includes(settings.logLevel) &&
            validCoordinateSystems.includes(settings.coordinateSystem) &&
            validBearingFormats.includes(settings.bearingFormat) &&
            typeof settings.positionSmoothing === 'boolean' &&
            typeof settings.smoothingFactor === 'number' &&
            settings.smoothingFactor >= 0 && settings.smoothingFactor <= 1
        );
    }

    /**
     * Export settings to JSON
     */
    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }

    /**
     * Import settings from JSON
     */
    importSettings(jsonString) {
        try {
            const importedSettings = JSON.parse(jsonString);
            const merged = this.mergeSettings(this.getDefaultSettings(), importedSettings);
            
            // Validate all categories
            for (const category of Object.keys(merged)) {
                if (!this.validateSettings(category, merged[category])) {
                    throw new Error(`Invalid settings for category: ${category}`);
                }
            }
            
            this.settings = merged;
            this.saveSettings();
            this.emit('settings:imported', { settings: this.settings });
            console.log('Settings imported successfully');
        } catch (error) {
            console.error('Failed to import settings:', error);
            throw error;
        }
    }

    /**
     * Get setting value with fallback
     */
    getSetting(category, key, fallback = null) {
        return this.settings[category]?.[key] ?? fallback;
    }

    /**
     * Check if setting exists
     */
    hasSetting(category, key) {
        return this.settings[category]?.[key] !== undefined;
    }

    /**
     * Add event listener
     */
    addEventListener(event, callback) {
        this.eventTarget.addEventListener(event, callback);
    }

    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        this.eventTarget.removeEventListener(event, callback);
    }

    /**
     * Emit event
     */
    emit(event, data) {
        this.eventTarget.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.eventTarget = null;
        console.log('SettingsManager destroyed');
    }
}
