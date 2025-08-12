/**
 * DisplayManager - Handles canvas-based visualization of grid, circles, and position
 */
import { CompassController } from './CompassController.js';

export class DisplayManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.markedPosition = null;
        this.currentPosition = null;

        // Display settings - will be updated based on theme
        this.settings = {
            gridSize: 5, // 5 meters
            gridScale: 1, // 1 meter per unit
            circleCount: 5, // 5 circles
            circleScale: 1, // 1 meter diameter increments
            dotSize: 8,
            gridColor: '#333',
            circleColor: '#4CAF50',
            dotColor: '#FF5722',
            centerColor: '#FFF',
            backgroundColor: '#000',
            compassColor: '#4CAF50',
            headingColor: '#FF9800',
            labelColor: '#FFF'
        };

        this.animationId = null;
        this.isInitialized = false;
        this.pixelsPerMeter = 50; // Scale factor for display

        // Heading selection properties
        this.selectedHeading = 0; // Current selected heading in degrees (0 = North)
        this.compassRadius = 0; // Will be calculated based on canvas size
        this.compassController = null; // Will be initialized after canvas setup
    }

    /**
     * Initialize the display
     */
    async init() {
        try {
            this.canvas = document.getElementById('hover-display');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }

            this.ctx = this.canvas.getContext('2d');
            this.setupCanvas();
            this.updateThemeColors(); // Set initial theme colors
            this.updateHeadingDisplay(); // Initialize heading display
            this.startAnimation();

            this.isInitialized = true;
            console.log('DisplayManager initialized');
        } catch (error) {
            console.error('Failed to initialize DisplayManager:', error);
            throw error;
        }
    }

    /**
     * Update colors based on current theme
     */
    updateThemeColors() {
        const isLightTheme = document.documentElement.classList.contains('light-theme');

        if (isLightTheme) {
            // Light theme colors for day operations
            this.settings.backgroundColor = '#ffffff';
            this.settings.gridColor = '#ddd';
            this.settings.circleColor = '#2E7D32';
            this.settings.centerColor = '#333';
            this.settings.dotColor = '#d32f2f';
        } else {
            // Dark theme colors for night operations
            this.settings.backgroundColor = '#000';
            this.settings.gridColor = '#333';
            this.settings.circleColor = '#4CAF50';
            this.settings.centerColor = '#FFF';
            this.settings.dotColor = '#FF5722';
        }
    }

    /**
     * Handle theme change - call this when theme switches
     */
    onThemeChange() {
        this.updateThemeColors();
        // Redraw immediately to show new colors
        if (this.isInitialized) {
            this.draw();
        }
    }

    /**
     * Setup canvas dimensions and properties
     */
    setupCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Calculate the size for a square canvas that fits within the container
        const availableWidth = rect.width;
        const availableHeight = rect.height;
        const canvasSize = Math.min(availableWidth, availableHeight);

        // Set canvas size to be square
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;

        // Set CSS size to match canvas dimensions for proper scaling
        this.canvas.style.width = `${canvasSize}px`;
        this.canvas.style.height = `${canvasSize}px`;

        // Calculate pixels per meter based on canvas size
        const minDimension = canvasSize;
        this.pixelsPerMeter = (minDimension * 0.9) / (this.settings.gridSize * 2);

        // Setup canvas properties
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Handle resize
        window.addEventListener('resize', this.handleResize.bind(this));

        // Initialize compass controller
        this.compassController = new CompassController(this.canvas, (rotationDelta) => {
            this.onHeadingChange(rotationDelta);
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.canvas) {
            this.setupCanvas();
        }
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        const animate = () => {
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Stop animation loop
     */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Main draw function
     */
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Always draw grid and compass for testing
        this.drawGrid(centerX, centerY);
        this.drawCircles(centerX, centerY);
        this.drawCenterPoint(centerX, centerY);

        // Draw position dot only if we have both marked and current positions
        if (this.markedPosition && this.currentPosition) {
            this.drawPositionDot(centerX, centerY);
        }

        // Show instructions if no position is marked
        if (!this.markedPosition) {
            this.drawInstructions();
        }
    }

    /**
     * Draw grid (1 meter scale, 5 meters length)
     */
    drawGrid(centerX, centerY) {
        this.ctx.strokeStyle = this.settings.gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.6;

        const gridExtent = this.settings.gridSize * this.pixelsPerMeter;
        const meterStep = this.pixelsPerMeter;

        // Draw vertical lines
        for (let i = -this.settings.gridSize; i <= this.settings.gridSize; i++) {
            const x = centerX + (i * meterStep);
            this.ctx.beginPath();
            this.ctx.moveTo(x, centerY - gridExtent);
            this.ctx.lineTo(x, centerY + gridExtent);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let i = -this.settings.gridSize; i <= this.settings.gridSize; i++) {
            const y = centerY + (i * meterStep);
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - gridExtent, y);
            this.ctx.lineTo(centerX + gridExtent, y);
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw concentric circles (1 meter diameter increments, 4 circles + compass)
     */
    drawCircles(centerX, centerY) {
        this.ctx.strokeStyle = this.settings.circleColor;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;

        // Draw inner circles (1m to 4m)
        for (let i = 1; i < this.settings.circleCount; i++) {
            const radius = i * this.settings.circleScale * this.pixelsPerMeter;

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.ctx.stroke();

            // Draw circle labels
            this.ctx.fillStyle = this.settings.circleColor;
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${i}m`, centerX, centerY - radius - 5);
        }

        this.ctx.globalAlpha = 1;

        // Draw compass ring at 5m radius
        this.compassRadius = this.settings.circleCount * this.settings.circleScale * this.pixelsPerMeter;
        this.drawCompassRing(centerX, centerY);
    }

    /**
     * Draw center point (marked position)
     */
    drawCenterPoint(centerX, centerY) {
        this.ctx.fillStyle = this.settings.centerColor;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
        this.ctx.fill();

        // Draw crosshairs
        this.ctx.strokeStyle = this.settings.centerColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 10, centerY);
        this.ctx.lineTo(centerX + 10, centerY);
        this.ctx.moveTo(centerX, centerY - 10);
        this.ctx.lineTo(centerX, centerY + 10);
        this.ctx.stroke();
    }

    /**
     * Draw current position dot
     */
    drawPositionDot(centerX, centerY) {
        if (!this.markedPosition || !this.currentPosition) return;

        // Use Haversine-based coordinate conversion for improved accuracy
        const localCoords = this.gpsToLocalCoordinates(this.markedPosition, this.currentPosition);

        // Apply coordinate system transformation: East=X, North=Y
        let offsetX = localCoords.x;  // East offset in meters
        let offsetY = localCoords.y;  // North offset in meters

        // Rotate coordinates based on selected heading (negative to rotate world opposite to compass)
        const headingRad = -this.selectedHeading * Math.PI / 180; // Convert to radians and invert
        const rotatedX = offsetX * Math.cos(headingRad) - offsetY * Math.sin(headingRad);
        const rotatedY = offsetX * Math.sin(headingRad) + offsetY * Math.cos(headingRad);

        // Convert to pixels (note: canvas Y increases downward, so we negate Y)
        const pixelX = centerX + (rotatedX * this.pixelsPerMeter);
        const pixelY = centerY - (rotatedY * this.pixelsPerMeter); // Negative for canvas coordinate system

        // Draw position dot with pulsing effect
        const time = Date.now() * 0.003;
        const pulseSize = this.settings.dotSize + Math.sin(time) * 2;

        // Get color based on GPS accuracy
        const dotColor = this.currentPosition.accuracy ?
            this.getAccuracyColor(this.currentPosition.accuracy) :
            this.settings.dotColor;

        // Draw outer glow
        this.ctx.shadowColor = dotColor;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = dotColor;
        this.ctx.beginPath();
        this.ctx.arc(pixelX, pixelY, pulseSize, 0, 2 * Math.PI);
        this.ctx.fill();

        // Reset shadow
        this.ctx.shadowBlur = 0;

        // Draw inner dot
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(pixelX, pixelY, pulseSize * 0.4, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Draw instructions when no position is marked
     */
    drawInstructions() {
        this.ctx.fillStyle = '#666';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Press "Mark Position" to set reference point',
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }

    /**
     * Draw compass ring
     */
    drawCompassRing(centerX, centerY) {
        // Draw outer compass ring
        this.ctx.strokeStyle = this.settings.compassColor;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.compassRadius, 0, 2 * Math.PI);
        this.ctx.stroke();

        // Draw N/S/E/W labels that rotate with compass heading
        this.ctx.fillStyle = '#FFFFFF'; // Force white for visibility
        this.ctx.strokeStyle = '#000000'; // Black outline for contrast
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const labelRadius = this.compassRadius + 12;

        // Calculate positions for N/S/E/W based on current heading
        // North is at (selectedHeading - 90) degrees from screen coordinates
        const headingOffset = -this.selectedHeading * Math.PI / 180; // Convert to radians and invert

        // North position (always points to true north relative to heading)
        const northAngle = headingOffset - Math.PI / 2; // -90 degrees from heading
        const northX = centerX + Math.cos(northAngle) * labelRadius;
        const northY = centerY + Math.sin(northAngle) * labelRadius;
        this.ctx.strokeText('N', northX, northY);
        this.ctx.fillText('N', northX, northY);

        // South position (opposite of north)
        const southAngle = northAngle + Math.PI; // +180 degrees from north
        const southX = centerX + Math.cos(southAngle) * labelRadius;
        const southY = centerY + Math.sin(southAngle) * labelRadius;
        this.ctx.strokeText('S', southX, southY);
        this.ctx.fillText('S', southX, southY);

        // East position (90 degrees clockwise from north)
        const eastAngle = northAngle + Math.PI / 2; // +90 degrees from north
        const eastX = centerX + Math.cos(eastAngle) * labelRadius;
        const eastY = centerY + Math.sin(eastAngle) * labelRadius;
        this.ctx.strokeText('E', eastX, eastY);
        this.ctx.fillText('E', eastX, eastY);

        // West position (90 degrees counter-clockwise from north)
        const westAngle = northAngle - Math.PI / 2; // -90 degrees from north
        const westX = centerX + Math.cos(westAngle) * labelRadius;
        const westY = centerY + Math.sin(westAngle) * labelRadius;
        this.ctx.strokeText('W', westX, westY);
        this.ctx.fillText('W', westX, westY);
    }

    /**
     * Handle heading change from compass controller
     */
    onHeadingChange(rotationDelta) {
        this.selectedHeading = (this.selectedHeading + rotationDelta + 360) % 360;
        this.updateHeadingDisplay();
    }

    /**
     * Update the heading display in the coordinates panel
     */
    updateHeadingDisplay() {
        const headingElement = document.getElementById('heading-value');
        if (headingElement) {
            headingElement.textContent = `${Math.round(this.selectedHeading)}°`;
        }
    }

    /**
     * Get selected heading
     */
    getSelectedHeading() {
        return this.selectedHeading;
    }

    /**
     * Set selected heading
     */
    setSelectedHeading(heading) {
        this.selectedHeading = (heading + 360) % 360;
        this.updateHeadingDisplay();
    }

    /**
     * Set marked position (reference point)
     */
    setMarkedPosition(position) {
        this.markedPosition = position;
        console.log('Display: Marked position set', position);
    }

    /**
     * Update current position
     */
    updatePosition(markedPosition, currentPosition) {
        this.markedPosition = markedPosition;
        this.currentPosition = currentPosition;
    }

    /**
     * Reset display
     */
    reset() {
        this.markedPosition = null;
        this.currentPosition = null;
        console.log('Display: Reset');
    }

    /**
     * Update display settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('Display settings updated:', this.settings);
    }

    /**
     * Get display bounds in meters
     */
    getDisplayBounds() {
        return {
            width: this.canvas.width / this.pixelsPerMeter,
            height: this.canvas.height / this.pixelsPerMeter
        };
    }

    /**
     * Convert screen coordinates to meters
     */
    screenToMeters(screenX, screenY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        return {
            x: (screenX - centerX) / this.pixelsPerMeter,
            y: (centerY - screenY) / this.pixelsPerMeter // Flip Y axis
        };
    }

    /**
     * Convert meters to screen coordinates
     */
    metersToScreen(meterX, meterY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        return {
            x: centerX + (meterX * this.pixelsPerMeter),
            y: centerY - (meterY * this.pixelsPerMeter) // Flip Y axis
        };
    }

    /**
     * Get color based on GPS accuracy
     * @param {number} accuracy - GPS accuracy in meters
     * @returns {string} - Color hex code
     */
    getAccuracyColor(accuracy) {
        if (accuracy < 5) return '#2196F3'; // Blue for excellent accuracy
        if (accuracy < 10) return '#FF9800'; // Orange for good accuracy
        return '#FF5722'; // Red for poor accuracy
    }

    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     * @param {number} lat1 - First latitude in decimal degrees
     * @param {number} lon1 - First longitude in decimal degrees
     * @param {number} lat2 - Second latitude in decimal degrees
     * @param {number} lon2 - Second longitude in decimal degrees
     * @returns {number} Distance in meters
     */
    haversineDistance(lat1, lon1, lat2, lon2) {
        // Use WGS84 Earth radius for better accuracy
        const R = 6378137.0; // WGS84 equatorial radius in meters

        // Convert to radians with higher precision
        const φ1 = lat1 * (Math.PI / 180.0);
        const φ2 = lat2 * (Math.PI / 180.0);
        const Δφ = (lat2 - lat1) * (Math.PI / 180.0);
        const Δλ = (lon2 - lon1) * (Math.PI / 180.0);

        // For very small distances, use linear approximation to avoid precision loss
        if (Math.abs(Δφ) < 1e-8 && Math.abs(Δλ) < 1e-8) {
            // Linear approximation for distances < ~1 meter
            const avgLat = (φ1 + φ2) / 2.0;
            const x = Δλ * Math.cos(avgLat);
            const y = Δφ;
            return R * Math.sqrt(x * x + y * y);
        }

        // Standard Haversine for larger distances
        const a = Math.sin(Δφ / 2.0) * Math.sin(Δφ / 2.0) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2.0) * Math.sin(Δλ / 2.0);
        const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));

        return R * c;
    }

    /**
     * Calculate bearing between two GPS coordinates
     * @param {number} lat1 - First latitude in decimal degrees
     * @param {number} lon1 - First longitude in decimal degrees
     * @param {number} lat2 - Second latitude in decimal degrees
     * @param {number} lon2 - Second longitude in decimal degrees
     * @returns {number} Bearing in degrees (0-360, where 0 is North)
     */
    calculateBearing(lat1, lon1, lat2, lon2) {
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

        const bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360; // Normalize to 0-360 degrees
    }

    /**
     * Convert GPS coordinates to local Cartesian coordinates (East/North offsets)
     * Uses Local Tangent Plane (LTP) projection for improved accuracy at short distances
     * @param {Object} referencePos - Reference position {latitude, longitude}
     * @param {Object} currentPos - Current position {latitude, longitude}
     * @returns {Object} Local coordinates {x: eastOffset, y: northOffset} in meters
     */
    gpsToLocalCoordinates(referencePos, currentPos) {
        // Use WGS84 parameters for higher accuracy
        const a = 6378137.0; // WGS84 semi-major axis (equatorial radius)
        const f = 1.0 / 298.257223563; // WGS84 flattening
        const e2 = 2.0 * f - f * f; // First eccentricity squared

        // Convert to radians with explicit precision
        const φ0 = referencePos.latitude * (Math.PI / 180.0); // Reference latitude
        const λ0 = referencePos.longitude * (Math.PI / 180.0); // Reference longitude
        const φ = currentPos.latitude * (Math.PI / 180.0); // Current latitude
        const λ = currentPos.longitude * (Math.PI / 180.0); // Current longitude

        // Calculate differences
        const Δφ = φ - φ0;
        const Δλ = λ - λ0;

        // For very small distances (< 100m), use simplified local tangent plane
        if (Math.abs(Δφ) < 0.001 && Math.abs(Δλ) < 0.001) {
            // Radius of curvature in the meridian
            const M = a * (1.0 - e2) / Math.pow(1.0 - e2 * Math.sin(φ0) * Math.sin(φ0), 1.5);

            // Radius of curvature in the prime vertical
            const N = a / Math.sqrt(1.0 - e2 * Math.sin(φ0) * Math.sin(φ0));

            // Local tangent plane coordinates
            const northOffset = M * Δφ;
            const eastOffset = N * Math.cos(φ0) * Δλ;

            return {
                x: eastOffset,  // East is positive X
                y: northOffset // North is positive Y
            };
        }

        // For larger distances, fall back to Haversine-based calculation
        // Calculate East offset using Haversine at reference latitude
        const eastDistance = this.haversineDistance(
            referencePos.latitude, referencePos.longitude,
            referencePos.latitude, currentPos.longitude
        );
        const eastOffset = currentPos.longitude > referencePos.longitude ? eastDistance : -eastDistance;

        // Calculate North offset using Haversine
        const northDistance = this.haversineDistance(
            referencePos.latitude, referencePos.longitude,
            currentPos.latitude, referencePos.longitude
        );
        const northOffset = currentPos.latitude > referencePos.latitude ? northDistance : -northDistance;

        return {
            x: eastOffset,  // East is positive X
            y: northOffset // North is positive Y
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopAnimation();

        if (this.compassController) {
            this.compassController.destroy();
            this.compassController = null;
        }

        if (this.canvas) {
            window.removeEventListener('resize', this.handleResize.bind(this));
        }

        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;

        console.log('DisplayManager destroyed');
    }
}
