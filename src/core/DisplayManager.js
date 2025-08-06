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

        // Set canvas size to match container
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Calculate pixels per meter based on canvas size
        const minDimension = Math.min(this.canvas.width, this.canvas.height);
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

        // Calculate offset from marked position
        const deltaLat = this.currentPosition.latitude - this.markedPosition.latitude;
        const deltaLon = this.currentPosition.longitude - this.markedPosition.longitude;

        // Convert to meters (approximate)
        const metersPerDegreeLat = 111320;
        const metersPerDegreeLon = 111320 * Math.cos(this.markedPosition.latitude * Math.PI / 180);

        const offsetX = deltaLon * metersPerDegreeLon;
        const offsetY = -deltaLat * metersPerDegreeLat; // Negative because canvas Y increases downward

        // Rotate coordinates based on selected heading (negative to rotate world opposite to compass)
        const headingRad = -this.selectedHeading * Math.PI / 180;
        const rotatedX = offsetX * Math.cos(headingRad) - offsetY * Math.sin(headingRad);
        const rotatedY = offsetX * Math.sin(headingRad) + offsetY * Math.cos(headingRad);

        // Convert to pixels
        const pixelX = centerX + (rotatedX * this.pixelsPerMeter);
        const pixelY = centerY + (rotatedY * this.pixelsPerMeter);

        // Draw position dot with pulsing effect
        const time = Date.now() * 0.003;
        const pulseSize = this.settings.dotSize + Math.sin(time) * 2;

        // Draw outer glow
        this.ctx.shadowColor = this.settings.dotColor;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = this.settings.dotColor;
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

        // Draw HDG value at top with prefix
        this.ctx.fillStyle = this.settings.headingColor;
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`HDG: ${Math.round(this.selectedHeading)}°`, centerX, centerY - this.compassRadius - 30);

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
