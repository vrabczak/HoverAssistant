/**
 * DisplayManager - Handles canvas-based visualization of grid, circles, and position
 */
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
        this.isDragging = false;
        this.compassRadius = 0; // Will be calculated based on canvas size
        this.compassRingWidth = 30;

        // Bind event handlers
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
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

        // Add event listeners for heading selection
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('touchmove', this.handleTouchMove);
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
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
        if (!this.ctx) return;

        // Update theme colors on each draw to ensure consistency
        this.updateThemeColors();

        // Clear canvas
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        if (this.markedPosition) {
            // Draw grid
            this.drawGrid(centerX, centerY);

            // Draw circles
            this.drawCircles(centerX, centerY);

            // Draw center point
            this.drawCenterPoint(centerX, centerY);

            // Draw current position dot
            if (this.currentPosition) {
                this.drawPositionDot(centerX, centerY);
            }

            // Draw compass ring
            this.drawCompassRing(centerX, centerY);
        } else {
            // Draw instructions when no position is marked
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
     * Draw concentric circles (1 meter diameter increments, 5 circles)
     */
    drawCircles(centerX, centerY) {
        this.ctx.strokeStyle = this.settings.circleColor;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;

        for (let i = 1; i <= this.settings.circleCount; i++) {
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

        // Convert to pixels
        const pixelX = centerX + (offsetX * this.pixelsPerMeter);
        const pixelY = centerY + (offsetY * this.pixelsPerMeter);

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

        // Draw HDG label at top (EHSI style)
        this.ctx.fillStyle = this.settings.labelColor;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('HDG', centerX, centerY - this.compassRadius - 40);

        // Draw N/S/E/W labels on the outer ring
        this.ctx.fillStyle = this.settings.labelColor;
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const labelRadius = this.compassRadius + 25;
        this.ctx.fillText('N', centerX, centerY - labelRadius);
        this.ctx.fillText('S', centerX, centerY + labelRadius);
        this.ctx.fillText('E', centerX + labelRadius, centerY);
        this.ctx.fillText('W', centerX - labelRadius, centerY);

        // Draw heading indicator line
        const headingRadians = (this.selectedHeading - 90) * Math.PI / 180; // -90 to make 0° point north
        const innerRadius = this.compassRadius - 15;
        const outerRadius = this.compassRadius + 15;

        const innerX = centerX + Math.cos(headingRadians) * innerRadius;
        const innerY = centerY + Math.sin(headingRadians) * innerRadius;
        const outerX = centerX + Math.cos(headingRadians) * outerRadius;
        const outerY = centerY + Math.sin(headingRadians) * outerRadius;

        this.ctx.strokeStyle = this.settings.headingColor;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(innerX, innerY);
        this.ctx.lineTo(outerX, outerY);
        this.ctx.stroke();

        // Draw current heading value below compass
        this.ctx.fillStyle = this.settings.headingColor;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${Math.round(this.selectedHeading)}°`, centerX, centerY + this.compassRadius + 60);
    }

    /**
     * Handle mouse down event
     */
    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

        if (distance <= this.compassRadius + this.compassRingWidth / 2) {
            this.isDragging = true;
        }
    }

    /**
     * Handle mouse move event
     */
    handleMouseMove(event) {
        if (!this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;

        this.selectedHeading = (angle + 360) % 360;
    }

    /**
     * Handle mouse up event
     */
    handleMouseUp() {
        this.isDragging = false;
    }

    /**
     * Handle touch start event
     */
    handleTouchStart(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.touches[0].clientX - rect.left;
        const y = event.touches[0].clientY - rect.top;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

        if (distance <= this.compassRadius + this.compassRingWidth / 2) {
            this.isDragging = true;
        }
    }

    /**
     * Handle touch move event
     */
    handleTouchMove(event) {
        if (!this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.touches[0].clientX - rect.left;
        const y = event.touches[0].clientY - rect.top;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;

        this.selectedHeading = (angle + 360) % 360;
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd() {
        this.isDragging = false;
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

        if (this.canvas) {
            window.removeEventListener('resize', this.handleResize.bind(this));
        }

        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;

        console.log('DisplayManager destroyed');
    }
}
