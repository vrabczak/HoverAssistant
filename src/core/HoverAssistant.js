/**
 * Main HoverAssistant class - Core application controller
 * Manages GPS tracking, UI updates, and hover visualization
 */
export class HoverAssistant {
    constructor() {
        this.gpsManager = null;
        this.displayManager = null;
        this.uiManager = null;
        this.settingsManager = null;
        this.themeManager = null;

        this.markedPosition = null;
        this.currentPosition = null;
        this.isTracking = false;

        this.eventListeners = new Map();

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Import managers dynamically to support future modularity
            const { GPSManager } = await import('./GPSManager.js');
            const { DisplayManager } = await import('./DisplayManager.js');
            const { UIManager } = await import('./UIManager.js');
            const { SettingsManager } = await import('./SettingsManager.js');
            const { ThemeManager } = await import('./ThemeManager.js');

            // Initialize managers
            this.settingsManager = new SettingsManager();
            this.themeManager = new ThemeManager();
            this.gpsManager = new GPSManager(this.settingsManager.getGPSSettings());
            this.displayManager = new DisplayManager();
            this.uiManager = new UIManager();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize UI and Display
            await this.uiManager.init();
            await this.displayManager.init();

            console.log('HoverAssistant initialized successfully');
        } catch (error) {
            console.error('Failed to initialize HoverAssistant:', error);
            this.handleError('Initialization failed', error);
        }
    }

    /**
     * Setup event listeners between components
     */
    setupEventListeners() {
        // GPS Manager events
        this.gpsManager.addEventListener('connected', (event) => {
            this.onGPSConnected(event.detail);
        });

        this.gpsManager.addEventListener('disconnected', () => {
            this.onGPSDisconnected();
        });

        this.gpsManager.addEventListener('position', (event) => {
            this.onPositionUpdate(event.detail);
        });

        this.gpsManager.addEventListener('error', (event) => {
            this.onGPSError(event.detail);
        });

        // UI Manager events
        this.uiManager.addEventListener('ui:mark', () => {
            this.onMarkPosition();
        });

        this.uiManager.addEventListener('ui:permission-granted', () => {
            this.onPermissionGranted();
        });

        this.uiManager.addEventListener('ui:permission-denied', () => {
            this.onPermissionDenied();
        });

        // Settings Manager events
        this.settingsManager.addEventListener('settings:changed', (event) => {
            this.onSettingsChanged(event.detail);
        });

        // Theme Manager events
        this.themeManager.addEventListener('themeChanged', (data) => {
            this.onThemeChanged(data);
        });
    }

    /**
     * Add event listener
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Emit event
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Start GPS tracking
     */
    async startTracking() {
        try {
            if (!this.gpsManager) {
                throw new Error('GPS Manager not initialized');
            }

            await this.gpsManager.start();
            this.isTracking = true;
            console.log('GPS tracking started');
        } catch (error) {
            console.error('Failed to start GPS tracking:', error);
            this.handleError('Failed to start GPS tracking', error);
        }
    }

    /**
     * Stop GPS tracking
     */
    stopTracking() {
        if (this.gpsManager && this.isTracking) {
            this.gpsManager.stop();
            this.isTracking = false;
            console.log('GPS tracking stopped');
        }
    }

    /**
     * Handle GPS connection
     */
    onGPSConnected(data) {
        console.log('GPS connected:', data);
        this.uiManager.updateGPSStatus('connected', data.accuracy);
        this.uiManager.enableMarkButton();
    }

    /**
     * Handle GPS disconnection
     */
    onGPSDisconnected() {
        console.log('GPS disconnected');
        this.uiManager.updateGPSStatus('disconnected');
        this.uiManager.disableMarkButton();
    }

    /**
     * Handle position updates
     */
    onPositionUpdate(position) {
        this.currentPosition = position;

        if (this.markedPosition) {
            const distance = this.calculateDistance(this.markedPosition, position);
            const bearing = this.calculateBearing(this.markedPosition, position);

            // Update display
            this.displayManager.updatePosition(this.markedPosition, position);
            this.uiManager.updateCoordinates(distance, bearing);
        }

        this.uiManager.updateGPSStatus('connected', position.accuracy);
    }

    /**
     * Handle GPS errors
     */
    onGPSError(error) {
        console.error('GPS error:', error);
        this.uiManager.updateGPSStatus('error');
        this.handleError('GPS Error', error);
    }

    /**
     * Handle mark position
     */
    onMarkPosition() {
        if (this.currentPosition) {
            this.markedPosition = { ...this.currentPosition };
            this.displayManager.setMarkedPosition(this.markedPosition);
            console.log('Position marked:', this.markedPosition);
        }
    }

    /**
     * Handle permission granted
     */
    async onPermissionGranted() {
        console.log('Location permission granted');
        await this.startTracking();
    }

    /**
     * Handle permission denied
     */
    onPermissionDenied() {
        console.log('Location permission denied');
        this.handleError('Permission Denied', 'Location access is required for hover assistance');
    }

    /**
     * Handle settings changes
     */
    onSettingsChanged(settings) {
        console.log('Settings changed:', settings);

        if (settings.gps && this.gpsManager) {
            this.gpsManager.updateSettings(settings.gps);
        }

        if (settings.display && this.displayManager) {
            this.displayManager.updateSettings(settings.display);
        }
    }

    /**
     * Handle theme changes
     */
    onThemeChanged(data) {
        console.log('Theme changed from', data.previousTheme, 'to', data.newTheme);

        // Update display manager colors
        if (this.displayManager) {
            this.displayManager.onThemeChange();
        }
    }

    /**
     * Calculate distance between two positions (in meters)
     */
    calculateDistance(pos1, pos2) {
        const R = 6371000; // Earth's radius in meters
        const lat1Rad = pos1.latitude * Math.PI / 180;
        const lat2Rad = pos2.latitude * Math.PI / 180;
        const deltaLatRad = (pos2.latitude - pos1.latitude) * Math.PI / 180;
        const deltaLonRad = (pos2.longitude - pos1.longitude) * Math.PI / 180;

        const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Calculate bearing from pos1 to pos2 (in degrees)
     */
    calculateBearing(pos1, pos2) {
        const lat1Rad = pos1.latitude * Math.PI / 180;
        const lat2Rad = pos2.latitude * Math.PI / 180;
        const deltaLonRad = (pos2.longitude - pos1.longitude) * Math.PI / 180;

        const y = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);

        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }

    /**
     * Handle errors
     */
    handleError(title, error) {
        const message = error instanceof Error ? error.message : String(error);
        this.uiManager.showError(title, message);
    }

    /**
     * Cleanup application resources
     */
    destroy() {
        this.stopTracking();

        if (this.gpsManager) {
            this.gpsManager.destroy();
        }

        if (this.displayManager) {
            this.displayManager.destroy();
        }

        if (this.uiManager) {
            this.uiManager.destroy();
        }

        if (this.settingsManager) {
            this.settingsManager.destroy();
        }

        if (this.themeManager) {
            this.themeManager.destroy();
        }

        this.eventListeners.clear();
        console.log('HoverAssistant destroyed');
    }
}
