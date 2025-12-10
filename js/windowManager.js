// ========================================
// WINDOW MANAGER v2.0
// Bulletproof draggable window system
// Uses pointer events for smooth, glitch-free dragging
// ========================================

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.baseZIndex = 100;
        this.currentZIndex = this.baseZIndex;
        this.activeWindow = null;
        this.isDragging = false;

        // Drag state
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.windowStartX = 0;
        this.windowStartY = 0;

        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeWindows());
        } else {
            this.initializeWindows();
        }

        // Add window resize listener for responsive centering
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Handle window resize - keep visible windows within bounds
     */
    handleResize() {
        this.windows.forEach((windowInfo, windowId) => {
            const windowEl = windowInfo.element;

            // Only adjust visible windows
            if (!windowEl || !windowEl.classList.contains('active')) return;

            // Get current position
            const rect = windowEl.getBoundingClientRect();

            // If window is off-screen or too far out, recenter it
            if (rect.left < -100 || rect.top < 0 ||
                rect.right > window.innerWidth + 100 ||
                rect.bottom > window.innerHeight + 100) {
                this.centerWindowNow(windowEl);
            }
        });
    }

    initializeWindows() {
        // Find all windows with .app-window or .browser-window class
        const windows = document.querySelectorAll('.app-window, .browser-window');

        windows.forEach(windowEl => {
            this.setupWindow(windowEl);
            this.makeWindowDraggable(windowEl);
        });

        console.log(`✓ WindowManager v2.0 initialized with ${windows.length} windows`);
    }

    /**
     * Sets up initial window positioning
     */
    setupWindow(windowEl) {
        if (!windowEl) return;

        // Center the window immediately if it's visible
        if (windowEl.classList.contains('active') ||
            window.getComputedStyle(windowEl).display !== 'none') {
            this.centerWindowNow(windowEl);
        } else {
            // For hidden windows, center them when they become visible
            // Keep CSS centering for now, will be converted when opened
        }

        // Store window info
        this.windows.set(windowEl.id, {
            element: windowEl,
            zIndex: this.baseZIndex
        });
    }

    /**
     * Centers a window element right now (converts transform to left/top)
     */
    centerWindowNow(windowEl) {
        if (!windowEl) return;

        // Get window dimensions
        const rect = windowEl.getBoundingClientRect();
        const windowWidth = rect.width;
        const windowHeight = rect.height;

        // Calculate centered position
        const centerX = (window.innerWidth - windowWidth) / 2;
        const centerY = (window.innerHeight - windowHeight) / 2;

        // Set explicit left/top positioning
        windowEl.style.left = centerX + 'px';
        windowEl.style.top = centerY + 'px';
        windowEl.style.transform = 'none';
        windowEl.style.margin = '0';
    }

    /**
     * Makes a window element draggable using pointer events
     */
    makeWindowDraggable(windowEl) {
        if (!windowEl) return;

        const header = windowEl.querySelector('.window-header');
        if (!header) {
            console.warn('Window missing .window-header:', windowEl.id);
            return;
        }

        // Prevent text selection during drag
        header.style.userSelect = 'none';
        header.style.webkitUserSelect = 'none';
        header.style.cursor = 'grab';
        header.style.touchAction = 'none'; // Prevent touch scrolling

        // Use pointer events for better cross-device support
        header.addEventListener('pointerdown', (e) => {
            // Ignore if clicking on controls or buttons
            if (e.target.classList.contains('control') ||
                e.target.closest('.control') ||
                e.target.closest('button')) {
                return;
            }

            this.startDrag(windowEl, e);
        });

        // Click anywhere on window to bring to front
        windowEl.addEventListener('pointerdown', (e) => {
            this.bringToFront(windowEl);
        });
    }

    startDrag(windowEl, e) {
        e.preventDefault();
        e.stopPropagation();

        this.isDragging = true;
        this.activeWindow = windowEl;

        // Change cursor
        const header = windowEl.querySelector('.window-header');
        if (header) {
            header.style.cursor = 'grabbing';
        }

        // Store pointer start position
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        // Get window's CURRENT position (must parse or use getBoundingClientRect)
        const rect = windowEl.getBoundingClientRect();
        this.windowStartX = rect.left;
        this.windowStartY = rect.top;

        // CRITICAL: Set initial left/top explicitly if not already set
        // This prevents the window from jumping
        windowEl.style.left = this.windowStartX + 'px';
        windowEl.style.top = this.windowStartY + 'px';

        // Remove any transform that might interfere
        windowEl.style.transform = 'none';
        windowEl.style.margin = '0';

        // Disable transitions during drag for smooth movement
        windowEl.style.transition = 'none';

        // Bring to front
        this.bringToFront(windowEl);

        // Add global pointer move and up listeners
        document.addEventListener('pointermove', this.handleDrag);
        document.addEventListener('pointerup', this.stopDrag);
        document.addEventListener('pointercancel', this.stopDrag);

        // Prevent text selection during drag
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    }

    handleDrag = (e) => {
        if (!this.isDragging || !this.activeWindow) return;

        e.preventDefault();
        e.stopPropagation();

        const windowEl = this.activeWindow;

        // Calculate how far the pointer has moved
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;

        // Calculate new position (window start + delta)
        let newX = this.windowStartX + deltaX;
        let newY = this.windowStartY + deltaY;

        // Get window dimensions for constraints
        const rect = windowEl.getBoundingClientRect();
        const windowWidth = rect.width;
        const windowHeight = rect.height;

        // Constrain to viewport (keep at least 50px of header visible)
        const minX = -windowWidth + 100; // Allow partial off-screen
        const minY = 0; // Don't allow dragging above viewport
        const maxX = window.innerWidth - 100; // Keep 100px visible on right
        const maxY = window.innerHeight - 50; // Keep 50px visible on bottom

        // Apply constraints
        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));

        // Update position using left/top (NOT transform)
        windowEl.style.left = newX + 'px';
        windowEl.style.top = newY + 'px';
    }

    stopDrag = (e) => {
        if (!this.isDragging) return;

        e.preventDefault();

        this.isDragging = false;

        // Reset cursor
        if (this.activeWindow) {
            const header = this.activeWindow.querySelector('.window-header');
            if (header) {
                header.style.cursor = 'grab';
            }

            // Re-enable transitions after a brief delay
            setTimeout(() => {
                if (this.activeWindow) {
                    this.activeWindow.style.transition = '';
                }
            }, 50);
        }

        this.activeWindow = null;

        // Remove global listeners
        document.removeEventListener('pointermove', this.handleDrag);
        document.removeEventListener('pointerup', this.stopDrag);
        document.removeEventListener('pointercancel', this.stopDrag);

        // Re-enable text selection
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
    }

    /**
     * Brings a window to the front by adjusting z-index
     */
    bringToFront(windowEl) {
        if (!windowEl) return;

        this.currentZIndex++;
        windowEl.style.zIndex = this.currentZIndex;

        // Update stored z-index
        if (this.windows.has(windowEl.id)) {
            this.windows.get(windowEl.id).zIndex = this.currentZIndex;
        }
    }

    /**
     * Shows a window and brings it to front
     */
    showWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) {
            console.warn('Window not found:', windowId);
            return;
        }

        // Make sure window is set up
        if (!this.windows.has(windowId)) {
            this.setupWindow(windowEl);
            this.makeWindowDraggable(windowEl);
        }

        // Show the window
        windowEl.classList.add('active');

        // CRITICAL: Center the window immediately after making it visible
        // This ensures all windows open perfectly centered
        this.centerWindowNow(windowEl);

        // Bring to front
        this.bringToFront(windowEl);

        // Trigger any app-specific initialization
        if (windowId === 'cameraWindow' && window.desktopApps) {
            window.desktopApps.startWebcam();
        } else if (windowId === 'notepadWindow' && window.desktopApps) {
            window.desktopApps.setupDrawingCanvas();
        }
    }

    /**
     * Hides a window
     */
    hideWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        windowEl.classList.remove('active');

        // Stop camera stream if closing camera window
        if (windowId === 'cameraWindow' && window.desktopApps) {
            window.desktopApps.stopCamera();
        }
    }

    /**
     * Centers a window in the viewport (public API method)
     */
    centerWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        this.centerWindowNow(windowEl);
    }

    /**
     * Resets a window to its default centered position
     */
    resetWindowPosition(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        // Remove inline styles
        windowEl.style.left = '';
        windowEl.style.top = '';
        windowEl.style.transform = '';

        // Re-setup the window
        this.setupWindow(windowEl);
    }

    /**
     * Makes the drawn computer illustration draggable
     * Special handling for drawn mode - draggable but not interactive
     */
    makeDrawnComputerDraggable(element) {
        if (!element) return;

        // Use the entire element as draggable area (no specific header)
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
        element.style.touchAction = 'none';

        // Add pointer events for dragging
        element.addEventListener('pointerdown', (e) => {
            // Start drag on the drawn computer
            this.startDrag(element, e);
        });

        console.log('✓ Drawn computer illustration made draggable');
    }
}

// Initialize window manager globally
window.windowManager = new WindowManager();
