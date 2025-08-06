/**
 * UIManager - Handles user interface interactions and updates
 */
export class UIManager {
    constructor() {
        this.elements = {};
        this.eventTarget = new EventTarget();
        this.isInitialized = false;
    }

    /**
     * Initialize the UI manager
     */
    async init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.showPermissionModal();

            this.isInitialized = true;
            console.log('UIManager initialized');
        } catch (error) {
            console.error('Failed to initialize UIManager:', error);
            throw error;
        }
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Buttons
            markButton: document.getElementById('mark-button'),
            grantPermissionButton: document.getElementById('grant-permission'),
            denyPermissionButton: document.getElementById('deny-permission'),
            closeErrorButton: document.getElementById('close-error'),

            // Status indicators
            gpsStatus: document.getElementById('gps-status'),
            accuracyStatus: document.getElementById('accuracy-status'),

            // Coordinate displays
            distanceValue: document.getElementById('distance-value'),
            bearingValue: document.getElementById('bearing-value'),

            // Modals
            permissionModal: document.getElementById('permission-modal'),
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message')
        };

        // Validate all elements exist
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                throw new Error(`Element not found: ${key}`);
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mark button
        this.elements.markButton.addEventListener('click', () => {
            this.emit('ui:mark');
        });

        // Permission modal buttons
        this.elements.grantPermissionButton.addEventListener('click', () => {
            this.hidePermissionModal();
            this.emit('ui:permission-granted');
        });

        this.elements.denyPermissionButton.addEventListener('click', () => {
            this.hidePermissionModal();
            this.emit('ui:permission-denied');
        });

        // Error modal button
        this.elements.closeErrorButton.addEventListener('click', () => {
            this.hideErrorModal();
        });

        // Prevent context menu on touch devices
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    /**
     * Get CSS color class based on GPS accuracy
     * @param {number} accuracy - GPS accuracy in meters
     * @returns {string} - CSS class name
     */
    getAccuracyColorClass(accuracy) {
        if (accuracy < 5) return 'accuracy-excellent'; // Blue for excellent accuracy
        if (accuracy < 10) return 'accuracy-good'; // Orange for good accuracy
        return 'accuracy-poor'; // Red for poor accuracy
    }

    /**
     * Update GPS status indicator
     */
    updateGPSStatus(status, accuracy = null) {
        const statusElement = this.elements.gpsStatus;
        const accuracyElement = this.elements.accuracyStatus;

        // Remove existing status classes
        statusElement.classList.remove('connected', 'error');
        accuracyElement.classList.remove('connected', 'error', 'accuracy-excellent', 'accuracy-good', 'accuracy-poor');

        switch (status) {
            case 'connected':
                statusElement.textContent = 'GPS: Connected';
                statusElement.classList.add('connected');
                if (accuracy !== null) {
                    accuracyElement.textContent = `Accuracy: ${Math.round(accuracy)}m`;
                    accuracyElement.classList.remove('error');
                    accuracyElement.classList.add('connected');
                    // Add accuracy-based color class
                    accuracyElement.classList.add(this.getAccuracyColorClass(accuracy));
                }
                break;

            case 'disconnected':
                statusElement.textContent = 'GPS: Disconnected';
                accuracyElement.textContent = 'Accuracy: --';
                break;

            case 'error':
                statusElement.textContent = 'GPS: Error';
                statusElement.classList.add('error');
                accuracyElement.textContent = 'Accuracy: Error';
                accuracyElement.classList.add('error');
                break;
        }
    }

    /**
     * Update coordinate display
     */
    updateCoordinates(distance, bearing) {
        this.elements.distanceValue.textContent = `${distance.toFixed(2)}m`;
        this.elements.bearingValue.textContent = `${Math.round(bearing)}°`;
    }

    /**
     * Reset coordinate display
     */
    resetCoordinates() {
        this.elements.distanceValue.textContent = '--';
        this.elements.bearingValue.textContent = '--';
    }

    /**
     * Enable mark button
     */
    enableMarkButton() {
        this.elements.markButton.disabled = false;
    }

    /**
     * Disable mark button
     */
    disableMarkButton() {
        this.elements.markButton.disabled = true;
    }

    /**
     * Show permission modal
     */
    showPermissionModal() {
        this.elements.permissionModal.classList.remove('hidden');
    }

    /**
     * Hide permission modal
     */
    hidePermissionModal() {
        this.elements.permissionModal.classList.add('hidden');
    }

    /**
     * Show error modal
     */
    showError(title, message) {
        const modal = this.elements.errorModal;
        const messageElement = this.elements.errorMessage;

        // Update modal content
        const titleElement = modal.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = title;
        }

        messageElement.textContent = message;

        // Show modal
        modal.classList.remove('hidden');
    }

    /**
     * Hide error modal
     */
    hideErrorModal() {
        this.elements.errorModal.classList.add('hidden');
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Loading...') {
        // Could implement a loading spinner here
        console.log('Loading:', message);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        // Hide loading spinner
        console.log('Loading complete');
    }

    /**
     * Update button text
     */
    updateButtonText(buttonName, text) {
        const button = this.elements[buttonName];
        if (button) {
            const textElement = button.querySelector('.button-text');
            if (textElement) {
                textElement.textContent = text;
            }
        }
    }

    /**
     * Add visual feedback for button press
     */
    addButtonFeedback(buttonElement) {
        buttonElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
            buttonElement.style.transform = '';
        }, 150);
    }

    /**
     * Setup touch feedback for all buttons
     */
    setupTouchFeedback() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                this.addButtonFeedback(button);
            });
        });
    }

    /**
     * Handle device orientation changes
     */
    handleOrientationChange() {
        // Force layout recalculation after orientation change
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }

    /**
     * Setup orientation change handling
     */
    setupOrientationHandling() {
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });
    }

    /**
     * Emit event
     */
    emit(event, data) {
        this.eventTarget.dispatchEvent(new CustomEvent(event, { detail: data }));
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
     * Cleanup resources
     */
    destroy() {
        // Remove all event listeners
        Object.values(this.elements).forEach(element => {
            if (element && element.removeEventListener) {
                // Clone node to remove all event listeners
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });

        this.elements = {};
        this.eventTarget = null;
        this.isInitialized = false;

        console.log('UIManager destroyed');
    }
}
