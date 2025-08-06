import './styles.css';
import { HoverAssistant } from './core/HoverAssistant.js';

/**
 * Main application entry point
 */
class App {
    constructor() {
        this.hoverAssistant = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Helicopter Hover Assistant...');

            // Check for required browser features
            this.checkBrowserSupport();

            // Initialize the main application
            this.hoverAssistant = new HoverAssistant();

            // Setup global error handling
            this.setupErrorHandling();

            // Setup service worker for PWA functionality
            await this.setupServiceWorker();

            // Setup wake lock to keep screen on
            this.setupWakeLock();

            this.isInitialized = true;
            console.log('Helicopter Hover Assistant initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showFatalError('Initialization Error', error.message);
        }
    }

    /**
     * Check browser support for required features
     */
    checkBrowserSupport() {
        const requiredFeatures = [
            { name: 'Geolocation', check: () => 'geolocation' in navigator },
            { name: 'Canvas', check: () => !!document.createElement('canvas').getContext },
            { name: 'Local Storage', check: () => typeof Storage !== 'undefined' },
            { name: 'ES6 Modules', check: () => typeof Symbol !== 'undefined' }
        ];

        const unsupported = requiredFeatures.filter(feature => !feature.check());

        if (unsupported.length > 0) {
            const missing = unsupported.map(f => f.name).join(', ');
            throw new Error(`Browser does not support required features: ${missing}`);
        }
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            if (this.hoverAssistant) {
                this.hoverAssistant.handleError('Application Error', event.error?.message || 'Unknown error');
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            if (this.hoverAssistant) {
                this.hoverAssistant.handleError('Promise Error', event.reason?.message || 'Promise rejection');
            }
            event.preventDefault();
        });
    }

    /**
     * Setup service worker for PWA functionality
     */
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered successfully:', registration.scope);

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    console.log('Service Worker update found');
                    const newWorker = registration.installing;

                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New service worker is installed and ready
                                this.showUpdateNotification();
                            }
                        });
                    }
                });

                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                        this.showUpdateNotification(event.data.message);
                    }
                });

                // Check for updates manually
                if (registration.waiting) {
                    this.showUpdateNotification();
                }

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 5 * 60 * 1000); // Check every 5 minutes

            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        } else {
            console.log('Service Worker not supported');
        }
    }

    /**
     * Setup wake lock to keep screen on during use
     */
    async setupWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                // Request wake lock when app becomes visible
                document.addEventListener('visibilitychange', async () => {
                    if (!document.hidden && this.isInitialized) {
                        try {
                            const wakeLock = await navigator.wakeLock.request('screen');
                            console.log('Screen wake lock acquired');

                            wakeLock.addEventListener('release', () => {
                                console.log('Screen wake lock released');
                            });
                        } catch (error) {
                            console.warn('Failed to acquire wake lock:', error);
                        }
                    }
                });
            } catch (error) {
                console.warn('Wake lock not supported or failed:', error);
            }
        }
    }

    /**
     * Show fatal error when app cannot initialize
     */
    showFatalError(title, message) {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #1a1a1a;
                color: #fff;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <h1 style="color: #f44336; margin-bottom: 20px;">${title}</h1>
                <p style="margin-bottom: 20px; line-height: 1.5;">${message}</p>
                <p style="color: #ccc; font-size: 14px;">
                    Please try refreshing the page or use a modern browser with GPS support.
                </p>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 12px 24px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                ">Retry</button>
            </div>
        `;
    }

    /**
     * Show update notification to user
     */
    showUpdateNotification(message = 'A new version is available!') {
        // Create update notification
        const notification = document.createElement('div');
        notification.id = 'update-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: Arial, sans-serif;
                max-width: 300px;
                animation: slideIn 0.3s ease-out;
            ">
                <div style="margin-bottom: 10px; font-weight: bold;">
                    📱 Update Available
                </div>
                <div style="margin-bottom: 15px; font-size: 14px;">
                    ${message}
                </div>
                <div>
                    <button id="update-now" style="
                        background: white;
                        color: #4CAF50;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        margin-right: 8px;
                    ">Update Now</button>
                    <button id="update-later" style="
                        background: transparent;
                        color: white;
                        border: 1px solid white;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Later</button>
                </div>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;

        // Remove existing notification if any
        const existing = document.getElementById('update-notification');
        if (existing) {
            existing.remove();
        }

        document.body.appendChild(notification);

        // Handle update now button
        document.getElementById('update-now').addEventListener('click', () => {
            this.applyUpdate();
            notification.remove();
        });

        // Handle later button
        document.getElementById('update-later').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (document.getElementById('update-notification')) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Apply the service worker update
     */
    async applyUpdate() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration && registration.waiting) {
                // Tell the waiting service worker to skip waiting
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });

                // Reload the page to get the new version
                window.location.reload();
            } else {
                // Force check for updates
                if (registration) {
                    await registration.update();
                }
                window.location.reload();
            }
        }
    }

    /**
     * Cleanup application resources
     */
    destroy() {
        if (this.hoverAssistant) {
            this.hoverAssistant.destroy();
            this.hoverAssistant = null;
        }

        this.isInitialized = false;
        console.log('Application destroyed');
    }
}

/**
 * Application lifecycle management
 */
let app = null;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

async function initializeApp() {
    try {
        app = new App();
        await app.init();
    } catch (error) {
        console.error('Failed to start application:', error);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('App hidden - pausing GPS tracking');
        if (app?.hoverAssistant) {
            app.hoverAssistant.stopTracking();
        }
    } else {
        console.log('App visible - resuming GPS tracking');
        if (app?.hoverAssistant && app.hoverAssistant.markedPosition) {
            app.hoverAssistant.startTracking();
        }
    }
});

// Export for debugging
window.HoverAssistantApp = app;
