/**
 * DisplayManager - Handles canvas-based visualization of grid, circles, and position
 */
export class DisplayManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.markedPosition = null;
        this.currentPosition = null;
        
        // Display settings
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
            backgroundColor: '#000'
        };
        
        this.animationId = null;
        this.isInitialized = false;
        this.pixelsPerMeter = 50; // Scale factor for display
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
            this.startAnimation();
            
            this.isInitialized = true;
            console.log('DisplayManager initialized');
        } catch (error) {
            console.error('Failed to initialize DisplayManager:', error);
            throw error;
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
        this.pixelsPerMeter = (minDimension * 0.8) / (this.settings.gridSize * 2);
        
        // Setup canvas properties
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Handle resize
        window.addEventListener('resize', this.handleResize.bind(this));
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
            const radius = i * this.settings.circleScale * this.pixelsPerMeter / 2; // diameter to radius
            
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
