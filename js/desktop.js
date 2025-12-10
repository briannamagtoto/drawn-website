// ========================================
// DESKTOP MANAGER
// Handles desktop UI, menu bar, dock, browser, and interactions
// Dependencies: windowManager.js (for window dragging/positioning)
// ========================================

class DesktopManager {
    constructor() {
        this.windowZIndex = 100;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.setupBrowserWindowResize();
        this.setupContextMenu();
        this.setupDesktopIcons();
        this.setupDock();
        this.setupBrowser();
    }

    // ========================================
    // GLOBAL EVENT LISTENERS
    // ========================================

    setupEventListeners() {
        // Close context menu when clicking outside
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('contextMenu');
            if (contextMenu && !contextMenu.contains(e.target)) {
                contextMenu.classList.remove('active');
            }
        });

        // Prevent default context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    // ========================================
    // MENU BAR
    // ========================================

    updateTime() {
        const timeElement = document.querySelector('.time');
        if (!timeElement) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        timeElement.textContent = timeString;

        // Update every minute
        setTimeout(() => this.updateTime(), 60000);
    }

    // ========================================
    // WINDOW MANAGEMENT
    // ========================================

    setupBrowserWindowResize() {
        const browserWindow = document.querySelector('.browser-window');
        if (!browserWindow) return;

        // Add resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        browserWindow.appendChild(resizeHandle);

        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;

            startX = e.clientX;
            startY = e.clientY;
            startWidth = browserWindow.offsetWidth;
            startHeight = browserWindow.offsetHeight;

            browserWindow.style.transition = 'none';

            const handleResize = (e) => {
                if (!isResizing) return;

                const newWidth = startWidth + (e.clientX - startX);
                const newHeight = startHeight + (e.clientY - startY);

                // Min and max constraints
                const minWidth = 600;
                const minHeight = 400;
                const maxWidth = window.innerWidth - 100;
                const maxHeight = window.innerHeight - 100;

                browserWindow.style.width = Math.max(minWidth, Math.min(newWidth, maxWidth)) + 'px';
                browserWindow.style.height = Math.max(minHeight, Math.min(newHeight, maxHeight)) + 'px';
            };

            const stopResize = () => {
                isResizing = false;
                browserWindow.style.transition = '';
                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', stopResize);
            };

            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        });
    }

    bringToFront(element) {
        this.windowZIndex += 10;
        element.style.zIndex = this.windowZIndex;
    }

    // ========================================
    // CONTEXT MENU
    // ========================================

    setupContextMenu() {
        const sidebar = document.querySelector('.sidebar');
        const contextMenu = document.getElementById('contextMenu');

        if (!sidebar || !contextMenu) return;

        sidebar.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
            contextMenu.classList.add('active');
        });

        // Context menu item interactions
        const contextItems = document.querySelectorAll('.context-item');
        contextItems.forEach(item => {
            item.addEventListener('click', () => {
                console.log('Context menu item clicked:', item.textContent);
                contextMenu.classList.remove('active');
                this.showClickFeedback(item);
            });
        });
    }

    // ========================================
    // DESKTOP ICONS
    // ========================================

    setupDesktopIcons() {
        const icons = document.querySelectorAll('.desktop-icon');

        icons.forEach(icon => {
            // Single click selection
            icon.addEventListener('click', (e) => {
                e.stopPropagation();

                icons.forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');

                this.showClickFeedback(icon);
            });

            // Double click handled by apps.js
            // (Camera, Notepad, Gallery icons)
        });

        // Deselect icons when clicking desktop background
        const desktop = document.querySelector('.desktop-background');
        if (desktop) {
            desktop.addEventListener('click', () => {
                icons.forEach(i => i.classList.remove('selected'));
            });
        }
    }

    // ========================================
    // DOCK
    // ========================================

    setupDock() {
        const dock = document.querySelector('.dock');
        if (!dock) return;

        const dockItems = Array.from(document.querySelectorAll('.dock-item'));
        const actualItems = dockItems.filter(item => !item.classList.contains('dock-separator'));

        dockItems.forEach((item) => {
            if (item.classList.contains('dock-separator')) return;

            item.addEventListener('click', (e) => {
                e.stopPropagation();

                // Add bounce animation
                item.classList.add('bouncing');
                setTimeout(() => item.classList.remove('bouncing'), 600);

                // Handle trash can click
                if (item.querySelector('.trash-dock-icon')) {
                    this.shakeAnimation(item);
                }
            });
        });

        // Reset dock on mouse leave
        dock.addEventListener('mouseleave', () => {
            this.resetDock(actualItems);
        });

        // Continuous magnification based on mouse position
        dock.addEventListener('mousemove', (e) => {
            const dockRect = dock.getBoundingClientRect();
            const mouseX = e.clientX - dockRect.left;

            actualItems.forEach((item) => {
                const itemRect = item.getBoundingClientRect();
                const itemCenterX = itemRect.left + itemRect.width / 2 - dockRect.left;
                const distance = Math.abs(mouseX - itemCenterX);

                // Magnification based on distance from cursor
                const maxDistance = 150;
                const minScale = 1;
                const maxScale = 1.5;
                const minTranslate = 0;
                const maxTranslate = -25;

                if (distance < maxDistance) {
                    const factor = 1 - (distance / maxDistance);
                    const scale = minScale + (maxScale - minScale) * factor;
                    const translateY = minTranslate + (maxTranslate - minTranslate) * factor;

                    item.style.transform = `translateY(${translateY}px) scale(${scale})`;
                    item.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
                } else {
                    item.style.transform = 'translateY(0) scale(1)';
                    item.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                }
            });
        });
    }

    resetDock(items) {
        items.forEach(item => {
            item.style.transform = 'translateY(0) scale(1)';
            item.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
    }

    shakeAnimation(element) {
        let shakeCount = 0;
        const shakeInterval = setInterval(() => {
            const rotation = shakeCount % 2 === 0 ? 10 : -10;
            element.style.transform = `rotate(${rotation}deg)`;
            shakeCount++;

            if (shakeCount >= 6) {
                clearInterval(shakeInterval);
                element.style.transform = '';
            }
        }, 50);
    }

    // ========================================
    // BROWSER
    // ========================================

    setupBrowser() {
        const tabs = document.querySelectorAll('.tab');
        const pages = document.querySelectorAll('.webpage');
        const urlInput = document.getElementById('urlInput');
        const backBtn = document.getElementById('backBtn');
        const forwardBtn = document.getElementById('forwardBtn');
        const refreshBtn = document.getElementById('refreshBtn');

        if (!urlInput || !backBtn || !forwardBtn || !refreshBtn) return;

        // Tab switching
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close')) return;

                const targetTab = tab.dataset.tab;

                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update active page
                pages.forEach(p => p.classList.remove('active'));
                const targetPage = document.getElementById(`page${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
                if (targetPage) {
                    targetPage.classList.add('active');
                }

                // Update URL
                const urls = {
                    'home': 'home',
                    'about': 'about',
                    'portfolio': 'portfolio'
                };
                urlInput.value = urls[targetTab] || 'home';
            });

            // Tab close functionality
            const closeBtn = tab.querySelector('.tab-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (tabs.length > 1) {
                        tab.style.animation = 'slideOut 0.2s ease';
                        setTimeout(() => tab.remove(), 200);
                    }
                });
            }
        });

        // Navigation buttons
        backBtn.addEventListener('click', () => this.animateButton(backBtn));
        forwardBtn.addEventListener('click', () => this.animateButton(forwardBtn));
        refreshBtn.addEventListener('click', () => {
            this.animateButton(refreshBtn);
            const activePage = document.querySelector('.webpage.active');
            if (activePage) {
                activePage.style.opacity = '0.5';
                setTimeout(() => {
                    activePage.style.opacity = '1';
                }, 300);
            }
        });

        // URL input
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUrlChange(urlInput.value);
            }
        });
    }

    animateButton(button) {
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);
    }

    handleUrlChange(url) {
        console.log('Navigating to:', url);
    }

    // ========================================
    // UI FEEDBACK & ANIMATIONS
    // ========================================

    showClickFeedback(element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = '';
        }, 100);
    }
}

// ========================================
// GLOBAL WINDOW CONTROL HANDLERS
// ========================================

function setupWindowControls() {
    // Close button
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-btn')) {
            const window = e.target.closest('.browser-window, .app-window');
            if (window) {
                window.style.opacity = '0';
                window.style.transform += ' scale(0.9)';
                setTimeout(() => {
                    window.style.display = 'none';
                    window.classList.remove('active');
                    window.style.opacity = '1';
                    window.style.transform = '';
                }, 300);
            }
        }
    });

    // Minimize button
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('minimize-btn')) {
            const window = e.target.closest('.browser-window, .app-window');
            if (window) {
                window.style.transform += ' scale(0.1)';
                window.style.opacity = '0';
                setTimeout(() => {
                    window.style.display = 'none';
                    window.classList.remove('active');
                    window.style.transform = '';
                    window.style.opacity = '1';
                }, 300);
            }
        }
    });

    // Maximize button
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('maximize-btn')) {
            const window = e.target.closest('.browser-window, .app-window');

            if (window && window.classList.contains('browser-window')) {
                if (window.dataset.maximized === 'true') {
                    // Restore
                    window.style.width = window.dataset.originalWidth || '900px';
                    window.style.height = window.dataset.originalHeight || '600px';
                    window.style.top = window.dataset.originalTop || '';
                    window.style.left = window.dataset.originalLeft || '';
                    window.style.transform = window.dataset.originalTransform || '';
                    window.dataset.maximized = 'false';
                } else {
                    // Store original dimensions
                    window.dataset.originalWidth = window.style.width || '900px';
                    window.dataset.originalHeight = window.style.height || '600px';
                    window.dataset.originalTop = window.style.top;
                    window.dataset.originalLeft = window.style.left;
                    window.dataset.originalTransform = window.style.transform;

                    // Maximize
                    window.style.width = 'calc(100vw - 40px)';
                    window.style.height = 'calc(100vh - 64px)';
                    window.style.top = '44px';
                    window.style.left = '20px';
                    window.style.transform = 'none';
                    window.dataset.maximized = 'true';
                }
            }
        }
    });
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + W to close active window
        if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
            e.preventDefault();
            const activeWindow = document.querySelector('.app-window.active, .browser-window:not([style*="display: none"])');
            if (activeWindow) {
                activeWindow.classList.remove('active');
            }
        }
    });
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    window.desktopManager = new DesktopManager();
    setupWindowControls();
    setupKeyboardShortcuts();

    console.log('✓ Desktop Manager initialized');
});
