/**
 * CompassController - Handles intuitive drag-based compass rotation
 * Drag direction controls compass rotation based on position relative to center
 */
export class CompassController {
    constructor(canvas, onHeadingChange) {
        this.canvas = canvas;
        this.onHeadingChange = onHeadingChange; // Callback function when heading changes

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.centerX = 0;
        this.centerY = 0;

        // Sensitivity for rotation (degrees per pixel of movement)
        this.sensitivity = 0.67; // Reduced from 2 to make rotation 3x slower

        // Bind event handlers
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        this.init();
    }

    /**
     * Initialize event listeners
     */
    init() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('mouseleave', this.handleMouseUp); // Stop dragging if mouse leaves canvas

        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('touchmove', this.handleTouchMove);
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd);

        this.updateCenter();
    }

    /**
     * Update center coordinates
     */
    updateCenter() {
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    /**
     * Handle mouse down event
     */
    handleMouseDown(event) {
        this.isDragging = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        this.updateCenter();
        event.preventDefault();
    }

    /**
     * Handle mouse move event
     */
    handleMouseMove(event) {
        if (!this.isDragging) return;

        const currentX = event.clientX;
        const currentY = event.clientY;

        // Calculate movement delta
        const deltaX = currentX - this.lastMouseX;
        const deltaY = currentY - this.lastMouseY;

        // Get canvas position
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = currentX - rect.left;
        const canvasY = currentY - rect.top;

        // Calculate rotation based on position and movement
        const rotationDelta = this.calculateRotationDelta(canvasX, canvasY, deltaX, deltaY);

        if (rotationDelta !== 0 && this.onHeadingChange) {
            this.onHeadingChange(rotationDelta);
        }

        // Update last position
        this.lastMouseX = currentX;
        this.lastMouseY = currentY;

        event.preventDefault();
    }

    /**
     * Handle mouse up event
     */
    handleMouseUp(event) {
        this.isDragging = false;
    }

    /**
     * Handle touch start event
     */
    handleTouchStart(event) {
        if (event.touches.length > 0) {
            this.isDragging = true;
            this.lastMouseX = event.touches[0].clientX;
            this.lastMouseY = event.touches[0].clientY;
            this.updateCenter();
            event.preventDefault();
        }
    }

    /**
     * Handle touch move event
     */
    handleTouchMove(event) {
        if (!this.isDragging || event.touches.length === 0) return;

        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;

        // Calculate movement delta
        const deltaX = currentX - this.lastMouseX;
        const deltaY = currentY - this.lastMouseY;

        // Get canvas position
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = currentX - rect.left;
        const canvasY = currentY - rect.top;

        // Calculate rotation based on position and movement
        const rotationDelta = this.calculateRotationDelta(canvasX, canvasY, deltaX, deltaY);

        if (rotationDelta !== 0 && this.onHeadingChange) {
            this.onHeadingChange(rotationDelta);
        }

        // Update last position
        this.lastMouseX = currentX;
        this.lastMouseY = currentY;

        event.preventDefault();
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd(event) {
        this.isDragging = false;
        event.preventDefault();
    }

    /**
     * Calculate rotation delta based on position and movement
     * Returns positive for clockwise, negative for counter-clockwise
     */
    calculateRotationDelta(canvasX, canvasY, deltaX, deltaY) {
        // Calculate position relative to center
        const relativeX = canvasX - this.centerX;
        const relativeY = canvasY - this.centerY;

        // Calculate which quadrant we're in and apply appropriate rotation logic
        let rotationDelta = 0;

        if (relativeY < 0) {
            // Top half of canvas
            rotationDelta = -deltaX * this.sensitivity; // Left = counter-clockwise, Right = clockwise
        } else {
            // Bottom half of canvas
            rotationDelta = deltaX * this.sensitivity; // Left = clockwise, Right = counter-clockwise
        }

        if (relativeX < 0) {
            // Left half of canvas
            rotationDelta += deltaY * this.sensitivity; // Up = clockwise, Down = counter-clockwise
        } else {
            // Right half of canvas
            rotationDelta += -deltaY * this.sensitivity; // Up = counter-clockwise, Down = clockwise
        }

        return rotationDelta;
    }

    /**
     * Set sensitivity for rotation control
     */
    setSensitivity(sensitivity) {
        this.sensitivity = sensitivity;
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mouseleave', this.handleMouseUp);

        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
    }
}
