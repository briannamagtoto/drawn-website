// ========================================
// DRAWING MODE MANAGER
// Transforms the entire page into a hand-drawn aesthetic
// Swaps desktop icons for hand-drawn versions and freezes UI
// ========================================

class DrawingModeManager {
    constructor() {
        this.isDrawingMode = false;
        this.toggleButton = null;
        this.body = document.body;

        // Icon swapping storage
        this.originalIcons = {};

        // Interaction blocking handlers
        this.interactionBlocker = null;
        this.keyBlocker = null;
        this.submitBlocker = null;
        this.contextMenuBlocker = null;

        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.toggleButton = document.getElementById('drawingModeToggle');

        if (!this.toggleButton) {
            console.error('Drawing mode toggle button not found!');
            return;
        }

        // Check if user previously enabled drawing mode (localStorage)
        this.loadSavedPreference();

        // Add click event listener
        this.toggleButton.addEventListener('click', () => this.toggle());

        // Add keyboard shortcut (Ctrl/Cmd + D)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    // ========================================
    // ICON SWAPPING
    // ========================================

    swapToDrawnIcons() {
        const iconMappings = [
            { id: 'cameraIcon', emoji: '📷', imagePath: 'assets/drawn/drawn-camera.png' },
            { id: 'notepadIcon', emoji: '✏️', imagePath: 'assets/drawn/drawn-pencil.png' },
            { id: 'galleryIcon', emoji: '🖼️', imagePath: 'assets/drawn/drawn-gallery-frame.png' }
        ];

        iconMappings.forEach(mapping => {
            const icon = document.getElementById(mapping.id);
            if (!icon) return;

            const iconImage = icon.querySelector('.icon-image');
            if (!iconImage) return;

            // Store original emoji
            this.originalIcons[mapping.id] = iconImage.textContent;

            // Replace with drawn version
            iconImage.textContent = '';
            iconImage.style.backgroundImage = `url('${mapping.imagePath}')`;
            iconImage.style.backgroundSize = 'contain';
            iconImage.style.backgroundRepeat = 'no-repeat';
            iconImage.style.backgroundPosition = 'center';
        });

        console.log('✏️ Swapped to hand-drawn icons');
    }

    restoreOriginalIcons() {
        Object.keys(this.originalIcons).forEach(iconId => {
            const icon = document.getElementById(iconId);
            if (!icon) return;

            const iconImage = icon.querySelector('.icon-image');
            if (!iconImage) return;

            // Restore original emoji
            iconImage.style.backgroundImage = '';
            iconImage.textContent = this.originalIcons[iconId];
        });

        this.originalIcons = {};
        console.log('🖥️ Restored original icons');
    }

    // ========================================
    // TOGGLE FUNCTION
    // ========================================

    toggle() {
        this.isDrawingMode = !this.isDrawingMode;

        if (this.isDrawingMode) {
            this.enableDrawingMode();
        } else {
            this.disableDrawingMode();
        }

        // Save preference
        this.savePreference();
    }

    // ========================================
    // ENABLE DRAWING MODE
    // ========================================

    enableDrawingMode() {
        // Add the drawn-mode class immediately (no transitions)
        this.body.classList.add('drawn-mode');

        // Update button emoji to computer
        this.updateButtonIcon('🖥️');

        // Swap icons to hand-drawn versions
        this.swapToDrawnIcons();

        // Center and show drawn computer illustration
        this.showDrawnComputer();

        // Block all JS-level interactions (except drawn computer dragging)
        this.blockInteractions();

        console.log('✏️ Drawing mode enabled - UI frozen');
    }

    // ========================================
    // DISABLE DRAWING MODE
    // ========================================

    disableDrawingMode() {
        // Remove drawn-mode class immediately (no transitions)
        this.body.classList.remove('drawn-mode');

        // Update button emoji back to pencil
        this.updateButtonIcon('✏️');

        // Restore original icons
        this.restoreOriginalIcons();

        // Unblock all JS-level interactions
        this.unblockInteractions();

        console.log('🖥️ Normal mode enabled - UI restored');
    }

    // ========================================
    // DRAWN COMPUTER ILLUSTRATION
    // ========================================

    showDrawnComputer() {
        const drawnComputer = document.getElementById('drawnComputerWindow');
        if (!drawnComputer) return;

        // Center the drawn computer illustration
        const rect = drawnComputer.getBoundingClientRect();
        const imgWidth = 900; // max-width from CSS
        const imgHeight = 600; // max-height from CSS

        const centerX = (window.innerWidth - imgWidth) / 2;
        const centerY = (window.innerHeight - imgHeight) / 2;

        drawnComputer.style.left = Math.max(0, centerX) + 'px';
        drawnComputer.style.top = Math.max(0, centerY) + 'px';

        // Make it draggable via windowManager
        if (window.windowManager) {
            window.windowManager.makeDrawnComputerDraggable(drawnComputer);
        }

        console.log('✏️ Drawn computer illustration centered and enabled for dragging');
    }

    // ========================================
    // INTERACTION BLOCKING
    // Freezes all UI interactions except the toggle button and drawn computer dragging
    // ========================================

    blockInteractions() {
        // Prevent all clicks except on the toggle button, drawn computer, and interactive apps
        this.interactionBlocker = (e) => {
            // Allow toggle button clicks
            if (e.target.closest('#drawingModeToggle')) {
                return;
            }

            // Allow drawn computer dragging
            if (e.target.closest('#drawnComputerWindow')) {
                return;
            }

            // Allow Camera, Notepad, and Gallery app interactions
            if (e.target.closest('#cameraWindow') ||
                e.target.closest('#notepadWindow') ||
                e.target.closest('#galleryWindow') ||
                e.target.closest('#cameraIcon') ||
                e.target.closest('#notepadIcon') ||
                e.target.closest('#galleryIcon')) {
                return;
            }

            // Block all other interactions
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        };

        // Block clicks at capture phase to prevent all handlers
        document.addEventListener('click', this.interactionBlocker, true);
        document.addEventListener('dblclick', this.interactionBlocker, true);
        document.addEventListener('mousedown', this.interactionBlocker, true);
        document.addEventListener('mouseup', this.interactionBlocker, true);

        // Block keyboard input except for toggle shortcut
        this.keyBlocker = (e) => {
            // Allow Ctrl/Cmd+D for toggle
            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                return;
            }

            // Block all other keyboard input
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        document.addEventListener('keydown', this.keyBlocker, true);
        document.addEventListener('keypress', this.keyBlocker, true);
        document.addEventListener('keyup', this.keyBlocker, true);

        // Block form submissions
        this.submitBlocker = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        document.addEventListener('submit', this.submitBlocker, true);

        // Block context menu
        this.contextMenuBlocker = (e) => {
            if (!e.target.closest('#drawingModeToggle')) {
                e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', this.contextMenuBlocker, true);

        console.log('🔒 All interactions blocked');
    }

    unblockInteractions() {
        // Remove all interaction blockers
        if (this.interactionBlocker) {
            document.removeEventListener('click', this.interactionBlocker, true);
            document.removeEventListener('dblclick', this.interactionBlocker, true);
            document.removeEventListener('mousedown', this.interactionBlocker, true);
            document.removeEventListener('mouseup', this.interactionBlocker, true);
            this.interactionBlocker = null;
        }

        if (this.keyBlocker) {
            document.removeEventListener('keydown', this.keyBlocker, true);
            document.removeEventListener('keypress', this.keyBlocker, true);
            document.removeEventListener('keyup', this.keyBlocker, true);
            this.keyBlocker = null;
        }

        if (this.submitBlocker) {
            document.removeEventListener('submit', this.submitBlocker, true);
            this.submitBlocker = null;
        }

        if (this.contextMenuBlocker) {
            document.removeEventListener('contextmenu', this.contextMenuBlocker, true);
            this.contextMenuBlocker = null;
        }

        console.log('🔓 All interactions restored');
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    updateButtonIcon(emoji) {
        const iconElement = this.toggleButton.querySelector('.toggle-icon');
        if (iconElement) {
            iconElement.textContent = emoji;
        }
    }

    savePreference() {
        try {
            localStorage.setItem('drawingMode', this.isDrawingMode ? 'enabled' : 'disabled');
        } catch (e) {
            console.warn('Could not save drawing mode preference:', e);
        }
    }

    loadSavedPreference() {
        try {
            const saved = localStorage.getItem('drawingMode');
            if (saved === 'enabled') {
                // Enable immediately on page load
                this.body.classList.add('drawn-mode');
                this.isDrawingMode = true;
                this.updateButtonIcon('🖥️');

                // Enable minimal effects
                this.swapToDrawnIcons();

                // Block interactions
                this.blockInteractions();
            }
        } catch (e) {
            console.warn('Could not load drawing mode preference:', e);
        }
    }
}

// ========================================
// INITIALIZE
// ========================================

// Create global instance
window.drawingModeManager = new DrawingModeManager();
